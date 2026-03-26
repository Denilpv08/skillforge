"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Aquí irían logs a un servicio como Sentry en producción
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 rounded-2xl bg-red-100 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Algo salió mal
        </h1>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          Ocurrió un error inesperado. Si el problema persiste, contacta al
          soporte técnico.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left bg-gray-900 text-red-400 text-xs p-4 rounded-xl mb-6 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
        <Button onClick={reset}>
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
