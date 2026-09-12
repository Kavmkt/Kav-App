"use client";

import { useTransition } from "react";
import { toggleCoursePublishedAction } from "@/lib/admin/course-actions";

export function TogglePublishButton({
  courseId,
  published,
}: {
  courseId: string;
  published: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleCoursePublishedAction(courseId))}
      className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-50"
    >
      {published ? "Despublicar" : "Publicar"}
    </button>
  );
}
