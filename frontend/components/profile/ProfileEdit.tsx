import { User } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useState } from "react";
import { User as Users } from "@/types/auth";

interface ProfileEditProps {
  user: Users;
  updateUser: (user: Users) => void;
}

const profileSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileEdit = ({ user, updateUser }: ProfileEditProps) => {
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
              <Button type="button" variant="secondary" onClick={handleCancel}>
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
  );
};

export default ProfileEdit;
