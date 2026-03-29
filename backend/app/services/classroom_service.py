from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enrollment import LessonProgress
from app.models.note import Note
from app.models.user import User
from app.repositories.course_repository import CourseRepository, LessonRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.note_repository import NoteRepository
from app.schemas.classroom import (
    ClassroomProgressOut,
    LessonProgressPatchIn,
    LessonProgressPatchOut,
    NoteOut,
    NoteUpsertIn,
)


class ClassroomService:
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
        self.course_repo = CourseRepository(db)
        self.lesson_repo = LessonRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    def get_note(self, current_user: User, lesson_id: str) -> NoteOut | None:
        note = self.note_repo.get_by_user_and_lesson(current_user.id, lesson_id)
        if not note:
            return None
        return NoteOut.model_validate(note)

    def upsert_note(self, current_user: User, payload: NoteUpsertIn) -> NoteOut:
        lesson = self.lesson_repo.get_by_id(payload.lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found",
            )

        note = self.note_repo.get_by_user_and_lesson(current_user.id, payload.lesson_id)
        if not note:
            note = Note(
                user_id=current_user.id,
                lesson_id=payload.lesson_id,
                content=payload.content,
            )
            saved = self.note_repo.create(note)
            return NoteOut.model_validate(saved)

        note.content = payload.content
        saved = self.note_repo.update(note)
        return NoteOut.model_validate(saved)

    def update_lesson_progress(
        self,
        current_user: User,
        lesson_id: str,
        payload: LessonProgressPatchIn,
    ) -> LessonProgressPatchOut:
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found",
            )

        enrollment = self.enrollment_repo.get_by_user_and_course(
            current_user.id,
            lesson.course_id,
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course",
            )

        progress = self.enrollment_repo.get_lesson_progress(enrollment.id, lesson_id)
        if not progress:
            progress = LessonProgress(
                enrollment_id=enrollment.id,
                lesson_id=lesson_id,
                watch_time_sec=payload.seconds_viewed,
                completed_at=datetime.utcnow() if payload.mark_completed else None,
            )
            self.enrollment_repo.create_lesson_progress(progress)
        else:
            progress.watch_time_sec = max(progress.watch_time_sec, payload.seconds_viewed)
            if payload.mark_completed and not progress.completed_at:
                progress.completed_at = datetime.utcnow()
            self.enrollment_repo.update_lesson_progress(progress)

        progress_pct = self._calculate_progress(enrollment.id, lesson.course_id)
        enrollment.progress_pct = progress_pct
        if progress_pct >= 100 and not enrollment.completed_at:
            enrollment.completed_at = datetime.utcnow()
        self.enrollment_repo.update(enrollment)

        return LessonProgressPatchOut(
            lesson_id=lesson_id,
            seconds_viewed=progress.watch_time_sec,
            progress_pct=float(progress_pct),
            course_completed=enrollment.completed_at is not None,
            next_lesson_id=self._get_next_lesson_id(lesson.course_id, lesson_id),
        )

    def get_course_progress(
        self,
        current_user: User,
        course_id: str,
    ) -> ClassroomProgressOut:
        course = self.course_repo.get_by_id(course_id)
        if not course or course.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

        enrollment = self.enrollment_repo.get_by_user_and_course(current_user.id, course_id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course",
            )

        lesson_progress = self.enrollment_repo.get_all_lesson_progress(enrollment.id)
        completed_lesson_ids = [
            item.lesson_id for item in lesson_progress if item.completed_at is not None
        ]

        lessons = self.lesson_repo.get_by_course(course_id)
        remaining_minutes = sum(
            lesson.duration_min or 0
            for lesson in lessons
            if lesson.id not in completed_lesson_ids
        )

        return ClassroomProgressOut(
            course_id=course_id,
            progress_pct=float(enrollment.progress_pct),
            completed_lesson_ids=completed_lesson_ids,
            estimated_remaining_min=remaining_minutes,
        )

    def get_notes_by_course(self, current_user: User, course_id: str) -> list[NoteOut]:
        notes = self.note_repo.get_by_user_and_course(current_user.id, course_id)
        return [NoteOut.model_validate(note) for note in notes]

    def _calculate_progress(self, enrollment_id: str, course_id: str) -> float:
        lessons = self.lesson_repo.get_by_course(course_id)
        if not lessons:
            return 0.0

        lesson_progress = self.enrollment_repo.get_all_lesson_progress(enrollment_id)
        completed_count = sum(
            1 for item in lesson_progress if item.completed_at is not None
        )
        return round((completed_count / len(lessons)) * 100, 2)

    def _get_next_lesson_id(self, course_id: str, lesson_id: str) -> str | None:
        lessons = self.lesson_repo.get_by_course(course_id)
        current_index = next(
            (index for index, lesson in enumerate(lessons) if lesson.id == lesson_id),
            -1,
        )
        if current_index == -1 or current_index >= len(lessons) - 1:
            return None
        return lessons[current_index + 1].id
