import { AlertCircle, Check, GripVertical, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  useFieldArray,
} from "react-hook-form";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import type { QuizFormInput } from "./quiz-form";

interface QuestionFieldProps {
  questionIndex: number;
  onRemove: () => void;
  register: UseFormRegister<QuizFormInput>;
  control: Control<QuizFormInput>;
  errors: FieldErrors<QuizFormInput>;
  watch: UseFormWatch<QuizFormInput>;
  setValue: UseFormSetValue<QuizFormInput>;
}

function QuestionField({
  questionIndex,
  onRemove,
  register,
  control,
  errors,
  watch,
  setValue,
}: QuestionFieldProps) {
  const answerOptionsPath =
    `questions.${questionIndex}.answer_options` as const;

  const { fields, append, remove } = useFieldArray<
    QuizFormInput,
    `questions.${number}.answer_options`
  >({
    control,
    name: answerOptionsPath,
  });

  const options = watch(answerOptionsPath) ?? [];

  const questionErrors = (
    Array.isArray(errors.questions)
      ? errors.questions[questionIndex]
      : undefined
  ) as FieldErrors<QuizFormInput["questions"][number]> | undefined;

  const markCorrect = (optionIndex: number) => {
    // Solo una respuesta correcta por pregunta
    options.forEach((_, i) => {
      setValue(
        `questions.${questionIndex}.answer_options.${i}.is_correct` as const,
        i === optionIndex,
      );
    });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
      {/* Header pregunta */}
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
        <span className="text-sm font-semibold text-gray-600">
          Pregunta {questionIndex + 1}
        </span>
        <Button
          type="button"
          onClick={onRemove}
          className="ml-auto p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Texto de la pregunta */}
      <textarea
        className={cn(
          "w-full rounded-lg border text-black px-3 py-2 text-sm outline-none transition-colors resize-none min-h-20",
          questionErrors?.text
            ? "border-red-400 focus:border-red-400"
            : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
        )}
        placeholder="Escribe la pregunta aquí..."
        {...register(`questions.${questionIndex}.text` as const)}
      />
      {questionErrors?.text?.message && (
        <p className="text-xs text-red-500">{questionErrors.text.message}</p>
      )}

      {/* Opciones de respuesta */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Opciones — haz click en ✓ para marcar la correcta
        </p>

        {fields.map((field, optIdx) => {
          const isCorrect = options[optIdx]?.is_correct ?? false;
          return (
            <div
              key={field.id}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all",
                isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-white",
              )}
            >
              {/* Botón marcar correcta */}
              <Button
                type="button"
                onClick={() => markCorrect(optIdx)}
                className={cn(
                  "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isCorrect
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:border-green-400",
                )}
              >
                {isCorrect && <Check className="w-3.5 h-3.5" />}
              </Button>

              {/* Input opción */}
              <input
                className="flex-1 text-sm text-black bg-transparent outline-none placeholder:text-gray-400"
                placeholder={`Opción ${optIdx + 1}`}
                {...register(
                  `questions.${questionIndex}.answer_options.${optIdx}.text` as const,
                )}
              />

              {/* Eliminar opción */}
              {fields.length > 2 && (
                <Button
                  type="button"
                  onClick={() => remove(optIdx)}
                  className="shrink-0 p-1 rounded bg-red-50 hover:bg-red-100 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          );
        })}

        {/* Error de opciones */}
        {questionErrors?.answer_options?.root?.message && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {questionErrors.answer_options.root.message}
          </div>
        )}

        {/* Agregar opción */}
        {fields.length < 5 && (
          <Button
            type="button"
            onClick={() => append({ text: "", is_correct: false })}
            className="w-full py-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700
                border border-dashed border-indigo-200 hover:border-indigo-400
                rounded-lg transition-all"
          >
            + Agregar opción
          </Button>
        )}
      </div>
    </div>
  );
}

export default QuestionField;
