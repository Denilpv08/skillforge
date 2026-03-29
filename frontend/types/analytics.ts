export interface WeeklyEnrollmentPoint {
  week_start: string;
  enrollments: number;
}

export interface TopCourseItem {
  course_id: string;
  title: string;
  enrollments: number;
}

export interface RecentActiveUserItem {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  last_activity_at: string;
}

export interface StaleDraftCourseAlert {
  course_id: string;
  title: string;
  days_in_draft: number;
}

export interface AdminAnalytics {
  total_users: number;
  active_courses: number;
  enrollments_this_month: number;
  completion_rate: number;
  enrollments_by_week: WeeklyEnrollmentPoint[];
  top_courses: TopCourseItem[];
  recent_active_users: RecentActiveUserItem[];
  stale_draft_alerts: StaleDraftCourseAlert[];
}

export interface InstructorCourseStats {
  total: number;
  published: number;
  drafts: number;
}

export interface LowestQuizPerformance {
  quiz_id: string;
  quiz_title: string;
  course_id: string;
  course_title: string;
  average_score: number;
}

export interface InstructorActivityItem {
  type: "ENROLLMENT" | "QUIZ_ATTEMPT" | "LESSON_COMPLETED";
  timestamp: string;
  course_id: string;
  course_title: string;
  message: string;
}

export interface InstructorAnalytics {
  my_courses: InstructorCourseStats;
  total_enrolled_students: number;
  average_completion_rate: number;
  lowest_performing_quiz: LowestQuizPerformance | null;
  recent_activity: InstructorActivityItem[];
}

export interface StudentInProgressCourse {
  course_id: string;
  course_title: string;
  progress_pct: number;
  next_lesson_id: string | null;
  next_lesson_title: string | null;
}

export interface StudentCompletedCourse {
  course_id: string;
  course_title: string;
  completed_at: string;
}

export interface PendingQuizItem {
  quiz_id: string;
  quiz_title: string;
  course_id: string;
  course_title: string;
}

export interface StudentPersonalStats {
  hours_learned: number;
  streak_days: number;
  quiz_average: number;
}

export interface StudentLearningPathItem {
  path_id: string;
  title: string;
  progress_pct: number;
}

export interface StudentAnalytics {
  in_progress_courses: StudentInProgressCourse[];
  completed_courses: StudentCompletedCourse[];
  pending_quizzes: PendingQuizItem[];
  personal_stats: StudentPersonalStats;
  assigned_learning_paths: StudentLearningPathItem[];
}
