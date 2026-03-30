from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, func
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User

class QuizRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_course(self, course_id: str) -> list[Quiz]:
        stmt = (
            select(Quiz)
            .options(
                selectinload(Quiz.questions).selectinload(
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
                selectinload(Quiz.questions).selectinload(
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
        self, user_id: str, quiz_id: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[QuizAttempt], int]:
        base_stmt = select(QuizAttempt).where(
            QuizAttempt.user_id == user_id,
            QuizAttempt.quiz_id == quiz_id,
        )
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0
        
        stmt = base_stmt.order_by(QuizAttempt.attempted_at.desc())
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)
        attempts = list(self.db.execute(stmt).scalars().all())
        return attempts, total

    def create_attempt(self, attempt: QuizAttempt) -> QuizAttempt:
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt
    
    def get_all_attempts_paginated(
        self, quiz_id: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[QuizAttempt], int]:
        base_stmt = (
            select(QuizAttempt)
            .options(joinedload(QuizAttempt.user))
            .where(QuizAttempt.quiz_id == quiz_id)
            .order_by(QuizAttempt.attempted_at.desc())
        )
        count_stmt = select(func.count()).where(QuizAttempt.quiz_id == quiz_id)
        total = self.db.execute(count_stmt).scalar() or 0
        
        stmt = base_stmt.offset((page - 1) * per_page).limit(per_page)
        attempts = list(self.db.execute(stmt).unique().scalars().all())
        return attempts, total