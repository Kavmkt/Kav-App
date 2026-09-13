export default function Loader({ label = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
