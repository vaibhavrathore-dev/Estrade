"""Bounded, one-use email challenges. No codes or credentials are logged."""
from datetime import datetime, timedelta, timezone
import hashlib
import logging
import hmac
import secrets
from email.message import EmailMessage
from base64 import urlsafe_b64encode
from fastapi import HTTPException
from sqlalchemy import select, text
from googleapiclient.discovery import build
from app.core.config import settings
from app.models import EmailChallenge, User
from app.services.google_auth import google_credentials

logger = logging.getLogger("estrade.email")


def digest(value):
    return hmac.new(settings.JWT_SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()


def email_ready():
    if not settings.ESTRADE_GMAIL_SENDER:
        raise RuntimeError("Email is not configured")
    google_credentials()


def send_code(email, code, purpose):
    if not settings.ESTRADE_GMAIL_SENDER:
        raise RuntimeError('Email is not configured')
    message = EmailMessage()
    message['To'] = email
    message['From'] = settings.ESTRADE_GMAIL_SENDER
    message['Subject'] = 'Estrade account verification' if purpose == 'verify' else 'Estrade password recovery'
    message.set_content(f'Your Estrade code is {code}. It expires in 10 minutes. Do not share this code. If you did not request it, ignore this message.')
    build('gmail', 'v1', credentials=google_credentials(), cache_discovery=False).users().messages().send(userId='me', body={'raw':urlsafe_b64encode(message.as_bytes()).decode()}).execute()


def lock(db, email, purpose):
    # Serialize requests even before a challenge row exists, across application workers.
    key = int.from_bytes(hashlib.sha256(f'{email}:{purpose}'.encode()).digest()[:8], 'big', signed=True)
    db.execute(text('SELECT pg_advisory_xact_lock(:key)'), {'key':key})


def request_code(db, email, purpose):
    email = email.strip().lower()
    now = datetime.now(timezone.utc)
    lock(db, email, purpose)
    row = db.scalar(select(EmailChallenge).where(EmailChallenge.email == email, EmailChallenge.purpose == purpose).with_for_update())
    if row and (now - row.sent_at < timedelta(seconds=60) or (now - row.window_at < timedelta(hours=1) and row.requests >= 5)):
        raise HTTPException(429, 'Please wait before requesting another code (60 seconds between requests, 5 per hour).')
    user = db.scalar(select(User).where(User.email == email))
    code = f'{secrets.randbelow(1000000):06d}'
    if row is None:
        row = EmailChallenge(email=email, purpose=purpose, window_at=now, requests=0)
        db.add(row)
    if now - row.window_at >= timedelta(hours=1):
        row.window_at, row.requests = now, 0
    row.requests += 1
    row.sent_at, row.expires_at = now, now + timedelta(minutes=10)
    row.code_hash = digest(f'{email}:{purpose}:{code}')
    row.attempts, row.verified, row.consumed = 0, False, False
    eligible = user is not None and ((purpose == 'verify' and not user.email_verified) or (purpose == 'recover' and user.is_active and user.email_verified))
    # Commit rate limits even if delivery fails. Failed sends never activate an account.
    db.commit()
    try:
        email_ready()
    except Exception as exc:
        # Never log addresses, codes, token contents, or provider error bodies.
        logger.error('email_transport_unavailable cause=%s', type(exc).__name__)
        raise HTTPException(503, 'Email delivery is unavailable. Please retry later or contact the administrator.')
    if eligible:
        try:
            send_code(email, code, purpose)
        except Exception as exc:
            # Password recovery remains non-enumerating; operators still get a safe signal.
            provider_status = getattr(getattr(exc, 'resp', None), 'status', None)
            logger.error('email_delivery_failed purpose=%s cause=%s status=%s',
                         purpose, type(exc).__name__, provider_status)
            if purpose != 'recover':
                raise HTTPException(503, 'Email delivery is unavailable. Please retry later or contact the administrator.')
            # Recovery response must not disclose whether a recipient exists,
            # even when the provider rejects delivery to that recipient.
    return {'message':'If this account is eligible and delivery is available, check your email for a code. Codes expire in 10 minutes. If no code arrives, retry later or contact the administrator.', 'resend_after':60}


def verify_code(db, email, purpose, code, grant=False):
    email = email.strip().lower()
    lock(db, email, purpose)
    row = db.scalar(select(EmailChallenge).where(EmailChallenge.email == email, EmailChallenge.purpose == purpose).with_for_update())
    if not row or row.consumed or row.verified or row.expires_at <= datetime.now(timezone.utc) or row.attempts >= 5:
        raise HTTPException(422, 'Code invalid, expired, or exhausted. Request a new code.')
    row.attempts += 1
    if not hmac.compare_digest(row.code_hash, digest(f'{email}:{purpose}:{code}')):
        db.commit()
        raise HTTPException(422, 'Code invalid, expired, or exhausted. Request a new code.')
    user = db.scalar(select(User).where(User.email == email).with_for_update())
    if not user:
        raise HTTPException(422, 'Code invalid, expired, or exhausted. Request a new code.')
    if grant:
        token = secrets.token_urlsafe(32)
        row.code_hash, row.verified = digest(token), True
        row.expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        db.commit()
        return {'reset_token':token}
    user.email_verified, user.is_active = True, True
    row.consumed = True
    db.commit()
    return {'message':'Email verified. You can now sign in.'}


def throttle_auth(request, db):
    """Database-backed per-peer limit; never trust a browser-supplied forwarded address."""
    if request.method != 'POST':
        return
    now = datetime.now(timezone.utc)
    peer = 'rate:' + digest(request.client.host if request.client else 'unknown')
    lock(db, peer, 'rate')
    row = db.scalar(select(EmailChallenge).where(EmailChallenge.email == peer, EmailChallenge.purpose == 'rate').with_for_update())
    if row is None:
        row = EmailChallenge(email=peer, purpose='rate', code_hash='', expires_at=now, sent_at=now,
                             window_at=now, requests=0, attempts=0, verified=False, consumed=False)
        db.add(row)
    if now - row.window_at >= timedelta(hours=1):
        row.window_at, row.requests = now, 0
    if now - row.sent_at >= timedelta(minutes=1):
        row.sent_at, row.attempts = now, 0
    if row.requests >= 300 or row.attempts >= 60:
        raise HTTPException(429, 'Too many authentication requests. Please retry later.')
    row.requests += 1
    row.attempts += 1
    db.commit()
