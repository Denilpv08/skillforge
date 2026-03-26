import { apiClient } from "./client";
import { User } from "@/types/auth";

interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
}

export const usersApi = {
  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await apiClient.patch<User>("/users/me", payload);
    return data;
  },
};
