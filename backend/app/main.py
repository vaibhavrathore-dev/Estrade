from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.routers.auth import router as auth_router
from app.routers.events import router as events_router

app = FastAPI(
    title="Estrade API",
    version="0.1.0",
)

from app.core.upload_limits import UploadBodyLimit
app.add_middleware(UploadBodyLimit)

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
                   allow_credentials=False, allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
                   allow_headers=["Authorization", "Content-Type"])

app.include_router(auth_router)
app.include_router(events_router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/ready")
def readiness(db: Session = Depends(get_db)):
    try:
        db.execute(sql_text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        )

    return {
        "status": "ready",
        "database": "ok",
    }
from app.routers.catalog import router as catalog_router
app.include_router(catalog_router)

from app.routers.coordination import router as coordination_router
from app.routers.summary import router as summary_router
app.include_router(coordination_router)
app.include_router(summary_router)

from app.routers.media import router as media_router
from app.routers.certificates import router as certificates_router
app.include_router(media_router)
app.include_router(certificates_router)


from app.routers.registrations import router as registrations_router
app.include_router(registrations_router)

from app.routers.admin import router as admin_router
app.include_router(admin_router)

