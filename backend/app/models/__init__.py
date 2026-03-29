# Importar todos los modelos aquí para que Alembic los detecte
# El orden importa: primero los modelos sin dependencias
from app.models.base_model import BaseModel
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.course import Category, Course, Lesson, CourseStatus
from app.models.enrollment import Enrollment, LessonProgress
from app.models.quiz import Quiz, Question, AnswerOption, QuizAttempt
from app.models.learning_path import LearningPath, LearningPathCourse
from app.models.note import Note

__all__ = [
    "BaseModel",
    "Organization",
    "User", "UserRole",
    "Category", "Course", "Lesson", "CourseStatus",
    "Enrollment", "LessonProgress",
    "Quiz", "Question", "AnswerOption", "QuizAttempt",
    "LearningPath", "LearningPathCourse",
    "Note",
]