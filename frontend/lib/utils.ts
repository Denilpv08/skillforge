import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilidad para combinar clases de Tailwind sin conflictos
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
