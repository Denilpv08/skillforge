"use client";
import {
  Clock,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Lesson } from "@/types/course";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useReorderLessons } from "@/hooks/use-courses";

interface LessonProps {
  ordered: Lesson[];
  canEdit: boolean;
  setOrdered: (lessons: Lesson[]) => void;
  setCreateOpen: (open: boolean) => void;
  setEditLesson: (lesson: Lesson | null) => void;
  setDeleteLesson: (lesson: Lesson | null) => void;
  courseId: string;
}

const LessonList = ({
  ordered,
  canEdit,
  setOrdered,
  setCreateOpen,
  setEditLesson,
  setDeleteLesson,
  courseId,
}: LessonProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const reorder = useReorderLessons(courseId);

  const onDragStart = (index: number) => setDragIndex(index);

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newOrder = [...ordered];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(index, 0, moved);
    setOrdered(newOrder);
    setDragIndex(index);
  };

  const onDragEnd = () => {
    setDragIndex(null);
    // Guardar nuevo orden en el backend
    reorder.mutate(ordered.map((l) => l.id));
  };

  return (
    <>
      {ordered.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            Este curso no tiene lecciones aún
          </p>
          {canEdit && (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Agregar primera lección
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {ordered.map((lesson, index) => (
            <div
              key={lesson.id}
              draggable={canEdit}
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border transition-all",
                dragIndex === index
                  ? "border-indigo-300 bg-indigo-50 shadow-md scale-[1.01]"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              {/* Drag handle */}
              {canEdit && (
                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}

              {/* Número */}
              <span className="text-sm font-semibold text-gray-400 w-6 text-center shrink-0">
                {index + 1}
              </span>

              {/* Icono tipo */}
              <div className="shrink-0">
                {lesson.video_url ? (
                  <Play className="w-4 h-4 text-indigo-500" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {lesson.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {lesson.duration_min && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {lesson.duration_min} min
                    </span>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 shrink-0">
                {lesson.is_free ? (
                  <Badge variant="info">
                    <Eye className="w-3 h-3 mr-1" />
                    Gratis
                  </Badge>
                ) : (
                  <span className="text-gray-300">
                    <EyeOff className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Acciones */}
              {canEdit && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    onClick={() => setEditLesson(lesson)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => setDeleteLesson(lesson)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default LessonList;
