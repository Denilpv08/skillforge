from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.quiz import Quiz, Question, AnswerOption, QuizAttempt
from app.schemas.quiz import (
    QuizCreate, QuizOut, QuizSubmit, QuizAttemptOut, QuizAttemptDetail, AnswerReview
)
from app.services.quiz_service import QuizService
from app.repositories.quiz_repository import QuizRepository
from app.repositories.course_repository import CourseRepository

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

# ─── Para instructores / admins ───────────────────────────────
@router.post(
    "/courses/{course_id}",
    response_model=QuizOut,
    status_code=201,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def create_quiz(
    course_id: str,
    data: QuizCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crea un quiz con preguntas y opciones en una sola operación."""
    return QuizService(db).create_quiz(
        course_id, data, current_user.organization_id, current_user
    )

@router.get(
    "/courses/{course_id}",
    response_model=list[QuizOut],
)
def list_quizzes_by_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los quizzes de un curso."""
    repo = QuizRepository(db)
    course_repo = CourseRepository(db)

    course = course_repo.get_by_id(course_id)
    if not course or course.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Course not found")

    return repo.get_by_course(course_id)

@router.delete(
    "/{quiz_id}",
    status_code=204,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def delete_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = QuizRepository(db)
    quiz = repo.get_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    course_repo = CourseRepository(db)
    course = course_repo.get_by_id(quiz.course_id)
    if not course or course.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Quiz not found")

    db.delete(quiz)
    db.commit()

# ─── Para estudiantes ─────────────────────────────────────────
@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna el quiz para tomarlo.
    Las respuestas correctas NO se exponen — el schema QuizOut
    usa AnswerOptionOut que omite is_correct.
    """
    return QuizService(db).get_quiz_for_student(quiz_id, current_user.id)

@router.post("/{quiz_id}/submit", response_model=QuizAttemptOut)
def submit_quiz(
    quiz_id: str,
    data: QuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Envía respuestas y recibe el resultado calificado."""
    return QuizService(db).submit_quiz(quiz_id, data, current_user)

@router.get(
    "/{quiz_id}/attempts",
    response_model=list[QuizAttemptOut],
)
def get_my_attempts(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Historial de intentos del usuario autenticado."""
    repo = QuizRepository(db)
    return repo.get_attempts_by_user(current_user.id, quiz_id)

@router.get(
    "/{quiz_id}/results",
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def get_quiz_results(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Resultados de todos los estudiantes en un quiz.
    Solo para instructores y admins.
    """
    repo = QuizRepository(db)
    quiz = repo.get_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    attempts = repo.get_all_attempts(quiz_id)
    return {
        "quiz_id": quiz_id,
        "quiz_title": quiz.title,
        "pass_score": quiz.pass_score,
        "total_attempts": len(attempts),
        "passed": sum(1 for a in attempts if a.passed),
        "failed": sum(1 for a in attempts if not a.passed),
        "average_score": (
            round(sum(float(a.score) for a in attempts) / len(attempts), 2)
            if attempts else 0
        ),
        "attempts": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "score": float(a.score),
                "passed": a.passed,
                "attempted_at": a.attempted_at.isoformat(),
            }
            for a in attempts
        ],
    }
    
@router.get(
    "/attempts/{attempt_id}",
    response_model=QuizAttemptDetail,
)
def get_attempt_detail(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Devuelve el detalle completo de un intento:
    qué respondió el usuario y cuáles eran las respuestas correctas.
    Solo el dueño del intento puede verlo.
    """
    repo = QuizRepository(db)

    # Buscar el intento
    from sqlalchemy import select
    from app.models.quiz import QuizAttempt
    stmt = select(QuizAttempt).where(QuizAttempt.id == attempt_id)
    attempt = db.execute(stmt).scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    # Solo el dueño puede ver su intento
    if attempt.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    quiz = repo.get_with_questions(attempt.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Construir revisión
    answers_snapshot: dict = attempt.answers_json
    reviews = []

    for question in quiz.questions:
        selected_id = answers_snapshot.get(question.id)

        # Encontrar opción seleccionada y correcta
        selected_option = next(
            (o for o in question.answer_options if o.id == selected_id),
            None,
        )
        correct_option = next(
            (o for o in question.answer_options if o.is_correct),
            None,
        )

        if correct_option:
            reviews.append(AnswerReview(
                question_id=question.id,
                question_text=question.text,
                selected_option_id=selected_id,
                selected_option_text=selected_option.text if selected_option else None,
                correct_option_id=correct_option.id,
                correct_option_text=correct_option.text,
                is_correct=selected_id == correct_option.id,
            ))

    return QuizAttemptDetail(
        id=attempt.id,
        score=float(attempt.score),
        passed=attempt.passed,
        attempted_at=attempt.attempted_at,
        answers_review=reviews,
    )