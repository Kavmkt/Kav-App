import Link from "next/link";
import { CreateClientForm } from "@/components/admin/CreateClientForm";
import { Card, CardContent } from "@/components/ui/Card";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-xs font-medium text-brand hover:underline"
        >
          ← Voltar para clientes
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Novo cliente
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Crie um login de acesso para que o cliente acompanhe suas métricas.
        </p>
      </div>
      <Card>
        <CardContent>
          <CreateClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
