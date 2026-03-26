from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from app.models.enrollment import Enrollment, LessonProgress

class EnrollmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user(self, user_id: str) -> list[Enrollment]:
        stmt = (
            select(Enrollment)
            .options(joinedload(Enrollment.course))
            .where(Enrollment.user_id == user_id)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_by_user_and_course(
        self, user_id: str, course_id: str
    ) -> Enrollment | None:
        stmt = select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_id(self, enrollment_id: str) -> Enrollment | None:
        return self.db.get(Enrollment, enrollment_id)

    def create(self, enrollment: Enrollment) -> Enrollment:
        self.db.add(enrollment)
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def update(self, enrollment: Enrollment) -> Enrollment:
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def get_lesson_progress(
        self, enrollment_id: str, lesson_id: str
    ) -> LessonProgress | None:
        stmt = select(LessonProgress).where(
            LessonProgress.enrollment_id == enrollment_id,
            LessonProgress.lesson_id == lesson_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all_lesson_progress(
        self, enrollment_id: str
    ) -> list[LessonProgress]:
        stmt = select(LessonProgress).where(
            LessonProgress.enrollment_id == enrollment_id
        )
        return list(self.db.execute(stmt).scalars().all())

    def create_lesson_progress(
        self, progress: LessonProgress
    ) -> LessonProgress:
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def update_lesson_progress(
        self, progress: LessonProgress
    ) -> LessonProgress:
        self.db.commit()
        self.db.refresh(progress)
        return progress