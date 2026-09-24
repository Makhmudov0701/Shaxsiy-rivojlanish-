import { useCallback, useEffect, useState } from 'react';

export type LocalModuleStatus = 'loading' | 'ready' | 'error';

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type EnergyLog = Record<string, number>;

export const EMPTY_ENERGY_LOG: EnergyLog = {};

export function isEnergyLog(value: unknown): value is EnergyLog {
  return isObject(value) && Object.entries(value).every(([date, level]) =>
    isValidDateKey(date) && typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 10,
  );
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function energyStorageKey(userId: string) {
  return `kundalik-energiya-v1-${userId}`;
}

export function readEnergyLog(userId: string): EnergyLog {
  try {
    const raw = window.localStorage.getItem(energyStorageKey(userId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isEnergyLog(parsed)) throw new Error('invalid-energy');
    return parsed;
  } catch {
    throw new Error('Energiya qaydlarini o‘qib bo‘lmadi. Brauzer xotirasini tekshiring.');
  }
}

export function saveDailyEnergy(userId: string, date: string, level: number | null) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (level !== null && (!Number.isInteger(level) || level < 1 || level > 10))) {
    throw new Error('Energiya qiymati yoki sana noto‘g‘ri.');
  }
  const next = readEnergyLog(userId);
  if (level === null) delete next[date];
  else next[date] = level;
  try {
    window.localStorage.setItem(energyStorageKey(userId), JSON.stringify(next));
  } catch {
    throw new Error('Energiya qaydini saqlab bo‘lmadi. Brauzer xotirasini tekshiring.');
  }
}

export function useLocalModuleStorage<T>(
  storageKey: string,
  emptyValue: T,
  validate: (value: unknown) => value is T,
  label: string,
) {
  const [value, setValue] = useState<T>(emptyValue);
  const [status, setStatus] = useState<LocalModuleStatus>('loading');
  const [error, setError] = useState('');

  const read = useCallback(() => {
    try {
      if (!storageKey) throw new Error('storage-key');
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return emptyValue;
      const parsed: unknown = JSON.parse(raw);
      if (!validate(parsed)) throw new Error('invalid-data');
      return parsed;
    } catch {
      throw new Error(`${label} ma’lumotlarini o‘qib bo‘lmadi. Brauzer xotirasini tekshiring.`);
    }
  }, [emptyValue, label, storageKey, validate]);

  useEffect(() => {
    setStatus('loading');
    setError('');
    try {
      setValue(read());
      setStatus('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${label} ma’lumotlarini o‘qib bo‘lmadi.`);
      setStatus('error');
    }
  }, [label, read]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        setValue(read());
        setError('');
        setStatus('ready');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : `${label} ma’lumotlarini o‘qib bo‘lmadi.`);
        setStatus('error');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [label, read, storageKey]);

  const save = useCallback((next: T) => {
    if (status !== 'ready') return false;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setValue(next);
      setError('');
      return true;
    } catch {
      setError(`${label} saqlanmadi. Brauzer xotirasi to‘lmaganini tekshiring.`);
      return false;
    }
  }, [label, status, storageKey]);

  return { value, status, error, save };
}