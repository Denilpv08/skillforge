from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from app.models.course import Category, Course, Lesson, CourseStatus

class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, organization_id: str) -> list[Category]:
        stmt = select(Category).where(
            Category.organization_id == organization_id
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_by_id(self, category_id: str) -> Category | None:
        return self.db.get(Category, category_id)

    def get_by_slug(self, slug: str, org_id: str) -> Category | None:
        stmt = select(Category).where(
            Category.slug == slug,
            Category.organization_id == org_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, category: Category) -> Category:
        self.db.add(category)
        try:
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise
        self.db.refresh(category)
        return category

class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(
        self,
        organization_id: str,
        status: CourseStatus | None = None,
        category_id: str | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[Course], int]:
        stmt = select(Course).where(Course.organization_id == organization_id)

        if status:
            stmt = stmt.where(Course.status == status)
        if category_id:
            stmt = stmt.where(Course.category_id == category_id)

        # Total para paginación
        from sqlalchemy import func, select as sa_select
        count_stmt = sa_select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginación
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)
        courses = list(self.db.execute(stmt).scalars().all())

        return courses, total

    def get_by_id(self, course_id: str) -> Course | None:
        return self.db.get(Course, course_id)

    def get_by_slug(self, slug: str, org_id: str) -> Course | None:
        stmt = select(Course).where(
            Course.slug == slug,
            Course.organization_id == org_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, course: Course) -> Course:
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def update(self, course: Course) -> Course:
        self.db.commit()
        self.db.refresh(course)
        return course

    def delete(self, course: Course) -> None:
        self.db.delete(course)
        self.db.commit()

class LessonRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_course(self, course_id: str) -> list[Lesson]:
        stmt = (
            select(Lesson)
            .where(Lesson.course_id == course_id)
            .order_by(Lesson.order_index)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_by_id(self, lesson_id: str) -> Lesson | None:
        return self.db.get(Lesson, lesson_id)

    def create(self, lesson: Lesson) -> Lesson:
        self.db.add(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        return lesson

    def update(self, lesson: Lesson) -> Lesson:
        self.db.commit()
        self.db.refresh(lesson)
        return lesson

    def delete(self, lesson: Lesson) -> None:
        self.db.delete(lesson)
        self.db.commit()