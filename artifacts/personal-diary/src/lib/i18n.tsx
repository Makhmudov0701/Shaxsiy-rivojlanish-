import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useUser } from "@clerk/react";
import copyData from "./i18n-copy.json";
import { readProfilePreferences, updateProfilePreference } from "@/lib/profile-preferences";

export const appLanguages = ["uz", "en", "ru", "ko"] as const;
export type AppLanguage = (typeof appLanguages)[number];

export const appLanguageLabels: Record<AppLanguage, string> = {
  uz: "UZ",
  en: "EN",
  ru: "RU",
  ko: "KO",
};

const languageStorageKey = "personal-diary-language";
const localeNames: Record<AppLanguage, string> = {
  uz: "uz-UZ",
  en: "en-US",
  ru: "ru-RU",
  ko: "ko-KR",
};

type TranslationRow = {
  uz: string;
  en: string;
  ru: string;
  ko: string;
};

const personalDevelopmentTitleCopy: TranslationRow = {
  uz: "Shaxsiy rivojlanish",
  en: "Personal Development",
  ru: "Личностный рост",
  ko: "자기계발",
};

const personalDevelopmentThoughtCopy: TranslationRow = {
  uz: "Shaxsiy rivojlanish fikri",
  en: "Personal Development Thought",
  ru: "Мысль о личностном росте",
  ko: "자기계발에 관한 생각",
};

const personalDevelopmentBackCopy: TranslationRow = {
  uz: "Shaxsiy rivojlanishga qaytish",
  en: "Back to Personal Development",
  ru: "Вернуться к личностному росту",
  ko: "자기계발로 돌아가기",
};

const personalDevelopmentSectionsCopy: TranslationRow = {
  uz: "Shaxsiy rivojlanish bo‘limlari",
  en: "Personal Development sections",
  ru: "Разделы личностного роста",
  ko: "자기계발 섹션",
};

type CopyCatalog = {
  translations: TranslationRow[];
};

const catalog = copyData as CopyCatalog;
const translations = new Map<string, Record<AppLanguage, string>>();
for (const { uz, en, ru, ko } of [
  ...catalog.translations,
  personalDevelopmentTitleCopy,
  personalDevelopmentThoughtCopy,
  personalDevelopmentBackCopy,
  personalDevelopmentSectionsCopy,
]) {
  translations.set(uz, { uz, en, ru, ko });
}

function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return appLanguages.some((language) => language === value);
}

function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "uz";
  try {
    const stored = window.localStorage.getItem(languageStorageKey);
    return isAppLanguage(stored) ? stored : "uz";
  } catch {
    return "uz";
  }
}

let currentLanguage = readStoredLanguage();

export function personalDevelopmentLabel(language: AppLanguage = currentLanguage): string {
  return personalDevelopmentTitleCopy[language];
}

export function personalDevelopmentBackLabel(language: AppLanguage = currentLanguage): string {
  return personalDevelopmentBackCopy[language];
}

export function personalDevelopmentSectionsLabel(language: AppLanguage = currentLanguage): string {
  return personalDevelopmentSectionsCopy[language];
}

export function getCurrentLanguage(): AppLanguage {
  return currentLanguage;
}

export function getCurrentIntlLocale(): string {
  return localeNames[currentLanguage];
}

export function calendarNavigationLabel(
  direction: "previous" | "next",
  language: AppLanguage = currentLanguage,
): string {
  const labels: Record<AppLanguage, { previous: string; next: string }> = {
    uz: { previous: "Oldingi oy", next: "Keyingi oy" },
    en: { previous: "Previous month", next: "Next month" },
    ru: { previous: "Предыдущий месяц", next: "Следующий месяц" },
    ko: { previous: "이전 달", next: "다음 달" },
  };
  return labels[language][direction];
}

export function formatCalendarDayLabel(date: Date): string {
  return new Intl.DateTimeFormat(getCurrentIntlLocale(), {
    dateStyle: "full",
  }).format(date);
}

export function formatDiaryEntryCount(
  count: number,
  language: AppLanguage = currentLanguage,
): string {
  if (language === "uz") return `${count} ta yozuv`;
  if (language === "en") return `${count} ${count === 1 ? "entry" : "entries"}`;
  if (language === "ko") return `${count}개 기록`;
  const plural = new Intl.PluralRules("ru-RU").select(count);
  const word =
    plural === "one"
      ? "запись"
      : plural === "few"
        ? "записи"
        : "записей";
  return `${count} ${word}`;
}

