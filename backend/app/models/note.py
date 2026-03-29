from sqlalchemy import String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import BaseModel


class Note(BaseModel):
    __tablename__ = "notes"

    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_notes_user_lesson"),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lesson_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notes")
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="notes")
