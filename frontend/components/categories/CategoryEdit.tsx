import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateCategory } from "@/hooks/use-courses";
import z from "zod";
import { Category } from "@/types/course";

interface CategoryEditProps {
  category: Category;
  setEditOpen: (open: boolean) => void;
}

const categorySchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const CategoryEdit = ({ category, setEditOpen }: CategoryEditProps) => {
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      description: category.description ?? "",
    },
  });

  const onEdit = (values: CategoryFormValues) => {
    updateCategory.mutate(
      { id: category.id, data: values },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  return (
    <form onSubmit={handleSubmit(onEdit)} className="space-y-4">
      <Input
        id="name"
        label="Nombre"
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          className="w-full rounded-lg border text-black border-gray-300 px-3 py-2 text-sm
                    outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                    min-h-20 resize-none"
          {...register("description")}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        loading={updateCategory.isPending}
      >
        Actualizar Categoría
      </Button>
    </form>
  );
};

export default CategoryEdit;
