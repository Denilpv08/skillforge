import re
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.course import Category, Course, Lesson, CourseStatus
from app.models.user import User, UserRole
from app.repositories.course_repository import (
    CategoryRepository, CourseRepository, LessonRepository,
)
from app.schemas.course import (
    CategoryCreate, CourseCreate, CourseUpdate,
    LessonCreate, LessonUpdate,
)

def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    return slug.strip("-")

class CategoryService:
    def __init__(self, db: Session):
        self.repo = CategoryRepository(db)

    def get_all(self, org_id: str) -> list[Category]:
        return self.repo.get_all(org_id)

    def create(self, data: CategoryCreate, org_id: str) -> Category:
        slug = _slugify(data.name)
        if not slug:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Category name is not valid",
            )

        if self.repo.get_by_slug(slug, org_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists",
            )
        category = Category(
            organization_id=org_id,
            name=data.name,
            slug=slug,
            description=data.description,
        )
        try:
            return self.repo.create(category)
        except IntegrityError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists",
            ) from exc


class CourseService:
    def __init__(self, db: Session):
        self.repo = CourseRepository(db)
        self.lesson_repo = LessonRepository(db)

    def get_all(
        self,
        org_id: str,
        status: CourseStatus | None = None,
        category_id: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Course], int]:
        return self.repo.get_all(org_id, status, category_id, page, per_page)

    def get_by_id(self, course_id: str, org_id: str) -> Course:
        course = self.repo.get_by_id(course_id)
        if not course or course.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )
        return course

    def create(
        self, data: CourseCreate, org_id: str, instructor: User
    ) -> Course:
        slug = _slugify(data.title)

        # Asegurar slug único dentro de la organización
        base_slug = slug
        counter = 1
        while self.repo.get_by_slug(slug, org_id):
            slug = f"{base_slug}-{counter}"
            counter += 1

        course = Course(
            organization_id=org_id,
            instructor_id=instructor.id,
            title=data.title,
            slug=slug,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            category_id=data.category_id,
            duration_hours=data.duration_hours,
        )
        return self.repo.create(course)

    def update(
        self, course_id: str, data: CourseUpdate,
        org_id: str, current_user: User
    ) -> Course:
        course = self.get_by_id(course_id, org_id)
        self._check_ownership(course, current_user)

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(course, field, value)

        return self.repo.update(course)

    def delete(
        self, course_id: str, org_id: str, current_user: User
    ) -> None:
        course = self.get_by_id(course_id, org_id)
        self._check_ownership(course, current_user)
        self.repo.delete(course)

    def add_lesson(
        self, course_id: str, data: LessonCreate,
        org_id: str, current_user: User
    ) -> Lesson:
        course = self.get_by_id(course_id, org_id)
        self._check_ownership(course, current_user)

        lesson = Lesson(course_id=course.id, **data.model_dump())
        return self.lesson_repo.create(lesson)

    def update_lesson(
        self, lesson_id: str, data: LessonUpdate,
        org_id: str, current_user: User
    ) -> Lesson:
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found",
            )
        self._check_ownership(lesson.course, current_user)

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(lesson, field, value)

        return self.lesson_repo.update(lesson)

    def delete_lesson(
        self, lesson_id: str, org_id: str, current_user: User
    ) -> None:
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found",
            )
        self._check_ownership(lesson.course, current_user)
        self.lesson_repo.delete(lesson)

    def _check_ownership(self, course: Course, user: User) -> None:
        """
        Solo el instructor dueño o un ADMIN/SUPER_ADMIN pueden
        modificar un curso. Patrón: Guard Clause.
        """
        is_owner = course.instructor_id == user.id
        is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
        if not is_owner and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to modify this course",
            )
    
    def change_status(
        self,
        course_id: str,
        new_status: CourseStatus,
        org_id: str,
        current_user: User,
    ) -> Course:
        course = self.get_by_id(course_id, org_id)
        self._check_ownership(course, current_user)

        if course.status == new_status:
            return course

        course.status = new_status
        return self.repo.update(course)