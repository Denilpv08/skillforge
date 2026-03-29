import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";

export const analyticsKeys = {
  admin: ["analytics", "admin"] as const,
  instructor: ["analytics", "instructor"] as const,
  student: ["analytics", "student"] as const,
};

export function useAdminAnalytics(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.admin,
    queryFn: analyticsApi.getAdmin,
    enabled,
  });
}

export function useInstructorAnalytics(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.instructor,
    queryFn: analyticsApi.getInstructor,
    enabled,
  });
}

export function useStudentAnalytics(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.student,
    queryFn: analyticsApi.getStudent,
    enabled,
  });
}
