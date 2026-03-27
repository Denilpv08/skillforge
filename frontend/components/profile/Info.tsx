import { User } from "@/types/auth";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

interface InfoProps {
  user: User;
}

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: "Acceso total a la plataforma",
  ADMIN: "Gestión de la organización",
  INSTRUCTOR: "Creación y gestión de cursos",
  STUDENT: "Acceso a cursos publicados",
};

const Info = ({ user }: InfoProps) => {
  return (
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
          <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
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
  );
};

export default Info;
