import { getCurrentIntlLocale } from "@/lib/i18n";

export type UzbekDateOptions = Intl.DateTimeFormatOptions;

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string' && typeof value !== 'number') return null;
  let candidate: Date;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    candidate = new Date(year, month - 1, day, 12);
    if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null;
  } else {
    candidate = new Date(value);
  }

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

export function safeDate(value: unknown, fallback = new Date()): Date {
  return parseDateValue(value) ?? parseDateValue(fallback) ?? new Date();
}

export function formatUzbekDate(
  value: unknown,
  options: UzbekDateOptions,
  fallback = 'Sana ko‘rsatilmagan',
): string {
  const date = parseDateValue(value);
  return date ? new Intl.DateTimeFormat(getCurrentIntlLocale(), options).format(date) : fallback;
}