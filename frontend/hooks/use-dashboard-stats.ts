import { useMemo } from "react";
import { useMyEnrollments } from "./use-courses";

export interface DashboardStats {
  totalCourses: number;
  inProgress: number;
  completed: number;
  totalHours: number;
}

export function useDashboardStats(): {
  stats: DashboardStats;
  isLoading: boolean;
} {
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  const stats = useMemo<DashboardStats>(() => {
    const completed = enrollments.filter((e) => !!e.completed_at);
    const inProgress = enrollments.filter((e) => !e.completed_at);

    const totalHours = enrollments.reduce((acc, e) => {
      return acc + (e.course.duration_hours ?? 0);
    }, 0);

    return {
      totalCourses: enrollments.length,
      inProgress: inProgress.length,
      completed: completed.length,
      totalHours: Math.round(totalHours),
    };
  }, [enrollments]);

  return { stats, isLoading };
}
