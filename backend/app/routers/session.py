from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AnonymousSession

from app.schemas.session import SessionResponse

router = APIRouter(
    prefix="/session",
    tags=["Session"]
)

@router.post("", response_model=SessionResponse)
def create_session(db: Session = Depends(get_db)):
    session = AnonymousSession()
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = (
        db.query(AnonymousSession)
        .filter(AnonymousSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
