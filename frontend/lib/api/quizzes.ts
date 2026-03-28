import { apiClient } from "./client";

export interface AnswerOptionOut {
  id: string;
  text: string;
  order_index: number;
}

export interface QuestionOut {
  id: string;
  text: string;
  order_index: number;
  answer_options: AnswerOptionOut[];
}

export interface QuizOut {
  id: string;
  title: string;
  pass_score: number;
  max_attempts: number;
  questions: QuestionOut[];
}

export interface QuizAttemptOut {
  id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

export interface QuizResults {
  quiz_id: string;
  quiz_title: string;
  pass_score: number;
  total_attempts: number;
  passed: number;
  failed: number;
  average_score: number;
  attempts: {
    id: string;
    user_id: string;
    score: number;
    passed: boolean;
    attempted_at: string;
  }[];
}

export interface CreateQuizPayload {
  title: string;
  pass_score: number;
  max_attempts: number;
  questions: {
    text: string;
    order_index: number;
    answer_options: {
      text: string;
      is_correct: boolean;
      order_index: number;
    }[];
  }[];
}

export const quizzesApi = {
  listByCourse: async (courseId: string): Promise<QuizOut[]> => {
    const { data } = await apiClient.get<QuizOut[]>(
      `/quizzes/courses/${courseId}`,
    );
    return data;
  },

  getQuiz: async (quizId: string): Promise<QuizOut> => {
    const { data } = await apiClient.get<QuizOut>(`/quizzes/${quizId}`);
    return data;
  },

  createQuiz: async (
    courseId: string,
    payload: CreateQuizPayload,
  ): Promise<QuizOut> => {
    const { data } = await apiClient.post<QuizOut>(
      `/quizzes/courses/${courseId}`,
      payload,
    );
    return data;
  },

  deleteQuiz: async (quizId: string): Promise<void> => {
    await apiClient.delete(`/quizzes/${quizId}`);
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

  getMyAttempts: async (quizId: string): Promise<QuizAttemptOut[]> => {
    const { data } = await apiClient.get<QuizAttemptOut[]>(
      `/quizzes/${quizId}/attempts`,
    );
    return data;
  },

  getResults: async (quizId: string): Promise<QuizResults> => {
    const { data } = await apiClient.get<QuizResults>(
      `/quizzes/${quizId}/results`,
    );
    return data;
  },
};
