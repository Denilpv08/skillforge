from datetime import datetime
from pydantic import BaseModel, Field

class AnswerOptionCreate(BaseModel):
    text: str = Field(min_length=1)
    is_correct: bool = False
    order_index: int = Field(default=0, ge=0)

class AnswerOptionOut(BaseModel):
    id: str
    text: str
    order_index: int
    # is_correct NO se expone al estudiante en el listado

    model_config = {"from_attributes": True}

class AnswerOptionWithCorrect(AnswerOptionOut):
    """Solo para instructores/admins."""
    is_correct: bool

class QuestionCreate(BaseModel):
    text: str = Field(min_length=1)
    order_index: int = Field(default=0, ge=0)
    answer_options: list[AnswerOptionCreate] = Field(min_length=2)

class QuestionOut(BaseModel):
    id: str
    text: str
    order_index: int
    answer_options: list[AnswerOptionOut]

    model_config = {"from_attributes": True}

class QuizCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    pass_score: int = Field(default=70, ge=0, le=100)
    max_attempts: int = Field(default=3, ge=1)
    questions: list[QuestionCreate] = Field(min_length=1)

class QuizOut(BaseModel):
    id: str
    title: str
    pass_score: int
    max_attempts: int
    questions: list[QuestionOut]

    model_config = {"from_attributes": True}

class QuizSubmit(BaseModel):
    """Body para enviar respuestas del quiz."""
    answers: dict[str, str]
    # { "question_id": "answer_option_id", ... }

class QuizAttemptOut(BaseModel):
    id: str
    score: float
    passed: bool
    attempted_at: datetime

    model_config = {"from_attributes": True}
    
class AnswerReview(BaseModel):
    """Revisión de una respuesta tras el intento."""
    question_id: str
    question_text: str
    selected_option_id: str | None
    selected_option_text: str | None
    correct_option_id: str
    correct_option_text: str
    is_correct: bool

class QuizAttemptDetail(BaseModel):
    id: str
    score: float
    passed: bool
    attempted_at: datetime
    answers_review: list[AnswerReview]

    model_config = {"from_attributes": True}