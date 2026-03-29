import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { classroomApi } from "@/lib/api/classroom";
import { LessonProgressPayload, UpsertNotePayload } from "@/types/classroom";

export const classroomKeys = {
  all: ["classroom"] as const,
  note: (lessonId: string) => ["classroom", "note", lessonId] as const,
  notesByCourse: (courseId: string) =>
    ["classroom", "notes-by-course", courseId] as const,
  progress: (courseId: string) => ["classroom", "progress", courseId] as const,
};

export function useClassroomProgress(courseId: string) {
  return useQuery({
    queryKey: classroomKeys.progress(courseId),
    queryFn: () => classroomApi.getClassroomProgress(courseId),
    enabled: !!courseId,
  });
}

export function useLessonNote(lessonId: string) {
  return useQuery({
    queryKey: classroomKeys.note(lessonId),
    queryFn: () => classroomApi.getNote(lessonId),
    enabled: !!lessonId,
  });
}

export function useNotesByCourse(courseId: string) {
  return useQuery({
    queryKey: classroomKeys.notesByCourse(courseId),
    queryFn: () => classroomApi.getNotesByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useUpsertNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertNotePayload) =>
      classroomApi.upsertNote(payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(classroomKeys.note(saved.lesson_id), saved);
      queryClient.invalidateQueries({
        queryKey: ["classroom", "notes-by-course"],
      });
    },
    onError: () => {
      toast.error("No se pudo guardar la nota");
    },
  });
}

export function usePatchLessonProgress(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      payload,
    }: {
      lessonId: string;
      payload: LessonProgressPayload;
    }) => classroomApi.patchLessonProgress(lessonId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classroomKeys.progress(courseId),
      });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}
