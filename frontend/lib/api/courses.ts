import { apiClient } from "./client";
import {
  Course,
  CourseDetail,
  PaginatedCourses,
  Category,
  Enrollment,
} from "@/types/course";

interface CourseFilters {
  page?: number;
  per_page?: number;
  status?: string;
  category_id?: string;
}

interface CreateCoursePayload {
  title: string;
  description?: string;
  thumbnail_url?: string;
  category_id?: string;
  duration_hours?: number;
}

export const coursesApi = {
  // Categorías
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<Category[]>("/courses/categories");
    return data;
  },

  createCategory: async (payload: { name: string; description?: string }) => {
    const { data } = await apiClient.post<Category>(
      "/courses/categories",
      payload,
    );
    return data;
  },

  // Cursos
  getCourses: async (
    filters: CourseFilters = {},
  ): Promise<PaginatedCourses> => {
    const { data } = await apiClient.get<PaginatedCourses>("/courses", {
      params: filters,
    });
    return data;
  },

  getCourse: async (courseId: string): Promise<CourseDetail> => {
    const { data } = await apiClient.get<CourseDetail>(`/courses/${courseId}`);
    return data;
  },

  createCourse: async (payload: CreateCoursePayload): Promise<Course> => {
    const { data } = await apiClient.post<Course>("/courses", payload);
    return data;
  },

  updateCourse: async (
    courseId: string,
    payload: Partial<CreateCoursePayload & { status: string }>,
  ): Promise<Course> => {
    const { data } = await apiClient.patch<Course>(
      `/courses/${courseId}`,
      payload,
    );
    return data;
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}`);
  },

  // Enrollments
  getMyEnrollments: async (): Promise<Enrollment[]> => {
    const { data } = await apiClient.get<Enrollment[]>("/enrollments");
    return data;
  },

  enroll: async (courseId: string): Promise<Enrollment> => {
    const { data } = await apiClient.post<Enrollment>(
      `/enrollments/${courseId}`,
    );
    return data;
  },

  completeLesson: async (courseId: string, lessonId: string) => {
    const { data } = await apiClient.post(
      `/enrollments/${courseId}/lessons/${lessonId}/complete`,
    );
    return data;
  },
};
