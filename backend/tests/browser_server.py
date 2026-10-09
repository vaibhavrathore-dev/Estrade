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
    fixture = context.__wrapped__()
    client, db, admin, student, outsider, committee, venue, other = next(fixture)
    try:
        Path('/tmp/estrade-browser-fixture.json').write_text(json.dumps({'admin':admin.email,'student':student.email,
            'committee':committee.name,'venue':venue.name,'other':other.name}))
        uvicorn.run(SerialRequests(app), host='127.0.0.1', port=args.port, access_log=False)
    finally:
        try:
            next(fixture)
        except StopIteration:
            pass
