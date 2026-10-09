"""Integrated AI entry point (run with backend on PYTHONPATH).

The frontend uses the main backend; no second AI process is required.
Optional: from backend/, PYTHONPATH=.. .venv/bin/uvicorn ai.main:app --port 8001
"""
from ai.api import app
