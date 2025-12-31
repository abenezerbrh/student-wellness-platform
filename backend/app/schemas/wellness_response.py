from pydantic import BaseModel
from datetime import datetime

class WellnessResponse(BaseModel):
    id: int
    session_id: int
    sleep_hours: float
    stress_level: int
    study_hours: float
    created_at: datetime

    class Config:
        from_attributes = True
