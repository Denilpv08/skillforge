from datetime import date, datetime
from pydantic import BaseModel

from app.models.course import CourseStatus


class InstructorCourseMetricsOut(BaseModel):
    course_id: str
    title: str
    status: CourseStatus
    enrolled_students: int
    completed_students: int
    quiz_average_score: float


class InstructorStudentRowOut(BaseModel):
    student_id: str
    student_name: str
    course_id: str
    course_title: str
    progress_pct: float
    last_access_at: datetime | None
    status: str


class StudentCourseProgressOut(BaseModel):
    course_id: str
    course_title: str
    progress_pct: float
    completed_at: datetime | None
    total_lessons: int
    completed_lessons: int


class InstructorStudentProgressDetailOut(BaseModel):
    student_id: str
    student_name: str
    courses: list[StudentCourseProgressOut]


class QuizScoreBinOut(BaseModel):
    label: str
    count: int


class InstructorQuizStatsOut(BaseModel):
    quiz_id: str
    quiz_title: str
    course_id: str
    course_title: str
    total_attempts: int
    pass_rate: float
    average_score: float
    score_distribution: list[QuizScoreBinOut]


class WeeklyEnrollmentPointOut(BaseModel):
    week_start: date
    enrollments: int


class MonthlyCompletionPointOut(BaseModel):
    month: str
    completions: int


class LessonWatchTimeLeaderOut(BaseModel):
    lesson_id: str
    lesson_title: str
    course_id: str
    course_title: str
    average_watch_time_sec: float


class InstructorAnalyticsOut(BaseModel):
    enrollments_by_week: list[WeeklyEnrollmentPointOut]
    completions_by_month: list[MonthlyCompletionPointOut]
    retention_rate: float
    top_watch_time_lesson: LessonWatchTimeLeaderOut | None
