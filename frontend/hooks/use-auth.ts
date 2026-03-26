"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api/auth";
import { LoginFormValues, RegisterFormValues } from "@/lib/validators/auth";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const { setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const login = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      const tokens = await authApi.login(values);

      // Guardar token en cookie para el middleware
      document.cookie = `access_token=${tokens.access_token}; path=/; max-age=${30 * 60}`;

      // Obtener datos del usuario
      const user = await authApi.me(tokens.access_token);

      // Guardar en store (localStorage via persist)
      setAuth(user, tokens.access_token, tokens.refresh_token);

      toast.success(`¡Bienvenido, ${user.full_name}!`);
      router.push("/dashboard");
    } catch (error: any) {
      const msg = error?.response?.data?.detail ?? "Credenciales inválidas";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      const { confirm_password: _confirmPassword, ...payload } = values;
      const tokens = await authApi.register(payload);

      document.cookie = `access_token=${tokens.access_token}; path=/; max-age=${30 * 60}`;

      const user = await authApi.me(tokens.access_token);
      setAuth(user, tokens.access_token, tokens.refresh_token);

      toast.success("¡Cuenta creada exitosamente!");
      router.push("/dashboard");
    } catch (error: any) {
      const statusCode = error?.response?.status;
      const apiDetail = error?.response?.data?.detail;
      const msg =
        statusCode === 409
          ? (apiDetail ??
            "La organización ya existe. Usa otro nombre o inicia sesión.")
          : (apiDetail ?? "Error al crear la cuenta");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    document.cookie = "access_token=; path=/; max-age=0";
    router.push("/login");
    toast.success("Sesión cerrada");
  };

  return { login, register, logout, loading };
}
