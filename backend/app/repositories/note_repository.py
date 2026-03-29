from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note


class NoteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_lesson(self, user_id: str, lesson_id: str) -> Note | None:
        stmt = select(Note).where(
            Note.user_id == user_id,
            Note.lesson_id == lesson_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, note: Note) -> Note:
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def update(self, note: Note) -> Note:
        self.db.commit()
        self.db.refresh(note)
        return note

    def get_by_user_and_course(self, user_id: str, course_id: str) -> list[Note]:
        from app.models.course import Lesson

        stmt = (
            select(Note)
            .join(Lesson, Note.lesson_id == Lesson.id)
            .where(
                Note.user_id == user_id,
                Lesson.course_id == course_id,
            )
            .order_by(Note.updated_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())
