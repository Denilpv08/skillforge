"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  BookOpen,
  CheckCircle,
  GripVertical,
  Lock,
  Unlock,
  Plus,
  X,
  Map,
  Trophy,
} from "lucide-react";
import { useLearningPath, useSetPathCourses } from "@/hooks/use-learning-paths";
import { useMyEnrollments, useEnroll, useCourses } from "@/hooks/use-courses";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { RoleGuard } from "@/components/ui/role-guard";
import { LearningPathCourseItem, Course } from "@/types/course";
import { cn } from "@/lib/utils";

// ─── Editor de cursos de la ruta ─────────────────────────────

function CourseEditor({
  pathId,
  currentCourses,
  onClose,
}: {
  pathId: string;
  currentCourses: LearningPathCourseItem[];
  onClose: () => void;
}) {
  const { data: allCoursesData } = useCourses({ status: "PUBLISHED" });
  const setPathCourses = useSetPathCourses();

  const allCourses = allCoursesData?.data ?? [];

  // Estado local editable
  const [selected, setSelected] = useState<
    {
      course_id: string;
      order_index: number;
      is_required: boolean;
      title: string;
    }[]
  >(
    currentCourses.map((pc, i) => ({
      course_id: pc.course.id,
      order_index: i,
      is_required: pc.is_required,
      title: pc.course.title,
    })),
  );

  const isAdded = (courseId: string) =>
    selected.some((s) => s.course_id === courseId);

  const addCourse = (course: Course) => {
    if (isAdded(course.id)) return;
    setSelected((prev) => [
      ...prev,
      {
        course_id: course.id,
        order_index: prev.length,
        is_required: true,
        title: course.title,
      },
    ]);
  };

  const removeCourse = (courseId: string) => {
    setSelected((prev) =>
      prev
        .filter((s) => s.course_id !== courseId)
        .map((s, i) => ({ ...s, order_index: i })),
    );
  };

  const toggleRequired = (courseId: string) => {
    setSelected((prev) =>
      prev.map((s) =>
        s.course_id === courseId ? { ...s, is_required: !s.is_required } : s,
      ),
    );
  };

  // Drag & drop
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...selected];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setSelected(reordered.map((s, i) => ({ ...s, order_index: i })));
    setDragIdx(idx);
  };

  const handleSave = () => {
    setPathCourses.mutate(
      {
        pathId,
        courses: selected.map((s) => ({
          course_id: s.course_id,
          order_index: s.order_index,
          is_required: s.is_required,
        })),
      },
      { onSuccess: onClose },
    );
  };

  const availableCourses = allCourses.filter((c) => !isAdded(c.id));

  return (
    <div className="space-y-5">
      {/* Cursos seleccionados */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Cursos en la ruta ({selected.length})
        </p>
        {selected.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400">
              Agrega cursos desde el catálogo
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {selected.map((item, idx) => (
              <div
                key={item.course_id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={() => setDragIdx(null)}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all",
                  dragIdx === idx
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 bg-white",
                )}
              >
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
                <span className="text-xs font-bold text-gray-400 w-5">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm text-gray-800 truncate">
                  {item.title}
                </p>

                {/* Toggle requerido */}
                <button
                  onClick={() => toggleRequired(item.course_id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                    item.is_required
                      ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {item.is_required ? (
                    <>
                      <Lock className="w-3 h-3" /> Requerido
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" /> Opcional
                    </>
                  )}
                </button>

                <button
                  onClick={() => removeCourse(item.course_id)}
                  className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catálogo de cursos disponibles */}
      {availableCourses.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Agregar curso
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {availableCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => addCourse(course)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border
                  border-gray-200 hover:border-indigo-300 hover:bg-indigo-50
                  transition-all text-left group"
              >
                <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {course.title}
                </span>
                {course.category && (
                  <Badge variant="default" className="ml-auto shrink-0">
                    {course.category.name}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <Button
          className="flex-1"
          loading={setPathCourses.isPending}
          onClick={handleSave}
        >
          Guardar cambios
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Página de detalle ────────────────────────────────────────
export default function PathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const permissions = usePermissions();

  const { data: path, isLoading } = useLearningPath(id);
  const { data: enrollments = [] } = useMyEnrollments();
  const enroll = useEnroll();

  const [editorOpen, setEditorOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-3xl">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="text-center py-20 text-gray-500">Ruta no encontrada</div>
    );
  }

  const totalCourses = path.path_courses.length;
  const enrolledCourses = path.path_courses.filter((pc) =>
    enrollments.some((e) => e.course_id === pc.course.id),
  );
  const completedCourses = enrollments.filter(
    (e) =>
      e.completed_at &&
      path.path_courses.some((pc) => pc.course.id === e.course_id),
  );

  const overallProgress =
    totalCourses > 0
      ? Math.round((completedCourses.length / totalCourses) * 100)
      : 0;

  return (
    <div className="w-full space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500
          hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Rutas de aprendizaje
      </button>

      {/* Hero */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-indigo-100 shrink-0">
              <Map className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{path.title}</h1>
              {path.description && (
                <p className="text-gray-500 mt-1 text-sm leading-relaxed">
                  {path.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  {totalCourses} curso{totalCourses !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {completedCourses.length} completados
                </span>
                {overallProgress > 0 && (
                  <Badge variant={overallProgress === 100 ? "success" : "info"}>
                    {overallProgress === 100
                      ? "¡Ruta completada!"
                      : `${overallProgress}% completado`}
                  </Badge>
                )}
              </div>

              {/* Barra de progreso general */}
              {enrolledCourses.length > 0 && (
                <div className="mt-4 space-y-1">
                  <Progress value={overallProgress} showLabel />
                </div>
              )}
            </div>

            {/* Botón editar cursos */}
            <RoleGuard allowIf={permissions.canCreateCourse}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditorOpen(true)}
                className="shrink-0"
              >
                Editar cursos
              </Button>
            </RoleGuard>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cursos de la ruta */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Cursos de la ruta</h2>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 py-0">
          {path.path_courses.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Esta ruta no tiene cursos aún
              </p>
              <RoleGuard allowIf={permissions.canCreateCourse}>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setEditorOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Agregar cursos
                </Button>
              </RoleGuard>
            </div>
          ) : (
            path.path_courses
              .sort((a, b) => a.order_index - b.order_index)
              .map((pc, idx) => {
                const enrollment = enrollments.find(
                  (e) => e.course_id === pc.course.id,
                );
                const isEnrolled = !!enrollment;
                const isCompleted = !!enrollment?.completed_at;
                const progress = Number(enrollment?.progress_pct ?? 0);

                return (
                  <div
                    key={pc.course.id}
                    className="flex items-center gap-4 py-4 px-2"
                  >
                    {/* Número / check */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                        isCompleted
                          ? "bg-green-100 text-green-600"
                          : isEnrolled
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Info del curso */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {pc.course.title}
                        </p>
                        {!pc.is_required && (
                          <Badge variant="default">Opcional</Badge>
                        )}
                        {pc.course.status !== "PUBLISHED" && (
                          <Badge variant="warning">No publicado</Badge>
                        )}
                      </div>

                      {pc.course.category && (
                        <p className="text-xs text-indigo-500 mt-0.5">
                          {pc.course.category.name}
                        </p>
                      )}

                      {/* Progress del curso */}
                      {isEnrolled && !isCompleted && (
                        <div className="mt-1.5">
                          <Progress value={progress} size="sm" showLabel />
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isCompleted ? (
                        <Badge variant="success">
                          <Trophy className="w-3 h-3 mr-1" />
                          Completado
                        </Badge>
                      ) : isEnrolled ? (
                        <Link href={`/dashboard/courses/${pc.course.id}`}>
                          <Button size="sm" variant="secondary">
                            Continuar
                          </Button>
                        </Link>
                      ) : pc.course.status === "PUBLISHED" ? (
                        <Button
                          size="sm"
                          loading={enroll.isPending}
                          onClick={() => enroll.mutate(pc.course.id)}
                        >
                          Inscribirme
                        </Button>
                      ) : (
                        <Badge variant="warning">No disponible</Badge>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      {/* Modal editor de cursos */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title="Gestionar cursos de la ruta"
        className="max-w-2xl"
      >
        <CourseEditor
          pathId={path.id}
          currentCourses={path.path_courses}
          onClose={() => setEditorOpen(false)}
        />
      </Modal>
    </div>
  );
}
