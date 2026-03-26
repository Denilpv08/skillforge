export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_min: number | null;
  is_free: boolean;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  status: CourseStatus;
  duration_hours: number | null;
  category: Category | null;
  instructor_id: string;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
}

export interface PaginatedCourses {
  data: Course[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Enrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_pct: number;
  course: Course;
}
