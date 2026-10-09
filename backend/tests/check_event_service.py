
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.session import engine
from app.models.user import User
from app.models.committee import Committee
from app.models.committee_member import CommitteeMember
from app.models.venue import Venue
from app.schemas.event import EventCreate
from app.services.event_service import (
    create_event,
    EventPermissionError,
    VenueConflictError,
)


def main():
    # Outer transaction ensures all test data gets rolled back.
    with engine.connect() as connection:
        transaction = connection.begin()

        try:
            with Session(
                bind=connection,
                join_transaction_mode="create_savepoint",
                expire_on_commit=False,
                autoflush=False,
            ) as db:

                # Create temporary test data.
                admin = User(
                    id=uuid4(),
                    full_name="Test Admin",
                    email=f"{uuid4()}@example.invalid",
                    password_hash="TEST_ONLY",
                    user_type="admin",
                )

                head = User(
                    id=uuid4(),
                    full_name="Test Committee Head",
                    email=f"{uuid4()}@example.invalid",
                    password_hash="TEST_ONLY",
                    user_type="faculty",
                )

                outsider = User(
                    id=uuid4(),
                    full_name="Unauthorized Student",
                    email=f"{uuid4()}@example.invalid",
                    password_hash="TEST_ONLY",
                    user_type="student",
                )

                committee = Committee(
                    id=uuid4(),
                    name=f"Test Committee {uuid4()}",
                )

                venue_a = Venue(
                    id=uuid4(),
                    name=f"Test Auditorium {uuid4()}",
                    capacity=200,
                )

                venue_b = Venue(
                    id=uuid4(),
                    name=f"Test Hall {uuid4()}",
                    capacity=100,
                )

                db.add_all([
                    admin, head, outsider,
                    committee, venue_a, venue_b,
                ])
                db.flush()

                membership = CommitteeMember(
                    id=uuid4(),
                    committee_id=committee.id,
                    user_id=head.id,
                    committee_role="head",
                    verification_status="approved",
                    verified_by=admin.id,
                    verified_at=datetime.now(timezone.utc),
                )

                db.add(membership)
                db.flush()

                start = datetime.now(timezone.utc) + timedelta(days=1)
                end = start + timedelta(hours=2)

                def payload(title, begins, ends, venue, status="confirmed"):
                    return EventCreate(
                        title=title,
                        committee_id=committee.id,
                        venue_id=venue.id,
                        starts_at=begins,
                        ends_at=ends,
                        max_participants=50,
                        status=status,
                    )

                # TEST 1: Authorized creation
                event = create_event(
                    db,
                    payload("Event A", start, end, venue_a),
                    head.id,
                )
                assert event.status == "confirmed"
                print("PASS 1: Authorized event created")

                # TEST 2: Venue collision
                try:
                    create_event(
                        db,
                        payload(
                            "Conflicting Event",
                            start + timedelta(hours=1),
                            end + timedelta(hours=1),
                            venue_a,
                        ),
                        head.id,
                    )
                    raise AssertionError("Conflict was accepted")
                except VenueConflictError:
                    print("PASS 2: Overlapping event rejected")

                # TEST 3: Adjacent booking
                create_event(
                    db,
                    payload(
                        "Adjacent Event",
                        end,
                        end + timedelta(hours=2),
                        venue_a,
                    ),
                    head.id,
                )
                print("PASS 3: Adjacent booking accepted")

                # TEST 4: Different venue
                create_event(
                    db,
                    payload("Other Venue Event", start, end, venue_b),
                    head.id,
                )
                print("PASS 4: Different venue accepted")

                # TEST 5: Draft overlap
                create_event(
                    db,
                    payload(
                        "Draft Event",
                        start,
                        end,
                        venue_a,
                        status="draft",
                    ),
                    head.id,
                )
                print("PASS 5: Overlapping draft accepted")

                # TEST 6: Unauthorized user
                try:
                    create_event(
                        db,
                        payload(
                            "Unauthorized Event",
                            end + timedelta(hours=3),
                            end + timedelta(hours=5),
                            venue_a,
                        ),
                        outsider.id,
                    )
                    raise AssertionError("Unauthorized user accepted")
                except EventPermissionError:
                    print("PASS 6: Unauthorized user rejected")

        finally:
            transaction.rollback()

    print("\nALL 6 INTEGRATION CHECKS PASSED")


if __name__ == "__main__":
    main()

