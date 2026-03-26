import Link from "next/link";
import { Clock, BookOpen } from "lucide-react";
import { Course } from "@/types/course";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  DRAFT: { label: "Borrador", variant: "warning" as const },
  PUBLISHED: { label: "Publicado", variant: "success" as const },
  ARCHIVED: { label: "Archivado", variant: "default" as const },
};

interface CourseCardProps {
  course: Course;
  showStatus?: boolean;
}

export function CourseCard({ course, showStatus = false }: CourseCardProps) {
  const status = statusConfig[course.status];

  return (
    <Link href={`/dashboard/courses/${course.id}`}>
      <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        {/* Thumbnail */}
        <div className="relative h-44 bg-linear-to-br from-indigo-500 to-purple-600 rounded-t-xl overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="w-12 h-12 text-white/60" />
            </div>
          )}
          {showStatus && (
            <div className="absolute top-3 right-3">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          )}
        </div>

        <CardContent className="py-4">
          {/* Category */}
          {course.category && (
            <p className="text-xs font-medium text-indigo-600 mb-1">
              {course.category.name}
            </p>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3">
            {course.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {course.duration_hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.duration_hours}h
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
