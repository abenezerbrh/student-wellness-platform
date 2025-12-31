from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class WellnessEntry(Base):
    __tablename__ = "wellness_entries"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("anonymous_sessions.id"), nullable=False)

    sleep_hours = Column(Float, nullable=False)
    stress_level = Column(Integer, nullable=False)  # 1–10
    study_hours = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
