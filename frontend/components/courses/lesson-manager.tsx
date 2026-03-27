"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Lesson } from "@/types/course";
import {
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from "@/hooks/use-courses";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { LessonForm, LessonFormValues } from "@/components/forms/lesson-form";
import LessonList from "./LessonList";

interface LessonManagerProps {
  courseId: string;
  lessons: Lesson[];
  canEdit: boolean;
}

export function LessonManager({
  courseId,
  lessons,
  canEdit,
}: LessonManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [ordered, setOrdered] = useState<Lesson[]>(lessons);

  // Sincronizar cuando cambien las lecciones desde fuera
  if (lessons.length !== ordered.length) setOrdered(lessons);

  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const deleteLessonM = useDeleteLesson(courseId);

  // ── Handlers ──────────────────────────────────────────────
  const handleCreate = (values: LessonFormValues) => {
    createLesson.mutate(
      { ...values, order_index: ordered.length },
      { onSuccess: () => setCreateOpen(false) },
    );
  };

  const handleEdit = (values: LessonFormValues) => {
    if (!editLesson) return;
    updateLesson.mutate(
      { lessonId: editLesson.id, data: values },
      { onSuccess: () => setEditLesson(null) },
    );
  };

  const handleDelete = () => {
    if (!deleteLesson) return;
    deleteLessonM.mutate(deleteLesson.id, {
      onSuccess: () => setDeleteLesson(null),
    });
  };

  return (
    <div className="space-y-3">
      {/* Lista de lecciones */}
      <LessonList
        ordered={ordered}
        canEdit={canEdit}
        setOrdered={setOrdered}
        setCreateOpen={setCreateOpen}
        setEditLesson={setEditLesson}
        setDeleteLesson={setDeleteLesson}
        courseId={courseId}
      />

      {/* Botón agregar */}
      {canEdit && ordered.length > 0 && (
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl
            text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 bg-indigo-50
            hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar lección
        </Button>
      )}

      {/* Modal crear */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva lección"
        className="max-w-2xl"
      >
        <LessonForm onSubmit={handleCreate} loading={createLesson.isPending} />
      </Modal>

      {/* Modal editar */}
      <Modal
        open={!!editLesson}
        onClose={() => setEditLesson(null)}
        title="Editar lección"
        className="max-w-2xl"
      >
        {editLesson && (
          <LessonForm
            onSubmit={handleEdit}
            loading={updateLesson.isPending}
            submitLabel="Guardar cambios"
            defaultValues={{
              title: editLesson.title,
              content: editLesson.content ?? "",
              video_url: editLesson.video_url ?? "",
              duration_min: editLesson.duration_min ?? undefined,
              is_free: editLesson.is_free,
            }}
          />
        )}
      </Modal>

      {/* Modal eliminar */}
      <Modal
        open={!!deleteLesson}
        onClose={() => setDeleteLesson(null)}
        title="Eliminar lección"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar{" "}
            <span className="font-semibold">"{deleteLesson?.title}"</span>? Esta
            acción no se puede deshacer y se perderá el progreso de los
            estudiantes en esta lección.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              loading={deleteLessonM.isPending}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteLesson(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
