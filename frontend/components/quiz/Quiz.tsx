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
import QuizResult from "./QuizResult";
import QuizQuestion from "./QuizQuestion";

const Quiz = () => {
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
      <QuizResult
        result={result}
        passScore={quiz.pass_score}
        setAnswers={setAnswers}
        setResult={setResult}
      />
    );
  }

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
          disabled={answeredCount < totalQuestions}
        >
          {answeredCount < totalQuestions
            ? `Responde ${totalQuestions - answeredCount} pregunta(s) más`
            : "Enviar respuestas"}
        </Button>
      </div>
    </div>
  );
};

export default Quiz;
