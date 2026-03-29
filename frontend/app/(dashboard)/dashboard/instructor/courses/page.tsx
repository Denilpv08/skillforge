"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstructorCourses } from "@/hooks/use-instructor";
import { CourseStatus } from "@/types/course";

function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const filters: Array<{ label: string; value?: CourseStatus }> = [
  { label: "Todos" },
  { label: "Publicados", value: "PUBLISHED" },
  { label: "Borradores", value: "DRAFT" },
  { label: "Archivados", value: "ARCHIVED" },
];

export default function InstructorCoursesPage() {
  const [status, setStatus] = useState<CourseStatus | undefined>(undefined);
  const { data = [], isLoading } = useInstructorCourses(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis cursos</h1>
        <p className="mt-1 text-gray-500">
          Solo se muestran cursos de tu autoría con métricas clave.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              status === filter.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div>
        <button
          onClick={() =>
            downloadCsv(
              "instructor-courses.csv",
              [
                "Curso",
                "Estado",
                "Inscritos",
                "Completados",
                "Promedio Quizzes %",
              ],
              data.map((course) => [
                course.title,
                course.status,
                course.enrolled_students,
                course.completed_students,
                course.quiz_average_score,
              ]),
            )
          }
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          Exportar cursos a CSV
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando cursos...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.map((course) => (
            <Card key={course.course_id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {course.title}
                  </h2>
                  <Badge variant="default">{course.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-3">
                  <p>Inscritos: {course.enrolled_students}</p>
                  <p>Completados: {course.completed_students}</p>
                  <p>Promedio quizzes: {course.quiz_average_score}%</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/courses/${course.course_id}/lessons`}
                    className="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                  >
                    Gestionar lecciones
                  </Link>
                  <Link
                    href={`/dashboard/quiz?courseId=${course.course_id}`}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                  >
                    Gestionar quizzes
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-gray-500">
              No hay cursos para este filtro.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
