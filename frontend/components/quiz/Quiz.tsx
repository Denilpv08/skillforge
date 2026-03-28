"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useQuiz, useMyAttempts } from "@/hooks/use-quizzes";
import { cn } from "@/lib/utils";
import ResultScreen from "./ResultScreen";
import QuizScreen from "./QuizScreen";
import AttemptsHistory from "./AttemptsHistory";

// ─── Página principal ─────────────────────────────────────────
export default function QuizPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: quiz, isLoading } = useQuiz(quizId);
  const { data: attempts = [] } = useMyAttempts(quizId);

  type Screen = "history" | "quiz" | "result";
  const [screen, setScreen] = useState<Screen>("history");
  const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);

  const hasPassed = attempts.some((a) => a.passed);
  const attemptsLeft = quiz ? quiz.max_attempts - attempts.length : 0;
  const canRetry = attemptsLeft > 0 && !hasPassed;

  const handleQuizComplete = (attemptId: string) => {
    setLastAttemptId(attemptId);
    setScreen("result");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-20 text-gray-500">Quiz no encontrado</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (screen !== "history") {
              setScreen("history");
            } else {
              router.back();
            }
          }}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-sm text-gray-400">
            {screen === "history" && "Historial de intentos"}
            {screen === "quiz" && "Respondiendo quiz"}
            {screen === "result" && "Resultado del intento"}
          </p>
        </div>

        {/* Indicador de pantalla */}
        <div className="ml-auto flex gap-1.5">
          {(["history", "quiz", "result"] as Screen[]).map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                screen === s ? "w-6 bg-indigo-600" : "w-1.5 bg-gray-200",
              )}
            />
          ))}
        </div>
      </div>

      {/* Contenido según pantalla */}
      {screen === "history" && (
        <AttemptsHistory
          quizId={quizId}
          passScore={quiz.pass_score}
          maxAttempts={quiz.max_attempts}
          onStartQuiz={() => setScreen("quiz")}
        />
      )}

      {screen === "quiz" && (
        <QuizScreen quizId={quizId} onComplete={handleQuizComplete} />
      )}

      {screen === "result" && lastAttemptId && (
        <ResultScreen
          attemptId={lastAttemptId}
          onRetry={() => {
            setLastAttemptId(null);
            setScreen("quiz");
          }}
          onBack={() => router.back()}
          canRetry={canRetry}
        />
      )}
    </div>
  );
}
