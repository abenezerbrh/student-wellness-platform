from pydantic import BaseModel, Field

class WellnessCreate(BaseModel):
    session_id: int
    sleep_hours: float = Field(..., ge=0, le=24)
    stress_level: int = Field(..., ge=1, le=10)
    study_hours: float = Field(..., ge=0, le=24)
