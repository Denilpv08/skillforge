"use client";
import { ComponentType } from "react";
import { BookOpen, Users, Target, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstructorAnalytics } from "@/hooks/use-analytics";
import { formatDate } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-3">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstructorDashboard() {
  const { data, isLoading } = useInstructorAnalytics();

  if (isLoading || !data) {
    return (
      <p className="text-sm text-gray-500">
        Cargando dashboard de instructor...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Mis cursos"
          value={data.my_courses.total}
          icon={BookOpen}
        />
        <StatCard
          label="Cursos publicados"
          value={data.my_courses.published}
          icon={BookOpen}
        />
        <StatCard
          label="Estudiantes inscritos"
          value={data.total_enrolled_students}
          icon={Users}
        />
        <StatCard
          label="Completación promedio"
          value={`${data.average_completion_rate}%`}
          icon={Target}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Estado de mis cursos</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="info">Publicados: {data.my_courses.published}</Badge>
          <Badge variant="warning">Borradores: {data.my_courses.drafts}</Badge>
          <Badge variant="default">Total: {data.my_courses.total}</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Quiz con peor rendimiento
            </h2>
          </CardHeader>
          <CardContent>
            {!data.lowest_performing_quiz ? (
              <p className="text-sm text-gray-500">
                Aún no hay intentos de quiz en tus cursos.
              </p>
            ) : (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {data.lowest_performing_quiz.quiz_title}
                    </p>
                    <p className="text-xs text-gray-600">
                      Curso: {data.lowest_performing_quiz.course_title}
                    </p>
                    <p className="mt-2 text-sm text-red-700">
                      Promedio actual:{" "}
                      {data.lowest_performing_quiz.average_score}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Actividad reciente</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_activity.length === 0 && (
              <p className="text-sm text-gray-500">
                Todavía no hay actividad en tus cursos.
              </p>
            )}
            {data.recent_activity.map((event, index) => (
              <div
                key={`${event.type}-${event.timestamp}-${index}`}
                className="rounded-lg border border-gray-100 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">
                    {event.message}
                  </p>
                  <Badge variant="default">{event.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {event.course_title}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(event.timestamp)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
