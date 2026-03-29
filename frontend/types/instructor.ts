import { CourseStatus } from "@/types/course";

export interface InstructorCourseMetrics {
  course_id: string;
  title: string;
  status: CourseStatus;
  enrolled_students: number;
  completed_students: number;
  quiz_average_score: number;
}

export interface InstructorStudentRow {
  student_id: string;
  student_name: string;
  course_id: string;
  course_title: string;
  progress_pct: number;
  last_access_at: string | null;
  status: "ACTIVE" | "INACTIVE" | "COMPLETED";
}

export interface StudentCourseProgress {
  course_id: string;
  course_title: string;
  progress_pct: number;
  completed_at: string | null;
  total_lessons: number;
  completed_lessons: number;
}

export interface InstructorStudentProgressDetail {
  student_id: string;
  student_name: string;
  courses: StudentCourseProgress[];
}

export interface QuizScoreBin {
  label: string;
  count: number;
}

export interface InstructorQuizStats {
  quiz_id: string;
  quiz_title: string;
  course_id: string;
  course_title: string;
  total_attempts: number;
  pass_rate: number;
  average_score: number;
  score_distribution: QuizScoreBin[];
}

export interface WeeklyEnrollmentPoint {
  week_start: string;
  enrollments: number;
}

export interface MonthlyCompletionPoint {
  month: string;
  completions: number;
}

export interface LessonWatchTimeLeader {
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  average_watch_time_sec: number;
}

export interface InstructorAnalytics {
  enrollments_by_week: WeeklyEnrollmentPoint[];
  completions_by_month: MonthlyCompletionPoint[];
  retention_rate: number;
  top_watch_time_lesson: LessonWatchTimeLeader | null;
}
