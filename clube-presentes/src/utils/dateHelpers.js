// Regra de negócio central do MVP: o cliente só pode selecionar ou trocar o
// item de uma data enquanto faltarem pelo menos MIN_DAYS_FOR_CHANGE dias
// para essa data. Depois disso a escolha (ou a ausência dela) fica travada
// para dar tempo da Lily Cestas preparar e enviar o presente.
export const MIN_DAYS_FOR_CHANGE = 15;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Recebe uma data "YYYY-MM-DD" e devolve quantos dias faltam a partir de hoje. */
export function daysUntil(dateString) {
  if (!dateString) return -Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / MS_PER_DAY);
}

/** true se ainda dá tempo de selecionar/trocar o item dessa data. */
export function canChangeSelection(dateString) {
  return daysUntil(dateString) >= MIN_DAYS_FOR_CHANGE;
}

/** Formata "YYYY-MM-DD" como "10 de maio de 2026". */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
