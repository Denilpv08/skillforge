import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateUser } from "@/hooks/use-users";
import z from "zod";

interface UserCreateProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const createUserSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

const UserCreate = ({ modalOpen, setModalOpen }: UserCreateProps) => {
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "STUDENT" },
  });

  const onSubmit = (values: CreateUserValues) => {
    createUser.mutate(values, {
      onSuccess: () => {
        reset();
        setModalOpen(false);
      },
    });
  };

  return (
    <Modal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      title="Crear nuevo usuario"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="full_name"
          label="Nombre completo"
          placeholder="Juan Pérez"
          error={errors.full_name?.message}
          {...register("full_name")}
        />
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="juan@empresa.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          id="password"
          type="password"
          label="Contraseña temporal"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Rol</label>
          <select
            className="w-full rounded-lg border text-black border-gray-300 px-3 py-2 text-sm
                outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            {...register("role")}
          >
            <option value="STUDENT">Estudiante</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
          </select>
          {errors.role && (
            <p className="text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" loading={createUser.isPending}>
          Crear usuario
        </Button>
      </form>
    </Modal>
  );
};

export default UserCreate;
