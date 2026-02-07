from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.course import (
    CourseInput,
    CourseEvaluation,
    CourseListInput,
)
from app.models.course_engine import evaluate_course, rank_courses

router = APIRouter(prefix="/courses", tags=["Courses"])


# ==================== Course CRUD Endpoints ====================

@router.post("/add")
def add_course(course: CourseInput):
    """
    Add a new course.
    
    Returns the course with a generated ID and initial evaluation.
    """
    try:
        # Validate course structure
        total_weight = sum(a.weight for a in course.assessments)
        if abs(total_weight - 100) > 0.1 and len(course.assessments) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assessment weights must sum to 100%, got {total_weight}%"
            )
        
        # Evaluate the course
        evaluation = evaluate_course(course) if len(course.assessments) > 0 else None
        
        return {
            "success": True,
            "message": "Course added successfully",
            "course": course.dict(),
            "evaluation": evaluation
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/update/{course_code}")
def update_course(course_code: str, course: CourseInput):
    """
    Update an existing course.
    
    Pass the course code in the URL and the updated course data in the body.
    """
    try:
        # Validate course structure if assessments exist
        if len(course.assessments) > 0:
            total_weight = sum(a.weight for a in course.assessments)
            if abs(total_weight - 100) > 0.1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assessment weights must sum to 100%, got {total_weight}%"
                )
        
        # Evaluate the updated course
        evaluation = evaluate_course(course) if len(course.assessments) > 0 else None
        
        return {
            "success": True,
            "message": f"Course {course_code} updated successfully",
            "course": course.dict(),
            "evaluation": evaluation
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/delete/{course_code}")
def delete_course(course_code: str):
    """
    Delete a course by course code.
    """
    return {
        "success": True,
        "message": f"Course {course_code} deleted successfully",
        "course_code": course_code
    }


# ==================== Assessment Management Endpoints ====================

@router.post("/{course_code}/assessments/add")
def add_assessment(course_code: str, course: CourseInput):
    """
    Add an assessment to a course.
    
    Send the full updated course with the new assessment included.
    Returns the evaluation with the new assessment.
    """
    try:
        # Validate total weight
        total_weight = sum(a.weight for a in course.assessments)
        if abs(total_weight - 100) > 0.1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assessment weights must sum to 100%, got {total_weight}%"
            )
        
        evaluation = evaluate_course(course)
        
        return {
            "success": True,
            "message": "Assessment added successfully",
            "course": course.dict(),
            "evaluation": evaluation
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{course_code}/assessments/update")
def update_assessment(course_code: str, course: CourseInput):
    """
    Update an assessment in a course.
    
    Send the full updated course with the modified assessment.
    Returns the updated evaluation.
    """
    try:
        # Validate total weight
        total_weight = sum(a.weight for a in course.assessments)
        if abs(total_weight - 100) > 0.1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Assessment weights must sum to 100%, got {total_weight}%"
            )
        
        evaluation = evaluate_course(course)
        
        return {
            "success": True,
            "message": "Assessment updated successfully",
            "course": course.dict(),
            "evaluation": evaluation
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{course_code}/assessments/delete")
def delete_assessment(course_code: str, course: CourseInput):
    """
    Delete an assessment from a course.
    
    Send the full updated course without the deleted assessment.
    Returns the updated evaluation.
    """
    try:
        # Validate total weight if assessments exist
        if len(course.assessments) > 0:
            total_weight = sum(a.weight for a in course.assessments)
            if abs(total_weight - 100) > 0.1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assessment weights must sum to 100%, got {total_weight}%"
                )
        
        evaluation = evaluate_course(course) if len(course.assessments) > 0 else None
        
        return {
            "success": True,
            "message": "Assessment deleted successfully",
            "course": course.dict(),
            "evaluation": evaluation
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== Core Evaluation Endpoints ====================

@router.post("/evaluate", response_model=CourseEvaluation)
def evaluate_single_course(course: CourseInput):
    """
    Evaluate a single course and return all metrics.
    
    - **name**: Course name
    - **code**: Course code
    - **target_grade**: Desired final grade (0-100)
    - **assessments**: List of assessments with weights and grades
    
    Returns current grade, required average, completion %, and status.
    """
    try:
        return evaluate_course(course)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/rank")
def rank_all_courses(course_list: CourseListInput):
    """
    Rank courses by priority (which need most attention).
    Returns sorted list with highest priority first.
    
    Priority is calculated based on:
    - How far behind target
    - Amount of work remaining
    - Risk of not achieving target
    """
    try:
        return rank_courses(course_list.courses)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/evaluate/batch")
def evaluate_multiple_courses(course_list: CourseListInput):
    """
    Evaluate multiple courses at once.
    Returns each course with its evaluation metrics.
    
    Useful for dashboard views showing all courses.
    """
    try:
        responses = []
        for course_input in course_list.courses:
            evaluation = evaluate_course(course_input)
            responses.append({
                "course": course_input.dict(),
                "evaluation": evaluation
            })
        return responses
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/dashboard")
def get_dashboard(course_list: CourseListInput):
    """
    Get dashboard summary statistics for all courses.
    
    Returns:
    - Total courses
    - Count by status (ahead/ontrack/behind)
    - Average current grade
    - Courses at risk
    """
    try:
        courses = course_list.courses
        
        if not courses:
            return {
                "total_courses": 0,
                "courses_behind": 0,
                "courses_on_track": 0,
                "courses_ahead": 0,
                "average_current_grade": 0.0,
                "courses_at_risk": []
            }
        
        evaluations = [evaluate_course(course) for course in courses]
        
        status_counts = {
            "behind": sum(1 for e in evaluations if e.status == "behind"),
            "ontrack": sum(1 for e in evaluations if e.status == "ontrack"),
            "ahead": sum(1 for e in evaluations if e.status == "ahead")
        }
        
        avg_grade = sum(e.current_grade for e in evaluations) / len(evaluations)
        
        # Courses at risk (behind and required average > 85%)
        at_risk = [
            courses[i].name 
            for i, e in enumerate(evaluations) 
            if e.status == "behind" and e.required_average > 85
        ]
        
        return {
            "total_courses": len(courses),
            "courses_behind": status_counts["behind"],
            "courses_on_track": status_counts["ontrack"],
            "courses_ahead": status_counts["ahead"],
            "average_current_grade": round(avg_grade, 1),
            "courses_at_risk": at_risk
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== What-If Analysis Endpoints ====================

@router.post("/whatif/grade")
def calculate_what_if_grade(
    course: CourseInput,
    assessment_name: str,
    hypothetical_grade: float
):
    """
    Calculate what-if scenario: "What if I get X% on this assessment?"
    
    Returns the projected final grade and updated metrics.
    """
    if not 0 <= hypothetical_grade <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Grade must be between 0 and 100"
        )
    
    # Find the assessment
    assessment_found = False
    modified_assessments = []
    
    for assessment in course.assessments:
        if assessment.name == assessment_name:
            assessment_found = True
            # Create modified version with hypothetical grade
            modified = assessment.copy()
            modified.grade = hypothetical_grade
            modified.status = "completed"
            modified_assessments.append(modified)
        else:
            modified_assessments.append(assessment)
    
    if not assessment_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment '{assessment_name}' not found"
        )
    
    # Create modified course and evaluate
    modified_course = CourseInput(
        name=course.name,
        code=course.code,
        target_grade=course.target_grade,
        assessments=modified_assessments
    )
    
    evaluation = evaluate_course(modified_course)
    
    return {
        "assessment_name": assessment_name,
        "hypothetical_grade": hypothetical_grade,
        "projected_final_grade": evaluation.current_grade,
        "new_required_average": evaluation.required_average,
        "new_status": evaluation.status,
        "can_achieve_target": evaluation.can_achieve_target
    }


