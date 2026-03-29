from collections import defaultdict
from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User, UserRole
from app.schemas.grades import (
    CategoryRadarPointOut,
    CourseGradeOut,
    CourseGradebookOut,
    CourseQuizGradeOut,
    GradeAchievementOut,
    GradebookQuizAverageOut,
    GradebookQuizOut,
    GradebookStudentRowOut,
    GradesSummaryOut,
    MyGradesOut,
)


class GradesService:
    def __init__(self, db: Session):
        self.db = db

    def get_my_grades(self, current_user: User) -> MyGradesOut:
        enrollments = self.db.execute(
            select(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .where(
                Enrollment.user_id == current_user.id,
                Course.organization_id == current_user.organization_id,
            )
            .order_by(Enrollment.enrolled_at.desc())
        ).scalars().all()

        courses_output: list[CourseGradeOut] = []
        category_scores: dict[str, list[float]] = defaultdict(list)

        for enrollment in enrollments:
            course = self.db.get(Course, enrollment.course_id)
            if not course:
                continue

            quizzes = self._get_course_quizzes(course.id)
            attempts = self._get_student_attempts(current_user.id, [quiz.id for quiz in quizzes])
            attempts_by_quiz = self._best_attempts_by_quiz(attempts)

            quiz_rows: list[CourseQuizGradeOut] = []
            weighted_sum = 0.0
            total_weight = 0.0
            best_attempt_score = 0.0
            has_pending_quizzes = False

            for quiz in quizzes:
                attempt = attempts_by_quiz.get(quiz.id)
                score = float(attempt.score) if attempt else None
                weight = float(quiz.weight) if quiz.weight is not None else 1.0

                if score is not None:
                    weighted_sum += score * weight
                    total_weight += weight
                    best_attempt_score = max(best_attempt_score, score)
                    category_scores[course.category.name if course.category else "General"].append(score)
                else:
                    has_pending_quizzes = True

                quiz_rows.append(
                    CourseQuizGradeOut(
                        quiz_id=quiz.id,
                        quiz_title=quiz.title,
                        pass_score=quiz.pass_score,
                        weight=weight,
                        best_score=score,
                        passed=attempt.passed if attempt else None,
                    )
                )

            average_score = round(weighted_sum / total_weight, 2) if total_weight > 0 else 0.0
            completion_status = "COMPLETADO" if enrollment.completed_at else "EN_PROGRESO"
            final_status = self._resolve_final_status(
                average_score,
                has_pending_quizzes,
                total_quizzes=len(quizzes),
            )

            courses_output.append(
                CourseGradeOut(
                    course_id=course.id,
                    course_title=course.title,
                    category_name=course.category.name if course.category else "General",
                    completion_status=completion_status,
                    average_score=average_score,
                    best_attempt_score=round(best_attempt_score, 2),
                    final_status=final_status,
                    quizzes=quiz_rows,
                )
            )

        radar = [
            CategoryRadarPointOut(
                category=category,
                average_score=round(sum(scores) / len(scores), 2) if scores else 0.0,
            )
            for category, scores in category_scores.items()
        ]

        achievements = self._build_achievements(current_user.id, enrollments)

        return MyGradesOut(
            courses=courses_output,
            radar_by_category=radar,
            achievements=achievements,
        )

    def get_course_gradebook(self, current_user: User, course_id: str) -> CourseGradebookOut:
        course = self.db.get(Course, course_id)
        if not course or course.organization_id != current_user.organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        if current_user.role == UserRole.INSTRUCTOR and course.instructor_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

        if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

        quizzes = self._get_course_quizzes(course_id)
        quiz_ids = [quiz.id for quiz in quizzes]

        enrollments = self.db.execute(
            select(Enrollment).where(Enrollment.course_id == course_id)
        ).scalars().all()

        student_ids = [enrollment.user_id for enrollment in enrollments]
        users = self.db.execute(select(User).where(User.id.in_(student_ids))).scalars().all() if student_ids else []
        user_map = {user.id: user for user in users}

        attempts = self._get_attempts_for_quizzes(quiz_ids)
        attempts_by_student_quiz: dict[tuple[str, str], QuizAttempt] = {}
        for attempt in attempts:
            key = (attempt.user_id, attempt.quiz_id)
            previous = attempts_by_student_quiz.get(key)
            if previous is None or float(attempt.score) > float(previous.score):
                attempts_by_student_quiz[key] = attempt

        quiz_out = [
            GradebookQuizOut(
                quiz_id=quiz.id,
                quiz_title=quiz.title,
                pass_score=quiz.pass_score,
                weight=float(quiz.weight) if quiz.weight is not None else 1.0,
            )
            for quiz in quizzes
        ]

        students_rows: list[GradebookStudentRowOut] = []
        for enrollment in enrollments:
            student = user_map.get(enrollment.user_id)
            if not student:
                continue

            scores_by_quiz: dict[str, float | None] = {}
            passed_by_quiz: dict[str, bool | None] = {}
            weighted_sum = 0.0
            total_weight = 0.0
            pending = False

            for quiz in quizzes:
                attempt = attempts_by_student_quiz.get((student.id, quiz.id))
                score = float(attempt.score) if attempt else None
                scores_by_quiz[quiz.id] = score
                passed_by_quiz[quiz.id] = attempt.passed if attempt else None

                if score is None:
                    pending = True
                    continue

                weight = float(quiz.weight) if quiz.weight is not None else 1.0
                weighted_sum += score * weight
                total_weight += weight

            avg_score = round(weighted_sum / total_weight, 2) if total_weight > 0 else 0.0
            students_rows.append(
                GradebookStudentRowOut(
                    student_id=student.id,
                    student_name=student.full_name,
                    scores_by_quiz=scores_by_quiz,
                    passed_by_quiz=passed_by_quiz,
                    average_score=avg_score,
                    final_status=self._resolve_final_status(avg_score, pending, len(quizzes)),
                )
            )

        students_rows.sort(key=lambda row: row.student_name.lower())

        quiz_averages = self._build_quiz_averages(quizzes, attempts_by_student_quiz)

        return CourseGradebookOut(
            course_id=course.id,
            course_title=course.title,
            quizzes=quiz_out,
            students=students_rows,
            quiz_averages=quiz_averages,
        )

    def get_summary(self, current_user: User) -> GradesSummaryOut:
        my_grades = self.get_my_grades(current_user)
        courses = my_grades.courses

        total_courses = len(courses)
        approved_courses = sum(1 for course in courses if course.final_status == "APROBADO")
        failed_courses = sum(1 for course in courses if course.final_status == "REPROBADO")
        in_progress_courses = sum(1 for course in courses if course.final_status == "EN_PROGRESO")
        overall_average = round(
            (sum(course.average_score for course in courses) / total_courses),
            2,
        ) if total_courses > 0 else 0.0

        streak_days, last_activity_date = self._calculate_streak_days(current_user.id)

        return GradesSummaryOut(
            overall_average=overall_average,
            total_courses=total_courses,
            approved_courses=approved_courses,
            failed_courses=failed_courses,
            in_progress_courses=in_progress_courses,
            active_streak_days=streak_days,
            last_activity_date=last_activity_date,
        )

    def _get_course_quizzes(self, course_id: str) -> list[Quiz]:
        return self.db.execute(
            select(Quiz)
            .where(Quiz.course_id == course_id)
            .order_by(Quiz.created_at.asc())
        ).scalars().all()

    def _get_student_attempts(self, user_id: str, quiz_ids: list[str]) -> list[QuizAttempt]:
        if not quiz_ids:
            return []

        return self.db.execute(
            select(QuizAttempt)
            .where(
                QuizAttempt.user_id == user_id,
                QuizAttempt.quiz_id.in_(quiz_ids),
            )
            .order_by(QuizAttempt.attempted_at.desc())
        ).scalars().all()

    def _get_attempts_for_quizzes(self, quiz_ids: list[str]) -> list[QuizAttempt]:
        if not quiz_ids:
            return []

        return self.db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.quiz_id.in_(quiz_ids))
            .order_by(QuizAttempt.attempted_at.desc())
        ).scalars().all()

    def _build_quiz_averages(
        self,
        quizzes: list[Quiz],
        attempts_by_student_quiz: dict[tuple[str, str], QuizAttempt],
    ) -> list[GradebookQuizAverageOut]:
        results: list[GradebookQuizAverageOut] = []

        for quiz in quizzes:
            scores: list[float] = []
            passed_count = 0

            for (_, quiz_id), attempt in attempts_by_student_quiz.items():
                if quiz_id != quiz.id:
                    continue
                score = float(attempt.score)
                scores.append(score)
                if attempt.passed:
                    passed_count += 1

            average_score = round(sum(scores) / len(scores), 2) if scores else 0.0
            pass_rate = round((passed_count / len(scores)) * 100, 2) if scores else 0.0
            results.append(
                GradebookQuizAverageOut(
                    quiz_id=quiz.id,
                    average_score=average_score,
                    pass_rate=pass_rate,
                )
            )

        return results

    def _resolve_final_status(
        self,
        average_score: float,
        has_pending_quizzes: bool,
        total_quizzes: int,
    ) -> str:
        if total_quizzes == 0 or has_pending_quizzes:
            return "EN_PROGRESO"
        if average_score >= 70:
            return "APROBADO"
        return "REPROBADO"

    def _build_achievements(
        self,
        user_id: str,
        enrollments: list[Enrollment],
    ) -> list[GradeAchievementOut]:
        attempts = self.db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.attempted_at.asc())
        ).scalars().all()

        first_quiz_passed = any(attempt.passed for attempt in attempts)
        any_course_completed = any(enrollment.completed_at is not None for enrollment in enrollments)
        streak_days, _ = self._calculate_streak_days(user_id)

        return [
            GradeAchievementOut(
                code="FIRST_QUIZ_PASSED",
                title="Primer quiz aprobado",
                achieved=first_quiz_passed,
            ),
            GradeAchievementOut(
                code="COURSE_COMPLETED",
                title="Curso completado",
                achieved=any_course_completed,
            ),
            GradeAchievementOut(
                code="STREAK_7_DAYS",
                title="Racha de 7 dias",
                achieved=streak_days >= 7,
            ),
        ]

    def _calculate_streak_days(self, user_id: str) -> tuple[int, date | None]:
        attempts = self.db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.user_id == user_id)
            .order_by(QuizAttempt.attempted_at.desc())
        ).scalars().all()

        if not attempts:
            return 0, None

        activity_days = sorted({attempt.attempted_at.date() for attempt in attempts}, reverse=True)
        streak = 1
        for index in range(1, len(activity_days)):
            if activity_days[index - 1] - activity_days[index] == timedelta(days=1):
                streak += 1
            else:
                break

        return streak, activity_days[0]

    def _best_attempts_by_quiz(
        self,
        attempts: list[QuizAttempt],
    ) -> dict[str, QuizAttempt]:
        best_by_quiz: dict[str, QuizAttempt] = {}
        for attempt in attempts:
            previous = best_by_quiz.get(attempt.quiz_id)
            if previous is None or float(attempt.score) > float(previous.score):
                best_by_quiz[attempt.quiz_id] = attempt
        return best_by_quiz
