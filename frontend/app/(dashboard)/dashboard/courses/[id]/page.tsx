"use client";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  ChevronLeft,
  Play,
  Lock,
  CheckCircle,
} from "lucide-react";
import {
  useCourse,
  useEnroll,
  useMyEnrollments,
  useCompleteLesson,
} from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: course, isLoading } = useCourse(id);
  const { data: enrollments = [] } = useMyEnrollments();
  const enroll = useEnroll();
  const completeLesson = useCompleteLesson();

  const enrollment = enrollments.find((e) => e.course_id === id);
  const isEnrolled = !!enrollment;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-40 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-gray-500">Curso no encontrado</div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a cursos
      </button>

      {/* Hero */}
      <Card>
        <div className="h-52 bg-linear-to-br from-indigo-500 to-purple-600 rounded-t-xl flex items-center justify-center">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover rounded-t-xl"
            />
          ) : (
            <BookOpen className="w-16 h-16 text-white/60" />
          )}
        </div>

        <CardContent className="py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {course.category && (
                <p className="text-sm font-medium text-indigo-600 mb-1">
                  {course.category.name}
                </p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  {course.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {course.lessons.length} lecciones
                </span>
                {course.duration_hours && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {course.duration_hours}h estimadas
                  </span>
                )}
                <Badge
                  variant={
                    course.status === "PUBLISHED" ? "success" : "warning"
                  }
                >
                  {course.status}
                </Badge>
              </div>
            </div>

            {/* Acción principal */}
            <div className="shrink-0">
              {isEnrolled ? (
                <div className="text-center space-y-2 min-w-35">
                  <Progress value={Number(enrollment.progress_pct)} showLabel />
                  <p className="text-xs text-gray-500">Tu progreso</p>
                </div>
              ) : (
                <Button
                  onClick={() => enroll.mutate(id)}
                  loading={enroll.isPending}
                  disabled={course.status !== "PUBLISHED"}
                >
                  Inscribirme
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lecciones */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Contenido del curso</h2>
        </CardHeader>
        <CardContent className="py-2 divide-y divide-gray-100">
          {course.lessons.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Este curso aún no tiene lecciones
            </p>
          ) : (
            course.lessons.map((lesson, idx) => {
              const canAccess = isEnrolled || lesson.is_free;
              const isCompleted = false; // TODO: conectar con progreso real

              return (
                <div key={lesson.id} className="flex items-center gap-4 py-3.5">
                  <span className="text-sm font-medium text-gray-400 w-6">
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {lesson.title}
                    </p>
                    {lesson.duration_min && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {lesson.duration_min} min
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {lesson.is_free && <Badge variant="info">Gratis</Badge>}

                    {isEnrolled ? (
                      <button
                        onClick={() =>
                          completeLesson.mutate({
                            courseId: id,
                            lessonId: lesson.id,
                          })
                        }
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completar
                      </button>
                    ) : canAccess ? (
                      <Play className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
