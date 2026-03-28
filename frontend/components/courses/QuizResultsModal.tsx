import { useQuizResults } from "@/hooks/use-quizzes";
import { Modal } from "../ui/modal";
import { Badge } from "../ui/badge";

interface QuizResultProps {
  quizId: string;
  open: boolean;
  onClose: () => void;
}

const QuizResultsModal = ({ quizId, open, onClose }: QuizResultProps) => {
  const { data: results, isLoading } = useQuizResults(quizId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resultados del quiz"
      className="max-w-lg"
    >
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : results ? (
        <div className="space-y-5">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Intentos",
                value: results.total_attempts,
                color: "text-gray-700",
                bg: "bg-gray-50",
              },
              {
                label: "Aprobados",
                value: results.passed,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Promedio",
                value: `${results.average_score}%`,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Barra aprobados vs reprobados */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Tasa de aprobación</span>
              <span>
                {results.total_attempts > 0
                  ? Math.round((results.passed / results.total_attempts) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{
                  width:
                    results.total_attempts > 0
                      ? `${(results.passed / results.total_attempts) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>

          {/* Lista de intentos */}
          {results.attempts.length > 0 && (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Intentos recientes
              </p>
              {results.attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between py-2.5 px-3
                    bg-gray-50 rounded-xl text-sm"
                >
                  <span className="text-gray-500 text-xs">
                    {new Date(attempt.attempted_at).toLocaleDateString("es-CO")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {attempt.score}%
                    </span>
                    {attempt.passed ? (
                      <Badge variant="success">Aprobó</Badge>
                    ) : (
                      <Badge variant="danger">Reprobó</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.total_attempts === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              Aún no hay intentos registrados
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default QuizResultsModal;
