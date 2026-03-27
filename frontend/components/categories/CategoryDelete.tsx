import { useDeleteCategory } from "@/hooks/use-courses";
import { Button } from "../ui/button";
import { Category } from "@/types/course";

interface CategoryDeleteProps {
  category: Category;
  setConfirmDelete: (value: boolean) => void;
}

const CategoryDelete = ({
  category,
  setConfirmDelete,
}: CategoryDeleteProps) => {
  const deleteCategory = useDeleteCategory();

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ¿Estás seguro de que deseas eliminar{" "}
        <span className="font-semibold">"{category.name}"</span>? Los cursos con
        esta categoría quedarán sin clasificar.
      </p>
      <div className="flex gap-3">
        <Button
          variant="danger"
          className="flex-1"
          loading={deleteCategory.isPending}
          onClick={() =>
            deleteCategory.mutate(category.id, {
              onSuccess: () => setConfirmDelete(false),
            })
          }
        >
          Eliminar
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setConfirmDelete(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default CategoryDelete;
