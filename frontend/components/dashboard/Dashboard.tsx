"use client";
import { BookOpen, GraduationCap, Trophy, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

const stats = [
  {
    label: "Cursos activos",
    value: "0",
    icon: BookOpen,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    label: "En progreso",
    value: "0",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "Completados",
    value: "0",
    icon: Trophy,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    label: "Horas aprendidas",
    value: "0",
    icon: GraduationCap,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const Dashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Resumen de actividad de{" "}
          <span className="font-medium">{user?.full_name}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder para actividad reciente */}
      <Card>
        <CardContent className="py-12 text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Aún no hay actividad registradaa
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Inscríbete en un curso para empezar
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
