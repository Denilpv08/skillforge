import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  learningPathsApi,
  CreatePathPayload,
  UpdatePathPayload,
} from "@/lib/api/learning-paths";

export const pathKeys = {
  all: ["learning-paths"] as const,
  list: ["learning-paths", "list"] as const,
  detail: (id: string) => ["learning-paths", id] as const,
};

export function useLearningPaths() {
  return useQuery({
    queryKey: pathKeys.list,
    queryFn: learningPathsApi.getAll,
  });
}

export function useLearningPath(pathId: string) {
  return useQuery({
    queryKey: pathKeys.detail(pathId),
    queryFn: () => learningPathsApi.getById(pathId),
    enabled: !!pathId,
  });
}

export function useCreatePath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePathPayload) =>
      learningPathsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pathKeys.list });
      toast.success("Ruta creada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al crear la ruta");
    },
  });
}

export function useUpdatePath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pathId,
      data,
    }: {
      pathId: string;
      data: UpdatePathPayload;
    }) => learningPathsApi.update(pathId, data),
    onSuccess: (_, { pathId }) => {
      queryClient.invalidateQueries({ queryKey: pathKeys.detail(pathId) });
      queryClient.invalidateQueries({ queryKey: pathKeys.list });
      toast.success("Ruta actualizada");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al actualizar");
    },
  });
}

export function useSetPathCourses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pathId,
      courses,
    }: {
      pathId: string;
      courses: {
        course_id: string;
        order_index: number;
        is_required: boolean;
      }[];
    }) => learningPathsApi.setCourses(pathId, courses),
    onSuccess: (_, { pathId }) => {
      queryClient.invalidateQueries({ queryKey: pathKeys.detail(pathId) });
      queryClient.invalidateQueries({ queryKey: pathKeys.list });
      toast.success("Cursos de la ruta actualizados");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.detail ?? "Error al actualizar cursos",
      );
    },
  });
}

export function useDeletePath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: learningPathsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pathKeys.list });
      toast.success("Ruta eliminada");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al eliminar");
    },
  });
}
