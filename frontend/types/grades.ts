export type GradeFinalStatus = "APROBADO" | "REPROBADO" | "EN_PROGRESO";

export interface GradeAchievement {
  code: "FIRST_QUIZ_PASSED" | "COURSE_COMPLETED" | "STREAK_7_DAYS";
  title: string;
  achieved: boolean;
}

export interface CourseQuizGrade {
  quiz_id: string;
  quiz_title: string;
  pass_score: number;
  weight: number;
  best_score: number | null;
  passed: boolean | null;
}

export interface CourseGrade {
  course_id: string;
  course_title: string;
  category_name: string;
  completion_status: string;
  average_score: number;
  best_attempt_score: number;
  final_status: GradeFinalStatus;
  quizzes: CourseQuizGrade[];
}

export interface CategoryRadarPoint {
  category: string;
  average_score: number;
}

export interface MyGrades {
  courses: CourseGrade[];
  radar_by_category: CategoryRadarPoint[];
  achievements: GradeAchievement[];
}

export interface GradebookQuiz {
  quiz_id: string;
  quiz_title: string;
  pass_score: number;
  weight: number;
}

export interface GradebookStudentRow {
  student_id: string;
  student_name: string;
  scores_by_quiz: Record<string, number | null>;
  passed_by_quiz: Record<string, boolean | null>;
  average_score: number;
  final_status: GradeFinalStatus;
}

export interface GradebookQuizAverage {
  quiz_id: string;
  average_score: number;
  pass_rate: number;
}

export interface CourseGradebook {
  course_id: string;
  course_title: string;
  quizzes: GradebookQuiz[];
  students: GradebookStudentRow[];
  quiz_averages: GradebookQuizAverage[];
}

export interface GradesSummary {
  overall_average: number;
  total_courses: number;
  approved_courses: number;
  failed_courses: number;
  in_progress_courses: number;
  active_streak_days: number;
  last_activity_date: string | null;
}
