from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.dependencies import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.course import CourseStatus
from app.schemas.course import (
    CategoryCreate, CategoryOut,
    CourseCreate, CourseUpdate, CourseOut, CourseDetail,
    LessonCreate, LessonUpdate, LessonOut,
)
from app.schemas import common
from app.services.course_service import CategoryService, CourseService

router = APIRouter(prefix="/courses", tags=["Courses"])

# ─── Categories ──────────────────────────────────────────────
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CategoryService(db).get_all(current_user.organization_id)


@router.post(
    "/categories",
    response_model=CategoryOut,
    status_code=201,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
def create_category(
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CategoryService(db).create(data, current_user.organization_id)

# ─── Courses ─────────────────────────────────────────────────
@router.get("", response_model=common.PaginatedOut[CourseOut])
def list_courses(
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 20,
    status: CourseStatus | None = None,
    category_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    courses, total = CourseService(db).get_all(
        org_id=current_user.organization_id,
        status=status,
        category_id=category_id,
        page=page,
        per_page=per_page,
    )
    return common.PaginatedOut(
        data=courses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=-(-total // per_page),  # ceil division
    )

@router.post(
    "",
    response_model=CourseOut,
    status_code=201,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def create_course(
    data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CourseService(db).create(data, current_user.organization_id, current_user)

@router.get("/{course_id}", response_model=CourseDetail)
def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CourseService(db).get_by_id(course_id, current_user.organization_id)

@router.patch(
    "/{course_id}",
    response_model=CourseOut,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def update_course(
    course_id: str,
    data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CourseService(db).update(
        course_id, data, current_user.organization_id, current_user
    )

@router.delete(
    "/{course_id}",
    status_code=204,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    CourseService(db).delete(
        course_id, current_user.organization_id, current_user
    )

# ─── Lessons ─────────────────────────────────────────────────
@router.post(
    "/{course_id}/lessons",
    response_model=LessonOut,
    status_code=201,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def add_lesson(
    course_id: str,
    data: LessonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CourseService(db).add_lesson(
        course_id, data, current_user.organization_id, current_user
    )

@router.patch(
    "/{course_id}/lessons/{lesson_id}",
    response_model=LessonOut,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def update_lesson(
    course_id: str,
    lesson_id: str,
    data: LessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CourseService(db).update_lesson(
        lesson_id, data, current_user.organization_id, current_user
    )

@router.delete(
    "/{course_id}/lessons/{lesson_id}",
    status_code=204,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def delete_lesson(
    course_id: str,
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    CourseService(db).delete_lesson(
        lesson_id, current_user.organization_id, current_user
    )