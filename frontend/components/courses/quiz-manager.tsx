"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  useQuizzesByCourse,
  useCreateQuiz,
  useDeleteQuiz,
} from "@/hooks/use-quizzes";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { QuizForm, QuizFormValues } from "@/components/forms/quiz-form";
import QuizResultsModal from "./QuizResultsModal";
import QuizList from "./QuizList";

// ─── Panel principal ──────────────────────────────────────────
interface QuizManagerProps {
  courseId: string;
  canManage: boolean;
}

export function QuizManager({ courseId, canManage }: QuizManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsQuizId, setResultsQuizId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: quizzes = [], isLoading } = useQuizzesByCourse(courseId);
  const createQuiz = useCreateQuiz(courseId);
  const deleteQuiz = useDeleteQuiz(courseId);

  const handleCreate = (values: QuizFormValues) => {
    const payload = {
      ...values,
      questions: values.questions.map((q, qi) => ({
        ...q,
        order_index: qi,
        answer_options: q.answer_options.map((a, ai) => ({
          ...a,
          order_index: ai,
        })),
      })),
    };
    createQuiz.mutate(payload, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista de quizzes */}
      <QuizList
        quizzes={quizzes}
        canManage={canManage}
        setCreateOpen={setCreateOpen}
        setResultsQuizId={setResultsQuizId}
        setConfirmDelete={setConfirmDelete}
      />

      {/* Botón agregar quiz */}
      {canManage && quizzes.length > 0 && (
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl
            text-sm text-gray-400 bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500
            hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar quiz
        </Button>
      )}

      {/* Modal crear quiz */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear quiz"
        className="max-w-2xl"
      >
        <QuizForm onSubmit={handleCreate} loading={createQuiz.isPending} />
      </Modal>

      {/* Modal resultados */}
      {resultsQuizId && (
        <QuizResultsModal
          quizId={resultsQuizId}
          open={!!resultsQuizId}
          onClose={() => setResultsQuizId(null)}
        />
      )}

      {/* Modal confirmar eliminación */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar quiz"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar este quiz? Se perderán todos los intentos e historial de
            los estudiantes. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              loading={deleteQuiz.isPending}
              onClick={() =>
                deleteQuiz.mutate(confirmDelete!, {
                  onSuccess: () => setConfirmDelete(null),
                })
              }
            >
              Eliminar
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmDelete(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
