"use client";
import { ComponentType } from "react";
import { BookOpen, Trophy, Clock3, Flame, Brain } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useStudentAnalytics } from "@/hooks/use-analytics";
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

export default function StudentDashboard() {
  const { data, isLoading } = useStudentAnalytics();

  if (isLoading || !data) {
    return <p className="text-sm text-gray-500">Cargando tu dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Horas aprendidas"
          value={data.personal_stats.hours_learned}
          icon={Clock3}
        />
        <StatCard
          label="Racha de días"
          value={data.personal_stats.streak_days}
          icon={Flame}
        />
        <StatCard
          label="Promedio en quizzes"
          value={`${data.personal_stats.quiz_average}%`}
          icon={Brain}
        />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Cursos en progreso</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.in_progress_courses.length === 0 && (
            <p className="text-sm text-gray-500">
              No tienes cursos en progreso.
            </p>
          )}
          {data.in_progress_courses.map((course) => (
            <div
              key={course.course_id}
              className="space-y-2 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">
                  {course.course_title}
                </p>
                <Badge variant="info">{course.progress_pct}%</Badge>
              </div>
              <Progress value={course.progress_pct} showLabel size="sm" />
              <p className="text-xs text-gray-500">
                Próxima lección:{" "}
                {course.next_lesson_title ?? "Sin lecciones pendientes"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Cursos completados</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.completed_courses.length === 0 && (
              <p className="text-sm text-gray-500">
                Aún no has completado cursos.
              </p>
            )}
            {data.completed_courses.map((course) => (
              <div
                key={course.course_id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-gray-800">{course.course_title}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(course.completed_at)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Próximos quizzes pendientes
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pending_quizzes.length === 0 && (
              <p className="text-sm text-gray-500">
                No tienes quizzes pendientes.
              </p>
            )}
            {data.pending_quizzes.map((quiz) => (
              <div
                key={quiz.quiz_id}
                className="rounded-lg border border-gray-100 p-3"
              >
                <p className="text-sm font-medium text-gray-900">
                  {quiz.quiz_title}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Curso: {quiz.course_title}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">
            Rutas de aprendizaje asignadas
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.assigned_learning_paths.length === 0 && (
            <p className="text-sm text-gray-500">
              Aún no hay rutas de aprendizaje asociadas a tus cursos.
            </p>
          )}
          {data.assigned_learning_paths.map((path) => (
            <div
              key={path.path_id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <p className="text-sm text-gray-800">{path.title}</p>
              </div>
              <Badge variant="info">{path.progress_pct}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
