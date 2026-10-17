# Estrade — Integration Recovery Report

Date: October 18, 2026. Branch: `feature/estrade-workflow-rescue`.

The application now exposes the event lifecycle through the authenticated UI. Local PostgreSQL integration tests and a real-backend browser journey verify the core path. Email transport is mocked in automated tests. Live Gmail delivery, live Drive upload, physical-camera scanning, and production deployment are not verified.

No production deployment was performed. Existing users, events, certificates, assignment history, migrations and venue constraints were preserved. The initial untracked ZIP, design references, `estrade_step1/` and `estrade_step2/` were left untouched. Landing-page components and assets were not changed.

## 1. Original problems

- Authenticated pages hard-coded “Faculty workspace” for student accounts.
- Registration, QR attendance and certificate delivery APIs existed without a corresponding UI journey.
- Certificate controls used the older email/evidence form instead of checked-in registrations.
- Invalid QR tokens returned 401, causing the API client to log out an authenticated organizer.
- Committee membership had pending/approved states but no application and review endpoints or inbox.
- Signup immediately activated accounts; verification and password recovery were absent.
- Action colors were overridden by inherited dashboard CSS. Disabled and operational actions were visually similar.
- Public certificate-code verification exposed participant names and private event details. Dashboard media summaries were visible to ordinary committee members.
- The existing withdrawal test assumed deterministic ordering of records sharing a transaction timestamp.
- Existing browser tests targeted the retired lamp experience, not the current curtain opening. Existing screenshot destinations also had filesystem permission problems.

## 2. Audit and workflow status

“Working” means the stated local tests passed. It does not mean the external provider or production hosting was tested.

| Workflow | Original backend / frontend | Current status | Evidence and limits |
| --- | --- | --- | --- |
| Landing → login → role dashboard | Existing / incorrect faculty label | **Working** | API auth tests, live-browser faculty/student login; preserved curtains and preview isolation |
| Signup → email OTP → login | Immediate activation / auto-login | **Partially Working** | Real API and database, browser UI; email transport mocked. Live delivery unverified |
| Authorized create → publish → discover | Existing / existing event controls | **Working** | Live-browser faculty head creates/publishes; student sees event; API permission and venue-conflict tests |
| Dynamic registration → ticket | Existing / absent | **Working** | UI questions, backend type/choice validation, duplicate handling, SVG QR ticket; live-browser journey |
| QR → attendance | Existing / absent | **Partially Working** | Manual token validation, duplicate and invalid QR, attendance persistence, camera-unavailable fallback tested; physical camera scanning unverified |
| Event end → approve → issue → PDF → verify | Existing / obsolete confirmation screen | **Working** | Real PostgreSQL API and live browser; PDF download, hash regression test, public verification. Test-only fixture advances event completion |
| Certificate email / retry | Existing / no delivery state | **Partially Working** | Sent path mocked in API tests; failed creation-delivery and retry paths tested; live Gmail unverified |
| Request membership → review → assignment | Missing application endpoints / directory only | **Working** | Real API and browser request/approval; restricted coordinator role; no organizer privilege grant |
| Withdrawal → review → replacement/history | Existing / existing | **Working** | API tests review/reassignment/history; browser request and assigned-duty visibility |
| Forgot password → OTP → new password | Absent / absent | **Partially Working** | API expiry/replay/attempt limits and live-browser recovery tested with mocked email |
| Analyze photos | Existing / existing | **Working** | Real image decoding, duplicates, bounds and metadata tests |
| Analyze → store eligible images in Drive | Existing / absent | **Partially Working** | Connected UI, upload/failure counts and folder results; mocked Drive routing and failure tests; live Drive unverified |
| Render / Vercel hosting | Incomplete configuration | **Partially Working** | Deployment files and instructions prepared; no hosted build, TLS or production smoke test |

## 3. Features fixed and UI changes

