/** Formata uma data ISO (AAAA-MM-DD) para o formato brasileiro. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const isoDate = value.slice(0, 10);
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** Formata data e hora ISO para o formato brasileiro. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Primeiro nome, para saudações curtas. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
