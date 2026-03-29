import { useQuery } from "@tanstack/react-query";
import { gradesApi } from "@/lib/api/grades";

export const gradesKeys = {
  myGrades: ["grades", "my-grades"] as const,
  summary: ["grades", "summary"] as const,
  course: (courseId?: string) => ["grades", "course", courseId] as const,
};

export function useMyGrades() {
  return useQuery({
    queryKey: gradesKeys.myGrades,
    queryFn: gradesApi.getMyGrades,
  });
}

export function useGradesSummary() {
  return useQuery({
    queryKey: gradesKeys.summary,
    queryFn: gradesApi.getSummary,
  });
}

export function useCourseGradebook(courseId?: string) {
  return useQuery({
    queryKey: gradesKeys.course(courseId),
    queryFn: () => gradesApi.getCourseGradebook(courseId!),
    enabled: !!courseId,
  });
}
