import {
  BookOpen,
  ChevronRight,
  Lock,
  Map,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { LearningPath } from "@/types/course";

interface PathInfoProps {
  path: LearningPath;
  canManage: boolean;
  setEditOpen: (open: boolean) => void;
  setConfirmDelete: (open: boolean) => void;
}

const PathInfo = ({
  path,
  canManage,
  setEditOpen,
  setConfirmDelete,
}: PathInfoProps) => {
  const publishedCourses = path.path_courses.filter(
    (pc) => pc.course.status === "PUBLISHED",
  );

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          {/* Icono */}
          <div className="p-3 rounded-xl bg-indigo-100 shrink-0">
            <Map className="w-6 h-6 text-indigo-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {path.title}
                </h3>
                {path.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {path.description}
                  </p>
                )}
              </div>

              {/* Acciones admin */}
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    onClick={() => setEditOpen(true)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Cursos de la ruta */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <BookOpen className="w-4 h-4" />
                <span>
                  {path.path_courses.length} curso
                  {path.path_courses.length !== 1 ? "s" : ""}
                </span>
              </div>
              {path.path_courses.length > 0 && (
                <>
                  <span className="text-gray-200">·</span>
                  <Badge variant="success">
                    {publishedCourses.length} publicados
                  </Badge>
                  {path.path_courses.some((pc) => pc.is_required) && (
                    <Badge variant="info">
                      {path.path_courses.filter((pc) => pc.is_required).length}{" "}
                      requeridos
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Preview de cursos */}
            {path.path_courses.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {path.path_courses.slice(0, 3).map((pc, idx) => (
                  <span
                    key={pc.course.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5
                        bg-gray-100 rounded-full text-xs text-gray-600"
                  >
                    <span className="text-gray-400">{idx + 1}.</span>
                    {pc.course.title}
                    {!pc.is_required && (
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                    )}
                  </span>
                ))}
                {path.path_courses.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-400">
                    +{path.path_courses.length - 3} más
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
          <Link href={`/dashboard/paths/${path.id}`}>
            <Button variant="secondary" size="sm">
              Ver detalle
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default PathInfo;
