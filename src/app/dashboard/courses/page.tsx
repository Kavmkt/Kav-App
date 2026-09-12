import Link from "next/link";
import { GraduationCap, PlayCircle } from "lucide-react";
import { requireClientSession } from "@/lib/auth/guards";
import { getCoursesForUser } from "@/lib/data/queries";
import { Card, CardContent } from "@/components/ui/Card";

export default async function CoursesPage() {
  const session = await requireClientSession();
  const courses = await getCoursesForUser(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Cursos</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Conteúdos para você aprender e extrair mais resultado das suas
          redes e campanhas.
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-foreground/50">
            Nenhum curso disponível ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div
                  className="flex h-28 items-center justify-center rounded-t-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${course.coverColor}, #12131a22)`,
                  }}
                >
                  <GraduationCap className="text-white" size={30} />
                </div>
                <CardContent>
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
                    {course.description}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/50">
                      <span className="flex items-center gap-1">
                        <PlayCircle size={13} /> {course.totalLessons} aulas
                      </span>
                      <span>{course.progressPct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/[0.06]">
                      <div
                        className="h-1.5 rounded-full bg-brand"
                        style={{ width: `${course.progressPct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
