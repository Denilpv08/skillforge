import axios from "axios";
import { apiClient } from "./client";
import {
  Course,
  CourseDetail,
  PaginatedCourses,
  Category,
  Enrollment,
  Lesson,
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

  // Categorías
  updateCategory: async (
    categoryId: string,
    payload: { name: string; description?: string },
  ): Promise<Category> => {
    const { data } = await apiClient.patch<Category>(
      `/courses/categories/${categoryId}`,
      payload,
    );
    return data;
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    await apiClient.delete(`/courses/categories/${categoryId}`);
  },

  // Estado de curso
  changeCourseStatus: async (
    courseId: string,
    status: string,
  ): Promise<Course> => {
    try {
      const { data } = await apiClient.patch<Course>(
        `/courses/${courseId}/status`,
        { status },
      );
      return data;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 404 || error.response?.status === 405)
      ) {
        const { data } = await apiClient.patch<Course>(`/courses/${courseId}`, {
          status,
        });
        return data;
      }
      throw error;
    }
  },

  // Lecciones
  getLesson: async (courseId: string, lessonId: string): Promise<Lesson> => {
    const { data } = await apiClient.get<Lesson>(
      `/courses/${courseId}/lessons/${lessonId}`,
    );
    return data;
  },

  createLesson: async (
    courseId: string,
    payload: {
      title: string;
      content?: string;
      video_url?: string;
      order_index?: number;
      duration_min?: number;
      is_free?: boolean;
    },
  ): Promise<Lesson> => {
    const { data } = await apiClient.post<Lesson>(
      `/courses/${courseId}/lessons`,
      payload,
    );
    return data;
  },

  updateLesson: async (
    courseId: string,
    lessonId: string,
    payload: Partial<{
      title: string;
      content: string;
      video_url: string;
      order_index: number;
      duration_min: number;
      is_free: boolean;
    }>,
  ): Promise<Lesson> => {
    const { data } = await apiClient.patch<Lesson>(
      `/courses/${courseId}/lessons/${lessonId}`,
      payload,
    );
    return data;
  },

  deleteLesson: async (courseId: string, lessonId: string): Promise<void> => {
    await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}`);
  },

  reorderLessons: async (
    courseId: string,
    lessonIds: string[],
  ): Promise<void> => {
    await apiClient.put(`/courses/${courseId}/lessons/reorder`, lessonIds);
  },

  // Materiales de Lecciones
  getMaterials: async (courseId: string, lessonId: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(
      `/courses/${courseId}/lessons/${lessonId}/materials`,
    );
    return data;
  },

  getMaterial: async (
    courseId: string,
    lessonId: string,
    materialId: string,
  ): Promise<any> => {
    const { data } = await apiClient.get<any>(
      `/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
    );
    return data;
  },

  createMaterial: async (
    courseId: string,
    lessonId: string,
    payload: any,
  ): Promise<any> => {
    const { data } = await apiClient.post<any>(
      `/courses/${courseId}/lessons/${lessonId}/materials`,
      payload,
    );
    return data;
  },

  updateMaterial: async (
    courseId: string,
    lessonId: string,
    materialId: string,
    payload: Partial<any>,
  ): Promise<any> => {
    const { data } = await apiClient.patch<any>(
      `/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
      payload,
    );
    return data;
  },

  deleteMaterial: async (
    courseId: string,
    lessonId: string,
    materialId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/courses/${courseId}/lessons/${lessonId}/materials/${materialId}`,
    );
  },

  reorderMaterials: async (
    courseId: string,
    lessonId: string,
    materials: any[],
  ): Promise<void> => {
    await apiClient.put(
      `/courses/${courseId}/lessons/${lessonId}/materials/reorder`,
      { materials },
    );
  },
};
