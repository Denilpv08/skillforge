import { apiClient } from "./client";
import {
  AdminAnalytics,
  InstructorAnalytics,
  StudentAnalytics,
} from "@/types/analytics";

export const analyticsApi = {
  getAdmin: async (): Promise<AdminAnalytics> => {
    const { data } = await apiClient.get<AdminAnalytics>("/analytics/admin");
    return data;
  },

  getInstructor: async (): Promise<InstructorAnalytics> => {
    const { data } = await apiClient.get<InstructorAnalytics>(
      "/analytics/instructor",
    );
    return data;
  },

  getStudent: async (): Promise<StudentAnalytics> => {
    const { data } =
      await apiClient.get<StudentAnalytics>("/analytics/student");
    return data;
  },
};
