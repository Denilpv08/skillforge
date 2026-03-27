"use client";
import Link from "next/link";
import { GraduationCap, Trophy, Clock } from "lucide-react";
import { useMyEnrollments } from "@/hooks/use-courses";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

const MyLearning = () => {
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  const inProgress = enrollments.filter((e) => !e.completed_at);
  const completed = enrollments.filter((e) => !!e.completed_at);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Aprendizaje</h1>
        <p className="text-gray-500 mt-0.5">
          {enrollments.length} cursos en total
        </p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Aún no tienes cursos"
          description="Explora el catálogo e inscríbete en tu primer curso"
          action={{
            label: "Explorar cursos",
            onClick: () => (window.location.href = "/dashboard/courses"),
          }}
        />
      ) : (
        <>
          {/* En progreso */}
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                En progreso ({inProgress.length})
              </h2>
              <div className="space-y-3">
                {inProgress.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/dashboard/courses/${enrollment.course_id}`}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="flex items-center gap-5 py-4">
                        {/* Thumbnail mini */}
                        <div className="w-16 h-16 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center">
                          <GraduationCap className="w-7 h-7 text-white/80" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {enrollment.course.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Inscrito el {formatDate(enrollment.enrolled_at)}
                          </p>
                          <div className="mt-2">
                            <Progress
                              value={Number(enrollment.progress_pct)}
                              showLabel
                              size="sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Completados */}
          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-green-500" />
                Completados ({completed.length})
              </h2>
              <div className="space-y-3">
                {completed.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="flex items-center gap-5 py-4">
                      <div className="w-16 h-16 rounded-xl bg-green-100 shrink-0 flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-green-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {enrollment.course.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Completado el{" "}
                          {enrollment.completed_at
                            ? formatDate(enrollment.completed_at)
                            : "—"}
                        </p>
                      </div>

                      <Badge variant="success">Completado</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default MyLearning;
