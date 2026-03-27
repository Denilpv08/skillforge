"use client";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { BookOpen } from "lucide-react";
import { useCourses, useCreateCourse } from "@/hooks/use-courses";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseForm, CourseFormValues } from "@/components/forms/course-form";
import { useAuthStore } from "@/store/auth-store";
import { CourseStatus } from "@/types/course";

const STATUS_FILTERS: { label: string; value: CourseStatus | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Publicados", value: "PUBLISHED" },
  { label: "Borradores", value: "DRAFT" },
  { label: "Archivados", value: "ARCHIVED" },
];

const Courses = () => {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CourseStatus | undefined>();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useCourses({ status: statusFilter });
  const createCourse = useCreateCourse();

  const canCreate = ["ADMIN", "SUPER_ADMIN", "INSTRUCTOR"].includes(
    user?.role ?? "",
  );

  const courses = data?.data ?? [];
  const filtered = search
    ? courses.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase()),
      )
    : courses;

  const handleCreate = (values: CourseFormValues) => {
    const payload = {
      ...values,
      duration_hours:
        typeof values.duration_hours === "string"
          ? Number(values.duration_hours) || undefined
          : values.duration_hours,
    };
    createCourse.mutate(payload, {
      onSuccess: () => setModalOpen(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-500 mt-0.5">
            {data?.total ?? 0} cursos disponibles
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo curso
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cursos..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm
              outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex gap-2">
          {STATUS_FILTERS.map(({ label, value }) => (
            <Button
              key={label}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No hay cursos"
          description={
            canCreate
              ? "Crea el primer curso de tu organización"
              : "Aún no hay cursos publicados en tu organización"
          }
          action={
            canCreate
              ? {
                  label: "Crear primer curso",
                  onClick: () => setModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              showStatus={canCreate}
            />
          ))}
        </div>
      )}

      {/* Modal crear curso */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear nuevo curso"
      >
        <CourseForm onSubmit={handleCreate} loading={createCourse.isPending} />
      </Modal>
    </div>
  );
};

export default Courses;
