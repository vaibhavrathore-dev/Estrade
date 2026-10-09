"""Compatibility entry point for the secured, integrated AI API.

Run from backend/: PYTHONPATH=.. .venv/bin/uvicorn ai.api:app --port 8001
The former anonymous /analyze-images upload is intentionally not exposed.
Use POST /api/v1/events/{event_id}/media/analyze with an organizer JWT.
"""
from app.main import app

# Backward-compatible path now requires event_id plus organizer authentication.
from app.routers.media import analyze
app.add_api_route('/analyze-images', analyze, methods=['POST'], tags=['Media'], deprecated=True)
