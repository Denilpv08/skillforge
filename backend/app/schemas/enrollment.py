from datetime import datetime
from pydantic import BaseModel
from app.schemas.course import CourseOut
from pydantic import Field


class EnrollmentOut(BaseModel):
    id: str
    course_id: str
    enrolled_at: datetime
    completed_at: datetime | None
    progress_pct: float
    course: CourseOut

    model_config = {"from_attributes": True}


class LessonProgressOut(BaseModel):
    lesson_id: str
    completed_at: datetime | None
    watch_time_sec: int

    model_config = {"from_attributes": True}


class ProgressUpdate(BaseModel):
    """Body para marcar una lección como completada."""
    watch_time_sec: int = Field(default=0, ge=0)

    