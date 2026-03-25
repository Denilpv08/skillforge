from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, DECIMAL, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel

class Enrollment(BaseModel):
    __tablename__ = "enrollments"

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_enrollment"),
    )

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    progress_pct: Mapped[float] = mapped_column(
        DECIMAL(5, 2), default=0.00, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="enrollments")
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")
    lesson_progress: Mapped[list["LessonProgress"]] = relationship(
        "LessonProgress", back_populates="enrollment", cascade="all, delete-orphan"
    )

class LessonProgress(BaseModel):
    __tablename__ = "lesson_progress"

    __table_args__ = (
        UniqueConstraint("enrollment_id", "lesson_id", name="uq_lesson_progress"),
    )

    enrollment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False
    )
    lesson_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    watch_time_sec: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    enrollment: Mapped["Enrollment"] = relationship(
        "Enrollment", back_populates="lesson_progress"
    )
    lesson: Mapped["Lesson"] = relationship(
        "Lesson", back_populates="progress_records"
    )