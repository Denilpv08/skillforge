import { useDeletePath } from "@/hooks/use-learning-paths";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { LearningPath } from "@/types/course";

interface PathDeleteProps {
  path: LearningPath;
  confirmDelete: boolean;
  setConfirmDelete: (value: boolean) => void;
}

const PathDelete = ({
  path,
  confirmDelete,
  setConfirmDelete,
}: PathDeleteProps) => {
  const deletePath = useDeletePath();

  return (
    <Modal
      open={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      title="Eliminar ruta"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          ¿Eliminar la ruta{" "}
          <span className="font-semibold">"{path.title}"</span>? Los cursos
          asignados no serán eliminados.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            loading={deletePath.isPending}
            onClick={() =>
              deletePath.mutate(path.id, {
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
    </Modal>
  );
};

export default PathDelete;
