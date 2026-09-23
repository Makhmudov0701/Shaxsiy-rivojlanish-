export type UzbekDateOptions = Intl.DateTimeFormatOptions;

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const candidate = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

export function safeDate(value: unknown, fallback = new Date()): Date {
  return parseDateValue(value) ?? fallback;
}

export function formatUzbekDate(
  value: unknown,
  options: UzbekDateOptions,
  fallback = 'Sana ko‘rsatilmagan',
): string {
  const date = parseDateValue(value);
  return date ? new Intl.DateTimeFormat('uz-UZ', options).format(date) : fallback;
}