export function formatRecordedDays(
  count: number,
  language: AppLanguage = currentLanguage,
): string {
  if (language === "uz") return `${count} kun yozilgan`;
  if (language === "en") return `${count} ${count === 1 ? "day" : "days"} recorded`;
  if (language === "ko") return `${count}일 기록됨`;
  const plural = new Intl.PluralRules("ru-RU").select(count);
  const word =
    plural === "one" ? "день" : plural === "few" ? "дня" : "дней";
  return `${count} ${word} записано`;
}

export function formatDiaryDateEntryCount(
  date: Date,
  count: number,
  language: AppLanguage = currentLanguage,
): string {
  const formattedDate = new Intl.DateTimeFormat(localeNames[language], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return `${formattedDate}: ${formatDiaryEntryCount(count, language)}`;
}

export function formatHabitDateStatus(
  date: Date,
  completed: boolean,
  language: AppLanguage = currentLanguage,
): string {
  const formattedDate = new Intl.DateTimeFormat(localeNames[language], {
    day: "numeric",
    month: "long",
  }).format(date);
  const status = {
    uz: completed ? "bajarilgan" : "bajarilmagan",
    en: completed ? "completed" : "not completed",
    ru: completed ? "выполнено" : "не выполнено",
    ko: completed ? "완료됨" : "미완료",
  }[language];
  return `${formattedDate}, ${status}`;
}

export function formatDeleteConfirmation(
  itemName: string,
  kind: "entry" | "habit" | "privateNote",
  language: AppLanguage = currentLanguage,
): string {
  const labels = {
    uz: {
      entry: `“${itemName}” yozuvini o‘chirishni xohlaysizmi?`,
      habit: `“${itemName}” odatini o‘chirishni xohlaysizmi?`,
      privateNote: `“${itemName}” maxfiy yozuvini o‘chirishni xohlaysizmi?`,
    },
    en: {
      entry: `Delete the entry “${itemName}”?`,
      habit: `Delete the habit “${itemName}”?`,
      privateNote: `Delete the private note “${itemName}”?`,
    },
    ru: {
      entry: `Удалить запись «${itemName}»?`,
      habit: `Удалить привычку «${itemName}»?`,
      privateNote: `Удалить личную заметку «${itemName}»?`,
    },
    ko: {
      entry: `“${itemName}” 기록을 삭제하시겠습니까?`,
      habit: `“${itemName}” 습관을 삭제하시겠습니까?`,
      privateNote: `“${itemName}” 비밀 메모를 삭제하시겠습니까?`,
    },
  } satisfies Record<AppLanguage, Record<typeof kind, string>>;
  return labels[language][kind];
}

export function formatDeleteItemLabel(
  itemName: string,
  kind: "entry" | "habit" | "privateNote",
  language: AppLanguage = currentLanguage,
): string {
  const labels = {
    uz: {
      entry: `“${itemName}” yozuvini o‘chirish`,
      habit: `“${itemName}” odatini o‘chirish`,
      privateNote: `“${itemName}” maxfiy yozuvini o‘chirish`,
    },
    en: {
      entry: `Delete entry “${itemName}”`,
      habit: `Delete habit “${itemName}”`,
      privateNote: `Delete private note “${itemName}”`,
    },
    ru: {
      entry: `Удалить запись «${itemName}»`,
      habit: `Удалить привычку «${itemName}»`,
      privateNote: `Удалить личную заметку «${itemName}»`,
    },
    ko: {
      entry: `“${itemName}” 기록 삭제`,
      habit: `“${itemName}” 습관 삭제`,
      privateNote: `“${itemName}” 비밀 메모 삭제`,
    },
  } satisfies Record<AppLanguage, Record<typeof kind, string>>;
  return labels[language][kind];
}

export function formatContentDeleteConfirmation(
  itemName: string,
  kind: "task" | "goal" | "book" | "idea" | "deck" | "card",
  language: AppLanguage = currentLanguage,
): string {
  const labels = {
    uz: {
      task: `“${itemName}” topshirig‘ini o‘chirishni xohlaysizmi?`,
      goal: `“${itemName}” maqsadini o‘chirishni xohlaysizmi?`,
      book: `“${itemName}” kitobini javondan o‘chirishni xohlaysizmi?`,
      idea: "Bu fikrni o‘chirishni xohlaysizmi?",
      deck: `“${itemName}” to‘plami va uning kartalarini o‘chirishni xohlaysizmi?`,
      card: "Bu kartni o‘chirishni xohlaysizmi?",
    },
    en: {
      task: `Delete the task “${itemName}”?`,
      goal: `Delete the goal “${itemName}”?`,
      book: `Remove “${itemName}” from your shelf?`,
      idea: "Delete this idea?",
      deck: `Delete the deck “${itemName}” and its cards?`,
      card: "Delete this card?",
    },
    ru: {
      task: `Удалить задачу «${itemName}»?`,
      goal: `Удалить цель «${itemName}»?`,
      book: `Убрать книгу «${itemName}» с полки?`,
      idea: "Удалить эту идею?",
      deck: `Удалить набор «${itemName}» и все его карточки?`,
      card: "Удалить эту карточку?",
    },
    ko: {
      task: `“${itemName}” 작업을 삭제하시겠습니까?`,
      goal: `“${itemName}” 목표를 삭제하시겠습니까?`,
      book: `“${itemName}” 책을 책장에서 삭제하시겠습니까?`,
      idea: "이 아이디어를 삭제하시겠습니까?",
      deck: `“${itemName}” 덱과 카드를 삭제하시겠습니까?`,
      card: "이 카드를 삭제하시겠습니까?",
    },
  } satisfies Record<AppLanguage, Record<typeof kind, string>>;
  return labels[language][kind];
}

export function formatEnergyLevelAriaLabel(
  level: number,
  language: AppLanguage = currentLanguage,
): string {
  return {
    uz: `Energiya darajasi ${level}`,
    en: `Energy level ${level}`,
    ru: `Уровень энергии ${level}`,
    ko: `에너지 수준 ${level}`,
  }[language];
}

export function formatAmbientLayerToggleLabel(
  playing: boolean,
  soundName: string,
  layer: "primary" | "secondary",
  language: AppLanguage = currentLanguage,
): string {
  const localizedName = translateUiText(soundName, language);
  const labels = {
    uz: {
      primary: `${playing ? "To‘xtatish" : "Boshlash"}: ${localizedName} · asosiy qatlam`,
      secondary: `${playing ? "To‘xtatish" : "Boshlash"}: ${localizedName} · ikkinchi qatlam`,
    },
    en: {
      primary: `${playing ? "Stop" : "Start"}: ${localizedName} · primary layer`,
      secondary: `${playing ? "Stop" : "Start"}: ${localizedName} · secondary layer`,
    },
    ru: {
      primary: `${playing ? "Остановить" : "Запустить"}: ${localizedName} · основной слой`,
      secondary: `${playing ? "Остановить" : "Запустить"}: ${localizedName} · второй слой`,
    },
    ko: {
      primary: `${localizedName} ${playing ? "중지" : "재생"} · 기본 레이어`,
      secondary: `${localizedName} ${playing ? "중지" : "재생"} · 보조 레이어`,
    },
  };
  return labels[language][layer];
}

export function formatAmbientControlTitle(
  soundName: string,
  playing: boolean,
  language: AppLanguage = currentLanguage,
): string {
  const localizedName = translateUiText(soundName, language);
  return {
    uz: `${localizedName} · ${playing ? "to‘xtatish" : "boshlash"}`,
    en: `${localizedName} · ${playing ? "stop" : "start"}`,
    ru: `${localizedName} · ${playing ? "остановить" : "запустить"}`,
    ko: `${localizedName} · ${playing ? "중지" : "재생"}`,
  }[language];
}

export function formatTimerDurationAriaLabel(
  durationMinutes: number,
  language: AppLanguage = currentLanguage,
): string {
  return {
    uz: `Taymer davomiyligini o‘zgartirish, hozir ${durationMinutes} daqiqa`,
    en: `Change timer duration, currently ${durationMinutes} minutes`,
    ru: `Изменить длительность таймера, сейчас ${durationMinutes} мин.`,
    ko: `타이머 시간 변경, 현재 ${durationMinutes}분`,
  }[language];
}

export function formatTimerDurationFieldLabel(
  modeLabel: string,
  language: AppLanguage = currentLanguage,
): string {
  const localizedLabel = translateUiText(modeLabel, language);
  return {
    uz: `${localizedLabel} davomiyligi`,
    en: `${localizedLabel} duration`,
    ru: `Длительность: ${localizedLabel}`,
    ko: `${localizedLabel} 시간`,
  }[language];
}

export function formatTimerPresetsGroupLabel(
  modeLabel: string,
  language: AppLanguage = currentLanguage,
): string {
  const localizedLabel = translateUiText(modeLabel, language);
  return {
    uz: `${localizedLabel} uchun tez tanlovlar`,
    en: `Quick choices for ${localizedLabel}`,
    ru: `Быстрый выбор для режима «${localizedLabel}»`,
    ko: `${localizedLabel} 빠른 선택`,
  }[language];
}

export function formatSubtaskCompletionAriaLabel(
  subtaskTitle: string,
  language: AppLanguage = currentLanguage,
): string {
  return {
    uz: `${subtaskTitle} bajarildi`,
    en: `${subtaskTitle} completed`,
    ru: `${subtaskTitle} выполнено`,
    ko: `${subtaskTitle} 완료`,
  }[language];
}

export function formatTaskPomodoroAriaLabel(
  taskTitle: string,
  language: AppLanguage = currentLanguage,
): string {
  return {
    uz: `${taskTitle} vazifasini Pomodoro bilan boshlash`,
    en: `Start task ${taskTitle} with Pomodoro`,
    ru: `Начать задачу «${taskTitle}» по методу Pomodoro`,
    ko: `“${taskTitle}” 작업을 포모도로 시작`,
  }[language];
}

export function formatGoalDuration(
  minutes: number,
  language: AppLanguage = currentLanguage,
): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (language === "uz") {
    return hours === 0
      ? `${remainingMinutes} daq.`
      : `${hours} soat${remainingMinutes ? ` ${remainingMinutes} daq.` : ""}`;
  }
  if (language === "en") {
    const hourText = `${hours} hr${hours === 1 ? "" : "s"}`;
    const minuteText = `${remainingMinutes} min`;
    return hours === 0 ? minuteText : remainingMinutes ? `${hourText} ${minuteText}` : hourText;
  }
  if (language === "ko") {
    return hours === 0
      ? `${remainingMinutes}분`
      : `${hours}시간${remainingMinutes ? ` ${remainingMinutes}분` : ""}`;
  }
  const hourWord = new Intl.PluralRules("ru-RU").select(hours);
  const minuteWord = new Intl.PluralRules("ru-RU").select(remainingMinutes);
  const hoursLabel =
    hourWord === "one" ? "час" : hourWord === "few" ? "часа" : "часов";
  const minutesLabel =
    minuteWord === "one" ? "минута" : minuteWord === "few" ? "минуты" : "минут";
  if (hours === 0) return `${remainingMinutes} ${minutesLabel}`;
  return `${hours} ${hoursLabel}${remainingMinutes ? ` ${remainingMinutes} ${minutesLabel}` : ""}`;
}

