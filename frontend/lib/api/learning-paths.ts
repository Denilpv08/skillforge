import { apiClient } from "./client";
import { LearningPath } from "@/types/course";

export interface CreatePathPayload {
  title: string;
  description?: string;
  courses: { course_id: string; order_index: number; is_required: boolean }[];
}

export interface UpdatePathPayload {
  title?: string;
  description?: string;
}

export const learningPathsApi = {
  getAll: async (): Promise<LearningPath[]> => {
    const { data } = await apiClient.get<LearningPath[]>("/learning-paths");
    return data;
  },

  getById: async (pathId: string): Promise<LearningPath> => {
    const { data } = await apiClient.get<LearningPath>(
      `/learning-paths/${pathId}`,
    );
    return data;
  },

  create: async (payload: CreatePathPayload): Promise<LearningPath> => {
    const { data } = await apiClient.post<LearningPath>(
      "/learning-paths",
      payload,
    );
    return data;
  },

  update: async (
    pathId: string,
    payload: UpdatePathPayload,
  ): Promise<LearningPath> => {
    const { data } = await apiClient.patch<LearningPath>(
      `/learning-paths/${pathId}`,
      payload,
    );
    return data;
  },

  setCourses: async (
    pathId: string,
    courses: { course_id: string; order_index: number; is_required: boolean }[],
  ): Promise<LearningPath> => {
    const { data } = await apiClient.put<LearningPath>(
      `/learning-paths/${pathId}/courses`,
      { courses },
    );
    return data;
  },

  delete: async (pathId: string): Promise<void> => {
    await apiClient.delete(`/learning-paths/${pathId}`);
  },
};
