import { useMyAttempts } from "@/hooks/use-quizzes";
import { useState } from "react";
import ResultScreen from "./ResultScreen";
import { Clock, Trophy, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { cn, formatDate } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface AttemptsHistoryProps {
  quizId: string;
  passScore: number;
  maxAttempts: number;
  onStartQuiz: () => void;
}

const AttemptsHistory = ({
  quizId,
  passScore,
  maxAttempts,
  onStartQuiz,
}: AttemptsHistoryProps) => {
  const { data: attempts = [], isLoading } = useMyAttempts(quizId);
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);

  const hasPassed = attempts.some((a) => a.passed);
  const attemptsLeft = maxAttempts - attempts.length;
  const canRetry = attemptsLeft > 0 && !hasPassed;

  if (reviewAttemptId) {
    return (
      <ResultScreen
        attemptId={reviewAttemptId}
        onRetry={() => setReviewAttemptId(null)}
        onBack={() => setReviewAttemptId(null)}
        canRetry={canRetry}
      />
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Info del quiz */}
      <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
        <div className="p-3 rounded-xl bg-indigo-100">
          <Clock className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-indigo-700">
              Puntaje mínimo: <span className="font-bold">{passScore}%</span>
            </span>
            <span className="text-indigo-300">·</span>
            <span className="text-sm text-indigo-700">
              Intentos:{" "}
              <span className="font-bold">
                {attempts.length} / {maxAttempts}
              </span>
            </span>
          </div>
          {hasPassed && (
            <p className="text-xs text-green-600 font-medium mt-1">
              ✓ Ya aprobaste este quiz
            </p>
          )}
          {!hasPassed && attemptsLeft === 0 && (
            <p className="text-xs text-red-500 font-medium mt-1">
              ✗ Sin intentos disponibles
            </p>
          )}
        </div>

        {canRetry && (
          <Button onClick={onStartQuiz} size="sm">
            {attempts.length === 0 ? "Comenzar" : "Reintentar"}
          </Button>
        )}
      </div>

      {/* Historial */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-10">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            Aún no has intentado este quiz
          </p>
          <Button className="mt-4" onClick={onStartQuiz}>
            Comenzar quiz
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">
            Tus intentos anteriores
          </h3>
          {attempts.map((attempt, idx) => (
            <button
              type="button"
              key={attempt.id}
              onClick={() => setReviewAttemptId(attempt.id)}
              className="w-full text-left"
            >
              <Card
                className={cn(
                  "border-2 cursor-pointer hover:shadow-md transition-all",
                  attempt.passed ? "border-green-200" : "border-gray-200",
                )}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Icono */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      attempt.passed ? "bg-green-100" : "bg-gray-100",
                    )}
                  >
                    {attempt.passed ? (
                      <Trophy className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg">
                        {attempt.score}%
                      </span>
                      {attempt.passed ? (
                        <Badge variant="success">Aprobado</Badge>
                      ) : (
                        <Badge variant="danger">Reprobado</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Intento #{attempts.length - idx} ·{" "}
                      {formatDate(attempt.attempted_at)}
                    </p>
                  </div>

                  {/* Barra de score */}
                  <div className="w-24 shrink-0">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          attempt.passed ? "bg-green-500" : "bg-red-400",
                        )}
                        style={{ width: `${attempt.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      Ver revisión →
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttemptsHistory;
