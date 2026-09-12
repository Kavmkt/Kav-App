import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { requireClientSession } from "@/lib/auth/guards";
import { getCourseDetail } from "@/lib/data/queries";
import { Card, CardContent } from "@/components/ui/Card";
import { LessonCompleteToggle } from "@/components/LessonCompleteToggle";
import { cn } from "@/lib/utils";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const session = await requireClientSession();
  const detail = await getCourseDetail(slug, session.userId);
  if (!detail) notFound();

  const { course, completedLessonIds } = detail;
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const lesson = allLessons[currentIndex];
  if (!lesson) notFound();

  const prevLesson = allLessons[currentIndex - 1];
  const nextLesson = allLessons[currentIndex + 1];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div>
          <Link
            href={`/dashboard/courses/${course.slug}`}
            className="text-xs font-medium text-brand hover:underline"
          >
            ← {course.title}
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            {lesson.title}
          </h1>
        </div>

        {lesson.videoUrl ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <video
              controls
              src={lesson.videoUrl}
              className="h-full w-full"
            />
          </div>
        ) : (
          <div
            className="flex aspect-video items-center justify-center rounded-2xl text-white"
            style={{
              background: `linear-gradient(135deg, ${course.coverColor}, #12131a)`,
            }}
          >
            <PlayCircle size={48} className="opacity-80" />
          </div>
        )}

        <Card>
          <CardContent className="prose prose-sm max-w-none whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {lesson.content}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          {prevLesson ? (
            <Link
              href={`/dashboard/courses/${course.slug}/${prevLesson.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
            >
              <ChevronLeft size={16} /> Anterior
            </Link>
          ) : (
            <span />
          )}

          <LessonCompleteToggle
            lessonId={lesson.id}
            courseSlug={course.slug}
            completed={completedLessonIds.has(lesson.id)}
          />

          {nextLesson ? (
            <Link
              href={`/dashboard/courses/${course.slug}/${nextLesson.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
            >
              Próxima <ChevronRight size={16} />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

      <Card className="h-fit">
        <CardContent>
          <h3 className="mb-3 text-sm font-semibold text-foreground/70">
            Conteúdo do curso
          </h3>
          <div className="space-y-3">
            {course.modules.map((module) => (
              <div key={module.id}>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground/40">
                  {module.title}
                </p>
                <div className="space-y-0.5">
                  {module.lessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/dashboard/courses/${course.slug}/${l.id}`}
                      className={cn(
                        "block rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-white/[0.07]",
                        l.id === lesson.id &&
                          "bg-brand-soft font-medium text-brand",
                        completedLessonIds.has(l.id) &&
                          l.id !== lesson.id &&
                          "text-foreground/40"
                      )}
                    >
                      {l.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
