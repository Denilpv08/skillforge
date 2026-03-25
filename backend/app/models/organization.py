from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel

class Organization(BaseModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    users: Mapped[list["User"]] = relationship(
        "User", back_populates="organization", cascade="all, delete-orphan"
    )
    courses: Mapped[list["Course"]] = relationship(
        "Course", back_populates="organization", cascade="all, delete-orphan"
    )
    categories: Mapped[list["Category"]] = relationship(
        "Category", back_populates="organization", cascade="all, delete-orphan"
    )
    learning_paths: Mapped[list["LearningPath"]] = relationship(
        "LearningPath", back_populates="organization", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Organization {self.name}>"