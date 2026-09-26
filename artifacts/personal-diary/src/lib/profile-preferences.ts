import type { AppLanguage } from '@/lib/i18n';

export type AvatarPreset = 'sunrise' | 'leaf' | 'moon' | 'ink' | 'horizon';
export type ThemePreference = 'system' | 'light' | 'dark';

export type ProfilePreferences = {
  displayName: string;
  motto: string;
  avatarPreset: AvatarPreset;
  goals: {
    pomodoroMinutes: number;
    readingPages: number;
    flashcardReviews: number;
  };
  language: AppLanguage;
  theme: ThemePreference;
};

export const DEFAULT_PROFILE_PREFERENCES: ProfilePreferences = {
  displayName: '',
  motto: '',
  avatarPreset: 'sunrise',
  goals: {
    pomodoroMinutes: 50,
    readingPages: 12,
    flashcardReviews: 15,
  },
  language: 'uz',
  theme: 'system',
};

export function profileStorageKey(userId: string) {
  return `kundalik-profile-v1-${userId}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function positiveNumber(value: unknown, fallback: number) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(10000, Math.round(number)) : fallback;
}

function isLanguage(value: unknown): value is AppLanguage {
  return value === 'uz' || value === 'en' || value === 'ru' || value === 'ko';
}

function isAvatar(value: unknown): value is AvatarPreset {
  return value === 'sunrise' || value === 'leaf' || value === 'moon' || value === 'ink' || value === 'horizon';
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function normalizeProfilePreferences(value: unknown): ProfilePreferences {
  if (!isObject(value)) return DEFAULT_PROFILE_PREFERENCES;
  const rawGoals = isObject(value.goals) ? value.goals : {};
  return {
    displayName: typeof value.displayName === 'string' ? value.displayName.slice(0, 80) : '',
    motto: typeof value.motto === 'string' ? value.motto.slice(0, 180) : '',
    avatarPreset: isAvatar(value.avatarPreset) ? value.avatarPreset : DEFAULT_PROFILE_PREFERENCES.avatarPreset,
    goals: {
      pomodoroMinutes: positiveNumber(rawGoals.pomodoroMinutes, DEFAULT_PROFILE_PREFERENCES.goals.pomodoroMinutes),
      readingPages: positiveNumber(rawGoals.readingPages, DEFAULT_PROFILE_PREFERENCES.goals.readingPages),
      flashcardReviews: positiveNumber(rawGoals.flashcardReviews, DEFAULT_PROFILE_PREFERENCES.goals.flashcardReviews),
    },
    language: isLanguage(value.language) ? value.language : DEFAULT_PROFILE_PREFERENCES.language,
    theme: isTheme(value.theme) ? value.theme : DEFAULT_PROFILE_PREFERENCES.theme,
  };
}

export function readProfilePreferences(userId: string): { value: ProfilePreferences; error: string | null } {
  try {
    const raw = window.localStorage.getItem(profileStorageKey(userId));
    if (!raw) return { value: DEFAULT_PROFILE_PREFERENCES, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return { value: DEFAULT_PROFILE_PREFERENCES, error: 'profile-read' };
    return { value: normalizeProfilePreferences(parsed), error: null };
  } catch {
    return { value: DEFAULT_PROFILE_PREFERENCES, error: 'profile-read' };
  }
}

export function writeProfilePreferences(userId: string, value: ProfilePreferences) {
  try {
    window.localStorage.setItem(profileStorageKey(userId), JSON.stringify(normalizeProfilePreferences(value)));
    window.dispatchEvent(new CustomEvent('kundalik-profile-preferences', { detail: { userId } }));
    return true;
  } catch {
    return false;
  }
}

export function updateProfilePreference(
  userId: string,
  update: Partial<ProfilePreferences>,
) {
  const current = readProfilePreferences(userId).value;
  return writeProfilePreferences(userId, normalizeProfilePreferences({
    ...current,
    ...update,
    goals: { ...current.goals, ...(update.goals ?? {}) },
  }));
}

export function applyThemePreference(theme: ThemePreference) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.themePreference = theme;
  window.dispatchEvent(new CustomEvent('kundalik-theme-preference-changed', { detail: { theme } }));
}