export function formatLocalModuleStorageMessage(
  label: string,
  action: "read" | "save",
  language: AppLanguage = currentLanguage,
): string {
  const localizedLabel = translateUiText(label, language);
  const messages = {
    uz: {
      read: `${localizedLabel} ma’lumotlarini o‘qib bo‘lmadi. Brauzer xotirasini tekshiring.`,
      save: `${localizedLabel} saqlanmadi. Brauzer xotirasi to‘lmaganini tekshiring.`,
    },
    en: {
      read: `Could not load ${localizedLabel} data. Check your browser storage.`,
      save: `Could not save ${localizedLabel}. Check that browser storage is not full.`,
    },
    ru: {
      read: `Не удалось загрузить данные «${localizedLabel}». Проверьте хранилище браузера.`,
      save: `Не удалось сохранить «${localizedLabel}». Проверьте, не заполнено ли хранилище браузера.`,
    },
    ko: {
      read: `${localizedLabel} 데이터를 불러오지 못했습니다. 브라우저 저장 공간을 확인하세요.`,
      save: `${localizedLabel} 데이터를 저장하지 못했습니다. 브라우저 저장 공간이 부족하지 않은지 확인하세요.`,
    },
  };
  return messages[language][action];
}

export function formatMoodAriaLabel(
  mood: string,
  language: AppLanguage = currentLanguage,
): string {
  return {
    uz: `Kayfiyat: ${mood}`,
    en: `Mood: ${mood}`,
    ru: `Настроение: ${mood}`,
    ko: `기분: ${mood}`,
  }[language];
}