@router.post("/whatif/target")
def calculate_grade_needed(
    course: CourseInput,
    desired_final_grade: float,
    assessment_name: str
):
    """
    Calculate what grade is needed on a specific assessment to achieve desired final grade.
    
    Example: "What do I need on the final to get 85% in the course?"
    """
    if not 0 <= desired_final_grade <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Desired grade must be between 0 and 100"
        )
    
    # Find the target assessment
    target_assessment = None
    other_assessments = []
    
    for assessment in course.assessments:
        if assessment.name == assessment_name:
            if assessment.status == "completed":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Assessment '{assessment_name}' is already completed"
                )
            target_assessment = assessment
        else:
            other_assessments.append(assessment)
    
    if not target_assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment '{assessment_name}' not found"
        )
    
    # Calculate required grade
    # Formula: (desired_final * total_weight - sum of other grades) / target_weight
    
    total_weight = sum(a.weight for a in course.assessments)
    completed_points = sum(
        a.grade * a.weight 
        for a in other_assessments 
        if a.status == "completed" and a.grade is not None
    )
    
    required_points = (desired_final_grade * total_weight) - completed_points
    required_grade = required_points / target_assessment.weight
    
    achievable = 0 <= required_grade <= 100
    
    return {
        "assessment_name": assessment_name,
        "desired_final_grade": desired_final_grade,
        "required_grade": round(required_grade, 1),
        "achievable": achievable,
        "message": (
            f"You need {round(required_grade, 1)}% on {assessment_name} to achieve {desired_final_grade}% final grade."
            if achievable
            else f"Target of {desired_final_grade}% is not achievable (would need {round(required_grade, 1)}%)."
        )
    }


