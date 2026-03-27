"use client";
import { usePermissions } from "@/hooks/use-permissions";

interface RoleGuardProps {
  children: React.ReactNode;
  // Muestra el contenido solo si alguna condición es true
  allowIf: boolean;
  // Qué mostrar si no tiene permiso (opcional)
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  allowIf,
  fallback = null,
}: RoleGuardProps) {
  if (!allowIf) return <>{fallback}</>;
  return <>{children}</>;
}
