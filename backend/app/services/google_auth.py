import json
from app.core.config import settings
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials


TOKEN_FILE = Path(settings.ESTRADE_GOOGLE_TOKEN_FILE)

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.file",
]


def google_credentials():
    token_json = settings.ESTRADE_GOOGLE_TOKEN_JSON

    if token_json:
        credentials = Credentials.from_authorized_user_info(
            json.loads(token_json),
            GOOGLE_SCOPES,
        )

        persist_to_file = False

    else:
        if not TOKEN_FILE.exists():
            raise RuntimeError(
                "Estrade Google account is not connected"
            )

        credentials = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            GOOGLE_SCOPES,
        )

        persist_to_file = True

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())

        if persist_to_file:
            TOKEN_FILE.write_text(
                credentials.to_json()
            )

    if not credentials.valid:
        raise RuntimeError(
            "Estrade Google authorization is invalid"
        )

    return credentials
