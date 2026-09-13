import { formatDate } from '../../utils/dateHelpers';

export default function PackageStatus({ pkg, subscription }) {
  if (!pkg || !subscription) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
        Nenhuma assinatura ativa encontrada. Fale com a equipe da Lily Cestas
        para ativar seu plano.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rose-500">
            Seu pacote
          </p>
          <h2 className="text-xl font-semibold text-slate-800">{pkg.name}</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          {subscription.status === 'active' ? 'Assinatura ativa' : subscription.status}
        </span>
      </div>

      {pkg.description && <p className="mt-2 text-sm text-slate-600">{pkg.description}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-400">Presentes no plano</dt>
          <dd className="font-medium text-slate-700">{pkg.totalDates ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Intervalo</dt>
          <dd className="font-medium text-slate-700">
            {pkg.intervalMonths ? `${pkg.intervalMonths} meses` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Início</dt>
          <dd className="font-medium text-slate-700">{formatDate(subscription.startDate)}</dd>
        </div>
      </dl>
    </div>
  );
}
