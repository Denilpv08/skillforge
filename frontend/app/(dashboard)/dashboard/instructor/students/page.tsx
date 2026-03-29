"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useInstructorCourses,
  useInstructorStudentProgress,
  useInstructorStudents,
} from "@/hooks/use-instructor";
import { formatDate } from "@/lib/utils";

export default function InstructorStudentsPage() {
  const [courseId, setCourseId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const perPage = 20;
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  const downloadCsv = () => {
    const headers = [
      "Nombre",
      "Curso",
      "Progreso %",
      "Ultimo acceso",
      "Estado",
    ];
    const rows = students.map((student) => [
      student.student_name,
      student.course_title,
      student.progress_pct,
      student.last_access_at
        ? formatDate(student.last_access_at)
        : "Sin actividad",
      student.status,
    ]);

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
    link.download = "instructor-students.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const { data: courses = [] } = useInstructorCourses();
  const { data: studentsPage, isLoading } = useInstructorStudents(
    courseId || undefined,
    page,
    perPage,
  );
  const students = studentsPage?.data ?? [];

  const detailQuery = useInstructorStudentProgress(
    selectedStudentId ?? undefined,
    courseId || undefined,
  );

  const selectedStudent = useMemo(
    () => students.find((student) => student.student_id === selectedStudentId),
    [selectedStudentId, students],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis estudiantes</h1>
        <p className="mt-1 text-gray-500">
          Revisa progreso por estudiante en tus cursos.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <label className="text-sm text-gray-600" htmlFor="course-filter">
            Filtrar por curso
          </label>
          <select
            id="course-filter"
            className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={courseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setPage(1);
              setSelectedStudentId(null);
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
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Tabla de estudiantes
            </h2>
            <button
              onClick={downloadCsv}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              Exportar CSV
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Cargando estudiantes...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-2 py-2">Nombre</th>
                    <th className="px-2 py-2">Curso</th>
                    <th className="px-2 py-2">Progreso %</th>
                    <th className="px-2 py-2">Último acceso</th>
                    <th className="px-2 py-2">Estado</th>
                    <th className="px-2 py-2">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={`${student.student_id}-${student.course_id}`}
                      className="border-b"
                    >
                      <td className="px-2 py-3 text-gray-900">
                        {student.student_name}
                      </td>
                      <td className="px-2 py-3 text-gray-700">
                        {student.course_title}
                      </td>
                      <td className="px-2 py-3">
                        <Progress
                          value={student.progress_pct}
                          showLabel
                          size="sm"
                        />
                      </td>
                      <td className="px-2 py-3 text-gray-600">
                        {student.last_access_at
                          ? formatDate(student.last_access_at)
                          : "Sin actividad"}
                      </td>
                      <td className="px-2 py-3">
                        <Badge
                          variant={
                            student.status === "COMPLETED"
                              ? "success"
                              : student.status === "ACTIVE"
                                ? "info"
                                : "warning"
                          }
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() =>
                            setSelectedStudentId(student.student_id)
                          }
                          className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                        >
                          Ver progreso
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-2 py-4 text-gray-500">
                        No hay estudiantes para este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Página {studentsPage?.page ?? 1} de{" "}
              {studentsPage?.total_pages ?? 1}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={(studentsPage?.page ?? 1) <= 1}
                className="rounded-md border border-gray-200 px-3 py-1 text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={
                  (studentsPage?.page ?? 1) >= (studentsPage?.total_pages ?? 1)
                }
                className="rounded-md border border-gray-200 px-3 py-1 text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Detalle de progreso de estudiante
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedStudentId && (
            <p className="text-sm text-gray-500">
              Selecciona un estudiante para ver su detalle.
            </p>
          )}
          {selectedStudentId && detailQuery.isLoading && (
            <p className="text-sm text-gray-500">Cargando detalle...</p>
          )}
          {selectedStudentId && detailQuery.data && (
            <>
              <p className="text-sm text-gray-700">
                Estudiante: {selectedStudent?.student_name}
              </p>
              {detailQuery.data.courses.map((course) => (
                <div
                  key={course.course_id}
                  className="rounded-md border border-gray-100 p-3"
                >
                  <p className="font-medium text-gray-900">
                    {course.course_title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Lecciones completadas: {course.completed_lessons}/
                    {course.total_lessons}
                  </p>
                  <Progress
                    value={course.progress_pct}
                    className="mt-2"
                    showLabel
                    size="sm"
                  />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
