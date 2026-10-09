"""Explicit, repeatable development-only provisioning. Never changes existing roles/passwords."""
import argparse
from getpass import getpass
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User, Committee, CommitteeMember, Venue, Event


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--email', required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--role', choices=['faculty','admin'], default='faculty')
    parser.add_argument('--member-email', action='append', default=[], help='Approve an existing registered student as a demo coordinator')
    parser.add_argument('--with-demo-events', action='store_true')
    args = parser.parse_args()
    if settings.ENVIRONMENT != 'development':
        raise SystemExit('Demo provisioning is restricted to ENVIRONMENT=development')
    from pydantic import TypeAdapter, EmailStr
    email = str(TypeAdapter(EmailStr).validate_python(args.email)).lower()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            password = getpass('New demonstration account password (12+ characters): ')
            if len(password) < 12 or password != getpass('Confirm password: '):
                raise SystemExit('Password too short or confirmation did not match')
            user = User(full_name=args.name, email=email, user_type=args.role, password_hash=hash_password(password))
            db.add(user); db.flush()
        elif user.user_type != args.role:
            raise SystemExit('Existing account has a different role; refusing to change privileges')
        committee = db.scalar(select(Committee).where(Committee.name == 'Estrade Demo Committee'))
        if committee is None:
            committee = Committee(name='Estrade Demo Committee', description='Explicit development demonstration workspace')
            db.add(committee); db.flush()
        member = db.scalar(select(CommitteeMember).where(CommitteeMember.committee_id == committee.id, CommitteeMember.user_id == user.id))
        if member is None:
            db.add(CommitteeMember(committee_id=committee.id, user_id=user.id, committee_role='head',
                verification_status='approved', verified_by=user.id, verified_at=datetime.now(timezone.utc)))
        for member_email in args.member_email:
            volunteer = db.scalar(select(User).where(User.email == member_email.strip().lower(), User.is_active.is_(True)))
            if volunteer is None:
                raise SystemExit('Register each volunteer before adding their demo membership')
            if db.scalar(select(CommitteeMember).where(CommitteeMember.committee_id == committee.id, CommitteeMember.user_id == volunteer.id)) is None:
                db.add(CommitteeMember(committee_id=committee.id, user_id=volunteer.id, committee_role='coordinator', verification_status='approved', verified_by=user.id, verified_at=datetime.now(timezone.utc)))
        for name in ['Demo Auditorium', 'Demo Seminar Hall']:
            if db.scalar(select(Venue).where(Venue.name == name)) is None:
                db.add(Venue(name=name, capacity=200))
        db.flush()
        if args.with_demo_events:
            # Past, clearly labeled event for demonstrating restricted attendance/certificates.
            title = 'Demo: Completed Event'
            if db.scalar(select(Event).where(Event.committee_id == committee.id, Event.title == title)) is None:
                from app.schemas.event import EventCreate
                from app.services.event_service import create_event
                venue = db.scalar(select(Venue).where(Venue.name == 'Demo Seminar Hall'))
                start = datetime.now(timezone.utc) - timedelta(days=2)
                create_event(db, EventCreate(title=title, committee_id=committee.id, venue_id=venue.id,
                    starts_at=start, ends_at=start+timedelta(hours=1), status='confirmed', max_participants=50), user.id)
        db.commit()
    print('Development account and demo workspace ready. Existing credentials were not changed.')

if __name__ == '__main__':
    main()
