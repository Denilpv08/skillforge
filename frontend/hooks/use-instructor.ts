import { useQuery } from "@tanstack/react-query";
import { CourseStatus } from "@/types/course";
import { instructorApi } from "@/lib/api/instructor";

export const instructorKeys = {
  courses: (status?: CourseStatus) =>
    ["instructor", "courses", status] as const,
  students: (courseId?: string, page = 1, perPage = 20) =>
    ["instructor", "students", courseId, page, perPage] as const,
  studentProgress: (studentId?: string, courseId?: string) =>
    ["instructor", "student-progress", studentId, courseId] as const,
  quizzes: (courseId?: string, page = 1, perPage = 12) =>
    ["instructor", "quizzes", courseId, page, perPage] as const,
  analytics: ["instructor", "analytics"] as const,
};

export function useInstructorCourses(status?: CourseStatus) {
  return useQuery({
    queryKey: instructorKeys.courses(status),
    queryFn: () => instructorApi.getCourses(status),
  });
}

export function useInstructorStudents(
  courseId?: string,
  page = 1,
  perPage = 20,
) {
  return useQuery({
    queryKey: instructorKeys.students(courseId, page, perPage),
    queryFn: () => instructorApi.getStudents(courseId, page, perPage),
  });
}

export function useInstructorStudentProgress(
  studentId?: string,
  courseId?: string,
) {
  return useQuery({
    queryKey: instructorKeys.studentProgress(studentId, courseId),
    queryFn: () => instructorApi.getStudentProgress(studentId!, courseId),
    enabled: !!studentId,
  });
}

export function useInstructorQuizzes(
  courseId?: string,
  page = 1,
  perPage = 12,
) {
  return useQuery({
    queryKey: instructorKeys.quizzes(courseId, page, perPage),
    queryFn: () => instructorApi.getQuizzes(courseId, page, perPage),
  });
}

export function useInstructorAnalytics() {
  return useQuery({
    queryKey: instructorKeys.analytics,
    queryFn: instructorApi.getAnalytics,
  });
}
