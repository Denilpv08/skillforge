import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useCreatePath } from "@/hooks/use-learning-paths";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

interface PathCreateProps {
  open: boolean;
  onClose: () => void;
  setCreateOpen: (open: boolean) => void;
}

const pathSchema = z.object({
  title: z.string().min(2, "El título es requerido"),
  description: z.string().optional(),
});

type PathFormValues = z.infer<typeof pathSchema>;

const PathCreate = ({ open, onClose, setCreateOpen }: PathCreateProps) => {
  const createPath = useCreatePath();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PathFormValues>({ resolver: zodResolver(pathSchema) });
  const onSubmit = (values: PathFormValues) => {
    createPath.mutate(
      { ...values, courses: [] },
      {
        onSuccess: () => {
          reset();
          setCreateOpen(false);
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva ruta de aprendizaje">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="title"
          label="Título de la ruta"
          placeholder="Ej: Desarrollo Web Full Stack"
          error={errors.title?.message}
          {...register("title")}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Descripción{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            className="w-full rounded-lg text-black border border-gray-300 px-3 py-2 text-sm
                outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                min-h-20 resize-none"
            placeholder="Describe qué aprenderá el estudiante en esta ruta..."
            {...register("description")}
          />
        </div>
        <p className="text-xs text-gray-400">
          Podrás agregar y ordenar cursos después de crear la ruta.
        </p>
        <Button type="submit" className="w-full" loading={createPath.isPending}>
          Crear ruta
        </Button>
      </form>
    </Modal>
  );
};

export default PathCreate;
