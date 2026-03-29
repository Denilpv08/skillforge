from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.grades import CourseGradebookOut, GradesSummaryOut, MyGradesOut
from app.services.grades_service import GradesService

router = APIRouter(prefix="/grades", tags=["Grades"])


@router.get("/my-grades", response_model=MyGradesOut)
def get_my_grades(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return GradesService(db).get_my_grades(current_user)


@router.get(
    "/course/{course_id}",
    response_model=CourseGradebookOut,
    dependencies=[
        Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR))
    ],
)
def get_course_grades(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return GradesService(db).get_course_gradebook(current_user, course_id)


@router.get("/summary", response_model=GradesSummaryOut)
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return GradesService(db).get_summary(current_user)
