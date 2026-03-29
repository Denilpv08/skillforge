"use client";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInstructorCourses } from "@/hooks/use-instructor";
import { useCourseGradebook } from "@/hooks/use-grades";

function toCsvCell(value: string | number | null) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function InstructorGradebookPage() {
  const [courseId, setCourseId] = useState<string>("");

  const { data: courses = [] } = useInstructorCourses();
  const { data: gradebook, isLoading } = useCourseGradebook(
    courseId || undefined,
  );

  const exportRows = useMemo(() => {
    if (!gradebook) return [] as Array<Record<string, string | number | null>>;

    return gradebook.students.map((student) => {
      const row: Record<string, string | number | null> = {
        Estudiante: student.student_name,
      };

      for (const quiz of gradebook.quizzes) {
        row[quiz.quiz_title] = student.scores_by_quiz[quiz.quiz_id] ?? "-";
      }

      row["Promedio"] = student.average_score;
      row["Estado final"] = student.final_status;
      return row;
    });
  }, [gradebook]);

  const handleExportCsv = () => {
    if (!gradebook) return;

    const headers = [
      "Estudiante",
      ...gradebook.quizzes.map((quiz) => quiz.quiz_title),
      "Promedio",
      "Estado final",
    ];

    const body = gradebook.students.map((student) => [
      student.student_name,
      ...gradebook.quizzes.map(
        (quiz) => student.scores_by_quiz[quiz.quiz_id] ?? "-",
      ),
      student.average_score,
      student.final_status,
    ]);

    const csv = [
      headers.map((header) => toCsvCell(header)).join(","),
      ...body.map((row) => row.map((cell) => toCsvCell(cell)).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gradebook-${gradebook.course_title}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!gradebook || exportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gradebook");
    XLSX.writeFile(workbook, `gradebook-${gradebook.course_title}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
        <p className="mt-1 text-gray-500">
          Vista tipo spreadsheet con calificaciones por quiz y promedios.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <label
            className="text-sm text-gray-600"
            htmlFor="gradebook-course-filter"
          >
            Selecciona curso
          </label>
          <select
            id="gradebook-course-filter"
            className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="">Selecciona un curso</option>
            {courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {course.title}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Matriz de calificaciones
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportCsv}>
                Exportar CSV
              </Button>
              <Button size="sm" onClick={handleExportExcel}>
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!courseId && (
            <p className="text-sm text-gray-500">
              Selecciona un curso para ver el gradebook.
            </p>
          )}
          {courseId && isLoading && (
            <p className="text-sm text-gray-500">Cargando gradebook...</p>
          )}

          {courseId && !isLoading && gradebook && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-220 text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-2 py-2 sticky left-0 bg-white">
                      Estudiante
                    </th>
                    {gradebook.quizzes.map((quiz) => (
                      <th
                        key={quiz.quiz_id}
                        className="px-2 py-2 text-center whitespace-nowrap"
                      >
                        {quiz.quiz_title}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center">Promedio</th>
                    <th className="px-2 py-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {gradebook.students.map((student) => (
                    <tr key={student.student_id} className="border-b">
                      <td className="px-2 py-3 sticky left-0 bg-white font-medium text-gray-900">
                        {student.student_name}
                      </td>
                      {gradebook.quizzes.map((quiz) => {
                        const score = student.scores_by_quiz[quiz.quiz_id];
                        const passed = student.passed_by_quiz[quiz.quiz_id];

                        return (
                          <td
                            key={quiz.quiz_id}
                            className="px-2 py-3 text-center"
                          >
                            <span
                              className={`inline-flex min-w-12 justify-center rounded px-2 py-1 text-xs font-medium ${
                                score === null
                                  ? "bg-gray-100 text-gray-500"
                                  : passed
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {score === null ? "-" : `${score}%`}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-2 py-3 text-center font-semibold text-gray-900">
                        {student.average_score}%
                      </td>
                      <td className="px-2 py-3 text-center">
                        <Badge
                          variant={
                            student.final_status === "APROBADO"
                              ? "success"
                              : student.final_status === "REPROBADO"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {student.final_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-gray-50 font-semibold text-gray-700">
                    <td className="px-2 py-3 sticky left-0 bg-gray-50">
                      Promedio por quiz
                    </td>
                    {gradebook.quizzes.map((quiz) => {
                      const stats = gradebook.quiz_averages.find(
                        (item) => item.quiz_id === quiz.quiz_id,
                      );

                      return (
                        <td
                          key={quiz.quiz_id}
                          className="px-2 py-3 text-center"
                        >
                          {stats?.average_score ?? 0}%
                        </td>
                      );
                    })}
                    <td className="px-2 py-3 text-center">
                      {gradebook.students.length > 0
                        ? (
                            gradebook.students.reduce(
                              (total, student) => total + student.average_score,
                              0,
                            ) / gradebook.students.length
                          ).toFixed(2)
                        : "0.00"}
                      %
                    </td>
                    <td className="px-2 py-3 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
