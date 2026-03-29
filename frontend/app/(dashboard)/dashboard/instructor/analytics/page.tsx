"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstructorAnalytics } from "@/hooks/use-instructor";

export default function InstructorAnalyticsPage() {
  const { data, isLoading } = useInstructorAnalytics();

  if (isLoading || !data) {
    return <p className="text-sm text-gray-500">Cargando analíticas...</p>;
  }

  const enrollmentsData = data.enrollments_by_week.map((item) => ({
    week: new Date(item.week_start).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
    }),
    enrollments: item.enrollments,
  }));

  const completionsData = data.completions_by_month.map((item) => ({
    month: item.month,
    completions: item.completions,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Analíticas del instructor
        </h1>
        <p className="mt-1 text-gray-500">
          Monitorea crecimiento, completación y retención de tus cursos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Retención</h2>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">
              {data.retention_rate}%
            </p>
            <p className="mt-1 text-xs text-gray-500">
              % de estudiantes que terminan respecto a los que empiezan.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Lección con mayor tiempo promedio
            </h2>
          </CardHeader>
          <CardContent>
            {!data.top_watch_time_lesson ? (
              <p className="text-sm text-gray-500">
                Sin datos suficientes todavía.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {data.top_watch_time_lesson.lesson_title}
                </p>
                <p className="text-xs text-gray-600">
                  Curso: {data.top_watch_time_lesson.course_title}
                </p>
                <Badge variant="info">
                  {data.top_watch_time_lesson.average_watch_time_sec}s promedio
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Inscripciones por semana
            </h2>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#4f46e5"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Completaciones por mes
            </h2>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip />
                <Bar
                  dataKey="completions"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
