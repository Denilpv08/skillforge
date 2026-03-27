import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../ui/empty-state";
import { Card, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { formatDate } from "@/lib/utils";
import { useMyEnrollments } from "@/hooks/use-courses";

const DashBoardCourses = () => {
  const { data: enrollments = [], isLoading: enrollLoading } =
    useMyEnrollments();

  const recentEnrollments = enrollments.slice(0, 3);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Continuar aprendiendo</h2>
        <Link
          href="/dashboard/my-learning"
          className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
        >
          Ver todo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {enrollLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : recentEnrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin cursos aún"
          description="Explora el catálogo y empieza tu primer curso"
          action={{
            label: "Explorar cursos",
            onClick: () => (window.location.href = "/dashboard/courses"),
          }}
        />
      ) : (
        <div className="space-y-3">
          {recentEnrollments.map((enrollment) => (
            <Link
              key={enrollment.id}
              href={`/dashboard/courses/${enrollment.course_id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {enrollment.course.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Desde {formatDate(enrollment.enrolled_at)}
                    </p>
                    <div className="mt-2">
                      <Progress
                        value={Number(enrollment.progress_pct)}
                        showLabel
                        size="sm"
                      />
                    </div>
                  </div>
                  {enrollment.completed_at && (
                    <Badge variant="success">✓</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashBoardCourses;
