"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { XCircle, ChevronLeft, Trophy } from "lucide-react";
import { quizzesApi } from "@/lib/api/quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Respuestas seleccionadas: { questionId: optionId }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => quizzesApi.getQuiz(id),
  });

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
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto",
            result.passed ? "bg-green-100" : "bg-red-100",
          )}
        >
          {result.passed ? (
            <Trophy className="w-12 h-12 text-green-500" />
          ) : (
            <XCircle className="w-12 h-12 text-red-400" />
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-900">{result.score}%</h2>
          <p className="text-gray-500 mt-1">
            {result.passed
              ? "¡Felicitaciones! Aprobaste el quiz"
              : `Necesitas ${quiz.pass_score}% para aprobar`}
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => router.back()}>
            Volver al curso
          </Button>
          {!result.passed && (
            <Button
              onClick={() => {
                setAnswers({});
                setResult(null);
              }}
            >
              Intentar de nuevo
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Pantalla de quiz ───────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
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

      {/* Preguntas */}
      {quiz.questions.map((question, qIdx) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                {qIdx + 1}
              </span>
              <p className="font-medium text-gray-800 pt-0.5">
                {question.text}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {question.answer_options.map((option) => {
              const selected = answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: option.id,
                    }))
                  }
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all",
                    selected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-700",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                        selected
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-gray-300",
                      )}
                    />
                    {option.text}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <div className="sticky bottom-4">
        <Button
          className="w-full shadow-lg"
          size="lg"
          onClick={() => submit.mutate()}
          loading={submit.isPending}
          disabled={answeredCount < totalQuestions}
        >
          {answeredCount < totalQuestions
            ? `Responde ${totalQuestions - answeredCount} pregunta(s) más`
            : "Enviar respuestas"}
        </Button>
      </div>
    </div>
  );
}
