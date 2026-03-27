import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { coursesApi } from "@/lib/api/courses";
import { CourseStatus } from "@/types/course";

// Claves de cache — centralizadas para evitar typos
export const courseKeys = {
  all: ["courses"] as const,
  list: (filters: object) => ["courses", "list", filters] as const,
  detail: (id: string) => ["courses", "detail", id] as const,
  categories: ["courses", "categories"] as const,
  enrollments: ["enrollments"] as const,
};

// ─── Queries ──────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: courseKeys.categories,
    queryFn: coursesApi.getCategories,
  });
}

export function useCourses(
  filters: {
    page?: number;
    per_page?: number;
    status?: CourseStatus;
    category_id?: string;
  } = {},
) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => coursesApi.getCourses(filters),
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => coursesApi.getCourse(courseId),
    enabled: !!courseId,
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: courseKeys.enrollments,
    queryFn: coursesApi.getMyEnrollments,
  });
}

// ─── Mutations ────────────────────────────────────────────────
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: () => {
      // Invalidar cache para refrescar la lista
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Curso creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al crear el curso");
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: any }) =>
      coursesApi.updateCourse(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Curso actualizado");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al actualizar");
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesApi.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Curso eliminado");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al eliminar");
    },
  });
}

export function useEnroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesApi.enroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.enrollments });
      toast.success("¡Inscripción exitosa!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al inscribirse");
    },
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
    }: {
      courseId: string;
      lessonId: string;
    }) => coursesApi.completeLesson(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.enrollments });
      toast.success("¡Lección completada!");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      coursesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.categories });
      toast.success("Categoría actualizada");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al actualizar");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.categories });
      toast.success("Categoría eliminada");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al eliminar");
    },
  });
}

export function useChangeCourseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, status }: { courseId: string; status: string }) =>
      coursesApi.changeCourseStatus(courseId, status),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.all });
      toast.success("Estado del curso actualizado");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al cambiar estado");
    },
  });
}

export function useLesson(courseId: string, lessonId: string) {
  return useQuery({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () => coursesApi.getLesson(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => coursesApi.createLesson(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success("Lección creada");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al crear lección");
    },
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: any }) =>
      coursesApi.updateLesson(courseId, lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success("Lección actualizada");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail ?? "Error al actualizar lección",
      );
    },
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) =>
      coursesApi.deleteLesson(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success("Lección eliminada");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al eliminar");
    },
  });
}

export function useReorderLessons(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonIds: string[]) =>
      coursesApi.reorderLessons(courseId, lessonIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}
