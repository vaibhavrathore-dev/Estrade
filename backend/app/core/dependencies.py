
from uuid import UUID

import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    error = HTTPException(
        status_code=401,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise error

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=["HS256"],
            options={"require": ["sub", "exp", "iat"]},
        )

        if payload.get("type") != "access":
            raise error

        user_id = UUID(payload["sub"])

    except (InvalidTokenError, ValueError, TypeError, KeyError):
        raise error

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise error

    return user
