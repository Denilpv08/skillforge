import { apiClient } from "./client";

export interface QuizOut {
  id: string;
  title: string;
  pass_score: number;
  max_attempts: number;
  questions: {
    id: string;
    text: string;
    order_index: number;
    answer_options: {
      id: string;
      text: string;
      order_index: number;
    }[];
  }[];
}

export interface QuizAttemptOut {
  id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

export const quizzesApi = {
  getQuiz: async (quizId: string): Promise<QuizOut> => {
    const { data } = await apiClient.get<QuizOut>(`/quizzes/${quizId}`);
    return data;
  },

  submitQuiz: async (
    quizId: string,
    answers: Record<string, string>,
  ): Promise<QuizAttemptOut> => {
    const { data } = await apiClient.post<QuizAttemptOut>(
      `/quizzes/${quizId}/submit`,
      { answers },
    );
    return data;
  },
};
