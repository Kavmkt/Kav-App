import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CreateModuleForm } from "@/components/admin/CreateModuleForm";
import { CreateLessonForm } from "@/components/admin/CreateLessonForm";
import { DeleteModuleButton } from "@/components/admin/DeleteModuleButton";
import { DeleteLessonButton } from "@/components/admin/DeleteLessonButton";

export default async function AdminCourseManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/courses"
          className="text-xs font-medium text-brand hover:underline"
        >
          ← Voltar para cursos
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <p className="mt-1 text-sm text-foreground/60">{course.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar módulo</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateModuleForm courseId={course.id} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {course.modules.map((module, idx) => (
          <Card key={module.id}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/70">
                  Módulo {idx + 1}: {module.title}
                </h3>
                <DeleteModuleButton moduleId={module.id} courseId={course.id} />
              </div>

              <div className="space-y-1.5">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-sm"
                  >
                    <span>{lesson.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-foreground/40">
                        {lesson.durationMinutes} min
                      </span>
                      <DeleteLessonButton
                        lessonId={lesson.id}
                        courseId={course.id}
                      />
                    </div>
                  </div>
                ))}
                {module.lessons.length === 0 && (
                  <p className="text-xs text-foreground/40">
                    Nenhuma aula neste módulo ainda.
                  </p>
                )}
              </div>

              <CreateLessonForm moduleId={module.id} courseId={course.id} />
            </CardContent>
          </Card>
        ))}
        {course.modules.length === 0 && (
          <p className="text-sm text-foreground/50">
            Nenhum módulo criado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
