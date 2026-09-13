import { useState } from 'react';
import ItemGallery from './ItemGallery';
import { formatDate } from '../../utils/dateHelpers';

export default function ItemSelectionModal({ date, items, currentItemId, onConfirm, onClose }) {
  const [chosenItem, setChosenItem] = useState(
    items.find((item) => item.id === currentItemId) || null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!chosenItem) {
      setError('Escolha um item antes de confirmar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onConfirm(chosenItem);
    } catch (err) {
      console.error(err);
      setError('Não foi possível salvar sua escolha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-rose-500">
              Escolher presente
            </p>
            <h3 className="text-lg font-semibold text-slate-800">{formatDate(date)}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <ItemGallery items={items} selectedItemId={chosenItem?.id} onSelect={setChosenItem} />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !chosenItem}
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Confirmar escolha'}
          </button>
        </div>
      </div>
    </div>
  );
}
