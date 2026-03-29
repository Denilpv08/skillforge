"use client";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useInstructorCourses,
  useInstructorQuizzes,
} from "@/hooks/use-instructor";

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

export default function InstructorQuizzesPage() {
  const [courseId, setCourseId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const perPage = 12;
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const { data: courses = [] } = useInstructorCourses();
  const { data: quizzesPage, isLoading } = useInstructorQuizzes(
    courseId || undefined,
    page,
    perPage,
  );
  const quizzes = quizzesPage?.data ?? [];

  const selectedQuiz = useMemo(
    () =>
      quizzes.find((quiz) => quiz.quiz_id === selectedQuizId) ??
      quizzes[0] ??
      null,
    [quizzes, selectedQuizId],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis quizzes</h1>
        <p className="mt-1 text-gray-500">
          Revisa tasas de aprobación y distribuciones de puntajes.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <label className="text-sm text-gray-600" htmlFor="quiz-course-filter">
            Filtrar por curso
          </label>
          <select
            id="quiz-course-filter"
            className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={courseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setPage(1);
              setSelectedQuizId(null);
            }}
          >
            <option value="">Todos mis cursos</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.title}
              </option>
            ))}
          </select>
        </CardContent>

        <div className="px-6 pb-4 pt-1 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Página {quizzesPage?.page ?? 1} de {quizzesPage?.total_pages ?? 1}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={(quizzesPage?.page ?? 1) <= 1}
              className="rounded-md border border-gray-200 px-3 py-1 text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={
                (quizzesPage?.page ?? 1) >= (quizzesPage?.total_pages ?? 1)
              }
              className="rounded-md border border-gray-200 px-3 py-1 text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Listado de quizzes
            </h2>
            <button
              onClick={() =>
                downloadCsv(
                  "instructor-quizzes.csv",
                  ["Quiz", "Curso", "Intentos", "Aprobacion %", "Promedio %"],
                  quizzes.map((quiz) => [
                    quiz.quiz_title,
                    quiz.course_title,
                    quiz.total_attempts,
                    quiz.pass_rate,
                    quiz.average_score,
                  ]),
                )
              }
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              Exportar CSV
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Cargando quizzes...</p>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <button
                  key={quiz.quiz_id}
                  onClick={() => setSelectedQuizId(quiz.quiz_id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedQuiz?.quiz_id === quiz.quiz_id
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {quiz.quiz_title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {quiz.course_title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        Intentos: {quiz.total_attempts}
                      </Badge>
                      <Badge variant="info">
                        Aprobación: {quiz.pass_rate}%
                      </Badge>
                      <Badge variant="warning">
                        Promedio: {quiz.average_score}%
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
              {quizzes.length === 0 && (
                <p className="text-sm text-gray-500">
                  No hay quizzes disponibles.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Distribución de puntajes (histograma)
          </h2>
        </CardHeader>
        <CardContent className="h-80">
          {!selectedQuiz ? (
            <p className="text-sm text-gray-500">
              Selecciona un quiz para ver la gráfica.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedQuiz.score_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
