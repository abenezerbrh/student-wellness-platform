from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base

class AnonymousSession(Base):
    __tablename__ = "anonymous_sessions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
