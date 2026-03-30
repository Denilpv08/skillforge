import enum
from sqlalchemy import String, Text, Enum, ForeignKey, DECIMAL, Boolean, SmallInteger, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base_model import BaseModel

class CourseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class MaterialType(str, enum.Enum):
    VIDEO = "VIDEO"
    DOCUMENT = "DOCUMENT"
    PRESENTATION = "PRESENTATION"
    CODE = "CODE"
    LINK = "LINK"
    FILE = "FILE"

class Category(BaseModel):
    __tablename__ = "categories"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="categories"
    )
    courses: Mapped[list["Course"]] = relationship(
        "Course", back_populates="category"
    )

class Course(BaseModel):
    __tablename__ = "courses"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    instructor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[CourseStatus] = mapped_column(
        Enum(CourseStatus),
        default=CourseStatus.DRAFT,
        nullable=False,
        index=True,
    )
    duration_hours: Mapped[float | None] = mapped_column(DECIMAL(5, 2), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="courses"
    )
    instructor: Mapped["User"] = relationship(
        "User", back_populates="courses_created"
    )
    category: Mapped["Category | None"] = relationship(
        "Category", back_populates="courses"
    )
    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment", back_populates="course", cascade="all, delete-orphan"
    )
    quizzes: Mapped[list["Quiz"]] = relationship(
        "Quiz", back_populates="course", cascade="all, delete-orphan"
    )

class Lesson(BaseModel):
    __tablename__ = "lessons"

    course_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    order_index: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    duration_min: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="lessons")
    progress_records: Mapped[list["LessonProgress"]] = relationship(
        "LessonProgress", back_populates="lesson", cascade="all, delete-orphan"
    )
    notes: Mapped[list["Note"]] = relationship(
        "Note", back_populates="lesson", cascade="all, delete-orphan"
    )
    materials: Mapped[list["LessonMaterial"]] = relationship(
        "LessonMaterial",
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="LessonMaterial.order_index",
    )


class LessonMaterial(BaseModel):
    __tablename__ = "lesson_materials"

    lesson_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[MaterialType] = mapped_column(
        Enum(MaterialType),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    file_size_kb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="materials")