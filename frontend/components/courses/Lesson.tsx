"use client";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import {
  useLesson,
  useCourse,
  useCompleteLesson,
  useMyEnrollments,
} from "@/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import renderMarkdown from "./RenderMarkdown";

const Lesson = () => {
  const { id: courseId, lessonId } = useParams<{
    id: string;
    lessonId: string;
  }>();
  const router = useRouter();

  const { data: course } = useCourse(courseId);
  const { data: lesson, isLoading } = useLesson(courseId, lessonId);
  const { data: enrollments = [] } = useMyEnrollments();
  const completeLesson = useCompleteLesson();

  const enrollment = enrollments.find((e) => e.course_id === courseId);

  // Navegación entre lecciones
  const lessons = course?.lessons ?? [];
  const currIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currIndex > 0 ? lessons[currIndex - 1] : null;
  const nextLesson =
    currIndex < lessons.length - 1 ? lessons[currIndex + 1] : null;

  const goTo = (lId: string) =>
    router.push(`/dashboard/courses/${courseId}/lessons/${lId}`);

  const handleComplete = () => {
    completeLesson.mutate({ courseId, lessonId });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 text-gray-500">
        Lección no encontrada
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => router.push(`/dashboard/courses/${courseId}`)}
          className="hover:text-gray-800 transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {course?.title ?? "Curso"}
        </button>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">
          {lesson.title}
        </span>
      </div>

      {/* Progress del curso */}
      {enrollment && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progreso del curso</span>
            <span>{Number(enrollment.progress_pct).toFixed(0)}%</span>
          </div>
          <Progress value={Number(enrollment.progress_pct)} size="sm" />
        </div>
      )}

      {/* Contenido principal */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header de la lección */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-400">
                  Lección {currIndex + 1} de {lessons.length}
                </span>
                {lesson.is_free && (
                  <Badge variant="info">Vista previa gratuita</Badge>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {lesson.title}
              </h1>
              {lesson.duration_min && (
                <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lesson.duration_min} minutos de lectura
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Video */}
        {lesson.video_url && (
          <div className="px-6 pt-5">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              {lesson.video_url.includes("youtube") ||
              lesson.video_url.includes("youtu.be") ? (
                <iframe
                  src={lesson.video_url
                    .replace("watch?v=", "embed/")
                    .replace("youtu.be/", "www.youtube.com/embed/")}
                  className="w-full h-full"
                  allowFullScreen
                  title={lesson.title}
                />
              ) : (
                <video
                  src={lesson.video_url}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>
          </div>
        )}

        {/* Contenido de texto */}
        {lesson.content && (
          <div className="px-6 py-5">
            <div
              className="prose prose-sm prose-indigo max-w-none text-gray-700
                prose-headings:font-bold prose-headings:text-gray-900
                prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:text-gray-100"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(lesson.content),
              }}
            />
          </div>
        )}

        {!lesson.video_url && !lesson.content && (
          <div className="px-6 py-10 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Esta lección no tiene contenido aún</p>
          </div>
        )}
      </div>

      {/* Acción completar */}
      {enrollment && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">
                ¿Terminaste esta lección?
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Márcala como completada para avanzar tu progreso
              </p>
            </div>
            <Button
              onClick={handleComplete}
              loading={completeLesson.isPending}
              variant="primary"
              size="sm"
            >
              <CheckCircle className="w-4 h-4" />
              Completar lección
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navegación entre lecciones */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => prevLesson && goTo(prevLesson.id)}
          disabled={!prevLesson}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {prevLesson ? prevLesson.title : "Primera lección"}
        </Button>

        <Button
          onClick={() => nextLesson && goTo(nextLesson.id)}
          disabled={!nextLesson}
          className="flex-1"
        >
          {nextLesson ? nextLesson.title : "Última lección"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Lesson;
