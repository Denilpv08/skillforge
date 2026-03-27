"use client";
import { Shield } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Info from "./Info";
import ProfileEdit from "./ProfileEdit";

const Profile = () => {
  const { user, updateUser } = useAuthStore();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal</p>
      </div>

      {/* Avatar + info */}
      <Info user={user!} />

      {/* Formulario de edición */}
      <ProfileEdit user={user!} updateUser={updateUser} />

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
};

export default Profile;
