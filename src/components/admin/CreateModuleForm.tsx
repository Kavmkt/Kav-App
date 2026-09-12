"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createModuleAction,
  type CreateModuleState,
} from "@/lib/admin/course-actions";
import { Button } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "Adicionando..." : "Adicionar módulo"}
    </Button>
  );
}

export function CreateModuleForm({ courseId }: { courseId: string }) {
  const action = createModuleAction.bind(null, courseId);
  const [state, formAction] = useActionState<CreateModuleState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <input
          name="title"
          required
          placeholder="Título do novo módulo"
          className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
        {state.error && (
          <p className="mt-1 text-xs text-red-700">{state.error}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
