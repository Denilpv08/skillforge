"use client";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import QuestionField from "./QuestionField";

// ─── Schema ──────────────────────────────────────────────────
const answerSchema = z.object({
  text: z.string().min(1, "La opción no puede estar vacía"),
  is_correct: z.boolean().default(false),
});

const questionSchema = z.object({
  text: z.string().min(1, "La pregunta no puede estar vacía"),
  answer_options: z
    .array(answerSchema)
    .min(2, "Necesitas al menos 2 opciones")
    .refine(
      (opts) => opts.some((o) => o.is_correct),
      "Debes marcar al menos una respuesta correcta",
    ),
});

const quizSchema = z.object({
  title: z.string().min(2, "El título es requerido"),
  pass_score: z.coerce.number().int().min(0).max(100),
  max_attempts: z.coerce.number().int().min(1).max(10),
  questions: z.array(questionSchema).min(1, "Agrega al menos una pregunta"),
});

export type QuizFormValues = z.infer<typeof quizSchema>;
export type QuizFormInput = z.input<typeof quizSchema>;

interface QuizFormProps {
  onSubmit: (values: QuizFormValues) => void;
  loading?: boolean;
}

// ─── Formulario principal ─────────────────────────────────────
export function QuizForm({ onSubmit, loading = false }: QuizFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuizFormInput, unknown, QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      pass_score: 70,
      max_attempts: 3,
      questions: [
        {
          text: "",
          answer_options: [
            { text: "", is_correct: false },
            { text: "", is_correct: false },
          ],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const addQuestion = () => {
    append({
      text: "",
      answer_options: [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Configuración del quiz */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Configuración
        </h3>

        <Input
          id="title"
          label="Título del quiz"
          placeholder="Ej: Evaluación del Módulo 1"
          error={errors.title?.message}
          {...register("title")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="pass_score"
            type="number"
            label="Puntaje mínimo (%)"
            helperText="Porcentaje para aprobar"
            error={errors.pass_score?.message}
            {...register("pass_score")}
          />
          <Input
            id="max_attempts"
            type="number"
            label="Intentos máximos"
            helperText="Veces que puede intentarlo"
            error={errors.max_attempts?.message}
            {...register("max_attempts")}
          />
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Preguntas ({fields.length})
          </h3>
          {errors.questions?.root && (
            <p className="text-xs text-red-500">
              {errors.questions.root.message}
            </p>
          )}
        </div>

        {fields.map((field, index) => (
          <QuestionField
            key={field.id}
            questionIndex={index}
            onRemove={() => remove(index)}
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        ))}

        <Button
          type="button"
          onClick={addQuestion}
          className="w-full py-3.5 border-2 border-dashed bg-indigo-50 border-gray-300
            hover:border-indigo-400 hover:bg-indigo-100 rounded-xl text-sm
            text-gray-500 hover:text-indigo-600 transition-all flex items-center
            justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar pregunta
        </Button>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Crear quiz
      </Button>
    </form>
  );
}
