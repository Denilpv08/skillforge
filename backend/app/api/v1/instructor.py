from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_roles
from app.models.course import CourseStatus
from app.models.user import User, UserRole
from app.schemas import common
from app.schemas.instructor import (
    InstructorAnalyticsOut,
    InstructorCourseMetricsOut,
    InstructorQuizStatsOut,
    InstructorStudentProgressDetailOut,
    InstructorStudentRowOut,
)
from app.services.instructor_service import InstructorService

router = APIRouter(
    prefix="/instructor",
    tags=["Instructor"],
    dependencies=[Depends(require_roles(UserRole.INSTRUCTOR))],
)


@router.get("/courses", response_model=list[InstructorCourseMetricsOut])
def get_instructor_courses(
    status: CourseStatus | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InstructorService(db).get_courses(current_user, status)


@router.get("/students", response_model=common.PaginatedOut[InstructorStudentRowOut])
def get_instructor_students(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    course_id: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows, total = InstructorService(db).get_students(
        current_user,
        course_id,
        page,
        per_page,
    )
    return common.PaginatedOut(
        data=rows,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=-(-total // per_page),
    )


@router.get(
    "/students/{student_id}/progress",
    response_model=InstructorStudentProgressDetailOut,
)
def get_student_progress_detail(
    student_id: str,
    course_id: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InstructorService(db).get_student_progress_detail(
        current_user, student_id, course_id
    )


@router.get("/quizzes", response_model=common.PaginatedOut[InstructorQuizStatsOut])
def get_instructor_quizzes(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=12, ge=1, le=100),
    course_id: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows, total = InstructorService(db).get_quizzes(
        current_user,
        course_id,
        page,
        per_page,
    )
    return common.PaginatedOut(
        data=rows,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=-(-total // per_page),
    )


@router.get("/analytics", response_model=InstructorAnalyticsOut)
def get_instructor_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InstructorService(db).get_analytics(current_user)
