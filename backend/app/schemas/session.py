from pydantic import BaseModel
from datetime import datetime

class SessionResponse(BaseModel):
    id: int
    created_at: datetime
    last_active: datetime

    class Config:
        from_attributes = True
