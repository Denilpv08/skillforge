import { apiClient } from "./client";
import {
  TokenResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "@/types/auth";

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  me: async (accessToken?: string): Promise<User> => {
    const { data } = await apiClient.get<User>("/auth/me", {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });
    return data;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },
};
