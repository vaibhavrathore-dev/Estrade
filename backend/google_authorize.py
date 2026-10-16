from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
]

CLIENT_FILE = Path("google_client_secret.json")
TOKEN_FILE = Path("google_token.json")

if not CLIENT_FILE.exists():
    raise SystemExit(
        "Missing backend/google_client_secret.json"
    )

flow = InstalledAppFlow.from_client_secrets_file(
    CLIENT_FILE,
    SCOPES,
)

credentials = flow.run_local_server(
    port=0,
    access_type="offline",
    prompt="consent",
)

TOKEN_FILE.write_text(credentials.to_json())

print("GOOGLE_GMAIL_AUTHORIZED")
print("Token saved securely to backend/google_token.json")
