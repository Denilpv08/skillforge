from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.dependencies import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.course import CourseStatus
from app.schemas.course import (
    CategoryCreate, CategoryOut,
    CourseCreate, CourseUpdate, CourseOut, CourseDetail,
    LessonCreate, LessonUpdate, LessonOut, CourseStatusUpdate
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

@router.patch(
    "/categories/{category_id}",
    response_model=CategoryOut,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
def update_category(
    category_id: str,
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = CategoryService(db)
    category = svc.repo.get_by_id(category_id)
    if not category or category.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Category not found")
    category.name = data.name
    if data.description is not None:
        category.description = data.description
    svc.repo.db.commit()
    svc.repo.db.refresh(category)
    return category


@router.delete(
    "/categories/{category_id}",
    status_code=204,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
def delete_category(
    category_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = CategoryService(db)
    category = svc.repo.get_by_id(category_id)
    if not category or category.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Category not found")
    svc.repo.db.delete(category)
    svc.repo.db.commit()

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
    
@router.patch(
    "/{course_id}/status",
    response_model=CourseOut,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def change_course_status(
    course_id: str,
    data: CourseStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cambia el estado de un curso con validaciones de transición:
    DRAFT → PUBLISHED (requiere al menos 1 lección)
    PUBLISHED → ARCHIVED
    ARCHIVED → DRAFT (permite reactivar)
    """
    return CourseService(db).change_status(
        course_id, data.status, current_user.organization_id, current_user
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
    
@router.get("/{course_id}/lessons/{lesson_id}", response_model=LessonOut)
def get_lesson(
    course_id: str,
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obtiene una lección específica.
    Si el usuario no está inscrito, solo puede ver lecciones gratuitas.
    """
    from app.repositories.enrollment_repository import EnrollmentRepository
    from app.repositories.course_repository import LessonRepository

    lesson_repo = LessonRepository(db)
    lesson = lesson_repo.get_by_id(lesson_id)

    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Verificar acceso
    enrollment_repo = EnrollmentRepository(db)
    enrollment = enrollment_repo.get_by_user_and_course(
        current_user.id, course_id
    )
    is_instructor_or_admin = current_user.role.value in (
        "ADMIN", "SUPER_ADMIN", "INSTRUCTOR"
    )

    if not enrollment and not lesson.is_free and not is_instructor_or_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled to access this lesson",
        )

    return lesson

@router.put(
    "/{course_id}/lessons/reorder",
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def reorder_lessons(
    course_id: str,
    lesson_ids: list[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Recibe una lista ordenada de IDs de lecciones
    y actualiza el order_index de cada una.
    """
    from app.repositories.course_repository import LessonRepository

    course_svc = CourseService(db)
    course = course_svc.get_by_id(course_id, current_user.organization_id)
    course_svc._check_ownership(course, current_user)

    lesson_repo = LessonRepository(db)
    for index, lesson_id in enumerate(lesson_ids):
        lesson = lesson_repo.get_by_id(lesson_id)
        if lesson and lesson.course_id == course_id:
            lesson.order_index = index

    db.commit()
    return {"message": "Lessons reordered successfully"}