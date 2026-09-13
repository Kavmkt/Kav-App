import { canChangeSelection, daysUntil, formatDate } from '../../utils/dateHelpers';

export default function DatesList({ dates, selections, items, onSelectDate }) {
  if (!dates || dates.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        Nenhuma data de presente cadastrada ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {dates.map((date) => {
        const selection = selections[date];
        const item = selection ? items.find((candidate) => candidate.id === selection.itemId) : null;
        const editable = canChangeSelection(date);
        const remaining = daysUntil(date);

        return (
          <li
            key={date}
            className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              {item?.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-50 text-2xl">
                  🎁
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800">{formatDate(date)}</p>
                <p className="text-sm text-slate-500">
                  {item ? item.name : 'Nenhum item selecionado ainda'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {editable ? (
                remaining >= 0 &&
                remaining <= 30 && (
                  <span className="text-xs text-amber-600">{remaining} dias p/ trocar</span>
                )
              ) : (
                <span className="text-xs font-medium text-slate-400">
                  🔒 Prazo de troca encerrado
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectDate(date)}
                disabled={!editable}
                className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {item ? 'Trocar item' : 'Selecionar item'}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
