"""Real PostgreSQL API integration tests. Every test rolls its records back."""
from datetime import datetime, timedelta, timezone
from io import BytesIO
from uuid import uuid4
import jwt
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import engine, get_db
from app.core.config import settings
from app.core.security import hash_password, create_access_token
from app.models import User, Committee, CommitteeMember, Venue, Event

@pytest.fixture
def context():
    with engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, join_transaction_mode='create_savepoint', expire_on_commit=False) as db:
            app.dependency_overrides[get_db] = lambda: db
            admin = User(full_name='Test Organizer', email=f'{uuid4()}@example.org', password_hash=hash_password('test-password-123'), user_type='admin')
            student = User(full_name='Test Student', email=f'{uuid4()}@example.org', password_hash=hash_password('test-password-123'), user_type='student')
            outsider = User(full_name='Test Outsider', email=f'{uuid4()}@example.org', password_hash=hash_password('test-password-123'), user_type='faculty')
            committee = Committee(name=f'Test Committee {uuid4()}')
            venue = Venue(name=f'Test Venue {uuid4()}', capacity=100)
            other = Venue(name=f'Test Other {uuid4()}', capacity=100)
            db.add_all([admin, student, outsider, committee, venue, other]); db.flush()
            db.add(CommitteeMember(committee_id=committee.id, user_id=student.id, committee_role='coordinator', verification_status='approved', verified_by=admin.id, verified_at=datetime.now(timezone.utc)))
            db.commit()
            with TestClient(app) as client:
                yield client, db, admin, student, outsider, committee, venue, other
            app.dependency_overrides.clear()
        transaction.rollback()

def headers(user):
    return {'Authorization': f'Bearer {create_access_token(user.id)}'}

def payload(c, v, **changes):
    start = datetime.now(timezone.utc) + timedelta(days=4)
    return {'title':'Integration Event', 'committee_id':str(c.id), 'venue_id':str(v.id),
            'starts_at':start.isoformat(), 'ends_at':(start+timedelta(hours=2)).isoformat(),
            'status':'confirmed', 'max_participants':50, **changes}

def create(client, admin, c, v, **changes):
    response = client.post('/api/v1/events', json=payload(c,v,**changes), headers=headers(admin))
    assert response.status_code == 201, response.text
    return response.json()

def test_auth(context):
    client, db, admin, student, outsider, c, v, other = context
    body = {'full_name':'New Student', 'email':f'{uuid4()}@example.org', 'password':'password-1234', 'user_type':'admin'}
    response = client.post('/api/v1/auth/register', json=body)
    assert response.status_code == 201 and response.json()['user_type'] == 'student'
    assert 'password_hash' not in response.json()
    assert client.post('/api/v1/auth/register', json=body).status_code == 409
    assert client.post('/api/v1/auth/register', json={**body, 'email':'broken'}).status_code == 422
    response = client.post('/api/v1/auth/login', json={'email':body['email'], 'password':body['password']})
    assert response.status_code == 200
    assert client.get('/api/v1/auth/me', headers={'Authorization':f"Bearer {response.json()['access_token']}"}).json()['full_name'] == 'New Student'
    assert client.post('/api/v1/auth/login', json={'email':body['email'], 'password':'wrong'}).status_code == 401
    assert client.get('/api/v1/auth/me').status_code == 401
    assert client.get('/api/v1/auth/me', headers={'Authorization':'Bearer invalid'}).status_code == 401
    expired = jwt.encode({'sub':str(admin.id), 'type':'access', 'iat':0, 'exp':1}, settings.JWT_SECRET_KEY, algorithm='HS256')
    assert client.get('/api/v1/auth/me', headers={'Authorization':f'Bearer {expired}'}).status_code == 401
    for path in ['/api/v1/events', '/api/v1/committees', '/api/v1/venues', '/api/v1/dashboard']:
        assert client.get(path).status_code == 401

