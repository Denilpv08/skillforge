import { apiClient } from "./client";
import {
  ClassroomNote,
  ClassroomProgress,
  LessonProgressPayload,
  LessonProgressResult,
  UpsertNotePayload,
} from "@/types/classroom";

export const classroomApi = {
  getNote: async (lessonId: string): Promise<ClassroomNote | null> => {
    const { data } = await apiClient.get<ClassroomNote | null>("/notes", {
      params: { lesson_id: lessonId },
    });
    return data;
  },

  upsertNote: async (payload: UpsertNotePayload): Promise<ClassroomNote> => {
    const { data } = await apiClient.post<ClassroomNote>("/notes", payload);
    return data;
  },

  getNotesByCourse: async (courseId: string): Promise<ClassroomNote[]> => {
    const { data } = await apiClient.get<ClassroomNote[]>("/notes/by-course", {
      params: { course_id: courseId },
    });
    return data;
  },

  patchLessonProgress: async (
    lessonId: string,
    payload: LessonProgressPayload,
  ): Promise<LessonProgressResult> => {
    const { data } = await apiClient.patch<LessonProgressResult>(
      `/lessons/${lessonId}/progress`,
      payload,
    );
    return data;
  },

  getClassroomProgress: async (
    courseId: string,
  ): Promise<ClassroomProgress> => {
    const { data } = await apiClient.get<ClassroomProgress>(
      `/classroom/${courseId}/progress`,
    );
    return data;
  },
};