- Student-specific workspace label; organizer navigation follows committee `can_manage`, not a faculty label.
- New entry points: My Registrations, My Assignments, Registrations, QR Attendance, Participation Approval and Certificate Studio.
- Committee directory now supports student requests, request reasons, membership status and an authorized review inbox.
- Registration questions support text, number, select, multiselect, boolean, URL and phone. Organizers can add questions in Registrations. Students can select their certificate name.
- QR tickets render as QR images. Optional clipboard copying supports manual check-in without making a raw token the primary ticket UI.
- Organizer check-in validates the selected event on the server, displays participant identity, and rejects invalid, duplicate and cancelled-event check-ins.
- Participation approval requires event completion and QR attendance. The legacy endpoint now enforces attendance too. Certificate issuance retains its independent eligibility checks and uniqueness protection.
- Certificate creation remains successful when email fails. Delivery state, PDF download, retry and public verification are separate controls.
- Media has distinct Analyze and Analyze/store-in-Drive actions. Results show eligible/uploaded/failed counts and per-file folder routing. Rejected photos are excluded by the existing media service.
- Reusable semantic Button: burgundy primary, green approval, blue information/download, amber caution/retry, red destructive, gray disabled. Native disabled attributes, processing labels and focus outlines are included. Cancellation requires confirmation.
- Mobile section selector supplements the scrolling navigation. Existing sidebar, topbar, CSS identity and cinematic landing are retained.
- Signup, verification, resend, forgot password and reset screens include server feedback, loading guards, password visibility and keyboard-operable controls.
- Tokens remain in memory. Full reload requires login. Optional browser storage failures no longer break token assignment.

## 4. Endpoint changes

New endpoints:

- `POST /api/v1/auth/verification/resend`
- `POST /api/v1/auth/verification/verify`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/verify`
- `POST /api/v1/auth/password/reset`
- `POST /api/v1/committees/{id}/applications`
- `GET /api/v1/committees/{id}/applications`
- `PATCH /api/v1/committee-applications/{id}`
- `GET /api/v1/me/assignments`
- `GET /api/v1/events/{id}/registrations`

Modified contracts and protections:

- Registration returns `verification_required` and `delivery_status`; newly registered students are inactive until verified. Existing accounts retain their state.
- Auth POST endpoints have a database-backed per-peer limit: 60/minute, 300/hour. OTP requests additionally enforce 60-second resend spacing and five requests/hour per email/purpose. Incorrect codes are capped at five attempts per code.
- Six-digit OTPs expire after ten minutes. A keyed HMAC is stored instead of the code. Recovery verification returns a random, short-lived reset authorization; only its hash is stored. Both verification and reset are one-use.
- Recovery requests use the same response for eligible and unknown recipients. A global delivery configuration failure returns 503 uniformly. Recipient-specific transport failures do not reveal account existence; the generic response explicitly conditions delivery on availability.
- Check-in accepts optional `event_id`; a mismatch is rejected. Invalid QR returns 422, while invalid authentication still returns 401.
- Registration rejects duplicate answers, invalid types/choices and missing required values.
- Participation approval locks the registration row before creating a record. Legacy evidence approval also requires QR attendance.
- Certificate-code verification no longer exposes participant name or event details. Existing certificate hashes and PDF QR payloads were not changed.
- Recipient certificate listing includes delivery status and verification code.
- Ordinary committee membership no longer exposes media summaries through `/dashboard`.

## 5. Database migration

`backend/alembic/versions/recovery_workflows.py` follows `round2_certificate_engine`.

Reviewed before execution and applied locally using `.venv/bin/python migrate.py upgrade` from `backend/`:

- Adds nullable `committee_members.request_reason`.
- Adds `users.email_verified`, with a true server default to preserve previously provisioned accounts. Public registration explicitly sets false and inactive.
- Creates `email_challenges` for OTP hashes, expiration, attempts, request counters and one-use state. The same table stores hashed peer rate-limit keys.

No old migration was edited. No tables were dropped, recreated or reset. Destructive downgrade is disabled. The confirmed-only, half-open `no_confirmed_venue_overlap` constraint remains in place.

## 6. Build and test evidence

Commands run from their documented working directories:

```sh
# backend/
.venv/bin/python -m pytest tests/test_integration.py -q tests/test_recovery.py tests/test_round2_media.py
.venv/bin/python -m tests.check_event_service
.venv/bin/python -m pip check

