from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.enrollment import Enrollment, LessonProgress
from app.models.course import CourseStatus
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.course_repository import CourseRepository, LessonRepository

class EnrollmentService:
    def __init__(self, db: Session):
        self.repo = EnrollmentRepository(db)
        self.course_repo = CourseRepository(db)
        self.lesson_repo = LessonRepository(db)

    def get_my_enrollments(self, user_id: str) -> list[Enrollment]:
        return self.repo.get_by_user(user_id)

    def enroll(self, course_id: str, user_id: str, org_id: str) -> Enrollment:
        # Verificar que el curso existe, está publicado y pertenece a la org
        course = self.course_repo.get_by_id(course_id)
        if not course or course.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )
        if course.status != CourseStatus.PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot enroll in an unpublished course",
            )

        # Verificar que no esté ya inscrito
        existing = self.repo.get_by_user_and_course(user_id, course_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Already enrolled in this course",
            )

        enrollment = Enrollment(user_id=user_id, course_id=course_id)
        return self.repo.create(enrollment)

    def complete_lesson(
        self,
        course_id: str,
        lesson_id: str,
        user_id: str,
        watch_time_sec: int,
    ) -> dict:
        # Verificar inscripción
        enrollment = self.repo.get_by_user_and_course(user_id, course_id)
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course",
            )

        # Verificar que la lección pertenece al curso
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson or lesson.course_id != course_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found in this course",
            )

        # Crear o actualizar progreso de lección
        progress = self.repo.get_lesson_progress(enrollment.id, lesson_id)
        if not progress:
            progress = LessonProgress(
                enrollment_id=enrollment.id,
                lesson_id=lesson_id,
                completed_at=datetime.utcnow(),
                watch_time_sec=watch_time_sec,
            )
            self.repo.create_lesson_progress(progress)
        else:
            progress.watch_time_sec = max(
                progress.watch_time_sec, watch_time_sec
            )
            if not progress.completed_at:
                progress.completed_at = datetime.utcnow()
            self.repo.update_lesson_progress(progress)

        # Recalcular progreso del curso
        progress_pct = self._calculate_progress(enrollment.id, course_id)
        enrollment.progress_pct = progress_pct

        # Marcar como completado si llegó al 100%
        if progress_pct >= 100 and not enrollment.completed_at:
            enrollment.completed_at = datetime.utcnow()

        self.repo.update(enrollment)

        return {
            "lesson_id": lesson_id,
            "progress_pct": float(progress_pct),
            "course_completed": enrollment.completed_at is not None,
        }

    def _calculate_progress(
        self, enrollment_id: str, course_id: str
    ) -> float:
        """
        Calcula el porcentaje de progreso del curso.
        progreso = lecciones_completadas / total_lecciones * 100
        """
        total_lessons = len(self.lesson_repo.get_by_course(course_id))
        if total_lessons == 0:
            return 0.0

        completed = self.repo.get_all_lesson_progress(enrollment_id)
        completed_count = sum(
            1 for p in completed if p.completed_at is not None
        )

        return round((completed_count / total_lessons) * 100, 2)