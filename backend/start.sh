#!/usr/bin/env bash
set -e

python migrate.py upgrade

exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}"
