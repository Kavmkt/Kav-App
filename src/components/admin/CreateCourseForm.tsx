"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createCourseAction,
  type CreateCourseState,
} from "@/lib/admin/course-actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Criando..." : "Criar curso"}
    </Button>
  );
}

export function CreateCourseForm() {
  const [state, formAction] = useActionState<CreateCourseState, FormData>(
    createCourseAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          Título do curso
        </label>
        <input
          name="title"
          required
          placeholder="Ex: Instagram para pequenos negócios"
          className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-foreground/60">
          Descrição
        </label>
        <input
          name="description"
          required
          placeholder="Uma frase sobre o curso"
          className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>
      <SubmitButton />
      {state.error && (
        <p className="text-xs text-red-700 sm:hidden">{state.error}</p>
      )}
    </form>
  );
}
