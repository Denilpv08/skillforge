import { ChevronRight, ClipboardList, Plus, Trash2, Users } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { QuizOut } from "@/lib/api/quizzes";

interface QuizListProps {
  quizzes: QuizOut[];
  canManage: boolean;
  setCreateOpen: (quizId: boolean) => void;
  setResultsQuizId: (quizId: string) => void;
  setConfirmDelete: (quizId: string) => void;
}

const QuizList = ({
  quizzes,
  canManage,
  setCreateOpen,
  setResultsQuizId,
  setConfirmDelete,
}: QuizListProps) => {
  const router = useRouter();

  return (
    <>
      {quizzes.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay quizzes en este curso</p>
          {canManage && (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Crear primer quiz
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center gap-3 p-4 bg-white border
                border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <div className="p-2 rounded-lg bg-indigo-50 shrink-0">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {quiz.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>{quiz.questions.length} preguntas</span>
                  <span>·</span>
                  <span>Mín. {quiz.pass_score}% para aprobar</span>
                  <span>·</span>
                  <span>{quiz.max_attempts} intentos</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {canManage && (
                  <Button
                    onClick={() => setResultsQuizId(quiz.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                      text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Resultados
                  </Button>
                )}

                <Button
                  onClick={() => router.push(`/dashboard/quiz/${quiz.id}`)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                    text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-medium transition-colors"
                >
                  Tomar
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>

                {canManage && (
                  <Button
                    onClick={() => setConfirmDelete(quiz.id)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-gray-300
                      hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default QuizList;
