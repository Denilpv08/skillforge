import Link from "next/link";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Trophy } from "lucide-react";
import { User } from "@/types/auth";

interface DashboardPerfilProps {
  user: User | null;
  stats: {
    completed: number;
  };
}

const DashboardPerfil = ({ user, stats }: DashboardPerfilProps) => {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-800">Tu perfil</h2>
      <Card>
        <CardContent className="py-5 text-center space-y-3">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center mx-auto text-white text-xl font-bold">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.full_name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
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
          <Link href="/dashboard/profile" className="block">
            <Button variant="secondary" size="sm" className="w-full">
              Ver perfil completo
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Logro rápido */}
      {stats.completed > 0 && (
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-100">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {stats.completed}{" "}
                {stats.completed === 1
                  ? "curso completado"
                  : "cursos completados"}
              </p>
              <p className="text-xs text-gray-400">¡Sigue así!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPerfil;
