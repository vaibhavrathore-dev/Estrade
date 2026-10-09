# Estrade integration handoff

## Launch

Keep the existing `estrade` PostgreSQL database and `estrade_app` role. Never execute legacy schema scripts or reset tables.

On the existing Linux installation, if PostgreSQL is not already running:

```sh
sudo systemctl start postgresql
pg_isready -h 127.0.0.1 -p 5432
```

Backend, from the repository root:

```sh
cd backend
# Existing .venv uses Python 3.14. For a fresh checkout: python3.14 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python migrate.py current
.venv/bin/python migrate.py upgrade
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend in another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite binds port 5173 with `strictPort`; `/api` proxies to `127.0.0.1:8000`. OpenAPI is at `http://127.0.0.1:8000/docs`. For production, serve the built frontend and proxy `/api` to FastAPI over HTTPS. Vite's dev proxy is not part of `dist`.

AI runs inside the main backend using the actual `ai/src/` code. **No separate AI process is needed.** Optional compatibility launch:

```sh
cd backend
PYTHONPATH=.. .venv/bin/uvicorn ai.api:app --host 127.0.0.1 --port 8001
```

This exposes the same secured routes. Legacy `POST /analyze-images?event_id=<uuid>` now requires an authorized bearer token and uses the validated adapter. `ai.main:app` forwards to it. The original image-analysis functions remain unchanged.

## Environment variables

Use the existing untracked `backend/.env`; no secret values are included here.

