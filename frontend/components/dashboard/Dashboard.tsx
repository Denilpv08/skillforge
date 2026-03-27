"use client";
import { BookOpen, GraduationCap, Trophy, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import DashBoardCourses from "./DashBoardCourses";
import DashboardPerfil from "./DashboardPerfil";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, isLoading: statsLoading } = useDashboardStats();

  const statCards = [
    {
      label: "Cursos inscritos",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "En progreso",
      value: stats.inProgress,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completados",
      value: stats.completed,
      icon: Trophy,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Horas de contenido",
      value: stats.totalHours,
      icon: GraduationCap,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {user?.full_name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Aquí está el resumen de tu aprendizaje
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                {statsLoading ? (
                  <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                )}
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continuar aprendiendo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente — ocupa 2/3 */}
        <DashBoardCourses />

        {/* Panel lateral — ocupa 1/3 */}
        <DashboardPerfil user={user} stats={stats} />
      </div>
    </div>
  );
}
