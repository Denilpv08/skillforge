from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.enrollment import EnrollmentOut
from app.services.enrollment_service import EnrollmentService

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.get("", response_model=list[EnrollmentOut])
def my_enrollments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EnrollmentService(db).get_my_enrollments(current_user.id)

@router.post("/{course_id}", status_code=201, response_model=EnrollmentOut)
def enroll(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EnrollmentService(db).enroll(
        course_id, current_user.id, current_user.organization_id
    )

@router.post("/{course_id}/lessons/{lesson_id}/complete")
def complete_lesson(
    course_id: str,
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return EnrollmentService(db).complete_lesson(
        course_id, lesson_id, current_user.id, watch_time_sec=0
    )