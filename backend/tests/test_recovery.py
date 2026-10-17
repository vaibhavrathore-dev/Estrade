from datetime import datetime, timedelta, timezone
from uuid import uuid4
from sqlalchemy import select
from app.models import User, Committee, CommitteeMember, EmailChallenge
from app.main import app
from tests.test_integration import context, headers, create


def test_membership_request_review(context):
    client, db, admin, student, outsider, c, v, other = context
    committee = Committee(name=f'Applications {uuid4()}'); db.add(committee); db.commit()
    path = f'/api/v1/committees/{committee.id}/applications'
    response = client.post(path, json={'reason':'Help at check-in', 'committee_role':'head'}, headers=headers(student))
    assert response.status_code == 201
    assert client.post(path, json={}, headers=headers(student)).status_code == 409
    assert client.get(path, headers=headers(student)).status_code == 403
    item = client.get(path, headers=headers(admin)).json()[0]
    assert item['role'] == 'coordinator' and item['status'] == 'pending'
    review = f"/api/v1/committee-applications/{item['id']}"
    assert client.patch(review, json={'status':'approved'}, headers=headers(student)).status_code == 403
    assert client.patch(review, json={'status':'approved'}, headers=headers(outsider)).status_code == 403
    assert client.patch(review, json={'status':'approved'}, headers=headers(admin)).status_code == 200
    assert client.patch(review, json={'status':'rejected'}, headers=headers(admin)).status_code == 409
    assert not next(x for x in client.get('/api/v1/committees', headers=headers(student)).json() if x['id'] == str(committee.id))['can_manage']
    event = create(client, admin, committee, v)
    assert client.post(f"/api/v1/events/{event['id']}/assignments", json={'user_id':str(student.id), 'duty':'Check-in'}, headers=headers(admin)).status_code == 201
    assert client.get('/api/v1/me/assignments', headers=headers(student)).json()[0]['duty'] == 'Check-in'


def test_recovery_limits_expiry_and_replay(context):
    client, db, admin, student, outsider, c, v, other = context
    email = student.email
    request = '/api/v1/auth/password/forgot'
    assert client.post(request, json={'email':email}).status_code == 200
    assert client.post(request, json={'email':email}).status_code == 429
    code = app.state.test_codes[(email, 'recover')]
    row = db.scalar(select(EmailChallenge).where(EmailChallenge.email == email))
    assert row.code_hash != code and len(row.code_hash) == 64
    verify = '/api/v1/auth/password/verify'
    wrong = '000000' if code != '000000' else '111111'
    for _ in range(5):
        assert client.post(verify, json={'email':email,'code':wrong}).status_code == 422
    assert client.post(verify, json={'email':email,'code':code}).status_code == 422
    row.sent_at -= timedelta(minutes=2); db.commit()
    assert client.post(request, json={'email':email}).status_code == 200
    code = app.state.test_codes[(email, 'recover')]
    row.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1); db.commit()
    assert client.post(verify, json={'email':email,'code':code}).status_code == 422
    row.sent_at -= timedelta(minutes=2); db.commit()
    assert client.post(request, json={'email':email}).status_code == 200
    code = app.state.test_codes[(email, 'recover')]
    response = client.post(verify, json={'email':email,'code':code})
    assert response.status_code == 200
    assert client.post(verify, json={'email':email,'code':code}).status_code == 422
    body = {'email':email,'reset_token':response.json()['reset_token'],'password':'new-long-password-123'}
    assert client.post('/api/v1/auth/password/reset', json={**body, 'password':'short'}).status_code == 422
    assert client.post('/api/v1/auth/password/reset', json=body).status_code == 200
    assert client.post('/api/v1/auth/password/reset', json=body).status_code == 422
    assert client.post('/api/v1/auth/login', json={'email':email,'password':'test-password-123'}).status_code == 401
    assert client.post('/api/v1/auth/login', json={'email':email,'password':body['password']}).status_code == 200
    row.sent_at -= timedelta(minutes=2); row.requests=5; db.commit()
    assert client.post(request, json={'email':email}).status_code == 429
    unknown = f'{uuid4()}@example.org'
    assert client.post(request, json={'email':unknown}).json()['message'].startswith('If this account')
    assert (unknown, 'recover') not in app.state.test_codes


def test_email_failure_and_verification(context, monkeypatch):
    client, db, admin, student, outsider, c, v, other = context
    def fail(): raise RuntimeError('unavailable')
    monkeypatch.setattr('app.services.email_challenges.email_ready', fail)
    for email in (student.email, f'{uuid4()}@example.org'):
        assert client.post('/api/v1/auth/password/forgot', json={'email':email}).status_code == 503
    body = {'full_name':'Unverified Student', 'email':f'{uuid4()}@example.org', 'password':'password-1234'}
    response = client.post('/api/v1/auth/register', json=body)
    assert response.status_code == 201 and response.json()['delivery_status'] == 'unavailable'
    assert client.post('/api/v1/auth/login', json=body).status_code == 401
    row = db.scalar(select(EmailChallenge).where(EmailChallenge.email == body['email']))
    row.sent_at -= timedelta(minutes=2); db.commit()
    monkeypatch.setattr('app.services.email_challenges.email_ready', lambda: None)
    assert client.post('/api/v1/auth/verification/resend', json={'email':body['email']}).status_code == 200
    code = app.state.test_codes[(body['email'],'verify')]
    proof = {'email':body['email'], 'code':code}
    assert client.post('/api/v1/auth/verification/verify', json=proof).status_code == 200
    assert client.post('/api/v1/auth/verification/verify', json=proof).status_code == 422
    assert client.post('/api/v1/auth/login', json=body).status_code == 200


