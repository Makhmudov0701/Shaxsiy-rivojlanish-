import type { AppLanguage } from '@/lib/i18n';

export type FlashcardExampleSuggestion = {
  id: string;
  text: string;
};

const labels: Record<AppLanguage, {
  first: (front: string, back: string) => string;
  second: (front: string, back: string) => string;
}> = {
  uz: {
    first: (front, back) => `Bugun "${back}" haqida gapirganda "${front}" so‘zini ishlatdim.`,
    second: (front, back) => `Dialog: “${front}” — “${back}”.`,
  },
  en: {
    first: (front, back) => `I used “${front}” today when talking about “${back}”.`,
    second: (front, back) => `Dialogue: “${front}” — “${back}”.`,
  },
  ru: {
    first: (front, back) => `Сегодня я использовал(а) «${front}», говоря о «${back}».`,
    second: (front, back) => `Диалог: «${front}» — «${back}».`,
  },
  ko: {
    first: (front, back) => `오늘 “${back}”에 대해 말할 때 “${front}”을(를) 사용했어요.`,
    second: (front, back) => `대화: “${front}” — “${back}”.`,
  },
};

export function generateFlashcardExamples(
  front: string,
  back: string,
  language: AppLanguage,
): FlashcardExampleSuggestion[] {
  const cleanFront = front.trim().replace(/\s+/g, ' ');
  const cleanBack = back.trim().replace(/\s+/g, ' ');
  if (!cleanFront || !cleanBack) return [];

  const makeSafe = (value: string) => value.slice(0, 240);
  return [
    { id: `${language}-sentence`, text: makeSafe(labels[language].first(cleanFront, cleanBack)) },
    { id: `${language}-dialogue`, text: makeSafe(labels[language].second(cleanFront, cleanBack)) },
  ];
}