| Variable | Purpose / default |
| --- | --- |
| `DB_HOST`, `DB_PORT` | PostgreSQL host; port defaults to 5432 |
| `DB_NAME` | Existing `estrade` database |
| `DB_USER` | Existing `estrade_app` role |
| `DB_PASSWORD` | Existing application role password |
| `JWT_SECRET_KEY` | Strong private signing secret |
| `JWT_ALGORITHM` | Keep `HS256` (verification explicitly permits HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Default 60 |
| `CORS_ORIGINS` | JSON array; defaults to localhost and 127.0.0.1 on port 5173 |
| `ENVIRONMENT` | Default `development`; set `production` to disable demo provisioning |
| `VITE_API_URL` | Optional frontend API origin; default empty uses `/api` proxy |

Passwords/JWTs are not logged or written to browser storage. Full reloads require login. Client-provided user roles and actor IDs do not grant permissions.

## Development demo setup

Register student/volunteer accounts through Signup first. Provision a faculty committee head interactively:

```sh
cd backend
.venv/bin/python seed_demo.py --email faculty@example.org --name "Demo Faculty" --role faculty --with-demo-events --member-email volunteer@example.org
```

Choose and confirm a password of at least 12 characters at the hidden prompt. Replace addresses with the accounts you intend to demonstrate. Repeat `--member-email` for a second volunteer/replacement. Use `--role admin` only when deliberately provisioning a development administrator. Existing account roles/passwords are never overwritten. Rerunning does not duplicate accounts, venues, memberships or the completed demo event.

The seed creates an explicitly labeled demo committee, two venues, approved memberships and (optionally) a past confirmed event for certificate eligibility. No certificates or attendance records are fabricated by the seed. Confirm demo participation explicitly in the UI using the completed event.

## Database and dependencies

`backend/alembic/versions/b2b_operations.py` follows `64f6563d3960`. It only creates:

- `event_assignments`: foreign keys, active-assignment uniqueness and status constraint.
- `withdrawal_requests`: original-assignment reference, pending-request uniqueness, review actor/time and retained history.
- `event_participations`: unique event/user, verifying organizer, evidence and timestamp.
- `certificates`: unique participation/type, issuer and name/event/date snapshots, opaque UUID.
- `media_analyses`: event/uploader references, JSON analysis results and timestamp.

Existing tables/migrations and the `no_confirmed_venue_overlap` GiST exclusion constraint remain unchanged. Destructive downgrade is intentionally disabled. Migrations were reviewed and applied locally through Alembic.

Added backend dependency: `reportlab==5.0.1`. Backend requirements now include the existing `../ai/requirements.txt` (OpenCV, Pillow, ImageHash, NumPy, python-multipart and existing FastAPI/Uvicorn). No new frontend runtime dependency. The pre-existing frontend lockfile edits were retained.

## API reference and examples

All paths below start with `/api/v1`. Except registration/login, health and public certificate verification, requests require `Authorization: Bearer <access token>`. UUIDs in examples are placeholders, not actor authority.

| Method / path | Behavior |
| --- | --- |
| `POST /auth/register` | Student-only registration; 201, duplicate 409, validation 422 |
| `POST /auth/login` | JWT; invalid credentials 401 |
| `GET /auth/me` | Safe id/name/email/type profile; invalid/expired/missing token 401 |
| `GET /venues` | Active venues and capacity |
| `GET /committees` | Committee catalog, own membership role/status and `can_manage` |
| `GET /committees/{id}/members` | Approved member/admin roster access |
| `GET /committees/{id}/availability` | Organizer view of active committee assignments and intervals |
| `GET /events` | Published events plus approved member's private committee events; admins see all |
| `POST /events` | Existing authorized scheduling service; venue conflict 409 |
| `GET /events/{id}` | Visibility-checked detail |
| `PATCH /events/{id}/publication` | Organizer publishes confirmed event or makes it private |
| `POST /events/{id}/cancel` | Organizer cancellation; releases venue and makes event private |
| `GET /events/{id}/assignments` | Private staff roster/history; public-only viewers receive no staff details |
| `POST /events/{id}/assignments` | Organizer assigns an active approved committee member; overlapping duty rejected 409 |
| `POST /assignments/{id}/withdrawals` | Assigned volunteer submits a reason; original assignment retained |
| `PATCH /withdrawals/{id}` | Organizer approves/rejects once; approved assignment becomes withdrawn |
| `POST /events/{id}/media/analyze` | Organizer-only multipart images; real analysis and saved results |
| `GET /events/{id}/media` | Organizer-only latest 20 analysis records |
| `POST /events/{id}/participations` | Organizer confirms participation with evidence after a confirmed event ends |
| `GET /events/{id}/participations` | Organizer roster; other eligible viewers see only their own records |
| `POST /participations/{id}/certificates` | Organizer issues once for verified participation; duplicate 409 |
| `GET /certificates` | Authenticated recipient’s own certificates, including private events |
| `GET /certificates/{id}/download` | Participant or organizer PDF download; no-store response |
| `GET /certificates/{id}/verify` | Public opaque-identifier validity/type/issuance date; no participant identity or private event details |
| `GET /dashboard` | Visible event phases, private workspace counts, event metrics and media summaries |

Authentication examples:

```json
{"full_name":"Campus Student","email":"student@example.org","password":"<chosen password>"}
```

Registration response: `{"id":"<uuid>","full_name":"Campus Student","email":"student@example.org","user_type":"student"}`.

Login request: `{"email":"student@example.org","password":"<chosen password>"}`. Response: `{"access_token":"<JWT>","token_type":"bearer"}`. `/auth/me` returns the same safe profile fields as registration.

Create event:

```json
{
  "title": "Demo Event A",
  "description": "College workshop",
  "committee_id": "<authorized committee UUID>",
  "venue_id": "<active venue UUID>",
  "starts_at": "2026-10-15T10:00:00+05:30",
  "ends_at": "2026-10-15T12:00:00+05:30",
  "max_participants": 50,
  "status": "confirmed"
}
```

201 returns the existing `EventResponse`: id/title/description, committee/venue/creator IDs, start/end, status, `is_published:false`, capacity and creation timestamp. Repeat with an overlapping confirmed interval in the same venue: **409** `{"detail":"Venue is already booked for this time"}`. Draft overlap, adjacent slots and different venues are allowed. Publish with `{"is_published":true}`.

Coordination requests:

```json
{"user_id":"<approved member UUID>","duty":"Registration desk"}
```

Assignment response: `{"id":"<assignment UUID>","status":"active"}`. Volunteer withdrawal request: `{"reason":"Exam schedule conflict"}`; response includes request id and `pending`. Review: `{"status":"approved"}` or `{"status":"rejected"}`. After approval, assign a replacement through the same assignment endpoint; historical records remain.

Media: multipart form field `files`, repeated per image. Limits: 1–12 files, 8 MiB/file, 32 MiB total, 12 megapixels/image, 34 MiB HTTP envelope. JPEG/PNG/WebP only; content must decode. Oversized bodies/files return 413, unsupported type 415, corrupt/pixel/batch errors 422. Filenames never become filesystem paths; decoded pixels are re-encoded without EXIF metadata. Originals are temporary and never published.

```json
{
  "summary": {"total_images":2,"accepted":0,"review":1,"rejected":1},
  "images": [
    {"filename":"photo.jpg","upload_index":0,"blur_score":92.88,"quality_score":40.0,"decision":"review","classification":"review","reasons":["Low sharpness"]},
    {"filename":"copy.jpg","upload_index":1,"classification":"rejected","reasons":["Duplicate image"]}
  ],
  "duplicates": [{"image1":"photo.jpg","image2":"copy.jpg","hash_distance":0,"similarity":100.0}],
  "notice": "Heuristic recommendations only. Human review is required; no original images are deleted."
}
```

Image records also retain the original pipeline's `status`/scores/decision fields. No trained neural network or external AI API is involved.

Participation confirmation: `{"email":"student@example.org","evidence":"Verified against the signed attendance register"}` → 201 `{"id":"<participation UUID>","full_name":"Campus Student"}`. Certificate issuance uses that ID with no request body → 201 `{"id":"<opaque UUID>","download_url":"/api/v1/certificates/<UUID>/download"}`. Public verification returns `{"id":"<UUID>","valid":true,"certificate_type":"participation","issued_at":"<timestamp>"}`.

## Tests and evidence

```sh
cd backend
.venv/bin/python -m pytest tests/test_integration.py -q
.venv/bin/python -m tests.check_event_service
.venv/bin/python -m compileall -q app tests seed_demo.py migrate.py
```

The API suite uses real PostgreSQL through the application's session dependency, nested savepoints and an outer rollback. It also executes `tests/test_scheduling.sql` with its four original scheduling assertions. Tests cover missing/invalid/expired JWTs, role escalation attempts, 401/409/422 handling, private visibility, capacity, conflicts/adjacency/drafts, roster privacy, withdrawal review/reassignment, upload bounds/corruption/duplicates/metadata, certificate eligibility/uniqueness/downloads, CORS and repeatable seed behavior.

```sh
cd frontend
npm run build
npm run lint
```

Browser smoke: stop a normal API on port 8000, start `cd backend && .venv/bin/python -m tests.browser_server`, start Vite, then run `node frontend/tests/browser-smoke.cjs` from the root with Playwright available. `PLAYWRIGHT_MODULE` may point to an existing Playwright package; `PLAYWRIGHT_BROWSERS_PATH` may point to its Chromium installation. This session used the installed Codex Playwright runtime and temporary Chromium under `/tmp/estrade-browsers`; no application dependency was added. Stop the test server with Ctrl+C to roll back all browser fixtures. **Never use the test fixture server as the normal application server.** Restart it between smoke runs.

Browser evidence: signup, invalid login, successful login, protected navigation, create A, same-venue conflict, different-venue recovery, duplicate image upload, participation verification, PDF issuance/download, assignment, navigation and reload logout. No JS runtime errors. Desktop/mobile layout screenshots and rendered certificate were visually inspected. Test artifacts are under `/tmp`, not committed.

## Three-minute live demo

Before presenting: choose organizer credentials with the seed command, register two volunteers, add both with `--member-email`, start the normal backend and Vite, and keep two sample images (one duplicate) ready. Use the clearly labeled completed demo event for certificates.

1. **0:00–0:25:** Show the unchanged landing page. Sign in as the seeded faculty head. Show real dashboard and committee role.
2. **0:25–1:15:** Create confirmed Event A in Demo Auditorium. Create Event B in the same interval: show the conflict message. Change B to Demo Seminar Hall and create successfully.
3. **1:15–1:45:** Open Media, select the event, upload a photo and its duplicate. Show blur/quality scores and duplicate recommendation; explain human review.
4. **1:45–2:15:** Open Certificates and the completed demo event. Confirm a registered participant with demo attendance evidence, issue and download the branded PDF.
5. **2:15–3:00:** Open Coordinators, assign a volunteer. Use a second signed-in volunteer browser to request withdrawal; organizer approves and assigns the other volunteer. Show retained history and updated dashboard counts.

Do not reload the signed-in browser mid-demo unless you intend to sign in again. Never claim readiness includes equipment/task completion or that media classifications are a trained neural model.

## Exact file inventory

Files modified or added for this integration:

- `AGENTS.md`
- `INTEGRATION_GUIDE.md`
- `INTEGRATION_STATUS.md`
- `ai/api.py`
- `ai/main.py`
- `backend/alembic/versions/b2b_operations.py`
- `backend/app/core/config.py`
- `backend/app/core/dependencies.py`
- `backend/app/core/upload_limits.py`
- `backend/app/main.py`
- `backend/app/models/__init__.py`
- `backend/app/models/operations.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/catalog.py`
- `backend/app/routers/certificates.py`
- `backend/app/routers/coordination.py`
- `backend/app/routers/events.py`
- `backend/app/routers/media.py`
- `backend/app/routers/summary.py`
- `backend/app/schemas/auth.py`
- `backend/app/services/access.py`
- `backend/app/services/certificates.py`
- `backend/app/services/media.py`
- `backend/migrate.py`
- `backend/requirements.txt`
- `backend/seed_demo.py`
- `backend/tests/browser_server.py`
- `backend/tests/test_integration.py`
- `frontend/eslint.config.js`
- `frontend/src/App.jsx`
- `frontend/src/components/DashboardStats.jsx`
- `frontend/src/components/EventForm.jsx`
- `frontend/src/components/EventReadiness.jsx`
- `frontend/src/components/EventWorkspace.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/Topbar.jsx`
- `frontend/src/components/UpcomingEvents.jsx`
- `frontend/src/components/WithdrawalAlert.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Operations.css`
- `frontend/src/pages/Signup.jsx`
- `frontend/src/services/api.js`
- `frontend/tests/browser-smoke.cjs`
- `frontend/vite.config.js`

`frontend/package-lock.json` was already modified before this task and was not edited during implementation. Existing edits in `ai/main.py`, Login, Signup and the API client were integrated rather than discarded. No changes were made to the original scheduling service, core models, existing migrations, `ai/src/` algorithms, landing components, assets or original dashboard CSS.
