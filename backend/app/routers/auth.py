
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RegisterRequest,
    RegisterResponse,
)

from app.services.auth import (
    authenticate_user,
    register_user,
    InvalidCredentialsError,
    EmailAlreadyRegisteredError,
)


def auth_rate_limit(request: Request, db: Session = Depends(get_db)):
    from app.services.email_challenges import throttle_auth
    throttle_auth(request, db)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
    dependencies=[Depends(auth_rate_limit)],
)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        user = register_user(db, data)

    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    from app.services.email_challenges import request_code
    try:
        request_code(db, user.email, "verify")
        delivery = "sent"
    except HTTPException:
        delivery = "unavailable"
    return RegisterResponse(
        verification_required=True,
        delivery_status=delivery,
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        user_type=user.user_type,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    try:
        token = authenticate_user(
            db,
            email=str(data.email),
            password=data.password,
        )

    except InvalidCredentialsError:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return TokenResponse(
        access_token=token
    )


from app.core.dependencies import get_current_user
from app.models.user import User

@router.get("/me", response_model=RegisterResponse)
def me(user: User = Depends(get_current_user)):
    return RegisterResponse(id=user.id, full_name=user.full_name, email=user.email, user_type=user.user_type)

from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from datetime import datetime, timezone
import hmac
from app.models import EmailChallenge
from app.services.email_challenges import request_code, verify_code, digest, lock
from app.core.security import hash_password

class EmailInput(BaseModel):
    email: EmailStr

class CodeInput(EmailInput):
    code: str = Field(pattern=r'^\d{6}$')

class ResetInput(EmailInput):
    reset_token: str = Field(min_length=32, max_length=100)
    password: str = Field(min_length=12, max_length=128)

@router.post('/verification/resend')
def resend(data: EmailInput, db: Session = Depends(get_db)):
    return request_code(db, str(data.email), 'verify')

@router.post('/verification/verify')
def verify_email(data: CodeInput, db: Session = Depends(get_db)):
    return verify_code(db, str(data.email), 'verify', data.code)

@router.post('/password/forgot')
def forgot(data: EmailInput, db: Session = Depends(get_db)):
    return request_code(db, str(data.email), 'recover')

@router.post('/password/verify')
def verify_recovery(data: CodeInput, db: Session = Depends(get_db)):
    return verify_code(db, str(data.email), 'recover', data.code, grant=True)

@router.post('/password/reset')
def reset_password(data: ResetInput, db: Session = Depends(get_db)):
    email = str(data.email).lower()
    lock(db, email, 'recover')
    row = db.scalar(select(EmailChallenge).where(EmailChallenge.email == email, EmailChallenge.purpose == 'recover').with_for_update())
    if not row or not row.verified or row.consumed or row.expires_at <= datetime.now(timezone.utc) or not hmac.compare_digest(row.code_hash, digest(data.reset_token)):
        raise HTTPException(422, 'Recovery authorization invalid or expired')
    user = db.scalar(select(User).where(User.email == email).with_for_update())
    if not user or not user.is_active:
        raise HTTPException(422, 'Recovery authorization invalid or expired')
    user.password_hash = hash_password(data.password)
    row.consumed = True
    db.commit()
    return {'message':'Password updated. Sign in with your new password.'}
