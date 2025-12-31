def evaluate_course(course):
    completed_weight = 0
    completed_contribution = 0

    for a in course.assessments:
        if a.grade is not None:
            completed_weight += a.weight
            completed_contribution += a.weight * a.grade

    remaining_weight = 100 - completed_weight

    if completed_weight > 0:
        current_standing = completed_contribution / completed_weight
    else:
        current_standing = None

    if remaining_weight > 0:
        required_average = (
            course.target_grade * 100 - completed_contribution
        ) / remaining_weight
    else:
        required_average = None

    if required_average is None:
        risk = "Complete"
    elif required_average > 100:
        risk = "Unrealistic"
    elif required_average > 85:
        risk = "Critical"
    elif required_average > 75:
        risk = "Watch"
    else:
        risk = "Safe"

    return {
        "course": course.name,
        "current_standing": round(current_standing, 1) if current_standing else None,
        "remaining_weight": remaining_weight,
        "required_average": round(required_average, 1) if required_average else None,
        "risk": risk
    }
