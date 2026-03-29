import { apiClient } from "./client";
import { CourseGradebook, GradesSummary, MyGrades } from "@/types/grades";

export const gradesApi = {
  getMyGrades: async (): Promise<MyGrades> => {
    const { data } = await apiClient.get<MyGrades>("/grades/my-grades");
    return data;
  },

  getCourseGradebook: async (courseId: string): Promise<CourseGradebook> => {
    const { data } = await apiClient.get<CourseGradebook>(
      `/grades/course/${courseId}`,
    );
    return data;
  },

  getSummary: async (): Promise<GradesSummary> => {
    const { data } = await apiClient.get<GradesSummary>("/grades/summary");
    return data;
  },
};
