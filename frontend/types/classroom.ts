export interface ClassroomNote {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  updated_at: string;
}

export interface LessonProgressPayload {
  seconds_viewed: number;
  mark_completed?: boolean;
}

export interface LessonProgressResult {
  lesson_id: string;
  seconds_viewed: number;
  progress_pct: number;
  course_completed: boolean;
  next_lesson_id: string | null;
}

export interface ClassroomProgress {
  course_id: string;
  progress_pct: number;
  completed_lesson_ids: string[];
  estimated_remaining_min: number;
}

export interface UpsertNotePayload {
  lesson_id: string;
  content: string;
}
