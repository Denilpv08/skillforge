from datetime import date
from pydantic import BaseModel


class GradeAchievementOut(BaseModel):
    code: str
    title: str
    achieved: bool


class CourseQuizGradeOut(BaseModel):
    quiz_id: str
    quiz_title: str
    pass_score: int
    weight: float
    best_score: float | None
    passed: bool | None


class CourseGradeOut(BaseModel):
    course_id: str
    course_title: str
    category_name: str
    completion_status: str
    average_score: float
    best_attempt_score: float
    final_status: str
    quizzes: list[CourseQuizGradeOut]


class CategoryRadarPointOut(BaseModel):
    category: str
    average_score: float


class MyGradesOut(BaseModel):
    courses: list[CourseGradeOut]
    radar_by_category: list[CategoryRadarPointOut]
    achievements: list[GradeAchievementOut]


class GradebookQuizOut(BaseModel):
    quiz_id: str
    quiz_title: str
    pass_score: int
    weight: float


class GradebookStudentRowOut(BaseModel):
    student_id: str
    student_name: str
    scores_by_quiz: dict[str, float | None]
    passed_by_quiz: dict[str, bool | None]
    average_score: float
    final_status: str


class GradebookQuizAverageOut(BaseModel):
    quiz_id: str
    average_score: float
    pass_rate: float


class CourseGradebookOut(BaseModel):
    course_id: str
    course_title: str
    quizzes: list[GradebookQuizOut]
    students: list[GradebookStudentRowOut]
    quiz_averages: list[GradebookQuizAverageOut]


class GradesSummaryOut(BaseModel):
    overall_average: float
    total_courses: int
    approved_courses: int
    failed_courses: int
    in_progress_courses: int
    active_streak_days: int
    last_activity_date: date | None
