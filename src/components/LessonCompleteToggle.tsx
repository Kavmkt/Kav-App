"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toggleLessonCompleteAction } from "@/lib/data/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function LessonCompleteToggle({
  lessonId,
  courseSlug,
  completed,
}: {
  lessonId: string;
  courseSlug: string;
  completed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      toggleLessonCompleteAction(lessonId, courseSlug, !completed);
    });
  }

  return (
    <Button
      variant={completed ? "secondary" : "primary"}
      onClick={handleClick}
      disabled={isPending}
      className={cn(completed && "text-emerald-300")}
    >
      <CheckCircle2 size={16} />
      {completed ? "Aula concluída" : "Marcar como concluída"}
    </Button>
  );
}
