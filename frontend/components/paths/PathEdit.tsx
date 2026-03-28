import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdatePath } from "@/hooks/use-learning-paths";
import z from "zod";
import { LearningPath } from "@/types/course";

interface PathEditProps {
  path: LearningPath;
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
}

const pathSchema = z.object({
  title: z.string().min(2, "El título es requerido"),
  description: z.string().optional(),
});

type PathFormValues = z.infer<typeof pathSchema>;

const PathEdit = ({ path, editOpen, setEditOpen }: PathEditProps) => {
  const updatePath = useUpdatePath();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PathFormValues>({
    resolver: zodResolver(pathSchema),
    defaultValues: { title: path.title, description: path.description ?? "" },
  });

  return (
    <Modal
      open={editOpen}
      onClose={() => setEditOpen(false)}
      title="Editar ruta"
    >
      <form
        onSubmit={handleSubmit((values) =>
          updatePath.mutate(
            { pathId: path.id, data: values },
            { onSuccess: () => setEditOpen(false) },
          ),
        )}
        className="space-y-4"
      >
        <Input
          id="title"
          label="Título"
          error={errors.title?.message}
          {...register("title")}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            className="w-full rounded-lg text-black border border-gray-300 px-3 py-2 text-sm
                    outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                    min-h-20 resize-none"
            {...register("description")}
          />
        </div>
        <Button type="submit" className="w-full" loading={updatePath.isPending}>
          Guardar cambios
        </Button>
      </form>
    </Modal>
  );
};

export default PathEdit;
