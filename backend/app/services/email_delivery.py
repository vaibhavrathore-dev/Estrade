import json
import os
from base64 import urlsafe_b64encode
from email.message import EmailMessage
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
]

TOKEN_FILE = Path(
    os.getenv(
        "ESTRADE_GOOGLE_TOKEN_FILE",
        "google_token.json",
    )
)


def _credentials():
    token_json = os.getenv("ESTRADE_GOOGLE_TOKEN_JSON")

    if token_json:
        credentials = Credentials.from_authorized_user_info(
            json.loads(token_json),
            GMAIL_SCOPES,
        )
    else:
        if not TOKEN_FILE.exists():
            raise RuntimeError(
                "Google Gmail account is not connected"
            )

        credentials = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            GMAIL_SCOPES,
        )

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())

        if not token_json:
            TOKEN_FILE.write_text(credentials.to_json())

    if not credentials.valid:
        raise RuntimeError(
            "Google Gmail authorization is invalid"
        )

    return credentials


def send_certificate_email(
    *,
    recipient_email: str,
    participant_name: str,
    event_title: str,
    event_date,
    certificate_code: str,
    pdf_bytes: bytes,
):
    credentials = _credentials()

    service = build(
        "gmail",
        "v1",
        credentials=credentials,
        cache_discovery=False,
    )

    sender = (
        service.users()
        .getProfile(userId="me")
        .execute()["emailAddress"]
    )

    message = EmailMessage()

    message["To"] = recipient_email
    message["From"] = sender
    message["Subject"] = (
        f"Your certificate for {event_title} | Estrade"
    )

    message.set_content(
        f"""Hello {participant_name},

Your verified certificate for {event_title} is ready.

Event: {event_title}
Date: {event_date:%d %B %Y}
Certificate ID: {certificate_code}

Your certificate is attached to this email.

This certificate was issued through Estrade after verified participation.

Behind every great event.

Estrade
"""
    )

    filename = (
        "estrade-"
        + certificate_code.lower()
        + ".pdf"
    )

    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=filename,
    )

    encoded = urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    result = (
        service.users()
        .messages()
        .send(
            userId="me",
            body={"raw": encoded},
        )
        .execute()
    )

    return result["id"]
