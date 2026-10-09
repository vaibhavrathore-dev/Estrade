from uuid import UUID
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models import User, MediaAnalysis
from app.services.access import get_event
from app.services.media import analyze_uploads
router = APIRouter(prefix='/api/v1/events', tags=['Media'])

@router.post('/{event_id}/media/analyze')
def analyze(event_id: UUID, files: list[UploadFile] = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_event(db, user, event_id, manage=True)
    result = analyze_uploads(files)
    record = MediaAnalysis(event_id=event_id, uploaded_by=user.id, result=result)
    db.add(record)
    db.commit()
    return result

@router.get('/{event_id}/media')
def history(event_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_event(db, user, event_id, manage=True)
    return [{'id': r.id, 'created_at': r.created_at, 'result': r.result} for r in db.scalars(
        select(MediaAnalysis).where(MediaAnalysis.event_id == event_id).order_by(MediaAnalysis.created_at.desc()).limit(20))]
