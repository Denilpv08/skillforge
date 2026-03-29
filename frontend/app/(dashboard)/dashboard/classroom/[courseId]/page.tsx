"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Video,
} from "lucide-react";

import { useCourse } from "@/hooks/use-courses";
import {
  useClassroomProgress,
  useNotesByCourse,
  usePatchLessonProgress,
  useUpsertNote,
} from "@/hooks/use-classroom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function isYoutubeOrVimeo(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function getEmbeddedUrl(url: string) {
  if (/youtu\.be\//i.test(url)) {
    return url.replace("youtu.be/", "www.youtube.com/embed/");
  }

  if (/youtube\.com\/watch\?v=/i.test(url)) {
    return url.replace("watch?v=", "embed/");
  }

  if (/vimeo\.com\//i.test(url) && !/player\.vimeo\.com/i.test(url)) {
    const id = url.split("/").filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }

  return url;
}

function parsePdfUrl(content: string | null, videoUrl: string | null) {
  const candidates = [content, videoUrl].filter(Boolean) as string[];
  const found = candidates.find((value) => /\.pdf(\?|$)/i.test(value.trim()));
  return found ?? null;
}

export default function ClassroomPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: classroomProgress } = useClassroomProgress(courseId);
  const { data: courseNotes = [] } = useNotesByCourse(courseId);

  const upsertNote = useUpsertNote();
  const patchProgress = usePatchLessonProgress(courseId);

  const lessons = course?.lessons ?? [];

  const [mobileIndexOpen, setMobileIndexOpen] = useState(false);
  const [notesCollapsed, setNotesCollapsed] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [noteContent, setNoteContent] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [secondsViewed, setSecondsViewed] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === activeLessonId) ?? null,
    [lessons, activeLessonId],
  );

  const activeIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.id === activeLessonId),
    [lessons, activeLessonId],
  );

  const nextLesson =
    activeIndex >= 0 && activeIndex < lessons.length - 1
      ? lessons[activeIndex + 1]
      : null;

  useEffect(() => {
    if (!lessons.length) return;

    const completed = new Set(classroomProgress?.completed_lesson_ids ?? []);
    const firstPending = lessons.find((lesson) => !completed.has(lesson.id));
    setActiveLessonId(firstPending?.id ?? lessons[0].id);
  }, [lessons, classroomProgress]);

  useEffect(() => {
    if (!activeLessonId) return;

    const existingNote = courseNotes.find(
      (item) => item.lesson_id === activeLessonId,
    );
    setNoteContent(existingNote?.content ?? "");
  }, [activeLessonId, courseNotes]);

  useEffect(() => {
    if (!activeLessonId) return;

    setSecondsViewed(0);
  }, [activeLessonId]);

  useEffect(() => {
    if (!activeLessonId) return;

    const timer = window.setInterval(() => {
      setSecondsViewed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeLessonId]);

  useEffect(() => {
    if (!activeLessonId || secondsViewed === 0 || secondsViewed % 15 !== 0)
      return;

    patchProgress.mutate({
      lessonId: activeLessonId,
      payload: {
        seconds_viewed: secondsViewed,
        mark_completed: false,
      },
    });
  }, [activeLessonId, secondsViewed, patchProgress]);

  useEffect(() => {
    if (!activeLessonId) return;

    const autosave = window.setInterval(() => {
      upsertNote.mutate(
        { lesson_id: activeLessonId, content: noteContent },
        {
          onSuccess: () => {
            setLastSavedAt(new Date());
          },
        },
      );
    }, 30000);

    return () => window.clearInterval(autosave);
  }, [activeLessonId, noteContent, upsertNote]);

  const saveNoteNow = () => {
    if (!activeLessonId) return;

    upsertNote.mutate(
      { lesson_id: activeLessonId, content: noteContent },
      {
        onSuccess: () => {
          setLastSavedAt(new Date());
        },
      },
    );
  };

  const navigateLesson = (lessonId: string) => {
    if (activeLessonId) {
      upsertNote.mutate({ lesson_id: activeLessonId, content: noteContent });
    }
    setActiveLessonId(lessonId);
    setMobileIndexOpen(false);
  };

  const markAsCompletedAndGoNext = () => {
    if (!activeLessonId) return;

    patchProgress.mutate(
      {
        lessonId: activeLessonId,
        payload: {
          seconds_viewed: secondsViewed,
          mark_completed: true,
        },
      },
      {
        onSuccess: (result) => {
          if (result.next_lesson_id) {
            setActiveLessonId(result.next_lesson_id);
          }
        },
      },
    );
  };

  const exportNotesTxt = () => {
    const lines = courseNotes
      .map((note) => {
        const lesson = lessons.find((item) => item.id === note.lesson_id);
        return `## ${lesson?.title ?? "Leccion"}\n\n${note.content}\n`;
      })
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `notas-${course?.slug ?? courseId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportNotesPdf = () => {
    const printable = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=900,height=700",
    );
    if (!printable) return;

    const html = courseNotes
      .map((note) => {
        const lesson = lessons.find((item) => item.id === note.lesson_id);
        return `<h2>${lesson?.title ?? "Leccion"}</h2><pre style=\"white-space:pre-wrap;font-family:system-ui\">${note.content.replace(/</g, "&lt;")}</pre>`;
      })
      .join("<hr />");

    printable.document.write(`
      <html>
        <head>
          <title>Notas del curso</title>
        </head>
        <body style="font-family: ui-sans-serif, system-ui; margin: 24px;">
          <h1>${course?.title ?? "Curso"}</h1>
          ${html}
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  if (loadingCourse) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 w-60 rounded bg-gray-200" />
        <div className="h-150 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="py-16 text-gray-500">No hay lecciones disponibles.</div>
    );
  }

  const isCurrentLessonCompleted =
    classroomProgress?.completed_lesson_ids.includes(activeLesson.id) ?? false;

  const embeddedVideoUrl = activeLesson.video_url
    ? getEmbeddedUrl(activeLesson.video_url)
    : null;

  const pdfUrl = parsePdfUrl(activeLesson.content, activeLesson.video_url);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">
            <Link href="/dashboard/my-learning" className="hover:text-gray-700">
              Mi aprendizaje
            </Link>
            <span className="mx-2">/</span>
            <span>{course.title}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">
              {activeLesson.title}
            </span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Classroom inmersivo
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportNotesTxt}>
            <Download className="h-4 w-4" /> TXT
          </Button>
          <Button variant="secondary" size="sm" onClick={exportNotesPdf}>
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Progreso total</p>
            <p className="text-lg font-semibold text-gray-900">
              {(classroomProgress?.progress_pct ?? 0).toFixed(0)}%
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Tiempo restante</p>
            <p className="text-lg font-semibold text-gray-900">
              {classroomProgress?.estimated_remaining_min ?? 0} min
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Leccion actual</p>
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
              {activeLesson.title}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Notas</p>
            <p className="text-sm font-semibold text-gray-900">
              {noteContent.length} caracteres
            </p>
          </div>
        </div>

        <Progress
          value={classroomProgress?.progress_pct ?? 0}
          className="mb-4"
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_auto]">
          <aside
            className={cn(
              "rounded-xl border border-gray-200 bg-gray-50 p-3",
              mobileIndexOpen ? "block" : "hidden lg:block",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                Indice del curso
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileIndexOpen(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const completed =
                  classroomProgress?.completed_lesson_ids.includes(lesson.id) ??
                  false;
                const isActive = lesson.id === activeLessonId;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigateLesson(lesson.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      isActive
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-200 bg-white hover:bg-gray-100",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {index + 1}. {lesson.title}
                      </p>
                      {completed && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          OK
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {lesson.duration_min ?? 0} min
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileIndexOpen((current) => !current)}
                >
                  <Menu className="h-4 w-4" />
                  Lecciones
                </Button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeLesson.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activeIndex <= 0}
                  onClick={() =>
                    activeIndex > 0 &&
                    navigateLesson(lessons[activeIndex - 1].id)
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  size="sm"
                  onClick={markAsCompletedAndGoNext}
                  loading={patchProgress.isPending}
                >
                  Marcar completada
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {activeLesson.video_url && (
              <div className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-black aspect-video">
                {isYoutubeOrVimeo(activeLesson.video_url) ? (
                  <iframe
                    src={embeddedVideoUrl ?? activeLesson.video_url}
                    title={activeLesson.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={activeLesson.video_url}
                    controls
                    className="h-full w-full"
                    onEnded={() => {
                      if (nextLesson) {
                        markAsCompletedAndGoNext();
                      }
                    }}
                  />
                )}
              </div>
            )}

            {pdfUrl && (
              <div
                ref={pdfContainerRef}
                className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  Documento PDF
                </div>
                <Document file={pdfUrl} loading={<p>Cargando PDF...</p>}>
                  <Page pageNumber={1} width={760} />
                </Document>
              </div>
            )}

            {activeLesson.content && !pdfUrl && (
              <article className="prose max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-code:text-gray-900 prose-pre:rounded-lg prose-pre:bg-gray-900 prose-pre:text-gray-100">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {activeLesson.content}
                </ReactMarkdown>
              </article>
            )}

            {!activeLesson.video_url && !activeLesson.content && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
                <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-70" />
                Esta leccion no tiene contenido cargado.
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/dashboard/courses/${courseId}`)}
              >
                Volver al curso
              </Button>

              <div className="text-xs text-gray-500">
                {isCurrentLessonCompleted
                  ? "Leccion completada"
                  : `Tiempo registrado: ${secondsViewed}s`}
              </div>
            </div>
          </section>

          <aside
            className={cn(
              "rounded-xl border border-gray-200 bg-white p-3",
              notesCollapsed ? "w-16" : "w-full lg:w-80",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              {!notesCollapsed && (
                <h2 className="text-sm font-semibold text-gray-800">
                  Notas personales
                </h2>
              )}

              <button
                onClick={() => setNotesCollapsed((current) => !current)}
                className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
              >
                {notesCollapsed ? (
                  <PanelRightOpen className="h-4 w-4" />
                ) : (
                  <PanelRightClose className="h-4 w-4" />
                )}
              </button>
            </div>

            {!notesCollapsed && (
              <>
                <textarea
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  placeholder="Escribe tus apuntes de esta leccion..."
                  className="min-h-90 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {lastSavedAt
                      ? `Guardado a las ${lastSavedAt.toLocaleTimeString()}`
                      : "Autosave cada 30 segundos"}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={saveNoteNow}
                    loading={upsertNote.isPending}
                  >
                    <Save className="h-3.5 w-3.5" /> Guardar
                  </Button>
                </div>
              </>
            )}

            {notesCollapsed && (
              <div className="flex h-full items-center justify-center text-gray-500">
                <Video className="h-5 w-5" />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
