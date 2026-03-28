from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from app.models.learning_path import LearningPath, LearningPathCourse

class LearningPathRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, organization_id: str) -> list[LearningPath]:
        stmt = (
            select(LearningPath)
            .options(
                joinedload(LearningPath.path_courses)
                .joinedload(LearningPathCourse.course)
            )
            .where(LearningPath.organization_id == organization_id)
            .order_by(LearningPath.created_at.desc())
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def get_by_id(self, path_id: str) -> LearningPath | None:
        stmt = (
            select(LearningPath)
            .options(
                joinedload(LearningPath.path_courses)
                .joinedload(LearningPathCourse.course)
            )
            .where(LearningPath.id == path_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_slug(self, slug: str, org_id: str) -> LearningPath | None:
        stmt = select(LearningPath).where(
            LearningPath.slug == slug,
            LearningPath.organization_id == org_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, path: LearningPath) -> LearningPath:
        self.db.add(path)
        self.db.commit()
        self.db.refresh(path)
        return self.get_by_id(path.id)  # type: ignore

    def update(self, path: LearningPath) -> LearningPath:
        self.db.commit()
        return self.get_by_id(path.id)  # type: ignore

    def delete(self, path: LearningPath) -> None:
        self.db.delete(path)
        self.db.commit()

    def set_courses(
        self,
        path_id: str,
        courses: list[dict],
    ) -> None:
        """
        Reemplaza todos los cursos de la ruta.
        Patrón: Delete + Insert — más simple que diff incremental
        para listas pequeñas de cursos.
        """
        stmt = select(LearningPathCourse).where(
            LearningPathCourse.learning_path_id == path_id
        )
        existing = self.db.execute(stmt).scalars().all()
        for item in existing:
            self.db.delete(item)

        for item in courses:
            self.db.add(LearningPathCourse(
                learning_path_id=path_id,
                course_id=item["course_id"],
                order_index=item["order_index"],
                is_required=item.get("is_required", True),
            ))

        self.db.commit()