export function formatDiaryBackupRestoreMessage(
  entries: number,
  photos: number,
  language: AppLanguage = currentLanguage,
): string {
  return {
    uz: `${entries} ta yozuv va ${photos} ta surat tiklandi.`,
    en: `${entries} ${entries === 1 ? "entry" : "entries"} and ${photos} ${photos === 1 ? "photo" : "photos"} restored.`,
    ru: `${entries} ${new Intl.PluralRules("ru-RU").select(entries) === "one" ? "запись восстановлена" : "записей восстановлено"} и ${photos} ${photos === 1 ? "фотография восстановлена" : "фотографий восстановлено"}.`,
    ko: `${entries}개의 기록과 ${photos}개의 사진이 복원되었습니다.`,
  }[language];
}

export function formatDiaryOverwriteConfirmation(
  language: AppLanguage = currentLanguage,
): string {
  return {
    uz: "Tiklash mavjud kundaligingizdagi barcha yozuv va suratlarni almashtiradi. Davom etasizmi?",
    en: "Restoring will replace all entries and photos in your current diary. Continue?",
    ru: "Восстановление заменит все записи и фотографии в текущем дневнике. Продолжить?",
    ko: "복원하면 현재 일기의 모든 기록과 사진이 교체됩니다. 계속하시겠습니까?",
  }[language];
}

