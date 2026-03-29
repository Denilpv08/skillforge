from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.course import Course, CourseStatus, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.learning_path import LearningPath, LearningPathCourse
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User
from app.schemas.analytics import (
    AdminAnalyticsOut,
    InstructorActivityItem,
    InstructorAnalyticsOut,
    InstructorCourseStats,
    LowestQuizPerformance,
    PendingQuizItem,
    RecentActiveUserItem,
    StaleDraftCourseAlert,
    StudentAnalyticsOut,
    StudentCompletedCourse,
    StudentInProgressCourse,
    StudentLearningPathItem,
    StudentPersonalStats,
    TopCourseItem,
    WeeklyEnrollmentPoint,
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_admin_analytics(self, current_user: User) -> AdminAnalyticsOut:
        """Retorna analytics globales para administradores de la organización."""
        org_id = current_user.organization_id
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        total_users = self.db.execute(
            select(func.count(User.id)).where(User.organization_id == org_id)
        ).scalar_one()

        active_courses = self.db.execute(
            select(func.count(Course.id)).where(
                Course.organization_id == org_id,
                Course.status == CourseStatus.PUBLISHED,
            )
        ).scalar_one()

        month_start = datetime(now.year, now.month, 1)
        enrollments_this_month = self.db.execute(
            select(func.count(Enrollment.id))
            .join(Course, Enrollment.course_id == Course.id)
            .where(
                Course.organization_id == org_id,
                Enrollment.enrolled_at >= month_start,
            )
        ).scalar_one()

        total_enrollments = self.db.execute(
            select(func.count(Enrollment.id))
            .join(Course, Enrollment.course_id == Course.id)
            .where(Course.organization_id == org_id)
        ).scalar_one()

        completed_enrollments = self.db.execute(
            select(func.count(Enrollment.id))
            .join(Course, Enrollment.course_id == Course.id)
            .where(
                Course.organization_id == org_id,
                Enrollment.completed_at.is_not(None),
            )
        ).scalar_one()

        completion_rate = (
            round((completed_enrollments / total_enrollments) * 100, 2)
            if total_enrollments > 0
            else 0.0
        )

        enrollments_by_week = self._get_enrollments_by_week(org_id, weeks=8)
        top_courses = self._get_top_courses(org_id, limit=5)
        recent_active_users = self._get_recent_active_users(org_id, limit=8)
        stale_draft_alerts = self._get_stale_draft_alerts(org_id, older_than_days=30)

        return AdminAnalyticsOut(
            total_users=total_users,
            active_courses=active_courses,
            enrollments_this_month=enrollments_this_month,
            completion_rate=completion_rate,
            enrollments_by_week=enrollments_by_week,
            top_courses=top_courses,
            recent_active_users=recent_active_users,
            stale_draft_alerts=stale_draft_alerts,
        )

    def get_instructor_analytics(self, current_user: User) -> InstructorAnalyticsOut:
        """Retorna analytics enfocados en rendimiento de cursos del instructor."""
        org_id = current_user.organization_id

        instructor_courses = self.db.execute(
            select(Course).where(
                Course.organization_id == org_id,
                Course.instructor_id == current_user.id,
            )
        ).scalars().all()

        course_ids = [course.id for course in instructor_courses]

        total_courses = len(instructor_courses)
        published_courses = sum(
            1 for course in instructor_courses if course.status == CourseStatus.PUBLISHED
        )
        draft_courses = sum(
            1 for course in instructor_courses if course.status == CourseStatus.DRAFT
        )

        total_enrolled_students = 0
        average_completion_rate = 0.0

        if course_ids:
            total_enrolled_students = self.db.execute(
                select(func.count(distinct(Enrollment.user_id))).where(
                    Enrollment.course_id.in_(course_ids)
                )
            ).scalar_one()

            total_enrollments = self.db.execute(
                select(func.count(Enrollment.id)).where(Enrollment.course_id.in_(course_ids))
            ).scalar_one()
            completed_enrollments = self.db.execute(
                select(func.count(Enrollment.id)).where(
                    Enrollment.course_id.in_(course_ids),
                    Enrollment.completed_at.is_not(None),
                )
            ).scalar_one()
            average_completion_rate = (
                round((completed_enrollments / total_enrollments) * 100, 2)
                if total_enrollments > 0
                else 0.0
            )

        lowest_performing_quiz = self._get_lowest_performing_quiz(course_ids)
        recent_activity = self._get_instructor_recent_activity(course_ids)

        return InstructorAnalyticsOut(
            my_courses=InstructorCourseStats(
                total=total_courses,
                published=published_courses,
                drafts=draft_courses,
            ),
            total_enrolled_students=total_enrolled_students,
            average_completion_rate=average_completion_rate,
            lowest_performing_quiz=lowest_performing_quiz,
            recent_activity=recent_activity,
        )

    def get_student_analytics(self, current_user: User) -> StudentAnalyticsOut:
        """Retorna analytics personales de progreso para estudiantes."""
        org_id = current_user.organization_id

        enrollments = self.db.execute(
            select(Enrollment)
            .join(Course, Enrollment.course_id == Course.id)
            .where(
                Enrollment.user_id == current_user.id,
                Course.organization_id == org_id,
            )
        ).scalars().all()

        in_progress_courses: list[StudentInProgressCourse] = []
        completed_courses: list[StudentCompletedCourse] = []

        for enrollment in enrollments:
            course = self.db.get(Course, enrollment.course_id)
            if not course:
                continue

            if enrollment.completed_at is None:
                next_lesson_id, next_lesson_title = self._get_next_lesson(enrollment.id)
                in_progress_courses.append(
                    StudentInProgressCourse(
                        course_id=course.id,
                        course_title=course.title,
                        progress_pct=round(float(enrollment.progress_pct), 2),
                        next_lesson_id=next_lesson_id,
                        next_lesson_title=next_lesson_title,
                    )
                )
            else:
                completed_courses.append(
                    StudentCompletedCourse(
                        course_id=course.id,
                        course_title=course.title,
                        completed_at=enrollment.completed_at,
                    )
                )

        completed_courses.sort(key=lambda item: item.completed_at, reverse=True)

        pending_quizzes = self._get_student_pending_quizzes(current_user.id, org_id)
        personal_stats = self._get_student_personal_stats(current_user.id)
        assigned_learning_paths = self._get_student_learning_paths(current_user.id, org_id)

        return StudentAnalyticsOut(
            in_progress_courses=sorted(
                in_progress_courses,
                key=lambda item: item.progress_pct,
                reverse=True,
            ),
            completed_courses=completed_courses[:8],
            pending_quizzes=pending_quizzes,
            personal_stats=personal_stats,
            assigned_learning_paths=assigned_learning_paths,
        )

    def _get_enrollments_by_week(
        self,
        org_id: str,
        weeks: int,
    ) -> list[WeeklyEnrollmentPoint]:
        now = datetime.utcnow()
        current_week_start = (now - timedelta(days=now.weekday())).date()
        start_week = current_week_start - timedelta(weeks=weeks - 1)

        rows = self.db.execute(
            select(Enrollment.enrolled_at)
            .join(Course, Enrollment.course_id == Course.id)
            .where(
                Course.organization_id == org_id,
                Enrollment.enrolled_at >= datetime.combine(start_week, datetime.min.time()),
            )
        ).all()

        bucket: dict[date, int] = defaultdict(int)
        for (enrolled_at,) in rows:
            week_start = (enrolled_at - timedelta(days=enrolled_at.weekday())).date()
            bucket[week_start] += 1

        points: list[WeeklyEnrollmentPoint] = []
        for index in range(weeks):
            week_start = start_week + timedelta(weeks=index)
            points.append(
                WeeklyEnrollmentPoint(
                    week_start=week_start,
                    enrollments=bucket.get(week_start, 0),
                )
            )
        return points

    def _get_top_courses(self, org_id: str, limit: int) -> list[TopCourseItem]:
        rows = self.db.execute(
            select(Course.id, Course.title, func.count(Enrollment.id).label("total"))
            .outerjoin(Enrollment, Enrollment.course_id == Course.id)
            .where(Course.organization_id == org_id)
            .group_by(Course.id, Course.title)
            .order_by(func.count(Enrollment.id).desc(), Course.title.asc())
            .limit(limit)
        ).all()

        return [
            TopCourseItem(
                course_id=course_id,
                title=title,
                enrollments=int(total),
            )
            for course_id, title, total in rows
        ]

    def _get_recent_active_users(
        self,
        org_id: str,
        limit: int,
    ) -> list[RecentActiveUserItem]:
        users = self.db.execute(
            select(User).where(User.organization_id == org_id)
        ).scalars().all()

        result: list[RecentActiveUserItem] = []
        for user in users:
            latest_enrollment = self.db.execute(
                select(func.max(Enrollment.enrolled_at)).where(Enrollment.user_id == user.id)
            ).scalar_one_or_none()
            latest_completion = self.db.execute(
                select(func.max(Enrollment.completed_at)).where(Enrollment.user_id == user.id)
            ).scalar_one_or_none()
            latest_quiz = self.db.execute(
                select(func.max(QuizAttempt.attempted_at)).where(QuizAttempt.user_id == user.id)
            ).scalar_one_or_none()

            activity_candidates = [
                timestamp
                for timestamp in [latest_enrollment, latest_completion, latest_quiz]
                if timestamp is not None
            ]
            if not activity_candidates:
                continue

            last_activity = max(activity_candidates)
            result.append(
                RecentActiveUserItem(
                    user_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    role=user.role.value,
                    last_activity_at=last_activity,
                )
            )

        result.sort(key=lambda item: item.last_activity_at, reverse=True)
        return result[:limit]

    def _get_stale_draft_alerts(
        self,
        org_id: str,
        older_than_days: int,
    ) -> list[StaleDraftCourseAlert]:
        threshold = datetime.utcnow() - timedelta(days=older_than_days)
        rows = self.db.execute(
            select(Course)
            .where(
                Course.organization_id == org_id,
                Course.status == CourseStatus.DRAFT,
                Course.updated_at < threshold,
            )
            .order_by(Course.updated_at.asc())
            .limit(10)
        ).scalars().all()

        now = datetime.utcnow()
        return [
            StaleDraftCourseAlert(
                course_id=course.id,
                title=course.title,
                days_in_draft=max((now - course.updated_at).days, 0),
            )
            for course in rows
        ]

    def _get_lowest_performing_quiz(
        self,
        course_ids: list[str],
    ) -> LowestQuizPerformance | None:
        if not course_ids:
            return None

        rows = self.db.execute(
            select(
                Quiz.id,
                Quiz.title,
                Quiz.course_id,
                Course.title,
                func.avg(QuizAttempt.score).label("avg_score"),
            )
            .join(Course, Quiz.course_id == Course.id)
            .outerjoin(QuizAttempt, QuizAttempt.quiz_id == Quiz.id)
            .where(Quiz.course_id.in_(course_ids))
            .group_by(Quiz.id, Quiz.title, Quiz.course_id, Course.title)
            .having(func.count(QuizAttempt.id) > 0)
            .order_by(func.avg(QuizAttempt.score).asc())
            .limit(1)
        ).first()

        if not rows:
            return None

        quiz_id, quiz_title, course_id, course_title, avg_score = rows
        return LowestQuizPerformance(
            quiz_id=quiz_id,
            quiz_title=quiz_title,
            course_id=course_id,
            course_title=course_title,
            average_score=round(float(avg_score), 2),
        )

    def _get_instructor_recent_activity(
        self,
        course_ids: list[str],
    ) -> list[InstructorActivityItem]:
        if not course_ids:
            return []

        course_map = {
            course.id: course.title
            for course in self.db.execute(
                select(Course).where(Course.id.in_(course_ids))
            ).scalars().all()
        }

        activity: list[InstructorActivityItem] = []

        enrollments = self.db.execute(
            select(Enrollment)
            .where(Enrollment.course_id.in_(course_ids))
            .order_by(Enrollment.enrolled_at.desc())
            .limit(8)
        ).scalars().all()

        for enrollment in enrollments:
            activity.append(
                InstructorActivityItem(
                    type="ENROLLMENT",
                    timestamp=enrollment.enrolled_at,
                    course_id=enrollment.course_id,
                    course_title=course_map.get(enrollment.course_id, "Curso"),
                    message="Nueva inscripción en el curso",
                )
            )

        attempts = self.db.execute(
            select(QuizAttempt, Quiz)
            .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
            .where(Quiz.course_id.in_(course_ids))
            .order_by(QuizAttempt.attempted_at.desc())
            .limit(8)
        ).all()

        for attempt, quiz in attempts:
            activity.append(
                InstructorActivityItem(
                    type="QUIZ_ATTEMPT",
                    timestamp=attempt.attempted_at,
                    course_id=quiz.course_id,
                    course_title=course_map.get(quiz.course_id, "Curso"),
                    message=f"Intento de quiz: {quiz.title}",
                )
            )

        progress_rows = self.db.execute(
            select(LessonProgress, Enrollment)
            .join(Enrollment, LessonProgress.enrollment_id == Enrollment.id)
            .where(
                Enrollment.course_id.in_(course_ids),
                LessonProgress.completed_at.is_not(None),
            )
            .order_by(LessonProgress.completed_at.desc())
            .limit(8)
        ).all()

        for progress, enrollment in progress_rows:
            if progress.completed_at is None:
                continue
            activity.append(
                InstructorActivityItem(
                    type="LESSON_COMPLETED",
                    timestamp=progress.completed_at,
                    course_id=enrollment.course_id,
                    course_title=course_map.get(enrollment.course_id, "Curso"),
                    message="Lección completada",
                )
            )

        activity.sort(key=lambda item: item.timestamp, reverse=True)
        return activity[:10]

    def _get_next_lesson(self, enrollment_id: str) -> tuple[str | None, str | None]:
        enrollment = self.db.get(Enrollment, enrollment_id)
        if not enrollment:
            return None, None

        lessons = self.db.execute(
            select(Lesson)
            .where(Lesson.course_id == enrollment.course_id)
            .order_by(Lesson.order_index.asc())
        ).scalars().all()
        if not lessons:
            return None, None

        completed_lesson_ids = set(
            self.db.execute(
                select(LessonProgress.lesson_id).where(
                    LessonProgress.enrollment_id == enrollment_id,
                    LessonProgress.completed_at.is_not(None),
                )
            ).scalars().all()
        )

        for lesson in lessons:
            if lesson.id not in completed_lesson_ids:
                return lesson.id, lesson.title

        return None, None

    def _get_student_pending_quizzes(
        self,
        user_id: str,
        org_id: str,
    ) -> list[PendingQuizItem]:
        enrolled_course_ids = self.db.execute(
            select(Enrollment.course_id).where(Enrollment.user_id == user_id)
        ).scalars().all()
        if not enrolled_course_ids:
            return []

        quizzes = self.db.execute(
            select(Quiz, Course)
            .join(Course, Quiz.course_id == Course.id)
            .where(
                Quiz.course_id.in_(enrolled_course_ids),
                Course.organization_id == org_id,
            )
        ).all()

        attempted_quiz_ids = set(
            self.db.execute(
                select(QuizAttempt.quiz_id).where(QuizAttempt.user_id == user_id)
            ).scalars().all()
        )

        pending: list[PendingQuizItem] = []
        for quiz, course in quizzes:
            if quiz.id in attempted_quiz_ids:
                continue
            pending.append(
                PendingQuizItem(
                    quiz_id=quiz.id,
                    quiz_title=quiz.title,
                    course_id=course.id,
                    course_title=course.title,
                )
            )

        return pending[:10]

    def _get_student_personal_stats(self, user_id: str) -> StudentPersonalStats:
        total_watch_seconds = self.db.execute(
            select(func.coalesce(func.sum(LessonProgress.watch_time_sec), 0))
            .join(Enrollment, LessonProgress.enrollment_id == Enrollment.id)
            .where(Enrollment.user_id == user_id)
        ).scalar_one()

        quiz_average = self.db.execute(
            select(func.avg(QuizAttempt.score)).where(QuizAttempt.user_id == user_id)
        ).scalar_one_or_none()

        streak_days = self._calculate_streak_days(user_id)

        return StudentPersonalStats(
            hours_learned=round(float(total_watch_seconds) / 3600, 2),
            streak_days=streak_days,
            quiz_average=round(float(quiz_average), 2) if quiz_average is not None else 0.0,
        )

    def _calculate_streak_days(self, user_id: str) -> int:
        activity_dates: set[date] = set()

        enrollment_dates = self.db.execute(
            select(Enrollment.enrolled_at).where(Enrollment.user_id == user_id)
        ).scalars().all()
        activity_dates.update(item.date() for item in enrollment_dates)

        lesson_completion_dates = self.db.execute(
            select(LessonProgress.completed_at)
            .join(Enrollment, LessonProgress.enrollment_id == Enrollment.id)
            .where(
                Enrollment.user_id == user_id,
                LessonProgress.completed_at.is_not(None),
            )
        ).scalars().all()
        activity_dates.update(item.date() for item in lesson_completion_dates if item is not None)

        quiz_dates = self.db.execute(
            select(QuizAttempt.attempted_at).where(QuizAttempt.user_id == user_id)
        ).scalars().all()
        activity_dates.update(item.date() for item in quiz_dates)

        if not activity_dates:
            return 0

        today = datetime.utcnow().date()
        streak = 0
        current_day = today

        # Permite que el usuario no haya tenido actividad hoy,
        # pero sí mantiene racha si tuvo actividad ayer.
        if current_day not in activity_dates:
            current_day = current_day - timedelta(days=1)

        while current_day in activity_dates:
            streak += 1
            current_day = current_day - timedelta(days=1)

        return streak

    def _get_student_learning_paths(
        self,
        user_id: str,
        org_id: str,
    ) -> list[StudentLearningPathItem]:
        paths = self.db.execute(
            select(LearningPath)
            .where(LearningPath.organization_id == org_id)
            .order_by(LearningPath.created_at.desc())
        ).scalars().all()

        if not paths:
            return []

        enrollment_rows = self.db.execute(
            select(Enrollment.course_id, Enrollment.completed_at)
            .where(Enrollment.user_id == user_id)
        ).all()
        completed_courses = {
            course_id for course_id, completed_at in enrollment_rows if completed_at is not None
        }
        enrolled_courses = {course_id for course_id, _ in enrollment_rows}

        path_courses = self.db.execute(
            select(LearningPathCourse)
            .where(LearningPathCourse.learning_path_id.in_([path.id for path in paths]))
        ).scalars().all()

        by_path: dict[str, list[LearningPathCourse]] = defaultdict(list)
        for row in path_courses:
            by_path[row.learning_path_id].append(row)

        output: list[StudentLearningPathItem] = []
        for path in paths:
            courses_in_path = by_path.get(path.id, [])
            if not courses_in_path:
                continue

            # Sin tabla de asignación explícita, se consideran "asignadas"
            # las rutas donde el estudiante ya está inscrito al menos en un curso.
            if not any(item.course_id in enrolled_courses for item in courses_in_path):
                continue

            total_courses = len(courses_in_path)
            completed_count = sum(
                1 for item in courses_in_path if item.course_id in completed_courses
            )
            progress_pct = round((completed_count / total_courses) * 100, 2)

            output.append(
                StudentLearningPathItem(
                    path_id=path.id,
                    title=path.title,
                    progress_pct=progress_pct,
                )
            )

        return output[:8]
