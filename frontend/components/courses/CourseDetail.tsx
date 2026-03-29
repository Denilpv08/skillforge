"use client";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Clock, ChevronLeft } from "lucide-react";
import { useCourse, useEnroll, useMyEnrollments } from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CourseStatusControl } from "@/components/courses/course-status-control";
import { usePermissions } from "@/hooks/use-permissions";
import { LessonManager } from "@/components/courses/lesson-manager";
import { QuizManager } from "./quiz-manager";

const CourseDetail = () => {
  const permissions = usePermissions();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: course, isLoading } = useCourse(id);
  const { data: enrollments = [] } = useMyEnrollments();
  const enroll = useEnroll();

  const enrollment = enrollments.find((e) => e.course_id === id);
  const isEnrolled = !!enrollment;
  const canEdit = course
    ? permissions.canManageCourse(course.instructor_id)
    : false;

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
    <div className="w-full space-y-6">
      {/* Back */}
      <Button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a cursos
      </Button>

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
                {permissions.canManageCourse(course.instructor_id) && (
                  <CourseStatusControl
                    courseId={course.id}
                    currentStatus={course.status}
                  />
                )}
              </div>
            </div>

            {/* Acción principal */}
            <div className="shrink-0">
              {isEnrolled ? (
                <div className="text-center space-y-2 min-w-35">
                  <Progress value={Number(enrollment.progress_pct)} showLabel />
                  <p className="text-xs text-gray-500">Tu progreso</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/classroom/${course.id}`)
                    }
                  >
                    Ir al classroom
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => enroll.mutate(id)}
                    loading={enroll.isPending}
                    disabled={course.status !== "PUBLISHED"}
                  >
                    Inscribirme
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lecciones */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Contenido del curso</h2>
          <span className="text-sm text-gray-400">
            {course.lessons.length} lecciones
          </span>
        </div>
        <div className="px-6 py-4">
          <LessonManager
            courseId={course.id}
            lessons={course.lessons}
            canEdit={canEdit}
          />
        </div>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Evaluaciones</h2>
        </div>
        <div className="px-6 py-4">
          <QuizManager courseId={course.id} canManage={canEdit} />
        </div>
      </Card>
    </div>
  );
};

export default CourseDetail;
