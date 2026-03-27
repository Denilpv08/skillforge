import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "../ui/card";

interface QuizQuestionProps {
  question: {
    id: string;
    text: string;
    answer_options: { id: string; text: string }[];
  };
  qIdx: number;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const QuizQuestion = ({
  question,
  qIdx,
  answers,
  setAnswers,
}: QuizQuestionProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
            {qIdx + 1}
          </span>
          <p className="font-medium text-gray-800 pt-0.5">{question.text}</p>
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
  );
};

export default QuizQuestion;
