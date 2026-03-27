"use client";
import { useCategories } from "@/hooks/use-courses";
import { usePermissions } from "@/hooks/use-permissions";
import { useState } from "react";
import { RoleGuard } from "../ui/role-guard";
import { Button } from "../ui/button";
import { Plus, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import CategoryRow from "./CategoryRow";
import { Modal } from "../ui/modal";
import CategoryCreate from "./CategoryCreate";

const Categories = () => {
  const permissions = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 mt-0.5">
            {categories.length} categorías registradas
          </p>
        </div>
        <RoleGuard allowIf={permissions.canManageUsers}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Nueva categoría
          </Button>
        </RoleGuard>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-800">
              Todas las categorías
            </h2>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 py-0">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Sin categorías"
              description="Crea categorías para organizar tus cursos"
              action={
                permissions.canManageUsers
                  ? {
                      label: "Crear categoría",
                      onClick: () => setCreateOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                canManage={permissions.canManageUsers}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal crear */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva categoría"
      >
        <CategoryCreate setCreateOpen={setCreateOpen} />
      </Modal>
    </div>
  );
};

export default Categories;
