import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { quizzesApi, CreateQuizPayload } from "@/lib/api/quizzes";

export const quizKeys = {
  byCourse: (courseId: string) => ["quizzes", "course", courseId] as const,
  detail: (quizId: string) => ["quizzes", "detail", quizId] as const,
  attempts: (quizId: string) => ["quizzes", "attempts", quizId] as const,
  results: (quizId: string) => ["quizzes", "results", quizId] as const,
};

export function useQuizzesByCourse(courseId: string) {
  return useQuery({
    queryKey: quizKeys.byCourse(courseId),
    queryFn: () => quizzesApi.listByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: quizKeys.detail(quizId),
    queryFn: () => quizzesApi.getQuiz(quizId),
    enabled: !!quizId,
  });
}

export function useMyAttempts(quizId: string) {
  return useQuery({
    queryKey: quizKeys.attempts(quizId),
    queryFn: () => quizzesApi.getMyAttempts(quizId),
    enabled: !!quizId,
  });
}

export function useQuizResults(quizId: string) {
  return useQuery({
    queryKey: quizKeys.results(quizId),
    queryFn: () => quizzesApi.getResults(quizId),
    enabled: !!quizId,
  });
}

export function useCreateQuiz(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuizPayload) =>
      quizzesApi.createQuiz(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.byCourse(courseId) });
      toast.success("Quiz creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al crear el quiz");
    },
  });
}

export function useDeleteQuiz(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quizzesApi.deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.byCourse(courseId) });
      toast.success("Quiz eliminado");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al eliminar");
    },
  });
}

export function useSubmitQuiz(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: Record<string, string>) =>
      quizzesApi.submitQuiz(quizId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.attempts(quizId) });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail ?? "Error al enviar respuestas",
      );
    },
  });
}
