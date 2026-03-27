import { useAuthStore } from "@/store/auth-store";
import { UserRole } from "@/types/auth";

export function usePermissions() {
  const { user } = useAuthStore();
  const role = user?.role;

  return {
    // Verificación base
    isAdmin: role === "ADMIN" || role === "SUPER_ADMIN",
    isSuperAdmin: role === "SUPER_ADMIN",
    isInstructor: role === "INSTRUCTOR",
    isStudent: role === "STUDENT",

    // Permisos de negocio
    canManageUsers: role === "ADMIN" || role === "SUPER_ADMIN",
    canCreateCourse: role !== "STUDENT",
    canManageCourse: (instructorId: string) =>
      role === "ADMIN" || role === "SUPER_ADMIN" || user?.id === instructorId,
    canManageQuiz: role !== "STUDENT",
    canViewDraftCourses: role !== "STUDENT",

    // Helper genérico
    hasRole: (...roles: UserRole[]) => roles.includes(role as UserRole),
  };
}
