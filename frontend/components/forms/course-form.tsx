"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-courses";

export type CourseFormValues = {
  title: string;
  description?: string;
  thumbnail_url?: string;
  category_id?: string;
  duration_hours?: number;
};

const courseSchema = z.object({
  title: z.string().min(2, "El título es requerido"),
  description: z.string().optional(),
  thumbnail_url: z.string().url("URL inválida").optional().or(z.literal("")),
  category_id: z.string().optional(),
  duration_hours: z.union([z.string(), z.number()]).optional(),
});

interface CourseFormProps {
  onSubmit: (values: CourseFormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<CourseFormValues>;
}

export function CourseForm({
  onSubmit,
  loading = false,
  defaultValues,
}: CourseFormProps) {
  const { data: categories = [] } = useCategories();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema as any),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="title"
        label="Título del curso"
        placeholder="Ej: Introducción a TypeScript"
        error={errors.title?.message}
        {...register("title")}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          className="w-full rounded-lg border text-black border-gray-300 px-3 py-2 text-sm
            outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
            min-h-25 resize-none"
          placeholder="Describe el contenido del curso..."
          {...register("description")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Categoría</label>
        <select
          className="w-full rounded-lg text-black border border-gray-300 px-3 py-2 text-sm
            outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          {...register("category_id")}
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="duration_hours"
          type="number"
          label="Duración (horas)"
          placeholder="0"
          error={errors.duration_hours?.message}
          {...register("duration_hours")}
        />

        <Input
          id="thumbnail_url"
          label="URL de thumbnail"
          placeholder="https://..."
          error={errors.thumbnail_url?.message}
          {...register("thumbnail_url")}
        />
      </div>

      <Button type="submit" className="w-full" loading={loading}>
        Guardar curso
      </Button>
    </form>
  );
}
