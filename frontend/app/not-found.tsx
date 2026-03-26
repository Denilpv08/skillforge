import Link from "next/link";
import { BookOpen, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex p-4 rounded-2xl bg-indigo-100 mb-6">
          <BookOpen className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-6xl font-black text-gray-200 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Página no encontrada
        </h2>
        <p className="text-gray-500 mb-8 text-sm">
          La página que buscas no existe o fue movida.
        </p>
        <Link href="/dashboard">
          <Button>
            <Home className="w-4 h-4" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
