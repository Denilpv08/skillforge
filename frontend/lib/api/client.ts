import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Request interceptor — adjunta token desde localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Leemos directamente de localStorage para evitar
    // dependencias circulares con el store de Zustand
    const raw = localStorage.getItem("skillforge-auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — manejo global de 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("skillforge-auth");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