def test_scheduling_and_visibility(context):
    client, db, admin, student, outsider, c, v, other = context
    data = payload(c,v)
    a = client.post('/api/v1/events', json=data, headers=headers(admin))
    assert a.status_code == 201
    event = a.json()
    assert client.post('/api/v1/events', json={**data, 'title':'Conflict'}, headers=headers(admin)).status_code == 409
    assert client.post('/api/v1/events', json={**data, 'venue_id':str(other.id)}, headers=headers(admin)).status_code == 201
    assert client.post('/api/v1/events', json={**data, 'status':'draft'}, headers=headers(admin)).status_code == 201
    adjacent = {**data, 'starts_at':data['ends_at'], 'ends_at':(datetime.fromisoformat(data['ends_at']) + timedelta(hours=1)).isoformat()}
    assert client.post('/api/v1/events', json=adjacent, headers=headers(admin)).status_code == 201
    assert client.post('/api/v1/events', json=data, headers=headers(student)).status_code == 403
    assert client.post('/api/v1/events', json={**data, 'max_participants':101}, headers=headers(admin)).status_code == 422
    assert client.post('/api/v1/events', json={**data, 'ends_at':data['starts_at']}, headers=headers(admin)).status_code == 422
    url = f"/api/v1/events/{event['id']}"
    assert client.get(url, headers=headers(student)).status_code == 200
    assert client.get(url, headers=headers(outsider)).status_code == 404
    assert event['id'] not in [r['id'] for r in client.get('/api/v1/events', headers=headers(outsider)).json()]
    assert client.patch(url+'/publication', json={'is_published':True}, headers=headers(admin)).status_code == 200
    assert client.get(url, headers=headers(outsider)).status_code == 200
    assert client.get(url+'/assignments', headers=headers(outsider)).json() == []
    assert client.post(url+'/cancel', headers=headers(student)).status_code == 403
    assert client.post(url+'/cancel', headers=headers(admin)).status_code == 200
    assert client.post('/api/v1/events', json=data, headers=headers(admin)).status_code == 201

def test_coordination(context):
    client, db, admin, student, outsider, c, v, other = context
    event = create(client, admin, c, v)
    url = f"/api/v1/events/{event['id']}/assignments"
    body = {'user_id':str(student.id),'duty':'Registration desk'}
    assert client.post(url, json=body, headers=headers(outsider)).status_code == 404
    a = client.post(url, json=body, headers=headers(admin)); assert a.status_code == 201, a.text
    assert client.post(url, json=body, headers=headers(admin)).status_code == 409
    second = create(client, admin, c, other, starts_at=event['starts_at'], ends_at=event['ends_at'])
    assert client.post(f"/api/v1/events/{second['id']}/assignments", json=body, headers=headers(admin)).status_code == 409
    withdraw = f"/api/v1/assignments/{a.json()['id']}/withdrawals"
    assert client.post(withdraw, json={'reason':'Exam schedule conflict'}, headers=headers(outsider)).status_code == 404
    w = client.post(withdraw, json={'reason':'Exam schedule conflict'}, headers=headers(student)); assert w.status_code == 201
    assert client.post(withdraw, json={'reason':'Again'}, headers=headers(student)).status_code == 409
    review = f"/api/v1/withdrawals/{w.json()['id']}"
    assert client.patch(review, json={'status':'approved'}, headers=headers(student)).status_code == 403
    assert client.patch(review, json={'status':'approved'}, headers=headers(admin)).status_code == 200
    assert client.patch(review, json={'status':'approved'}, headers=headers(admin)).status_code == 409
    assert client.post(url, json=body, headers=headers(admin)).status_code == 201
    rows = client.get(url, headers=headers(admin)).json()
    assert len(rows) == 2 and rows[0]['status'] == 'withdrawn'
    assert client.get('/api/v1/dashboard', headers=headers(admin)).status_code == 200

def test_certificates(context):
    client, db, admin, student, outsider, c, v, other = context
    future = create(client, admin, c, v)
    body = {'email':student.email, 'evidence':'Checked signed attendance register'}
    assert client.post(f"/api/v1/events/{future['id']}/participations", json=body, headers=headers(admin)).status_code == 422
    start = datetime.now(timezone.utc) - timedelta(days=2)
    event = create(client, admin, c, v, starts_at=start.isoformat(), ends_at=(start+timedelta(hours=1)).isoformat())
    url = f"/api/v1/events/{event['id']}/participations"
    assert client.post(url, json=body, headers=headers(student)).status_code == 403
    p = client.post(url, json=body, headers=headers(admin)); assert p.status_code == 201, p.text
    assert client.post(url, json=body, headers=headers(admin)).status_code == 409
    issue = f"/api/v1/participations/{p.json()['id']}/certificates"
    assert client.post(issue, headers=headers(student)).status_code == 403
    cert = client.post(issue, headers=headers(admin)); assert cert.status_code == 201, cert.text
    assert client.post(issue, headers=headers(admin)).status_code == 409
    assert cert.json()['id'] in [c['id'] for c in client.get('/api/v1/certificates', headers=headers(student)).json()]
    assert client.get('/api/v1/certificates', headers=headers(outsider)).json() == []
    path = cert.json()['download_url']
    pdf = client.get(path, headers=headers(student)); assert pdf.status_code == 200 and pdf.content.startswith(b'%PDF')
    assert client.get(path, headers=headers(outsider)).status_code == 404
    verification = client.get(f"/api/v1/certificates/{cert.json()['id']}/verify").json()
    assert verification['valid'] and 'email' not in verification and 'participant_name' not in verification

