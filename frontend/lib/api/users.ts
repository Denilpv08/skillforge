import { apiClient } from "./client";
import { User, UserListItem } from "@/types/auth";

interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
}

interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

interface UpdateUserPayload {
  full_name?: string;
  role?: string;
  is_active?: boolean;
}

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/users/me");
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await apiClient.patch<User>("/users/me", payload);
    return data;
  },

  listUsers: async (): Promise<UserListItem[]> => {
    const { data } = await apiClient.get<UserListItem[]>("/users");
    return data;
  },

  createUser: async (payload: CreateUserPayload): Promise<UserListItem> => {
    const { data } = await apiClient.post<UserListItem>("/users", payload);
    return data;
  },

  updateUser: async (
    userId: string,
    payload: UpdateUserPayload,
  ): Promise<UserListItem> => {
    const { data } = await apiClient.patch<UserListItem>(
      `/users/${userId}`,
      payload,
    );
    return data;
  },
};
