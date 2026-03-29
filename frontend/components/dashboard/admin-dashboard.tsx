"use client";
import { ComponentType } from "react";
import {
  Users,
  BookOpenCheck,
  UserPlus,
  Target,
  AlertTriangle,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminAnalytics } from "@/hooks/use-analytics";
import { formatDate } from "@/lib/utils";

function KpiCard({
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

export default function AdminDashboard() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading || !data) {
    return <p className="text-sm text-gray-500">Cargando dashboard admin...</p>;
  }

  const chartData = data.enrollments_by_week.map((item) => ({
    week: new Date(item.week_start).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
    }),
    enrollments: item.enrollments,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total usuarios" value={data.total_users} icon={Users} />
        <KpiCard
          label="Cursos activos"
          value={data.active_courses}
          icon={BookOpenCheck}
        />
        <KpiCard
          label="Inscripciones del mes"
          value={data.enrollments_this_month}
          icon={UserPlus}
        />
        <KpiCard
          label="Tasa de completación"
          value={`${data.completion_rate}%`}
          icon={Target}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Inscripciones por semana
            </h2>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Alertas de publicación
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.stale_draft_alerts.length === 0 && (
              <p className="text-sm text-gray-500">No hay alertas activas.</p>
            )}
            {data.stale_draft_alerts.map((alert) => (
              <div
                key={alert.course_id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3"
              >
                <p className="text-sm font-medium text-gray-900">
                  {alert.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{alert.days_in_draft} días en borrador</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Top 5 cursos más inscritos
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.top_courses.map((course, index) => (
              <div
                key={course.course_id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-indigo-600">
                    #{index + 1}
                  </span>
                  <p className="text-sm text-gray-800">{course.title}</p>
                </div>
                <Badge variant="info">{course.enrollments} inscritos</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Usuarios activos recientes
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_active_users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default">{user.role}</Badge>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(user.last_activity_at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
