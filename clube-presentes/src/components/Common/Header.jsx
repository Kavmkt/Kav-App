import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/auth';

export default function Header() {
  const { profile, user } = useAuth();

  const displayName = profile?.name || user?.email || 'Cliente';

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-rose-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-lg font-semibold text-rose-600">🎁 Clube de Presentes</p>
          <p className="text-xs text-slate-500">Lily Cestas</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">Olá, {displayName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-rose-200 px-4 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
