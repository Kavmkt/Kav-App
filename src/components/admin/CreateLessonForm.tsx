"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import {
  createLessonAction,
  type CreateLessonState,
} from "@/lib/admin/course-actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Salvando..." : "Adicionar aula"}
    </Button>
  );
}

export function CreateLessonForm({
  moduleId,
  courseId,
}: {
  moduleId: string;
  courseId: string;
}) {
  const [open, setOpen] = useState(false);
  const action = createLessonAction.bind(null, moduleId, courseId);
  const [state, formAction] = useActionState<CreateLessonState, FormData>(
    action,
    {}
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
      >
        <Plus size={13} /> Adicionar aula
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-lg border border-border-subtle bg-white/[0.05] p-3"
    >
      <input
        name="title"
        required
        placeholder="Título da aula"
        className="w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
      />
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Conteúdo / texto de apoio da aula"
        className="w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
      />
      <div className="flex gap-2">
        <input
          name="videoUrl"
          placeholder="URL do vídeo (opcional)"
          className="flex-1 rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
        <input
          name="durationMinutes"
          type="number"
          min={1}
          defaultValue={10}
          className="w-24 rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      {state.error && (
        <p className="text-xs text-red-300">{state.error}</p>
      )}
      <div className="flex gap-2">
        <SubmitButton />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
