export default function ItemCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex flex-col overflow-hidden rounded-2xl border text-left transition hover:shadow-md ${
        selected ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
      }`}
    >
      <div className="aspect-square w-full bg-slate-100">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">🎁</div>
        )}
      </div>
      <div className="space-y-1 p-3">
        {item.category && (
          <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-500">
            {item.category}
          </span>
        )}
        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
        {item.description && (
          <p className="line-clamp-2 text-xs text-slate-500">{item.description}</p>
        )}
      </div>
    </button>
  );
}
