from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.course import Course, CourseStatus, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User
from app.schemas.instructor import (
    InstructorAnalyticsOut,
    InstructorCourseMetricsOut,
    InstructorQuizStatsOut,
    InstructorStudentProgressDetailOut,
    InstructorStudentRowOut,
    LessonWatchTimeLeaderOut,
    MonthlyCompletionPointOut,
    QuizScoreBinOut,
    StudentCourseProgressOut,
    WeeklyEnrollmentPointOut,
)


class InstructorService:
    def __init__(self, db: Session):
        self.db = db

    def get_courses(
        self,
        current_user: User,
        status_filter: CourseStatus | None,
    ) -> list[InstructorCourseMetricsOut]:
        courses_query = select(Course).where(
            Course.organization_id == current_user.organization_id,
            Course.instructor_id == current_user.id,
        )
        if status_filter is not None:
            courses_query = courses_query.where(Course.status == status_filter)

        courses = self.db.execute(courses_query.order_by(Course.created_at.desc())).scalars().all()

        output: list[InstructorCourseMetricsOut] = []
        for course in courses:
            enrolled_students = self.db.execute(
                select(func.count(Enrollment.id)).where(Enrollment.course_id == course.id)
            ).scalar_one()
            completed_students = self.db.execute(
                select(func.count(Enrollment.id)).where(
                    Enrollment.course_id == course.id,
                    Enrollment.completed_at.is_not(None),
                )
            ).scalar_one()

            avg_quiz_score = self.db.execute(
                select(func.avg(QuizAttempt.score))
                .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
                .where(Quiz.course_id == course.id)
            ).scalar_one_or_none()

            output.append(
                InstructorCourseMetricsOut(
                    course_id=course.id,
                    title=course.title,
                    status=course.status,
                    enrolled_students=enrolled_students,
                    completed_students=completed_students,
                    quiz_average_score=(
                        round(float(avg_quiz_score), 2)
                        if avg_quiz_score is not None
                        else 0.0
                    ),
                )
            )

        return output

    def get_students(
        self,
        current_user: User,
        course_id: str | None,
        page: int,
        per_page: int,
    ) -> tuple[list[InstructorStudentRowOut], int]:
        courses_query = select(Course).where(
            Course.organization_id == current_user.organization_id,
            Course.instructor_id == current_user.id,
        )
        if course_id:
            courses_query = courses_query.where(Course.id == course_id)

        courses = self.db.execute(courses_query).scalars().all()
        course_map = {course.id: course.title for course in courses}
        if not course_map:
            return []

        enrollments = self.db.execute(
            select(Enrollment).where(Enrollment.course_id.in_(list(course_map.keys())))
        ).scalars().all()

        student_ids = list({enrollment.user_id for enrollment in enrollments})
        users = self.db.execute(select(User).where(User.id.in_(student_ids))).scalars().all()
        user_map = {user.id: user for user in users}

        output: list[InstructorStudentRowOut] = []
        now = datetime.utcnow()

        for enrollment in enrollments:
            student = user_map.get(enrollment.user_id)
            if not student:
                continue

            last_access = self._get_last_access(enrollment.id, enrollment.user_id)

            if enrollment.completed_at is not None:
                student_status = "COMPLETED"
            elif last_access and (now - last_access) <= timedelta(days=14):
                student_status = "ACTIVE"
            else:
                student_status = "INACTIVE"

            output.append(
                InstructorStudentRowOut(
                    student_id=student.id,
                    student_name=student.full_name,
                    course_id=enrollment.course_id,
                    course_title=course_map.get(enrollment.course_id, "Curso"),
                    progress_pct=round(float(enrollment.progress_pct), 2),
                    last_access_at=last_access,
                    status=student_status,
                )
            )

        output.sort(
            key=lambda item: item.last_access_at or datetime.min,
            reverse=True,
        )
        total = len(output)
        start = (page - 1) * per_page
        end = start + per_page
        return output[start:end], total

    def get_student_progress_detail(
        self,
        current_user: User,
        student_id: str,
        course_id: str | None,
    ) -> InstructorStudentProgressDetailOut:
        student = self.db.get(User, student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        courses_query = select(Course).where(
            Course.organization_id == current_user.organization_id,
            Course.instructor_id == current_user.id,
        )
        if course_id:
            courses_query = courses_query.where(Course.id == course_id)

        instructor_courses = self.db.execute(courses_query).scalars().all()
        course_ids = [course.id for course in instructor_courses]
        if not course_ids:
            return InstructorStudentProgressDetailOut(
                student_id=student.id,
                student_name=student.full_name,
                courses=[],
            )

        enrollments = self.db.execute(
            select(Enrollment).where(
                Enrollment.user_id == student.id,
                Enrollment.course_id.in_(course_ids),
            )
        ).scalars().all()

        course_map = {course.id: course for course in instructor_courses}
        courses_output: list[StudentCourseProgressOut] = []

        for enrollment in enrollments:
            course = course_map.get(enrollment.course_id)
            if not course:
                continue

            total_lessons = self.db.execute(
                select(func.count(Lesson.id)).where(Lesson.course_id == course.id)
            ).scalar_one()
            completed_lessons = self.db.execute(
                select(func.count(LessonProgress.id)).where(
                    LessonProgress.enrollment_id == enrollment.id,
                    LessonProgress.completed_at.is_not(None),
                )
            ).scalar_one()

            courses_output.append(
                StudentCourseProgressOut(
                    course_id=course.id,
                    course_title=course.title,
                    progress_pct=round(float(enrollment.progress_pct), 2),
                    completed_at=enrollment.completed_at,
                    total_lessons=total_lessons,
                    completed_lessons=completed_lessons,
                )
            )

        return InstructorStudentProgressDetailOut(
            student_id=student.id,
            student_name=student.full_name,
            courses=courses_output,
        )

    def get_quizzes(
        self,
        current_user: User,
        course_id: str | None,
        page: int,
        per_page: int,
    ) -> tuple[list[InstructorQuizStatsOut], int]:
        courses_query = select(Course).where(
            Course.organization_id == current_user.organization_id,
            Course.instructor_id == current_user.id,
        )
        if course_id:
            courses_query = courses_query.where(Course.id == course_id)

        courses = self.db.execute(courses_query).scalars().all()
        course_map = {course.id: course.title for course in courses}
        if not course_map:
            return [], 0

        quizzes = self.db.execute(
            select(Quiz)
            .where(Quiz.course_id.in_(list(course_map.keys())))
            .order_by(Quiz.created_at.desc())
        ).scalars().all()

        output: list[InstructorQuizStatsOut] = []
        for quiz in quizzes:
            attempts = self.db.execute(
                select(QuizAttempt).where(QuizAttempt.quiz_id == quiz.id)
            ).scalars().all()

            total_attempts = len(attempts)
            passed_attempts = sum(1 for attempt in attempts if attempt.passed)
            pass_rate = (
                round((passed_attempts / total_attempts) * 100, 2)
                if total_attempts > 0
                else 0.0
            )
            average_score = (
                round(
                    sum(float(attempt.score) for attempt in attempts) / total_attempts,
                    2,
                )
                if total_attempts > 0
                else 0.0
            )

            output.append(
                InstructorQuizStatsOut(
                    quiz_id=quiz.id,
                    quiz_title=quiz.title,
                    course_id=quiz.course_id,
                    course_title=course_map.get(quiz.course_id, "Curso"),
                    total_attempts=total_attempts,
                    pass_rate=pass_rate,
                    average_score=average_score,
                    score_distribution=self._build_score_distribution(attempts),
                )
            )

        total = len(output)
        start = (page - 1) * per_page
        end = start + per_page
        return output[start:end], total

    def get_analytics(self, current_user: User) -> InstructorAnalyticsOut:
        courses = self.db.execute(
            select(Course).where(
                Course.organization_id == current_user.organization_id,
                Course.instructor_id == current_user.id,
            )
        ).scalars().all()
        course_ids = [course.id for course in courses]

        enrollments_by_week = self._build_enrollments_by_week(course_ids)
        completions_by_month = self._build_completions_by_month(course_ids)

        total_enrollments = self.db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.course_id.in_(course_ids))
        ).scalar_one() if course_ids else 0

        completed_enrollments = self.db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.course_id.in_(course_ids),
                Enrollment.completed_at.is_not(None),
            )
        ).scalar_one() if course_ids else 0

        retention_rate = (
            round((completed_enrollments / total_enrollments) * 100, 2)
            if total_enrollments > 0
            else 0.0
        )

        top_watch_time_lesson = self._get_top_watch_time_lesson(course_ids)

        return InstructorAnalyticsOut(
            enrollments_by_week=enrollments_by_week,
            completions_by_month=completions_by_month,
            retention_rate=retention_rate,
            top_watch_time_lesson=top_watch_time_lesson,
        )

    def _get_last_access(
        self,
        enrollment_id: str,
        student_id: str,
    ) -> datetime | None:
        latest_lesson_progress = self.db.execute(
            select(func.max(LessonProgress.completed_at)).where(
                LessonProgress.enrollment_id == enrollment_id
            )
        ).scalar_one_or_none()
        latest_quiz_attempt = self.db.execute(
            select(func.max(QuizAttempt.attempted_at)).where(QuizAttempt.user_id == student_id)
        ).scalar_one_or_none()

        candidates = [
            point
            for point in [latest_lesson_progress, latest_quiz_attempt]
            if point is not None
        ]
        if not candidates:
            return None

        return max(candidates)

    def _build_score_distribution(
        self,
        attempts: list[QuizAttempt],
    ) -> list[QuizScoreBinOut]:
        bins = [
            ("0-20", 0),
            ("21-40", 0),
            ("41-60", 0),
            ("61-80", 0),
            ("81-100", 0),
        ]
        mutable_bins = {label: count for label, count in bins}

        for attempt in attempts:
            score = float(attempt.score)
            if score <= 20:
                mutable_bins["0-20"] += 1
            elif score <= 40:
                mutable_bins["21-40"] += 1
            elif score <= 60:
                mutable_bins["41-60"] += 1
            elif score <= 80:
                mutable_bins["61-80"] += 1
            else:
                mutable_bins["81-100"] += 1

        return [
            QuizScoreBinOut(label=label, count=count)
            for label, count in mutable_bins.items()
        ]

    def _build_enrollments_by_week(
        self,
        course_ids: list[str],
    ) -> list[WeeklyEnrollmentPointOut]:
        weeks = 8
        if not course_ids:
            return []

        now = datetime.utcnow()
        current_week_start = (now - timedelta(days=now.weekday())).date()
        start_week = current_week_start - timedelta(weeks=weeks - 1)

        rows = self.db.execute(
            select(Enrollment.enrolled_at).where(
                Enrollment.course_id.in_(course_ids),
                Enrollment.enrolled_at >= datetime.combine(start_week, datetime.min.time()),
            )
        ).all()

        bucket: dict[date, int] = defaultdict(int)
        for (enrolled_at,) in rows:
            week_start = (enrolled_at - timedelta(days=enrolled_at.weekday())).date()
            bucket[week_start] += 1

        points: list[WeeklyEnrollmentPointOut] = []
        for index in range(weeks):
            week_start = start_week + timedelta(weeks=index)
            points.append(
                WeeklyEnrollmentPointOut(
                    week_start=week_start,
                    enrollments=bucket.get(week_start, 0),
                )
            )

        return points

    def _build_completions_by_month(
        self,
        course_ids: list[str],
    ) -> list[MonthlyCompletionPointOut]:
        months = 6
        if not course_ids:
            return []

        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)

        labels: list[str] = []
        month_keys: list[tuple[int, int]] = []

        year = month_start.year
        month = month_start.month
        for _ in range(months):
            labels.append(f"{year:04d}-{month:02d}")
            month_keys.append((year, month))
            month -= 1
            if month == 0:
                month = 12
                year -= 1

        month_keys.reverse()
        labels.reverse()

        start_year, start_month = month_keys[0]
        range_start = datetime(start_year, start_month, 1)

        completions = self.db.execute(
            select(Enrollment.completed_at).where(
                Enrollment.course_id.in_(course_ids),
                Enrollment.completed_at.is_not(None),
                Enrollment.completed_at >= range_start,
            )
        ).scalars().all()

        bucket: dict[str, int] = defaultdict(int)
        for completed_at in completions:
            bucket[f"{completed_at.year:04d}-{completed_at.month:02d}"] += 1

        return [
            MonthlyCompletionPointOut(month=label, completions=bucket.get(label, 0))
            for label in labels
        ]

    def _get_top_watch_time_lesson(
        self,
        course_ids: list[str],
    ) -> LessonWatchTimeLeaderOut | None:
        if not course_ids:
            return None

        row = self.db.execute(
            select(
                Lesson.id,
                Lesson.title,
                Lesson.course_id,
                Course.title,
                func.avg(LessonProgress.watch_time_sec).label("avg_watch_time"),
            )
            .join(Enrollment, LessonProgress.enrollment_id == Enrollment.id)
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .join(Course, Lesson.course_id == Course.id)
            .where(Enrollment.course_id.in_(course_ids))
            .group_by(Lesson.id, Lesson.title, Lesson.course_id, Course.title)
            .order_by(func.avg(LessonProgress.watch_time_sec).desc())
            .limit(1)
        ).first()

        if not row:
            return None

        lesson_id, lesson_title, course_id, course_title, avg_watch_time = row
        return LessonWatchTimeLeaderOut(
            lesson_id=lesson_id,
            lesson_title=lesson_title,
            course_id=course_id,
            course_title=course_title,
            average_watch_time_sec=round(float(avg_watch_time), 2),
        )
