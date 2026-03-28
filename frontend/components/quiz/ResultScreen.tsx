import { useAttemptDetail } from "@/hooks/use-quizzes";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";

interface ResultScreenProps {
  attemptId: string;
  onRetry: () => void;
  onBack: () => void;
  canRetry: boolean;
}

const ResultScreen = ({
  attemptId,
  onRetry,
  onBack,
  canRetry,
}: ResultScreenProps) => {
  const { data: detail, isLoading } = useAttemptDetail(attemptId);
  const [showReview, setShowReview] = useState(false);

  if (isLoading || !detail) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  const correctCount = detail.answers_review.filter((r) => r.is_correct).length;
  const totalCount = detail.answers_review.length;

  return (
    <div className="w-full space-y-5">
      {/* Tarjeta de resultado principal */}
      <div
        className={cn(
          "rounded-2xl p-8 text-center space-y-4",
          detail.passed
            ? "bg-linear-to-br from-green-500 to-emerald-600"
            : "bg-linear-to-br from-red-500 to-rose-600",
        )}
      >
        <div className="flex justify-center">
          {detail.passed ? (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        <div>
          <p className="text-white/80 text-sm font-medium mb-1">Tu puntaje</p>
          <p className="text-6xl font-black text-white">{detail.score}%</p>
          <p className="text-white/90 text-lg font-semibold mt-2">
            {detail.passed ? "¡Aprobaste!" : "No aprobaste esta vez"}
          </p>
          <p className="text-white/70 text-sm mt-1">
            {correctCount} de {totalCount} respuestas correctas
          </p>
        </div>

        {/* Mini barra de progreso */}
        <div className="bg-white/20 rounded-full h-2 max-w-xs mx-auto">
          <div
            className="bg-white rounded-full h-full transition-all duration-700"
            style={{ width: `${detail.score}%` }}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4" />
          Volver al curso
        </Button>
        {!detail.passed && canRetry && (
          <Button onClick={onRetry} className="flex-1">
            <RotateCcw className="w-4 h-4" />
            Intentar de nuevo
          </Button>
        )}
        <Button
          variant={showReview ? "primary" : "secondary"}
          onClick={() => setShowReview(!showReview)}
          className="flex-1"
        >
          <BookOpen className="w-4 h-4" />
          {showReview ? "Ocultar revisión" : "Ver revisión"}
        </Button>
      </div>

      {/* Revisión detallada de respuestas */}
      {showReview && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">
            Revisión de respuestas
          </h3>
          {detail.answers_review.map((review, idx) => (
            <Card
              key={review.question_id}
              className={cn(
                "border-2",
                review.is_correct ? "border-green-200" : "border-red-200",
              )}
            >
              <CardHeader
                className={cn(
                  "py-3",
                  review.is_correct ? "bg-green-50" : "bg-red-50",
                )}
              >
                <div className="flex items-start gap-2">
                  {review.is_correct ? (
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-400 mb-0.5">
                      Pregunta {idx + 1}
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {review.question_text}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-3 space-y-2">
                {/* Tu respuesta */}
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                    review.is_correct
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full shrink-0 flex items-center justify-center",
                      review.is_correct ? "bg-green-500" : "bg-red-400",
                    )}
                  >
                    {review.is_correct ? (
                      <CheckCircle className="w-3 h-3 text-white" />
                    ) : (
                      <XCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span>
                    <span className="font-medium">Tu respuesta: </span>
                    {review.selected_option_text ?? "Sin respuesta"}
                  </span>
                </div>

                {/* Respuesta correcta (solo si falló) */}
                {!review.is_correct && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg
                    bg-green-50 text-green-800 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span>
                      <span className="font-medium">Respuesta correcta: </span>
                      {review.correct_option_text}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultScreen;
