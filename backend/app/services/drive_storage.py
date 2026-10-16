from io import BytesIO
from pathlib import Path

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload


TOKEN_FILE = Path("google_token.json")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.file",
]

FOLDER_MIME = "application/vnd.google-apps.folder"


def _drive_credentials():
    if not TOKEN_FILE.exists():
        raise RuntimeError("Google Drive account is not connected")

    credentials = Credentials.from_authorized_user_file(
        TOKEN_FILE,
        SCOPES,
    )

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        TOKEN_FILE.write_text(credentials.to_json())

    if not credentials.valid:
        raise RuntimeError("Google Drive authorization is invalid")

    return credentials


def _service():
    return build(
        "drive",
        "v3",
        credentials=_drive_credentials(),
        cache_discovery=False,
    )


def _find_or_create_folder(service, name: str, parent_id: str | None = None):
    safe_name = name.replace("'", "\\'")

    query = [
        f"name = '{safe_name}'",
        f"mimeType = '{FOLDER_MIME}'",
        "trashed = false",
    ]

    if parent_id:
        query.append(f"'{parent_id}' in parents")

    result = (
        service.files()
        .list(
            q=" and ".join(query),
            spaces="drive",
            fields="files(id,name)",
            pageSize=10,
        )
        .execute()
    )

    files = result.get("files", [])

    if files:
        return files[0]["id"]

    metadata = {
        "name": name,
        "mimeType": FOLDER_MIME,
    }

    if parent_id:
        metadata["parents"] = [parent_id]

    created = (
        service.files()
        .create(
            body=metadata,
            fields="id",
        )
        .execute()
    )

    return created["id"]


def upload_event_image(
    *,
    event_id,
    event_title: str,
    filename: str,
    content: bytes,
    geotagged: bool,
):
    service = _service()

    estrade_folder = _find_or_create_folder(
        service,
        "Estrade",
    )

    event_folder = _find_or_create_folder(
        service,
        f"{event_title} - {str(event_id)[:8]}",
        estrade_folder,
    )

    category = "Geotagged" if geotagged else "Standard"

    category_folder = _find_or_create_folder(
        service,
        category,
        event_folder,
    )

    media = MediaIoBaseUpload(
        BytesIO(content),
        mimetype="image/png",
        resumable=False,
    )

    created = (
        service.files()
        .create(
            body={
                "name": filename,
                "parents": [category_folder],
            },
            media_body=media,
            fields="id,name,webViewLink",
        )
        .execute()
    )

    return {
        "file_id": created["id"],
        "filename": created["name"],
        "folder": category,
        "web_view_link": created.get("webViewLink"),
    }
