from pydantic import BaseModel, Field
from app.schemas.course import CourseOut

class LearningPathCourseItem(BaseModel):
    course_id: str
    order_index: int = Field(default=0, ge=0)
    is_required: bool = True

class LearningPathCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    courses: list[LearningPathCourseItem] = []

class LearningPathUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = None

class LearningPathCourseOut(BaseModel):
    course: CourseOut
    order_index: int
    is_required: bool

    model_config = {"from_attributes": True}

class LearningPathOut(BaseModel):
    id: str
    title: str
    slug: str
    description: str | None
    path_courses: list[LearningPathCourseOut] = []

    model_config = {"from_attributes": True}