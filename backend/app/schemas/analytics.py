from datetime import date, datetime
from pydantic import BaseModel


class WeeklyEnrollmentPoint(BaseModel):
    week_start: date
    enrollments: int


class TopCourseItem(BaseModel):
    course_id: str
    title: str
    enrollments: int


class RecentActiveUserItem(BaseModel):
    user_id: str
    full_name: str
    email: str
    role: str
    last_activity_at: datetime


class StaleDraftCourseAlert(BaseModel):
    course_id: str
    title: str
    days_in_draft: int


class AdminAnalyticsOut(BaseModel):
    total_users: int
    active_courses: int
    enrollments_this_month: int
    completion_rate: float
    enrollments_by_week: list[WeeklyEnrollmentPoint]
    top_courses: list[TopCourseItem]
    recent_active_users: list[RecentActiveUserItem]
    stale_draft_alerts: list[StaleDraftCourseAlert]


class InstructorCourseStats(BaseModel):
    total: int
    published: int
    drafts: int


class LowestQuizPerformance(BaseModel):
    quiz_id: str
    quiz_title: str
    course_id: str
    course_title: str
    average_score: float


class InstructorActivityItem(BaseModel):
    type: str
    timestamp: datetime
    course_id: str
    course_title: str
    message: str


class InstructorAnalyticsOut(BaseModel):
    my_courses: InstructorCourseStats
    total_enrolled_students: int
    average_completion_rate: float
    lowest_performing_quiz: LowestQuizPerformance | None
    recent_activity: list[InstructorActivityItem]


class StudentInProgressCourse(BaseModel):
    course_id: str
    course_title: str
    progress_pct: float
    next_lesson_id: str | None
    next_lesson_title: str | None


class StudentCompletedCourse(BaseModel):
    course_id: str
    course_title: str
    completed_at: datetime


class PendingQuizItem(BaseModel):
    quiz_id: str
    quiz_title: str
    course_id: str
    course_title: str


class StudentPersonalStats(BaseModel):
    hours_learned: float
    streak_days: int
    quiz_average: float


class StudentLearningPathItem(BaseModel):
    path_id: str
    title: str
    progress_pct: float


class StudentAnalyticsOut(BaseModel):
    in_progress_courses: list[StudentInProgressCourse]
    completed_courses: list[StudentCompletedCourse]
    pending_quizzes: list[PendingQuizItem]
    personal_stats: StudentPersonalStats
    assigned_learning_paths: list[StudentLearningPathItem]
