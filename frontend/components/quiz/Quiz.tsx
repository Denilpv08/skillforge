"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { quizzesApi } from "@/lib/api/quizzes";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import QuizResult from "./QuizResult";
import QuizQuestion from "./QuizQuestion";
import { useMyAttempts } from "@/hooks/use-quizzes";
import { Badge } from "../ui/badge";
import { formatDate } from "@/lib/utils";

const Quiz = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Respuestas seleccionadas: { questionId: optionId }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  const { data: attempts = [] } = useMyAttempts(id);

  const hasPassedAlready = attempts.some((a) => a.passed);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => quizzesApi.getQuiz(id),
  });
  const attemptsLeft = quiz ? quiz.max_attempts - attempts.length : 0;

  const submit = useMutation({
    mutationFn: () => quizzesApi.submitQuiz(id, answers),
    onSuccess: (data) => {
      setResult({ score: data.score, passed: data.passed });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al enviar");
    },
  });

  const totalQuestions = quiz?.questions.length ?? 0;
  const answeredCount = Object.keys(answers).length;
  const progressPct =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!quiz) return null;

  // ── Pantalla de resultado ──────────────────────────────────
  if (result) {
    return (
      <QuizResult
        result={result}
        passScore={quiz.pass_score}
        setAnswers={setAnswers}
        setResult={setResult}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Puntuación mínima: {quiz.pass_score}%
          </p>
        </div>
      </div>

      {/* Progreso de respuestas */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Progreso del quiz</span>
          <span>
            {answeredCount} / {totalQuestions}
          </span>
        </div>
        <Progress value={progressPct} />
      </div>

      {attempts.length > 0 && !result && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-600">
            Intentos anteriores
          </p>
          <div className="space-y-1.5">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between px-4 py-2.5
            bg-gray-50 rounded-xl border border-gray-200 text-sm"
              >
                <span className="text-gray-500 text-xs">
                  {formatDate(attempt.attempted_at)}
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
          <p className="text-xs text-gray-400 text-right">
            {attemptsLeft > 0
              ? `${attemptsLeft} intento(s) restante(s)`
              : "No te quedan más intentos"}
          </p>
        </div>
      )}

      {/* Preguntas */}
      {quiz.questions.map((question, qIdx) => (
        <QuizQuestion
          key={question.id}
          question={question}
          qIdx={qIdx}
          answers={answers}
          setAnswers={setAnswers}
        />
      ))}

      {/* Submit */}
      <div className="sticky bottom-4">
        <Button
          className="w-full shadow-lg"
          size="lg"
          onClick={() => submit.mutate()}
          loading={submit.isPending}
          disabled={
            answeredCount < totalQuestions ||
            attemptsLeft <= 0 ||
            hasPassedAlready
          }
        >
          {hasPassedAlready
            ? "¡Ya aprobaste este quiz!"
            : attemptsLeft <= 0
              ? "Sin intentos disponibles"
              : answeredCount < totalQuestions
                ? `Responde ${totalQuestions - answeredCount} pregunta(s) más`
                : "Enviar respuestas"}
        </Button>
      </div>
    </div>
  );
};

export default Quiz;
