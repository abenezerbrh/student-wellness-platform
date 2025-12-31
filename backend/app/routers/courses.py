from fastapi import APIRouter
from app.schemas.course import CourseInput, CourseEvaluation
from app.models.course_engine import evaluate_course

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.post("/evaluate", response_model=CourseEvaluation)
def evaluate(course: CourseInput):
    return evaluate_course(course)
