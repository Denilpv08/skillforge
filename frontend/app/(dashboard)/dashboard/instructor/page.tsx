"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";

const sections = [
  {
    href: "/dashboard/instructor/courses",
    title: "Mis cursos",
    description: "Gestiona tus cursos y revisa métricas por curso.",
  },
  {
    href: "/dashboard/instructor/students",
    title: "Mis estudiantes",
    description: "Visualiza progreso por estudiante y por curso.",
  },
  {
    href: "/dashboard/instructor/quizzes",
    title: "Mis quizzes",
    description: "Monitorea tasas de aprobación y distribución de puntajes.",
  },
  {
    href: "/dashboard/instructor/analytics",
    title: "Analíticas",
    description:
      "Métricas agregadas de inscripciones, completación y retención.",
  },
];

export default function InstructorHomePage() {
  const permissions = usePermissions();

  if (!permissions.isInstructor) {
    return (
      <p className="text-sm text-gray-500">
        Esta sección está disponible solo para instructores.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Centro de Instructor
        </h1>
        <p className="mt-1 text-gray-500">
          Accede rápidamente a cursos, estudiantes, quizzes y analíticas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition hover:border-indigo-200 hover:shadow-md">
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
