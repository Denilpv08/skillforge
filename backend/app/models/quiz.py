from datetime import datetime
from sqlalchemy import (
    String, Text, ForeignKey, SmallInteger,
    Boolean, DECIMAL, JSON, DateTime, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel

class Quiz(BaseModel):
    __tablename__ = "quizzes"

    course_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    pass_score: Mapped[int] = mapped_column(SmallInteger, default=70, nullable=False)
    max_attempts: Mapped[int] = mapped_column(SmallInteger, default=3, nullable=False)
    weight: Mapped[float | None] = mapped_column(DECIMAL(5, 2), nullable=True, default=1.0)

    course: Mapped["Course"] = relationship("Course", back_populates="quizzes")
    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="quiz", cascade="all, delete-orphan",
        order_by="Question.order_index",
    )
    attempts: Mapped[list["QuizAttempt"]] = relationship(
        "QuizAttempt", back_populates="quiz", cascade="all, delete-orphan"
    )

class Question(BaseModel):
    __tablename__ = "questions"

    quiz_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)

    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")
    answer_options: Mapped[list["AnswerOption"]] = relationship(
        "AnswerOption", back_populates="question",
        cascade="all, delete-orphan",
        order_by="AnswerOption.order_index",
    )

class AnswerOption(BaseModel):
    __tablename__ = "answer_options"

    question_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order_index: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)

    question: Mapped["Question"] = relationship(
        "Question", back_populates="answer_options"
    )

class QuizAttempt(BaseModel):
    __tablename__ = "quiz_attempts"

    __table_args__ = (
        UniqueConstraint("user_id", "quiz_id", name="uq_quiz_attempt"),
    )

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    quiz_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[float] = mapped_column(DECIMAL(5, 2), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answers_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="quiz_attempts")
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")