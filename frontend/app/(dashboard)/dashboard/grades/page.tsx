"use client";
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Award, CheckCircle2, Flame, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyGrades, useGradesSummary } from "@/hooks/use-grades";

function getStatusVariant(status: string): "success" | "danger" | "warning" {
  if (status === "APROBADO") return "success";
  if (status === "REPROBADO") return "danger";
  return "warning";
}

export default function GradesPage() {
  const { data, isLoading } = useMyGrades();
  const { data: summary } = useGradesSummary();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Cargando calificaciones...</p>;
  }

  const courses = data?.courses ?? [];
  const achievements = data?.achievements ?? [];
  const radarData = data?.radar_by_category ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis calificaciones</h1>
        <p className="mt-1 text-gray-500">
          Revisa tu rendimiento por curso y por categoria.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">Promedio general</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {summary?.overall_average ?? 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">Cursos aprobados</p>
            <p className="mt-1 text-2xl font-semibold text-green-700">
              {summary?.approved_courses ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">Cursos en progreso</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {summary?.in_progress_courses ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500">Racha activa</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-indigo-700">
              <Flame className="h-5 w-5" />
              {summary?.active_streak_days ?? 0} dias
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Tabla por curso
          </h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-2 py-2">Curso</th>
                  <th className="px-2 py-2">Categoria</th>
                  <th className="px-2 py-2">Prom. quizzes</th>
                  <th className="px-2 py-2">Mejor intento</th>
                  <th className="px-2 py-2">Completacion</th>
                  <th className="px-2 py-2">Estado final</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.course_id} className="border-b">
                    <td className="px-2 py-3 font-medium text-gray-900">
                      {course.course_title}
                    </td>
                    <td className="px-2 py-3 text-gray-600">
                      {course.category_name}
                    </td>
                    <td className="px-2 py-3 text-gray-700">
                      {course.average_score}%
                    </td>
                    <td className="px-2 py-3 text-gray-700">
                      {course.best_attempt_score}%
                    </td>
                    <td className="px-2 py-3">
                      <Badge
                        variant={
                          course.completion_status === "COMPLETADO"
                            ? "success"
                            : "warning"
                        }
                      >
                        {course.completion_status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={getStatusVariant(course.final_status)}>
                        {course.final_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-gray-500">
                      No tienes cursos inscritos o sin evaluaciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Rendimiento por categoria
            </h2>
          </CardHeader>
          <CardContent className="h-90">
            {radarData.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay suficientes datos para la grafica.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Tooltip />
                  <Radar
                    name="Promedio"
                    dataKey="average_score"
                    stroke="#4f46e5"
                    fill="#6366f1"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Insignias y logros
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.code}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  {achievement.code === "FIRST_QUIZ_PASSED" && (
                    <Award className="h-4 w-4 text-indigo-600" />
                  )}
                  {achievement.code === "COURSE_COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {achievement.code === "STREAK_7_DAYS" && (
                    <Trophy className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-sm text-gray-800">
                    {achievement.title}
                  </span>
                </div>
                <Badge variant={achievement.achieved ? "success" : "default"}>
                  {achievement.achieved ? "Desbloqueado" : "Pendiente"}
                </Badge>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-gray-500">
                Aun no hay logros registrados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
