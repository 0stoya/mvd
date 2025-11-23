// lib/format.ts

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';

  const date = value instanceof Date ? value : new Date(value);

  // Force a fixed locale + options so SSR and browser match
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}
