import Link from "next/link";
import { GraduationCap, PlayCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CreateCourseForm } from "@/components/admin/CreateCourseForm";
import { TogglePublishButton } from "@/components/admin/TogglePublishButton";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { modules: { include: { lessons: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Cursos</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Gerencie os cursos disponíveis para os clientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo curso</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCourseForm />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const lessonsCount = course.modules.reduce(
            (sum, m) => sum + m.lessons.length,
            0
          );
          return (
            <Card key={course.id}>
              <div
                className="flex h-24 items-center justify-center rounded-t-3xl"
                style={{
                  background: `linear-gradient(135deg, ${course.coverColor}, #12131a22)`,
                }}
              >
                <GraduationCap className="text-white" size={26} />
              </div>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{course.title}</h3>
                  <Badge tone={course.published ? "green" : "gray"}>
                    {course.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/60">
                  {course.description}
                </p>
                <p className="flex items-center gap-1 text-xs text-foreground/40">
                  <PlayCircle size={13} /> {course.modules.length} módulos ·{" "}
                  {lessonsCount} aulas
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium hover:bg-white/[0.06]"
                  >
                    Gerenciar conteúdo
                  </Link>
                  <TogglePublishButton
                    courseId={course.id}
                    published={course.published}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {courses.length === 0 && (
          <p className="text-sm text-foreground/50">
            Nenhum curso cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