# ==================== Utility Endpoints ====================

@router.post("/validate")
def validate_course_structure(course: CourseInput):
    """
    Validate course structure without evaluating.
    Checks if assessment weights sum to 100%.
    """
    total_weight = sum(a.weight for a in course.assessments)
    
    is_valid = abs(total_weight - 100) < 0.1
    
    return {
        "valid": is_valid,
        "total_weight": round(total_weight, 2),
        "message": (
            "Course structure is valid"
            if is_valid
            else f"Assessment weights sum to {total_weight}%, must equal 100%"
        ),
        "assessment_count": len(course.assessments),
        "completed_count": sum(1 for a in course.assessments if a.status == "completed")
    }


@router.get("/status-info")
def get_status_information():
    """
    Get information about course status classifications.
    """
    return {
        "statuses": {
            "ahead": {
                "description": "Current grade exceeds target grade",
                "color": "#22c55e",
                "icon": "✓",
                "priority": "low"
            },
            "ontrack": {
                "description": "On pace to meet target with reasonable effort",
                "color": "#3b82f6",
                "icon": "→",
                "priority": "medium"
            },
            "behind": {
                "description": "Requires high performance on remaining work",
                "color": "#f59e0b",
                "icon": "!",
                "priority": "high"
            }
        }
    }


@router.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "course-evaluator",
        "version": "1.0.0"
    }


# ==================== Example Endpoints ====================

@router.get("/examples/course")
def get_example_course():
    """
    Get an example course structure for testing.
    """
    return {
        "name": "Data Structures",
        "code": "CS104",
        "target_grade": 85,
        "assessments": [
            {
                "name": "Midterm",
                "weight": 30,
                "grade": 90,
                "status": "completed"
            },
            {
                "name": "Final",
                "weight": 50,
                "grade": None,
                "status": "pending"
            },
            {
                "name": "Projects",
                "weight": 20,
                "grade": 95,
                "status": "completed"
            }
        ]
    }


@router.get("/examples/courses")
def get_example_courses():
    """
    Get example courses for testing batch operations.
    """
    return {
        "courses": [
            {
                "name": "Data Structures",
                "code": "CS104",
                "target_grade": 85,
                "assessments": [
                    {"name": "Midterm", "weight": 30, "grade": 90, "status": "completed"},
                    {"name": "Final", "weight": 50, "grade": None, "status": "pending"},
                    {"name": "Projects", "weight": 20, "grade": 95, "status": "completed"}
                ]
            },
            {
                "name": "Calculus II",
                "code": "MATH202",
                "target_grade": 80,
                "assessments": [
                    {"name": "Midterm", "weight": 30, "grade": 76, "status": "completed"},
                    {"name": "Final", "weight": 50, "grade": None, "status": "pending"},
                    {"name": "Projects", "weight": 20, "grade": 95, "status": "completed"}
                ]
            },
            {
                "name": "Web Development",
                "code": "CS408",
                "target_grade": 90,
                "assessments": [
                    {"name": "Midterm", "weight": 30, "grade": 85, "status": "completed"},
                    {"name": "Final", "weight": 50, "grade": None, "status": "pending"},
                    {"name": "Projects", "weight": 20, "grade": 95, "status": "completed"}
                ]
            }
        ]
    }