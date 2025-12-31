from typing import List, Optional
from pydantic import BaseModel

class Assessment(BaseModel):
    name: str
    weight: float
    grade: Optional[float] = None

class CourseInput(BaseModel):
    name: str
    assessments: List[Assessment]
    target_grade: float

class CourseEvaluation(BaseModel):
    course: str
    current_standing: Optional[float]
    remaining_weight: float
    required_average: Optional[float]
    risk: str

class CourseListInput(BaseModel):
    courses: List[CourseInput]
