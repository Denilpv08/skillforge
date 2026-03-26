from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.quiz import Quiz, Question, AnswerOption, QuizAttempt
from app.models.user import User, UserRole
from app.repositories.quiz_repository import QuizRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.course_repository import CourseRepository
from app.schemas.quiz import QuizCreate, QuizSubmit


class QuizService:
    def __init__(self, db: Session):
        self.repo = QuizRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)
        self.course_repo = CourseRepository(db)

    def create_quiz(
        self, course_id: str, data: QuizCreate,
        org_id: str, current_user: User
    ) -> Quiz:
        course = self.course_repo.get_by_id(course_id)
        if not course or course.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

        self._check_instructor(course, current_user)

        quiz = Quiz(
            course_id=course_id,
            title=data.title,
            pass_score=data.pass_score,
            max_attempts=data.max_attempts,
        )

        for q_data in data.questions:
            question = Question(
                text=q_data.text,
                order_index=q_data.order_index,
            )
            for a_data in q_data.answer_options:
                option = AnswerOption(
                    text=a_data.text,
                    is_correct=a_data.is_correct,
                    order_index=a_data.order_index,
                )
                question.answer_options.append(option)
            quiz.questions.append(question)

        return self.repo.create(quiz)

    def get_quiz_for_student(self, quiz_id: str, user_id: str) -> Quiz:
        """
        Retorna el quiz SIN revelar las respuestas correctas.
        La lógica de ocultar is_correct está en el schema.
        """
        quiz = self.repo.get_with_questions(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found",
            )

        enrollment = self.enrollment_repo.get_by_user_and_course(
            user_id, quiz.course_id
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled to take this quiz",
            )

        return quiz

    def submit_quiz(
        self, quiz_id: str, data: QuizSubmit, current_user: User
    ) -> QuizAttempt:
        quiz = self.repo.get_with_questions(quiz_id)
        if not quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found",
            )

        # Verificar inscripción
        enrollment = self.enrollment_repo.get_by_user_and_course(
            current_user.id, quiz.course_id
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be enrolled to submit this quiz",
            )

        # Verificar límite de intentos
        attempts = self.repo.get_attempts_by_user(current_user.id, quiz_id)
        if len(attempts) >= quiz.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum attempts ({quiz.max_attempts}) reached",
            )

        # Calificar automáticamente
        score = self._grade_quiz(quiz, data.answers)
        passed = score >= quiz.pass_score

        attempt = QuizAttempt(
            user_id=current_user.id,
            quiz_id=quiz_id,
            score=score,
            passed=passed,
            answers_json=data.answers,
        )

        return self.repo.create_attempt(attempt)

    def _grade_quiz(self, quiz: Quiz, answers: dict[str, str]) -> float:
        """
        Calcula el puntaje del quiz.
        Puntaje = (respuestas correctas / total preguntas) * 100
        """
        if not quiz.questions:
            return 0.0

        correct = 0
        for question in quiz.questions:
            selected_option_id = answers.get(question.id)
            if not selected_option_id:
                continue
            for option in question.answer_options:
                if option.id == selected_option_id and option.is_correct:
                    correct += 1
                    break

        return round((correct / len(quiz.questions)) * 100, 2)

    def _check_instructor(self, course: "Course", user: User) -> None:
        is_owner = course.instructor_id == user.id
        is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
        if not is_owner and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the instructor or admin can manage quizzes",
            )