def test_registration_contract_and_qr_errors(context):
    client, db, admin, student, outsider, c, v, other = context
    event = create(client, admin, c, v)
    root = f"/api/v1/events/{event['id']}"
    client.patch(root+'/publication', json={'is_published':True}, headers=headers(admin))
    field = client.post(root+'/registration-fields', json={'label':'Session','field_type':'select','options':['Morning'],'required':True}, headers=headers(admin)).json()
    assert client.post(root+'/registrations', json={'answers':[]}, headers=headers(student)).status_code == 422
    assert client.post(root+'/registrations', json={'answers':[{'field_id':field['id'], 'value':'Invalid'}]}, headers=headers(student)).status_code == 422
    registered = client.post(root+'/registrations', json={'answers':[{'field_id':field['id'], 'value':'Morning'}]}, headers=headers(student))
    assert registered.status_code == 201
    assert client.get(root+'/registrations', headers=headers(student)).status_code == 403
    assert client.get(root+'/registrations', headers=headers(admin)).json()[0]['checked_in'] is False
    assert client.post('/api/v1/check-in', json={'token':'invalid-token-more-than-twenty'}, headers=headers(admin)).status_code == 422
    assert client.post(f"/api/v1/registrations/{registered.json()['id']}/participation", headers=headers(admin)).status_code == 422


def test_certificate_delivery_failure_is_separate(context):
    from app.models import Event, EventRegistration, Attendance
    client, db, admin, student, outsider, c, v, other = context
    now = datetime.now(timezone.utc)
    event = create(client, admin, c, v, starts_at=(now-timedelta(hours=3)).isoformat(), ends_at=(now-timedelta(hours=1)).isoformat())
    registration = EventRegistration(event_id=event['id'], user_id=student.id, certificate_name=student.full_name)
    db.add(registration); db.commit()
    approval = f'/api/v1/registrations/{registration.id}/participation'
    assert client.post(approval, headers=headers(admin)).status_code == 422
    assert client.post(f"/api/v1/events/{event['id']}/participations", json={'email':student.email,'evidence':'No QR attendance'}, headers=headers(admin)).status_code == 422
    db.add(Attendance(registration_id=registration.id, checked_in_by=admin.id)); db.commit()
    participation = client.post(approval, headers=headers(admin)).json()
    response = client.post(f"/api/v1/participations/{participation['id']}/certificates", headers=headers(admin))
    assert response.status_code == 201 and response.json()['delivery_status'] == 'failed'
    certificate = response.json()
    assert client.get(certificate['download_url'], headers=headers(student)).content.startswith(b'%PDF')
    assert client.post(f"/api/v1/certificates/{certificate['id']}/email", headers=headers(admin)).status_code == 502
    assert client.post(f"/api/v1/certificates/{certificate['id']}/email", headers=headers(student)).status_code == 403
    assert client.get(f"/api/v1/certificates/{certificate['id']}/delivery", headers=headers(student)).json()['delivery_status'] == 'failed'


def test_media_storage_failure_is_reported(context, monkeypatch):
    from tests.test_integration import image_bytes
    client, db, admin, student, outsider, c, v, other = context
    event = create(client, admin, c, v)
    def fail(**kwargs): raise RuntimeError('Drive unavailable')
    monkeypatch.setattr('app.services.drive_storage.upload_event_image', fail)
    monkeypatch.setattr('app.services.media.analyze_image', lambda path, is_duplicate=False: {'decision':'reject' if is_duplicate else 'good'})
    raw = image_bytes()
    response = client.post(f"/api/v1/events/{event['id']}/media/store", files=[('files',('first.png',raw,'image/png')),('files',('copy.png',raw,'image/png'))], headers=headers(admin))
    assert response.status_code == 200
    result = response.json()
    assert result['drive']['uploaded'] == 0 and result['drive']['failed'] == 1
    assert result['summary']['rejected'] == 1
    assert client.get('/api/v1/dashboard', headers=headers(student)).json()['media'] == []


def test_auth_peer_rate_limit(context):
    client, db, admin, student, outsider, c, v, other = context
    for _ in range(60):
        assert client.post('/api/v1/auth/login', json={'email':'unknown@example.org', 'password':'invalid'}).status_code == 401
    assert client.post('/api/v1/auth/login', json={'email':'unknown@example.org', 'password':'invalid'}).status_code == 429


def test_self_review_and_cancelled_checkin(context):
    from app.models import EventRegistration
    client, db, admin, student, outsider, c, v, other = context
    member = CommitteeMember(committee_id=c.id, user_id=admin.id, committee_role='coordinator', verification_status='pending')
    db.add(member); db.commit()
    assert client.patch(f'/api/v1/committee-applications/{member.id}', json={'status':'approved'}, headers=headers(admin)).status_code == 403
    event = create(client, admin, c, v)
    root = f"/api/v1/events/{event['id']}"
    client.patch(root+'/publication', json={'is_published':True}, headers=headers(admin))
    registration = client.post(root+'/registrations', json={}, headers=headers(student)).json()
    token = client.get(f"/api/v1/registrations/{registration['id']}/check-in-token", headers=headers(student)).json()['token']
    assert client.post('/api/v1/check-in', json={'token':token, 'event_id':str(uuid4())}, headers=headers(admin)).status_code == 422
    assert client.get(root+'/attendance', headers=headers(student)).status_code == 403
    client.post(root+'/cancel', headers=headers(admin))
    assert client.post('/api/v1/check-in', json={'token':token}, headers=headers(admin)).status_code == 422
