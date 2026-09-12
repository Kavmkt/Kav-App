"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteModuleAction } from "@/lib/admin/course-actions";

export function DeleteModuleButton({
  moduleId,
  courseId,
}: {
  moduleId: string;
  courseId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(() => deleteModuleAction(moduleId, courseId))
      }
      className="flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      <Trash2 size={13} /> Remover módulo
    </button>
  );
}
