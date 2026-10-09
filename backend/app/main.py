from fastapi import FastAPI
from app.routers.auth import router as auth_router
from app.routers.events import router as events_router

app = FastAPI(
    title="Estrade API",
    version="0.1.0",
)

app.include_router(auth_router)
app.include_router(events_router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}