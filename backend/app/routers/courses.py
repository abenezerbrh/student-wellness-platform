from fastapi import APIRouter
from app.schemas.course import CourseInput, CourseEvaluation, CourseListInput
from app.models.course_engine import evaluate_course, rank_courses

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.post("/evaluate", response_model=CourseEvaluation)
def evaluate(course: CourseInput):
    return evaluate_course(course)

@router.post("/rank")
def rank(course_list: CourseListInput):
    return rank_courses(course_list.courses)
