import type { DiarySticker } from '@workspace/api-client-react';
import type { AppLanguage } from '@/lib/i18n';

export type DailyStickerOption = {
  value: DiarySticker;
  emoji: string;
  label: Record<AppLanguage, string>;
  className: string;
};

export const DAILY_STICKER_OPTIONS: DailyStickerOption[] = [
  {
    value: 'productive',
    emoji: '✅',
    label: { uz: 'Sermahsul', en: 'Productive', ru: 'Продуктивность', ko: '생산적' },
    className: 'border-[#cde4c9] bg-[#edf6e9] text-[#3e714b] dark:border-[#45664a] dark:bg-[#243a29] dark:text-[#b7d5b7]',
  },
  {
    value: 'study',
    emoji: '📚',
    label: { uz: 'O‘qish', en: 'Study', ru: 'Учёба', ko: '학습' },
    className: 'border-[#cad9f2] bg-[#edf2fc] text-[#49689b] dark:border-[#465d82] dark:bg-[#242f43] dark:text-[#b7c8e8]',
  },
  {
    value: 'calm',
    emoji: '🧘',
    label: { uz: 'Xotirjam', en: 'Calm', ru: 'Спокойствие', ko: '차분함' },
    className: 'border-[#c8e3dc] bg-[#eaf5f1] text-[#47796c] dark:border-[#42685d] dark:bg-[#233a34] dark:text-[#b4d9ce]',
  },
  {
    value: 'busy',
    emoji: '⚡',
    label: { uz: 'Band', en: 'Busy', ru: 'Занятой день', ko: '바쁨' },
    className: 'border-[#f0d5b5] bg-[#fff1df] text-[#9a6426] dark:border-[#755833] dark:bg-[#40311e] dark:text-[#e6c18d]',
  },
  {
    value: 'happy',
    emoji: '😊',
    label: { uz: 'Xursand', en: 'Happy', ru: 'Радость', ko: '기쁨' },
    className: 'border-[#efcfca] bg-[#fff0ed] text-[#a25f55] dark:border-[#76504b] dark:bg-[#402b2a] dark:text-[#e6b5ad]',
  },
  {
    value: 'creative',
    emoji: '💡',
    label: { uz: 'Ijod', en: 'Creative', ru: 'Творчество', ko: '창의적' },
    className: 'border-[#ddcbed] bg-[#f4edfb] text-[#79589a] dark:border-[#65507b] dark:bg-[#352a40] dark:text-[#d1b9e8]',
  },
  {
    value: 'rest',
    emoji: '🌙',
    label: { uz: 'Dam olish', en: 'Rest', ru: 'Отдых', ko: '휴식' },
    className: 'border-[#d4d9e8] bg-[#f0f1f7] text-[#626a87] dark:border-[#535a74] dark:bg-[#2b2e3e] dark:text-[#c4c9df]',
  },
  {
    value: 'social',
    emoji: '🤝',
    label: { uz: 'Muloqot', en: 'Social', ru: 'Общение', ko: '교류' },
    className: 'border-[#ecdbad] bg-[#faf3dd] text-[#8e712b] dark:border-[#6d5d37] dark:bg-[#3a3321] dark:text-[#e0cd8c]',
  },
];

export const DAILY_STICKER_COPY: Record<AppLanguage, {
  title: string;
  description: string;
  loading: string;
  clear: string;
  loadError: string;
  saveError: string;
  markerHint: string;
  noMarker: string;
}> = {
  uz: {
    title: 'Kun belgisini tanlang',
    description: 'Kayfiyatingiz yoki mashg‘ulotingizni ifodalovchi bitta belgini qo‘shing.',
    loading: 'Saqlangan belgi yuklanmoqda…',
    clear: 'Belgini olib tashlash',
    loadError: 'Saqlangan kun belgilarini yuklab bo‘lmadi.',
    saveError: 'Yozuv saqlandi, ammo kun belgisi saqlanmadi. Qayta urinib ko‘ring.',
    markerHint: 'Rangli emoji kuningizni taqvimda ko‘rsatadi.',
    noMarker: 'Belgi tanlanmagan',
  },
  en: {
    title: 'Choose a daily sticker',
    description: 'Add one marker for the mood or activity that describes your day.',
    loading: 'Loading saved sticker…',
    clear: 'Remove sticker',
    loadError: 'Saved daily stickers could not be loaded.',
    saveError: 'The entry was saved, but its daily sticker was not. Try again.',
    markerHint: 'The colored emoji marks your day on the calendar.',
    noMarker: 'No sticker selected',
  },
  ru: {
    title: 'Выберите знак дня',
    description: 'Добавьте один знак настроения или занятия, которое описывает ваш день.',
    loading: 'Загружается сохранённый знак…',
    clear: 'Убрать знак',
    loadError: 'Не удалось загрузить сохранённые знаки дней.',
    saveError: 'Запись сохранена, но знак дня не сохранён. Попробуйте ещё раз.',
    markerHint: 'Цветной эмодзи отмечает день в календаре.',
    noMarker: 'Знак не выбран',
  },
  ko: {
    title: '오늘의 스티커 선택',
    description: '오늘의 기분이나 활동을 나타내는 표시 하나를 추가하세요.',
    loading: '저장된 스티커를 불러오는 중…',
    clear: '스티커 제거',
    loadError: '저장된 일일 스티커를 불러오지 못했습니다.',
    saveError: '일기는 저장됐지만 스티커는 저장되지 않았습니다. 다시 시도하세요.',
    markerHint: '색이 있는 이모지가 달력에서 하루를 표시합니다.',
    noMarker: '선택된 스티커 없음',
  },
};

export function getDailySticker(value: DiarySticker | null | undefined) {
  return value ? DAILY_STICKER_OPTIONS.find((sticker) => sticker.value === value) ?? null : null;
}