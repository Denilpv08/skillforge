from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.quiz import QuizCreate, QuizOut, QuizSubmit, QuizAttemptOut
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

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
    return QuizService(db).create_quiz(
        course_id, data, current_user.organization_id, current_user
    )

@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return QuizService(db).get_quiz_for_student(quiz_id, current_user.id)

@router.post("/{quiz_id}/submit", response_model=QuizAttemptOut)
def submit_quiz(
    quiz_id: str,
    data: QuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return QuizService(db).submit_quiz(quiz_id, data, current_user)