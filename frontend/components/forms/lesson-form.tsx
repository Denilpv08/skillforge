"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const lessonSchema = z.object({
  title: z.string().min(2, "El título es requerido"),
  content: z.string().optional(),
  video_url: z.string().url("URL inválida").optional().or(z.literal("")),
  duration_min: z.coerce.number().min(1).optional(),
  is_free: z.boolean().default(false),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;
type LessonFormInput = z.input<typeof lessonSchema>;

interface LessonFormProps {
  onSubmit: (values: LessonFormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<LessonFormValues>;
  submitLabel?: string;
}

export function LessonForm({
  onSubmit,
  loading = false,
  defaultValues,
  submitLabel = "Guardar lección",
}: LessonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonFormInput, unknown, LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="title"
        label="Título de la lección"
        placeholder="Ej: Introducción a los componentes"
        error={errors.title?.message}
        {...register("title")}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Contenido{" "}
          <span className="text-gray-400 font-normal">
            (Markdown soportado)
          </span>
        </label>
        <textarea
          className="w-full rounded-lg text-black border border-gray-300 px-3 py-2 text-sm
            font-mono outline-none focus:border-indigo-500 focus:ring-2
            focus:ring-indigo-500/20 min-h-45 resize-y"
          placeholder="## Introducción&#10;&#10;En esta lección aprenderás..."
          {...register("content")}
        />
      </div>

      <Input
        id="video_url"
        label="URL del video"
        placeholder="https://youtube.com/..."
        helperText="YouTube, Vimeo o cualquier URL de video"
        error={errors.video_url?.message}
        {...register("video_url")}
      />

      <Input
        id="duration_min"
        type="number"
        label="Duración estimada (minutos)"
        placeholder="15"
        error={errors.duration_min?.message}
        {...register("duration_min")}
      />

      {/* Toggle is_free */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <Input
            type="checkbox"
            className="sr-only peer"
            {...register("is_free")}
          />
          <div
            className="w-10 h-6 bg-gray-200 rounded-full peer
            peer-checked:bg-indigo-600 transition-colors"
          />
          <div
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
            shadow transition-transform peer-checked:translate-x-4"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Lección gratuita</p>
          <p className="text-xs text-gray-400">
            Visible para usuarios no inscritos como vista previa
          </p>
        </div>
      </label>

      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
