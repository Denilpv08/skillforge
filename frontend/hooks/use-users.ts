import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "@/lib/api/users";

export const userKeys = {
  all: ["users"] as const,
  list: ["users", "list"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list,
    queryFn: usersApi.listUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list });
      toast.success("Usuario creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al crear usuario");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      usersApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list });
      toast.success("Usuario actualizado");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al actualizar");
    },
  });
}