export function translateUiText(
  text: string,
  language: AppLanguage = currentLanguage,
): string {
  if (language === "uz" || !text) return text;
  const trimmed = text.trim();
  const translated = translations.get(trimmed)?.[language];
  if (!translated) return text;

  const leadingWhitespace = text.length - text.trimStart().length;
  const trailingWhitespace = text.length - text.trimEnd().length;
  return `${text.slice(0, leadingWhitespace)}${translated}${text.slice(text.length - trailingWhitespace)}`;
}

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

const I18nContext = createContext<I18nContextValue>({
  language: "uz",
  setLanguage: () => undefined,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(readStoredLanguage);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    const safeLanguage = isAppLanguage(nextLanguage) ? nextLanguage : "uz";
    currentLanguage = safeLanguage;
    setLanguageState(safeLanguage);
    try {
      window.localStorage.setItem(languageStorageKey, safeLanguage);
    } catch {
      // The in-memory choice still applies when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    currentLanguage = language;
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch {
      // Keep the selected language for this visit if storage is unavailable.
    }
  }, [language]);

  useEffect(() => {
    const syncLanguageFromAnotherTab = (event: StorageEvent) => {
      if (event.key !== languageStorageKey) return;
      const nextLanguage = isAppLanguage(event.newValue) ? event.newValue : "uz";
      currentLanguage = nextLanguage;
      setLanguageState(nextLanguage);
    };
    window.addEventListener("storage", syncLanguageFromAnotherTab);
    return () => window.removeEventListener("storage", syncLanguageFromAnotherTab);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

function translateNode(node: ReactNode, language: AppLanguage): ReactNode {
  if (typeof node === "string") return translateUiText(node, language);
  if (Array.isArray(node)) {
    return node.map((child) => translateNode(child, language));
  }
  return node;
}

export function LocalizedText({ children }: { children: ReactNode }) {
  const { language } = useI18n();
  return <>{translateNode(children, language)}</>;
}

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useI18n();
  const { user } = useUser();
  const label = translateUiText("Til", language);

  useEffect(() => {
    if (!user?.id) return;
    const stored = readProfilePreferences(user.id).value;
    if (stored.language !== language) setLanguage(stored.language);
  }, [user?.id]);

  return (
    <label className={`flex min-w-0 shrink-0 items-center gap-2 ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        title={label}
        value={language}
        onChange={(event) => {
          const nextLanguage = event.target.value;
          if (isAppLanguage(nextLanguage)) {
            setLanguage(nextLanguage);
            if (user?.id) updateProfilePreference(user.id, { language: nextLanguage });
          }
        }}
        className="h-11 w-full min-w-0 shrink-0 rounded-xl border border-border bg-background px-2 text-xs font-semibold text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
        data-testid="select-app-language"
      >
        {appLanguages.map((item) => (
          <option key={item} value={item}>
            {appLanguageLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
