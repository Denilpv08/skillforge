import { cn } from "@/lib/utils";
import { Trophy, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface QuizResultProps {
  result: {
    score: number;
    passed: boolean;
  };
  passScore: number;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setResult: React.Dispatch<
    React.SetStateAction<{ score: number; passed: boolean } | null>
  >;
}

const QuizResult = ({
  result,
  passScore,
  setAnswers,
  setResult,
}: QuizResultProps) => {
  const router = useRouter();

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
            : `Necesitas ${passScore}% para aprobar`}
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
};

export default QuizResult;
