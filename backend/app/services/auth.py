
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import hash_password


class EmailAlreadyRegisteredError(Exception):
    pass


def register_user(
    db: Session,
    data: RegisterRequest,
) -> User:

    email = str(data.email).strip().lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user is not None:
        raise EmailAlreadyRegisteredError(
            "Email already registered"
        )

    user = User(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        user_type="student",
        is_active=True,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError(
            "Email already registered"
        ) from exc

    return user


from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import (
    verify_password,
    create_access_token,
)


class InvalidCredentialsError(Exception):
    pass


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> str:

    user = db.scalar(
        select(User).where(
            User.email == email.strip().lower()
        )
    )

    if user is None or not user.is_active:
        raise InvalidCredentialsError(
            "Invalid email or password"
        )

    if not verify_password(
        password,
        user.password_hash,
    ):
        raise InvalidCredentialsError(
            "Invalid email or password"
        )

    return create_access_token(user.id)
