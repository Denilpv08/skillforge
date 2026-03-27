from pydantic import BaseModel, Field
from app.models.course import CourseStatus

# ─── Category ────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None

class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None

    model_config = {"from_attributes": True}

# ─── Lesson ──────────────────────────────────────────────────
class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    content: str | None = None
    video_url: str | None = None
    order_index: int = Field(default=0, ge=0)
    duration_min: int | None = Field(default=None, ge=1)
    is_free: bool = False

class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    content: str | None = None
    video_url: str | None = None
    order_index: int | None = Field(default=None, ge=0)
    duration_min: int | None = Field(default=None, ge=1)
    is_free: bool | None = None

class LessonOut(BaseModel):
    id: str
    title: str
    content: str | None
    video_url: str | None
    order_index: int
    duration_min: int | None
    is_free: bool

    model_config = {"from_attributes": True}

# ─── Course ──────────────────────────────────────────────────
class CourseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    thumbnail_url: str | None = None
    category_id: str | None = None
    duration_hours: float | None = Field(default=None, ge=0)

class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None
    thumbnail_url: str | None = None
    category_id: str | None = None
    duration_hours: float | None = Field(default=None, ge=0)
    status: CourseStatus | None = None

class CourseOut(BaseModel):
    id: str
    title: str
    slug: str
    description: str | None
    thumbnail_url: str | None
    status: CourseStatus
    duration_hours: float | None
    category: CategoryOut | None
    instructor_id: str

    model_config = {"from_attributes": True}

class CourseDetail(CourseOut):
    """CourseOut + lecciones — usado en el detalle del curso."""
    lessons: list[LessonOut] = []
    
class CourseStatusUpdate(BaseModel):
    status: CourseStatus