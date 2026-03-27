"use client";
import { Category } from "@/types/course";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "../ui/modal";
import CategoryEdit from "./CategoryEdit";
import CategoryDelete from "./CategoryDelete";

interface CategoryProps {
  category: Category;
  canManage: boolean;
}

const CategoryRow = ({ category, canManage }: CategoryProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4 py-3.5 px-2">
        <div className="p-2 rounded-lg bg-indigo-50">
          <Tag className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{category.name}</p>
          {category.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {category.description}
            </p>
          )}
          <p className="text-xs text-gray-300 mt-0.5">/{category.slug}</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg cursor-pointer hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modal editar */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar categoría"
      >
        <CategoryEdit category={category} setEditOpen={setEditOpen} />
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar categoría"
      >
        <CategoryDelete
          category={category}
          setConfirmDelete={setConfirmDelete}
        />
      </Modal>
    </>
  );
};

export default CategoryRow;
