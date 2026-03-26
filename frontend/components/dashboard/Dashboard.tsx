"use client";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Trophy,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthStore } from "@/store/auth-store";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useMyEnrollments } from "@/hooks/use-courses";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { data: enrollments = [], isLoading: enrollLoading } =
    useMyEnrollments();

  const recentEnrollments = enrollments.slice(0, 3);

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
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Continuar aprendiendo
            </h2>
            <Link
              href="/dashboard/my-learning"
              className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
            >
              Ver todo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {enrollLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : recentEnrollments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin cursos aún"
              description="Explora el catálogo y empieza tu primer curso"
              action={{
                label: "Explorar cursos",
                onClick: () => (window.location.href = "/dashboard/courses"),
              }}
            />
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/dashboard/courses/${enrollment.course_id}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="w-14 h-14 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">
                          {enrollment.course.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Desde {formatDate(enrollment.enrolled_at)}
                        </p>
                        <div className="mt-2">
                          <Progress
                            value={Number(enrollment.progress_pct)}
                            showLabel
                            size="sm"
                          />
                        </div>
                      </div>
                      {enrollment.completed_at && (
                        <Badge variant="success">✓</Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral — ocupa 1/3 */}
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
      </div>
    </div>
  );
}
