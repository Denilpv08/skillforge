"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Shield } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { usersApi } from "@/lib/api/users";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: "Acceso total a la plataforma",
  ADMIN: "Gestión de la organización",
  INSTRUCTOR: "Creación y gestión de cursos",
  STUDENT: "Acceso a cursos publicados",
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editMode, setEditMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? "",
      avatar_url: user?.avatar_url ?? "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success("Perfil actualizado");
      setEditMode(false);
    },
    onError: () => {
      toast.error("Error al actualizar el perfil");
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate({
      full_name: values.full_name,
      avatar_url: values.avatar_url || undefined,
    });
  };

  const handleCancel = () => {
    reset();
    setEditMode(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal</p>
      </div>

      {/* Avatar + info */}
      <Card>
        <CardContent className="flex items-center gap-6 py-6">
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {user?.full_name}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={
                  user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
                    ? "info"
                    : user?.role === "INSTRUCTOR"
                      ? "warning"
                      : "default"
                }
              >
                {user?.role}
              </Badge>
              <span className="text-xs text-gray-400">
                {roleDescriptions[user?.role ?? ""] ?? ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de edición */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-800">
                Información personal
              </h3>
            </div>
            {!editMode && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditMode(true)}
              >
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                id="full_name"
                label="Nombre completo"
                error={errors.full_name?.message}
                {...register("full_name")}
              />
              <Input
                id="avatar_url"
                label="URL de avatar"
                placeholder="https://..."
                helperText="URL de imagen para tu foto de perfil"
                error={errors.avatar_url?.message}
                {...register("avatar_url")}
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={updateProfile.isPending}>
                  Guardar cambios
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-0.5">Nombre</p>
                  <p className="font-medium text-gray-800">{user?.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Email</p>
                  <p className="font-medium text-gray-800">{user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Rol</p>
                  <p className="font-medium text-gray-800">{user?.role}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Estado</p>
                  <Badge variant={user?.is_active ? "success" : "danger"}>
                    {user?.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info de seguridad */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-800">Seguridad</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Contraseña</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Usa una contraseña segura de al menos 8 caracteres
              </p>
            </div>
            <Button variant="secondary" size="sm" disabled>
              Cambiar (próximamente)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
