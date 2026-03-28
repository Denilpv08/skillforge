import re
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.learning_path import LearningPath
from app.models.user import User, UserRole
from app.repositories.learning_path_repository import LearningPathRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.learning_path import LearningPathCreate, LearningPathUpdate

def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    return slug.strip("-")

class LearningPathService:
    def __init__(self, db: Session):
        self.repo         = LearningPathRepository(db)
        self.course_repo  = CourseRepository(db)

    def get_all(self, org_id: str) -> list[LearningPath]:
        return self.repo.get_all(org_id)

    def get_by_id(self, path_id: str, org_id: str) -> LearningPath:
        path = self.repo.get_by_id(path_id)
        if not path or path.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Learning path not found",
            )
        return path

    def create(
        self,
        data: LearningPathCreate,
        org_id: str,
        current_user: User,
    ) -> LearningPath:
        slug = _slugify(data.title)

        # Slug único
        base_slug = slug
        counter   = 1
        while self.repo.get_by_slug(slug, org_id):
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Validar que los cursos existen y pertenecen a la org
        for item in data.courses:
            course = self.course_repo.get_by_id(item.course_id)
            if not course or course.organization_id != org_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Course {item.course_id} not found",
                )

        path = LearningPath(
            organization_id=org_id,
            title=data.title,
            slug=slug,
            description=data.description,
        )
        self.repo.db.add(path)
        self.repo.db.flush()  # genera el ID sin commit

        # Asignar cursos
        if data.courses:
            self.repo.set_courses(
                path.id,
                [c.model_dump() for c in data.courses],
            )
        else:
            self.repo.db.commit()

        return self.repo.get_by_id(path.id)  # type: ignore

    def update(
        self,
        path_id: str,
        data: LearningPathUpdate,
        org_id: str,
        current_user: User,
    ) -> LearningPath:
        path = self.get_by_id(path_id, org_id)
        self._check_permission(current_user)

        if data.title is not None:
            path.title = data.title
        if data.description is not None:
            path.description = data.description

        return self.repo.update(path)

    def set_courses(
        self,
        path_id: str,
        courses: list[dict],
        org_id: str,
        current_user: User,
    ) -> LearningPath:
        path = self.get_by_id(path_id, org_id)
        self._check_permission(current_user)

        for item in courses:
            course = self.course_repo.get_by_id(item["course_id"])
            if not course or course.organization_id != org_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Course {item['course_id']} not found",
                )

        self.repo.set_courses(path_id, courses)
        return self.repo.get_by_id(path_id)  # type: ignore

    def delete(
        self,
        path_id: str,
        org_id: str,
        current_user: User,
    ) -> None:
        path = self.get_by_id(path_id, org_id)
        self._check_permission(current_user)
        self.repo.delete(path)

    def _check_permission(self, user: User) -> None:
        if user.role not in (
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins and instructors can manage learning paths",
            )