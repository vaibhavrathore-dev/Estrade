
from fastapi import APIRouter, Depends, HTTPException, status
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


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
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

    return RegisterResponse(
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
