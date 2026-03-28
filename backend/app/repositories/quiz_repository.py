from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from app.models.quiz import Quiz, QuizAttempt

class QuizRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_course(self, course_id: str) -> list[Quiz]:
        stmt = (
            select(Quiz)
            .options(
                joinedload(Quiz.questions).joinedload(
                    Quiz.questions.property.mapper.class_.answer_options
                )
            )
            .where(Quiz.course_id == course_id)
        )
        return list(self.db.execute(stmt).unique().scalars().all())

    def get_by_id(self, quiz_id: str) -> Quiz | None:
        return self.db.get(Quiz, quiz_id)

    def get_with_questions(self, quiz_id: str) -> Quiz | None:
        stmt = (
            select(Quiz)
            .options(
                joinedload(Quiz.questions).joinedload(
                    Quiz.questions.property.mapper.class_.answer_options
                )
            )
            .where(Quiz.id == quiz_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def create(self, quiz: Quiz) -> Quiz:
        self.db.add(quiz)
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def get_attempts_by_user(
        self, user_id: str, quiz_id: str
    ) -> list[QuizAttempt]:
        stmt = select(QuizAttempt).where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.quiz_id == quiz_id,
        )
        return list(self.db.execute(stmt).scalars().all())

    def create_attempt(self, attempt: QuizAttempt) -> QuizAttempt:
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt
    
    def get_all_attempts(self, quiz_id: str) -> list[QuizAttempt]:
        stmt = select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz_id
        ).order_by(QuizAttempt.attempted_at.desc())
        return list(self.db.execute(stmt).scalars().all())