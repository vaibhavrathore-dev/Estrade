"""Local browser-test server with all writes inside one rolled-back transaction.
Run only for tests. A request lock serializes access to the shared test session.
"""
import argparse
import asyncio
import json
from pathlib import Path
import uvicorn
from tests.test_integration import context
from app.main import app

class SerialRequests:
    def __init__(self, app):
        self.app = app
        self.lock = asyncio.Lock()
    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http':
            async with self.lock:
                await self.app(scope, receive, send)
        else:
            await self.app(scope, receive, send)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    from pytest import MonkeyPatch
    patch = MonkeyPatch()
    fixture = context.__wrapped__(patch)
    client, db, admin, student, outsider, committee, venue, other = next(fixture)
    from app.core.config import settings
    if settings.ENVIRONMENT != 'development' or settings.DB_HOST not in ('localhost', '127.0.0.1'):
        raise SystemExit('Browser fixture server requires a local development database')
    from app.models import CommitteeMember, Event
    from datetime import datetime, timedelta, timezone
    from uuid import UUID
    from fastapi import HTTPException
    db.add(CommitteeMember(committee_id=committee.id, user_id=outsider.id, committee_role='head', verification_status='approved', verified_by=admin.id, verified_at=datetime.now(timezone.utc)))
    db.commit()
    @app.get('/__test__/code')
    def test_code(email: str, purpose: str = 'verify'):
        return {'code': app.state.test_codes.get((email, purpose))}
    @app.post('/__test__/complete/{event_id}')
    def complete_fixture_event(event_id: UUID):
        event = db.get(Event, event_id)
        if not event or event.committee_id != committee.id:
            raise HTTPException(404)
        event.starts_at = datetime.now(timezone.utc) - timedelta(hours=3)
        event.ends_at = datetime.now(timezone.utc) - timedelta(hours=1)
        db.commit()
        return {'completed': True}
    try:
        Path('/tmp/estrade-browser-fixture.json').write_text(json.dumps({'admin':admin.email,'student':student.email,'faculty':outsider.email,
            'committee':committee.name,'venue':venue.name,'other':other.name}))
        uvicorn.run(SerialRequests(app), host='127.0.0.1', port=args.port, access_log=False)
    finally:
        try:
            next(fixture)
        except StopIteration:
            pass
        patch.undo()
