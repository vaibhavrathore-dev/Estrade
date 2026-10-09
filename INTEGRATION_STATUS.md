# Estrade integration status — 9 October 2026

## Completed and tested

- Fixed signup's missing imports and login's undefined navigation; preserved landing page, assets, original dashboard CSS and responsive layout.
- Real signup/login, safe `/auth/me`, student-only registration, in-memory JWT, protected dashboard, 401/409/422/network feedback and loading states.
- Existing scheduling service and GiST constraint preserved. Authorized event creation, active venues, committee selection, lists/details, private/public visibility, publication and cancellation.
- Real browser demo: create A, reject overlapping B, create B in another venue.
- Committee roles/rosters, coordinator assignments and availability, withdrawal request/review/history, manual replacement.
- Original OpenCV/perceptual-hash analysis integrated behind authenticated event APIs. Bounded uploads, decoded content validation, safe filenames, metadata stripping, duplicate/blur recommendations, previews and stored analysis history.
- Verified-participation certificate issuance, duplicate protection, restricted PDF downloads and minimal public verification. PDF rendered and visually inspected.
- Real dashboard events/counts/staffing/readiness; fake operational metrics removed.
- Reviewed additive Alembic revision `b2b_operations` applied. Original venue exclusion constraint verified present. Controlled repeatable seed workflow tested.
- PostgreSQL service tests: **6/6**. Original SQL scheduling assertions: **4/4** (executed by API test suite).
- API suite: **9 test functions passed**, covering real PostgreSQL and rollback-only fixtures. One upstream TestClient/httpx deprecation warning.
- Frontend: **Vite production build and ESLint pass**. Chromium end-to-end smoke passes with zero runtime errors; desktop and mobile screenshots inspected.

## Implemented but untested

- Optional standalone AI compatibility server (same authenticated implementation) has import/route checks; its separate port was not browser-tested.
- Production reverse-proxy deployment, sustained upload load, and simultaneous competing HTTP requests were not exercised. Database exclusion and uniqueness constraints are in place; SQL conflict behavior is tested.

## Pending / MVP limitations

- General schedule editing, committee creation/join/approval UI, participant self-registration, password reset, refresh/revocation sessions, login rate limiting and email verification.
- Persistent image storage and human-review decision editing; originals are not retained, previews last for the current browser session. Analysis history and recommendations are retained.
- Separate task/checklist management and automatic volunteer recommendations. Readiness measures schedule/staffing only; replacement is manual.
- Full Unicode/complex-script certificate typography (current PDF uses built-in Latin fonts).
- Tokens intentionally do not survive a full page reload. Demo organizer credentials must be chosen using the documented interactive seed command; no default passwords exist.

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for setup, environment variables, endpoints/examples, file inventory, test commands and the three-minute demo.
