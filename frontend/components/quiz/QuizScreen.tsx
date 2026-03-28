import { useQuiz, useSubmitQuiz } from "@/hooks/use-quizzes";
import { useState } from "react";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface QuizScreenProps {
  quizId: string;
  onComplete: (attemptId: string) => void;
}

const QuizScreen = ({ quizId, onComplete }: QuizScreenProps) => {
  const { data: quiz, isLoading } = useQuiz(quizId);
  const submitQuiz = useSubmitQuiz(quizId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  if (isLoading || !quiz) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-6 w-64 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-10 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const totalQ = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLast = currentQuestion === totalQ - 1;
  const isFirst = currentQuestion === 0;
  const hasAnswered = !!answers[question.id];

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handleSubmit = () => {
    submitQuiz.mutate(answers, {
      onSuccess: (attempt) => onComplete(attempt.id),
    });
  };

  return (
    <div className="w-full space-y-5">
      {/* Header del quiz */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">{quiz.title}</span>
          <span className="text-gray-400">
            {answeredCount} / {totalQ} respondidas
          </span>
        </div>
        <Progress value={(answeredCount / totalQ) * 100} />

        {/* Navegación de puntos */}
        <div className="flex gap-1.5 flex-wrap">
          {quiz.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-semibold transition-all",
                idx === currentQuestion
                  ? "bg-indigo-600 text-white scale-110"
                  : answers[q.id]
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200",
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjeta de pregunta */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span
              className="shrink-0 w-8 h-8 rounded-full bg-indigo-600
              text-white flex items-center justify-center text-sm font-bold"
            >
              {currentQuestion + 1}
            </span>
            <p className="text-base font-semibold text-gray-800 pt-1 leading-snug">
              {question.text}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0">
          {question.answer_options.map((option) => {
            const selected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all",
                  selected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-700",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 shrink-0 transition-all",
                      "flex items-center justify-center",
                      selected
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-gray-300",
                    )}
                  >
                    {selected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  {option.text}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navegación entre preguntas */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => setCurrentQuestion((p) => p - 1)}
          disabled={isFirst}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        {isLast ? (
          <Button
            onClick={handleSubmit}
            loading={submitQuiz.isPending}
            disabled={answeredCount < totalQ}
            className="flex-1"
          >
            {answeredCount < totalQ
              ? `Falta${totalQ - answeredCount > 1 ? "n" : ""} ${totalQ - answeredCount}`
              : "Enviar quiz"}
            <CheckCircle className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion((p) => p + 1)}
            disabled={!hasAnswered}
            className="flex-1"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Hint si no ha respondido */}
      {!hasAnswered && !isLast && (
        <p className="text-center text-xs text-gray-400">
          Selecciona una respuesta para continuar
        </p>
      )}
    </div>
  );
};

export default QuizScreen;
