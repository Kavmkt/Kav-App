import { Logo } from "./Logo";

/**
 * Único lugar (além do menu) onde o nome/marca da agência aparece — por
 * instrução do time, a marca fica restrita a essas duas áreas do app.
 */
export function Footer() {
  return (
    <footer className="mt-10 border-t border-border-subtle px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo variant="compact" className="opacity-90" />
        <p className="text-xs text-foreground/40">
          © {new Date().getFullYear()} Kav Marketing e Performance. Todos os
          direitos reservados.
        </p>
      </div>
    </footer>
  );
}
