"use client";
import { usePermissions } from "@/hooks/use-permissions";
import { useUsers } from "@/hooks/use-users";
import { useAuthStore } from "@/store/auth-store";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { UserPlus } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import UserList from "./UserList";
import UserCreate from "./UserCreate";

const Users = () => {
  const permissions = usePermissions();
  const { user: currentUser } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);

  // Solo ADMIN y SUPER_ADMIN pueden ver esta página
  if (!permissions.canManageUsers) return notFound();

  const { data: users = [], isLoading } = useUsers();

  // Stats rápidas
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    instructors: users.filter((u) => u.role === "INSTRUCTOR").length,
    students: users.filter((u) => u.role === "STUDENT").length,
    inactive: users.filter((u) => !u.is_active).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-0.5">
            {stats.total} miembros en la organización
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-gray-700" },
          {
            label: "Instructores",
            value: stats.instructors,
            color: "text-amber-600",
          },
          {
            label: "Estudiantes",
            value: stats.students,
            color: "text-indigo-600",
          },
          { label: "Inactivos", value: stats.inactive, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla de usuarios */}
      <UserList
        users={users}
        isLoading={isLoading}
        currentUserId={currentUser?.id ?? ""}
        setModalOpen={setModalOpen}
      />

      {/* Modal crear usuario */}
      <UserCreate modalOpen={modalOpen} setModalOpen={setModalOpen} />
    </div>
  );
};

export default Users;
