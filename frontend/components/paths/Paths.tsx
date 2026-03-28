"use client";
import { useLearningPaths } from "@/hooks/use-learning-paths";
import { usePermissions } from "@/hooks/use-permissions";
import { useState } from "react";
import { RoleGuard } from "../ui/role-guard";
import { Button } from "../ui/button";
import { Map, Plus } from "lucide-react";
import { EmptyState } from "../ui/empty-state";
import PathCard from "./PathCard";
import PathCreate from "./PathCreate";

const Paths = () => {
  const permissions = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: paths = [], isLoading } = useLearningPaths();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Rutas de Aprendizaje
          </h1>
          <p className="text-gray-500 mt-0.5">
            {paths.length} ruta{paths.length !== 1 ? "s" : ""} disponible
            {paths.length !== 1 ? "s" : ""}
          </p>
        </div>
        <RoleGuard allowIf={permissions.canCreateCourse}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Nueva ruta
          </Button>
        </RoleGuard>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Sin rutas de aprendizaje"
          description={
            permissions.canCreateCourse
              ? "Crea una ruta para agrupar cursos en una secuencia de aprendizaje"
              : "Aún no hay rutas de aprendizaje disponibles"
          }
          action={
            permissions.canCreateCourse
              ? {
                  label: "Crear primera ruta",
                  onClick: () => setCreateOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              canManage={permissions.canCreateCourse}
            />
          ))}
        </div>
      )}

      {/* Modal crear */}
      <PathCreate
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        setCreateOpen={setCreateOpen}
      />
    </div>
  );
};

export default Paths;
