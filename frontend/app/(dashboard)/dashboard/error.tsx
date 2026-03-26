"use client";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="inline-flex p-4 rounded-2xl bg-red-50 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Error al cargar</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "No pudimos cargar esta sección. Intenta de nuevo."}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
          <Home className="w-4 h-4" />
          Dashboard
        </Button>
        <Button onClick={reset}>
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}
