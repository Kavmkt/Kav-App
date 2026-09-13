import { useMemo, useState } from 'react';
import ItemCard from './ItemCard';

export default function ItemGallery({ items, selectedItemId, onSelect }) {
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const set = new Set(items.map((item) => item.category).filter(Boolean));
    return ['all', ...set];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (category === 'all') return items;
    return items.filter((item) => item.category === category);
  }, [items, category]);

  return (
    <div>
      {categories.length > 2 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                category === cat
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Nenhum item disponível no momento.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selected={item.id === selectedItemId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
