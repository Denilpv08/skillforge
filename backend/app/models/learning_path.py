from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, SmallInteger, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.base_model import BaseModel

class LearningPath(BaseModel):
    __tablename__ = "learning_paths"

    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="learning_paths"
    )
    path_courses: Mapped[list["LearningPathCourse"]] = relationship(
        "LearningPathCourse",
        back_populates="learning_path",
        cascade="all, delete-orphan",
        order_by="LearningPathCourse.order_index",
    )

class LearningPathCourse(Base):
    __tablename__ = "learning_path_courses"

    learning_path_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    order_index: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    learning_path: Mapped["LearningPath"] = relationship(
        "LearningPath", back_populates="path_courses"
    )
    course: Mapped["Course"] = relationship("Course")