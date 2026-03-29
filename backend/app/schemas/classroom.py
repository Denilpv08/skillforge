from datetime import datetime
from pydantic import BaseModel, Field


class NoteUpsertIn(BaseModel):
    lesson_id: str
    content: str = ""


class NoteOut(BaseModel):
    id: str
    user_id: str
    lesson_id: str
    content: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class LessonProgressPatchIn(BaseModel):
    seconds_viewed: int = Field(ge=0)
    mark_completed: bool = False


class LessonProgressPatchOut(BaseModel):
    lesson_id: str
    seconds_viewed: int
    progress_pct: float
    course_completed: bool
    next_lesson_id: str | None


class ClassroomProgressOut(BaseModel):
    course_id: str
    progress_pct: float
    completed_lesson_ids: list[str]
    estimated_remaining_min: int
