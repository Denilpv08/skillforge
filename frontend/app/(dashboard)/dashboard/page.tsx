"use client";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import InstructorDashboard from "@/components/dashboard/instructor-dashboard";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const firstName = user?.full_name?.split(" ")[0] ?? "";

  const renderDashboardByRole = () => {
    if (!user) {
      return <p className="text-sm text-gray-500">Cargando usuario...</p>;
    }

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      return <AdminDashboard />;
    }

    if (user.role === "INSTRUCTOR") {
      return <InstructorDashboard />;
    }

    return <StudentDashboard />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hola, {firstName}</h1>
        <p className="mt-1 text-gray-500">
          Este es tu panel principal según tu rol en SkillForge.
        </p>
      </div>

      {renderDashboardByRole()}
    </div>
  );
}
