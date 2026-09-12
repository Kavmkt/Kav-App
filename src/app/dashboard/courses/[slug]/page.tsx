import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { requireClientSession } from "@/lib/auth/guards";
import { getCourseDetail } from "@/lib/data/queries";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireClientSession();
  const detail = await getCourseDetail(slug, session.userId);
  if (!detail) notFound();

  const { course, completedLessonIds } = detail;
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const firstIncomplete =
    allLessons.find((l) => !completedLessonIds.has(l.id)) ?? allLessons[0];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/courses"
          className="text-xs font-medium text-brand hover:underline"
        >
          ← Voltar para cursos
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground/60">
          {course.description}
        </p>
      </div>

      {firstIncomplete && (
        <Link
          href={`/dashboard/courses/${course.slug}/${firstIncomplete.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <PlayCircle size={16} />
          {completedLessonIds.size === 0 ? "Começar curso" : "Continuar curso"}
        </Link>
      )}

      <div className="space-y-4">
        {course.modules.map((module, moduleIdx) => (
          <Card key={module.id}>
            <CardContent>
              <h3 className="mb-3 text-sm font-semibold text-foreground/70">
                Módulo {moduleIdx + 1}: {module.title}
              </h3>
              <div className="space-y-1">
                {module.lessons.map((lesson) => {
                  const completed = completedLessonIds.has(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      href={`/dashboard/courses/${course.slug}/${lesson.id}`}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-black/[0.03]"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        {completed ? (
                          <CheckCircle2 size={17} className="text-emerald-600" />
                        ) : (
                          <Circle size={17} className="text-foreground/30" />
                        )}
                        <span
                          className={completed ? "text-foreground/50 line-through" : ""}
                        >
                          {lesson.title}
                        </span>
                      </span>
                      <span className="text-xs text-foreground/40">
                        {lesson.durationMinutes} min
                      </span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
