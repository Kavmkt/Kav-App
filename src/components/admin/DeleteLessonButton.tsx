"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteLessonAction } from "@/lib/admin/course-actions";

export function DeleteLessonButton({
  lessonId,
  courseId,
}: {
  lessonId: string;
  courseId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label="Remover aula"
      onClick={() =>
        startTransition(() => deleteLessonAction(lessonId, courseId))
      }
      className="text-foreground/30 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
