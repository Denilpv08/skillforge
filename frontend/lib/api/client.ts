import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Tipo para errores del backend (FastAPI)
export interface ApiErrorDetail {
  detail: string | { msg: string; type: string }[];
}

// Helper para extraer mensaje de error legible
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorDetail | undefined;
    if (!data?.detail) return "Error de conexión";

    // FastAPI puede devolver detail como string o como array de validaciones
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((e) => e.msg).join(", ");
    }
  }
  if (error instanceof Error) return error.message;
  return "Error desconocido";
}

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const raw = localStorage.getItem("skillforge-auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // JSON inválido — ignorar
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Intentar refresh antes de redirigir
      const raw = localStorage.getItem("skillforge-auth");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const refreshToken = parsed?.state?.refreshToken;
          if (refreshToken) {
            const { data } = await axios.post(
              `${BASE_URL}/api/v1/auth/refresh`,
              { refresh_token: refreshToken },
            );
            // Actualizar token en storage
            parsed.state.accessToken = data.access_token;
            localStorage.setItem("skillforge-auth", JSON.stringify(parsed));
            document.cookie = `access_token=${data.access_token}; path=/; max-age=${30 * 60}`;

            // Reintentar la request original
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${data.access_token}`;
              return apiClient(error.config);
            }
          }
        } catch {
          // Refresh falló — cerrar sesión
        }
      }
      localStorage.removeItem("skillforge-auth");
      document.cookie = "access_token=; path=/; max-age=0";
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
