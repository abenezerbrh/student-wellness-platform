from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AnonymousSession, WellnessEntry
from app.schemas.wellness import WellnessCreate

from app.schemas.wellness_response import WellnessResponse
from typing import List

from sqlalchemy import func

router = APIRouter(
    prefix="/wellness",
    tags=["Wellness"]
)

@router.post("", response_model=WellnessResponse)
def create_wellness_entry(
    data: WellnessCreate,
    db: Session = Depends(get_db)
):
    session = (
        db.query(AnonymousSession)
        .filter(AnonymousSession.id == data.session_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    entry = WellnessEntry(
        session_id=data.session_id,
        sleep_hours=data.sleep_hours,
        stress_level=data.stress_level,
        study_hours=data.study_hours
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{session_id}", response_model=List[WellnessResponse])
def get_wellness_entries(session_id: int, db: Session = Depends(get_db)):
    return (
        db.query(WellnessEntry)
        .filter(WellnessEntry.session_id == session_id)
        .order_by(WellnessEntry.created_at.desc())
        .all()
    )

@router.get("/summary/{session_id}")
def get_wellness_summary(session_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.count(WellnessEntry.id).label("entries"),
            func.avg(WellnessEntry.sleep_hours).label("avg_sleep"),
            func.avg(WellnessEntry.stress_level).label("avg_stress"),
            func.avg(WellnessEntry.study_hours).label("avg_study"),
        )
        .filter(WellnessEntry.session_id == session_id)
        .first()
    )

    if result.entries == 0:
        raise HTTPException(status_code=404, detail="No wellness data found")

    return {
        "session_id": session_id,
        "entries": result.entries,
        "avg_sleep_hours": round(result.avg_sleep, 2),
        "avg_stress_level": round(result.avg_stress, 2),
        "avg_study_hours": round(result.avg_study, 2),
    }

@router.get("/insights/{session_id}")
def get_wellness_insights(session_id: int, db: Session = Depends(get_db)):
    result = (
        db.query(
            func.count(WellnessEntry.id).label("entries"),
            func.avg(WellnessEntry.sleep_hours).label("avg_sleep"),
            func.avg(WellnessEntry.stress_level).label("avg_stress"),
            func.avg(WellnessEntry.study_hours).label("avg_study"),
        )
        .filter(WellnessEntry.session_id == session_id)
        .first()
    )

    if result.entries == 0:
        raise HTTPException(status_code=404, detail="No wellness data found")

    insights = []

    # Rule 1: Sleep
    if result.avg_sleep < 7:
        insights.append(
            "Your average sleep is below 7 hours. Consider prioritizing rest."
        )

    # Rule 2: Stress
    if result.avg_stress >= 7:
        insights.append(
            "Your stress levels are consistently high. Consider adding recovery time."
        )

    # Rule 3: Study–Stress interaction
    if result.avg_study >= 4 and result.avg_stress >= 7:
        insights.append(
            "Higher study hours appear to be associated with increased stress."
        )

    # Rule 4: Consistency
    if result.entries >= 5:
        insights.append(
            "You have been consistently tracking your wellness. Keep it up!"
        )

    if not insights:
        insights.append(
            "Your wellness data looks balanced. Keep maintaining healthy habits."
        )

    return {
        "session_id": session_id,
        "entries": result.entries,
        "insights": insights
    }
