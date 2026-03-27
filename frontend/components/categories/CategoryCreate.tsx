import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "../ui/input";
import { coursesApi } from "@/lib/api/courses";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "sonner";
import { courseKeys } from "@/hooks/use-courses";
import { Button } from "../ui/button";

interface CategoryProps {
  setCreateOpen: (open: boolean) => void;
}

const categorySchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const CategoryCreate = ({ setCreateOpen }: CategoryProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) });

  const createCategory = useMutation({
    mutationFn: (data: CategoryFormValues) => coursesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.categories });
      toast.success("Categoría creada");
      reset();
      setCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail ?? "Error al crear categoría");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => createCategory.mutate(v))}
      className="space-y-4"
    >
      <Input
        id="name"
        label="Nombre"
        placeholder="Ej: Desarrollo Web"
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Descripción <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          className="w-full rounded-lg border text-black border-gray-300 px-3 py-2 text-sm
                outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                min-h-20 resize-none"
          placeholder="Describe esta categoría..."
          {...register("description")}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        loading={createCategory.isPending}
      >
        Crear categoría
      </Button>
    </form>
  );
};

export default CategoryCreate;
