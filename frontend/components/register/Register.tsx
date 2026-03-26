"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";
import { registerSchema, RegisterFormValues } from "@/lib/validators/auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Register = () => {
  const { register: registerUser, loading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SkillForge</h1>
          <p className="text-gray-500 mt-1">Crea tu organización</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(registerUser)} className="space-y-5">
            <Input
              id="organization_name"
              label="Nombre de la organización"
              placeholder="Mi Empresa"
              error={errors.organization_name?.message}
              {...register("organization_name")}
            />

            <Input
              id="full_name"
              label="Tu nombre completo"
              placeholder="Juan Pérez"
              error={errors.full_name?.message}
              {...register("full_name")}
            />

            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              id="password"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              helperText="Mínimo 8 caracteres, una mayúscula y un número"
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              id="confirm_password"
              type="password"
              label="Confirmar contraseña"
              placeholder="••••••••"
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
