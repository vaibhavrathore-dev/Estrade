# Estrade project conventions

- Preserve the React 19/Vite/JSX UI, landing sections, assets, existing CSS, Lucide icons, sidebar and topbar. Add small scoped controls; do not redesign.
- Work with the existing FastAPI, Python 3.14, Pydantic v2, SQLAlchemy, Psycopg, PostgreSQL and Alembic stack. Never run legacy schema SQL or database reset commands.
- Run backend commands from `backend/` with `.venv/bin/python`; frontend commands from `frontend/`. Settings load `backend/.env` relative to the working directory. Never print or commit secrets.
- Check `git status` first and preserve teammate changes. Existing uncommitted work is not disposable.
- Database changes must be additive Alembic migrations reviewed before execution. `python migrate.py upgrade` is the migration entry point. The `no_confirmed_venue_overlap` GiST constraint is the final concurrency protection; preserve its confirmed-only, half-open time range semantics.
- Authentication derives the actor from a validated JWT and active database user. Registration always creates a student. Only development seed workflows provision faculty/admin accounts. Never accept browser-supplied authority.
- Use `services/access.py` for visibility and organizer checks. Published event visibility never grants access to private staff or media records.
- The frontend API client holds access tokens in memory. A full reload requires login. Use the Vite `/api` proxy locally; configure `VITE_API_URL` only when necessary.
- Integrate the original `ai/src/` implementation through `services/media.py`; this is OpenCV/hash heuristics, not a trained neural model. Enforce bounded, decoded uploads with generated filenames and metadata stripping.
- Certificates require organizer-verified participation after a confirmed event has ended. Keep issuance unique and download access restricted. Public verification must minimize personal data.
- Keep assignment and withdrawal history. Approving withdrawal permits manual replacement; do not overwrite the original assignment.
- Tests: `cd backend && .venv/bin/python -m pytest tests/test_integration.py -q`; `.venv/bin/python -m tests.check_event_service`. PostgreSQL integration fixtures roll back. Never point browser test fixtures at a shared production deployment.
- Frontend checks: `cd frontend && npm run build && npm run lint`. Browser smoke script and rollback test server are described in `INTEGRATION_STATUS.md`.
- Update integration status with actual evidence; distinguish tested, untested and pending work. Do not describe placeholder or fictional figures as database results.
