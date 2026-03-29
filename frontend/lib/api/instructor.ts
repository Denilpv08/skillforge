import { apiClient } from "./client";
import {
  InstructorAnalytics,
  InstructorCourseMetrics,
  InstructorQuizStats,
  InstructorStudentProgressDetail,
  InstructorStudentRow,
} from "@/types/instructor";
import { CourseStatus } from "@/types/course";
import { PaginatedResponse } from "@/types/api";

export const instructorApi = {
  getCourses: async (
    status?: CourseStatus,
  ): Promise<InstructorCourseMetrics[]> => {
    const { data } = await apiClient.get<InstructorCourseMetrics[]>(
      "/instructor/courses",
      {
        params: status ? { status } : undefined,
      },
    );
    return data;
  },

  getStudents: async (
    courseId?: string,
    page = 1,
    perPage = 20,
  ): Promise<PaginatedResponse<InstructorStudentRow>> => {
    const { data } = await apiClient.get<
      PaginatedResponse<InstructorStudentRow>
    >("/instructor/students", {
      params: {
        page,
        per_page: perPage,
        ...(courseId ? { course_id: courseId } : {}),
      },
    });
    return data;
  },

  getStudentProgress: async (
    studentId: string,
    courseId?: string,
  ): Promise<InstructorStudentProgressDetail> => {
    const { data } = await apiClient.get<InstructorStudentProgressDetail>(
      `/instructor/students/${studentId}/progress`,
      {
        params: courseId ? { course_id: courseId } : undefined,
      },
    );
    return data;
  },

  getQuizzes: async (
    courseId?: string,
    page = 1,
    perPage = 12,
  ): Promise<PaginatedResponse<InstructorQuizStats>> => {
    const { data } = await apiClient.get<
      PaginatedResponse<InstructorQuizStats>
    >("/instructor/quizzes", {
      params: {
        page,
        per_page: perPage,
        ...(courseId ? { course_id: courseId } : {}),
      },
    });
    return data;
  },

  getAnalytics: async (): Promise<InstructorAnalytics> => {
    const { data } = await apiClient.get<InstructorAnalytics>(
      "/instructor/analytics",
    );
    return data;
  },
};