# frontend/
npm run build
npm run lint
npm run test:ui -- --output=/tmp/estrade-recovery-ui-results
node tests/recovery-lifecycle.cjs
```

- **22 backend tests passed**: real PostgreSQL integration plus isolated media tests. Tests use outer rollback transactions. Email is disabled in the shared fixture; provider success/failure is explicitly mocked.
- **6 scheduling service checks passed**, including same-venue rejection, adjacency, different venues, drafts and unauthorized creation.
- **11 Playwright UI regression tests passed**, with isolated API fixtures for dashboard/auth tests. Covers the current curtain, keyboard replay, session persistence, reduced motion, theme controls, errors and 390/768/1024/1280/1440px layouts.
- **Live-backend browser lifecycle passed**: registration and email-code verification, student/faculty login, event creation/publication, enrollment, QR ticket display, invalid/duplicate/manual check-in, camera-denied fallback, completion eligibility, participation, certificate download, email failure/retry, public verification, committee request/approval, assignment, withdrawal request and password recovery. No JS runtime errors; mobile overflow check passed; semantic check-in color asserted.
- Build and lint passed. Camera code is dynamically loaded; it no longer inflates the initial application chunk.
- Installed Python dependencies pass `pip check`. Local Python is 3.14.4. A clean hosted dependency installation was not run.
- Existing Starlette/httpx deprecation warning remains. Local Node 22.23.2 successfully built/tested, but the QR scanner package declares Node >=24. Frontend now declares Node >=24 for deployment.
- Screenshots under `/tmp/estrade-recovery/` were inspected. They are local test artifacts, not real campus data.

The browser fixture server binds only loopback, requires local development settings, and rolls back on shutdown. Its test-only code retrieval and event-completion routes are registered only when launching `tests.browser_server`; they are absent from the normal FastAPI application. A test clock change is not proof that a live event actually ended.

## 7. Known limitations and unverified behavior

- Live Gmail and Google Drive credentials are present locally, but no real email or upload was sent during this work. Provider authorization, scopes, quota and delivery still require a controlled live check.
- Physical camera scanning, iOS/Safari camera behavior and HTTPS camera permissions are not verified. Manual check-in and unavailable-camera handling are verified.
- Full browser lifecycle uses PostgreSQL rollback fixtures, mocked mail transport and a test-only event-completion control. It is not a production smoke test.
- Old `browser-smoke.cjs` and `repair-smoke.cjs` reflect superseded workflows; use `recovery-lifecycle.cjs` for this release. They were not rerun as current acceptance tests.
- Rejected membership applications cannot be resubmitted. This deliberately preserves the existing unique membership and review history; a resubmission policy is not implemented.
- Adding registration questions after enrollment does not retroactively collect answers. Add questions before publishing.
- Password reset invalidates recovery authorization, but existing access JWTs remain valid until their normal expiry. Session refresh/revocation is not implemented.
- Authentication rate limits depend on the trusted client address supplied by the server. Review trusted reverse-proxy configuration before deployment; do not trust arbitrary browser forwarding headers.
- Email/Drive calls remain synchronous. Provider latency can exceed the frontend timeout; refresh before retrying a certificate issuance or storage request.
- Media storage retries can upload duplicates across separate batches; no cross-batch idempotency key or persistent original-photo workflow is added.
- Certificate PDF typography retains the existing Latin-font limitation. No new font asset was fetched.
- No production load test, hosted dependency build, migration rehearsal on a hosted snapshot, or concurrent HTTP load test was performed.

## 8. External service and deployment checklist

Prepared files: `render.yaml`, `frontend/vercel.json`.

### Backend — Render

- Use repository root as the service root. `backend/requirements.txt` includes `../ai/requirements.txt`, and the media adapter needs `ai/src/`.
- Build: `cd backend && pip install -r requirements.txt`.
- Start: `cd backend && bash start.sh`. The existing script runs `python migrate.py upgrade`, then Uvicorn with `$PORT`.
- Python: 3.14.4, matching the verified local runtime. Render supports explicit Python-version configuration: [Render Python version](https://render.com/docs/python-version).
- Supply existing hosted PostgreSQL credentials through secret environment values. `DB_SSLMODE=require` is included; use stronger certificate verification where supported by the host.
- Set `ENVIRONMENT=production`, strong `JWT_SECRET_KEY`, explicit HTTPS `CORS_ORIGINS` JSON array, and the public HTTPS **API** origin in `ESTRADE_PUBLIC_BASE_URL`.
- Production validation rejects weak signing secrets, non-HTTPS CORS/public origins and unencrypted DB configuration without printing secret values.
- `/api/v1/health` checks application liveness; `/api/v1/ready` checks database access. Render uses readiness as its health check.
- Review migrations and take a provider backup before first production start. For multiple workers/instances, run migrations once as a controlled release step before enabling concurrent starts.
- Verify OpenCV runtime/system-library support in a clean Render build. Local import tests do not establish hosted compatibility.

### Frontend — Vercel

- Root: `frontend`; Node 24 or newer; install from lockfile; build `npm run build`; output `dist`.
- Set `VITE_API_URL` to the HTTPS API origin, without a trailing `/api/v1`. This is public build-time configuration, never a secret.
- Vercel SPA rewrite is supplied for login, dashboard, recovery and public verification deep links. Vite's `/api` development proxy does not ship with `dist`. See [Vercel Vite deployment](https://vercel.com/docs/frameworks/frontend/vite).
- Set backend CORS to the actual frontend origin. Deliberately configure any preview origins; do not use a wildcard.
- Verify HTTPS, refresh/deep links, API calls and camera permission behavior after deployment.

### Google

- `ESTRADE_GMAIL_SENDER`, `ESTRADE_GOOGLE_TOKEN_JSON` or `ESTRADE_GOOGLE_TOKEN_FILE` must be configured securely. Google token settings now load through the same backend Settings mechanism as `.env`.
- Authorize `gmail.send` and `drive.file` using the existing `google_authorize.py` workflow; do not commit authorization files.
- Perform one intended-recipient email and one intended Drive upload with a consenting operator. Check failure status as well as successful delivery.
- Verify refresh-token persistence for file-based credentials; prefer a secret environment value on ephemeral hosting.

**Not deployed. Production readiness remains conditional on these checks.**

## 9. Manual test guide — Student and Faculty

### Preparation

1. Start the normal API from `backend/` and Vite from `frontend/` using the existing integration guide. Do not run browser fixture routes as the application server.
2. Use an existing authorized faculty committee head or provision one with `seed_demo.py` in development. Public signup never creates faculty/admin accounts.
3. Use two browser profiles or separate browsers, one for the student and one for the faculty head. Avoid full reloads while signed in; JWTs intentionally stay in memory.

### Student

1. Open the landing page. Confirm the curtain opens and Replay opening works. Choose account creation.
2. Submit name, email and password. Confirm the verification screen appears and login is blocked until verification.
3. Use the actual email code. If delivery is unavailable, stop this live step and record the blocker; do not treat account creation as activation. Test resend cooldown and a wrong code.
4. Sign in. Confirm the workspace says Student and does not show organizer-only navigation or Create Event.
5. Open Events. Choose the faculty-published event, fill required registration answers and register. Submit again to verify duplicate feedback.
6. Open My Registrations → Show QR ticket. Present the image to the organizer. If camera access is unavailable, use Copy ticket for manual check-in.
7. Reopen My Registrations after check-in and confirm Checked in.
8. Open Committees → request coordinator membership with a reason. Confirm pending status; approval alone must not reveal organizer controls.
9. After the organizer assigns a duty, open My Assignments. Confirm event time, duty and assigning organizer. Request withdrawal; confirm the assignment remains active while pending.
10. After certificate issuance, refresh and open Certificates. Download the PDF, inspect email status, and open Public verification in a new tab.
11. Log out. Use Forgot password, receive/verify the recovery code, choose a password of at least 12 characters and sign in with it. Test that the old password no longer works.

### Faculty / authorized organizer

1. Sign in as the approved faculty head. Create a **confirmed** event with a real venue and time. Try an overlapping event in the same venue and confirm rejection; use another venue or adjacent slot to recover.
2. Open Registrations, choose the event, and expand Configure registration questions. Add a required select question with one option per line before opening enrollment.
3. Open Events and Publish event. Confirm it appears in the student's event list.
4. Open QR Attendance and select the event. Scan the student's QR or paste the copied ticket. Confirm the returned participant identity and checked-in count. Scan twice to verify duplicate rejection. Invalid input must not log you out.
5. Open Participation Approval. Before the event ends, approval must be disabled. For a live demo, schedule a short real event and wait until its end; never alter production timestamps to fake attendance eligibility.
6. After the event ends, refresh and approve the checked-in participant. Open Certificate Studio, issue once and download the PDF. If email fails, the certificate must remain available and Retry email must report the real result.
7. Open Committees → Application inbox. Review the student's reason and approve or reject. Confirm a second review is rejected by the API.
8. Open Coordinators. Choose an approved member and assign a duty. Review the student's withdrawal request, approve/reject it, and assign a replacement after approval. Confirm the original record remains withdrawn in history.
9. Open Media. Analyze a sharp photo and a duplicate. Inspect classifications. Then select Analyze and store eligible images in Drive. Inspect eligible/uploaded/failed counts and Geotagged/Standard folder outcomes; do not infer success from analysis alone.

## 10. Repeatable browser acceptance run

```sh
# Terminal 1, backend/ — local development DB only
.venv/bin/python -m tests.browser_server --port 8002

# Terminal 2, frontend/
npm run dev

# Terminal 3, frontend/
node tests/recovery-lifecycle.cjs
```

Stop the fixture server with Ctrl+C after testing so its transaction rolls back. Restart it between runs. The browser script reads fixture account identifiers from `/tmp/estrade-browser-fixture.json`; it prints no passwords, OTPs or JWTs.