def image_bytes():
    output = BytesIO(); Image.effect_noise((128,128),100).convert('RGB').save(output, format='PNG'); return output.getvalue()

def test_media(context):
    client, db, admin, student, outsider, c, v, other = context
    event = create(client, admin, c, v)
    url = f"/api/v1/events/{event['id']}/media/analyze"
    image = image_bytes(); files = [('files',('../../same.png',image,'image/png')),('files',('same.png',image,'image/png'))]
    assert client.post(url, files=files).status_code == 401
    assert client.post(url, files=files, headers=headers(student)).status_code == 403
    response = client.post(url, files=files, headers=headers(admin)); assert response.status_code == 200, response.text
    data = response.json(); assert data['summary']['total_images'] == 2 and len(data['duplicates']) == 1
    assert data['images'][1]['classification'] == 'rejected'
    assert data['images'][0]['filename'] == 'same.png'
    assert client.post(url, headers=headers(admin)).status_code == 422
    assert client.post(url, files=[('files',('x.png',b'corrupt','image/png'))], headers=headers(admin)).status_code == 422
    assert client.post(url, files=[('files',('x.txt',b'bad','text/plain'))], headers=headers(admin)).status_code == 415
    assert client.post(url, files=files*7, headers=headers(admin)).status_code == 422
    assert client.post(url, files=[('files',('x.png',b'x'*(8*1024*1024+1),'image/png'))], headers=headers(admin)).status_code == 413
    assert len(client.get(f"/api/v1/events/{event['id']}/media", headers=headers(admin)).json()) == 1

def test_original_sql():
    from pathlib import Path
    with engine.connect() as connection:
        connection.exec_driver_sql(Path('tests/test_scheduling.sql').read_text())
        connection.rollback()

def test_cors_and_limits(context):
    client, db, admin, student, outsider, c, v, other = context
    response = client.options('/api/v1/auth/login', headers={'Origin':'http://localhost:5173', 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'content-type'})
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == 'http://localhost:5173'
    blocked = client.options('/api/v1/auth/login', headers={'Origin':'https://untrusted.invalid','Access-Control-Request-Method':'POST'})
    assert blocked.status_code == 400
    event = create(client, admin, c, v)
    url = f"/api/v1/events/{event['id']}/media/analyze"
    assert client.post(url, content=b'', headers={**headers(admin),'Content-Length':str(35*1024*1024)}).status_code == 413
    image = BytesIO(); Image.new('RGB',(4000,4000)).save(image, format='PNG')
    assert client.post(url, files=[('files',('large.png',image.getvalue(),'image/png'))], headers=headers(admin)).status_code == 422
    assert client.post('/api/v1/auth/register', json={'full_name':'  ', 'email':f'{uuid4()}@example.org','password':'password123'}).status_code == 422

def test_repeatable_seed(context, monkeypatch):
    from contextlib import contextmanager
    import seed_demo
    client, db, admin, student, outsider, c, v, other = context
    @contextmanager
    def session():
        yield db
    email = f'{uuid4()}@example.org'
    monkeypatch.setattr(seed_demo, 'SessionLocal', session)
    monkeypatch.setattr(seed_demo, 'getpass', lambda prompt: 'seed-test-password')
    monkeypatch.setattr('sys.argv', ['seed_demo.py','--email',email,'--name','Seed Faculty','--member-email',student.email,'--with-demo-events'])
    seed_demo.main()
    seeded = db.scalar(select(User).where(User.email == email))
    before = seeded.password_hash
    seed_demo.main()
    assert seeded.user_type == 'faculty' and seeded.password_hash == before
    assert len(db.scalars(select(User).where(User.email == email)).all()) == 1
    monkeypatch.setattr(seed_demo.settings, 'ENVIRONMENT', 'production')
    with pytest.raises(SystemExit):
        seed_demo.main()

def test_media_strips_metadata(context, monkeypatch):
    import app.services.media as service
    client, db, admin, student, outsider, c, v, other = context
    event = create(client, admin, c, v)
    image = Image.new('RGB',(100,100),'red')
    exif = Image.Exif(); exif[0x010E] = 'Private metadata must not survive'
    raw = BytesIO(); image.save(raw, format='JPEG', exif=exif)
    original = service.analyze_image
    def inspect_clean(path, **kwargs):
        with Image.open(path) as clean:
            assert not clean.getexif()
            assert 'exif' not in clean.info
        return original(path, **kwargs)
    monkeypatch.setattr(service, 'analyze_image', inspect_clean)
    response = client.post(f"/api/v1/events/{event['id']}/media/analyze", files=[('files',('private.jpg',raw.getvalue(),'image/jpeg'))], headers=headers(admin))
    assert response.status_code == 200, response.text
