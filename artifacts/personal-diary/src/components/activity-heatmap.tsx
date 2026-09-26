import { useMemo, useState } from 'react';
import { useI18n, type AppLanguage } from '@/lib/i18n';

export type ActivityDay = {
  date: string;
  journalEntries: number;
  tasksCompleted: number;
  pomodoroMinutes: number;
  flashcardsReviewed: number;
  exerciseCompletions: number;
  exerciseScore?: number;
  exercisePossible?: number;
};

export type ActivityHeatmapProps = {
  days: ActivityDay[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  partialData?: boolean;
};

type Period = 'weekly' | 'monthly' | 'yearly';

type Copy = {
  title: string;
  description: string;
  periods: Record<Period, string>;
  activity: string;
  less: string;
  more: string;
  loading: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  noActivity: string;
  formula: string;
  partialData: string;
  recorded: string;
  metricLabels: {
    journalEntries: string;
    tasksCompleted: string;
    pomodoroMinutes: string;
    flashcardsReviewed: string;
    exerciseCompletions: string;
    exerciseScore: string;
  };
  monthLabel: (date: Date) => string;
  dateLabel: (date: Date) => string;
  dayLetter: (date: Date) => string;
  summary: (days: number, total: number) => string;
};

const localeByLanguage: Record<AppLanguage, string> = {
  uz: 'uz-UZ',
  en: 'en-US',
  ru: 'ru-RU',
  ko: 'ko-KR',
};

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date): Date {
  const mondayOffset = (date.getDay() + 6) % 7;
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -mondayOffset);
}

function metricValue(day: ActivityDay): number {
  return Math.max(0, Number.isFinite(day.journalEntries) ? day.journalEntries : 0)
    + Math.max(0, Number.isFinite(day.tasksCompleted) ? day.tasksCompleted : 0)
    + Math.floor(Math.max(0, Number.isFinite(day.pomodoroMinutes) ? day.pomodoroMinutes / 25 : 0))
    + Math.floor(Math.max(0, Number.isFinite(day.flashcardsReviewed) ? day.flashcardsReviewed / 10 : 0))
    + Math.max(0, Number.isFinite(day.exerciseCompletions) ? day.exerciseCompletions : 0);
}

function metricCount(value: number): string {
  return Number.isFinite(value) ? String(Math.max(0, value)) : '0';
}

function createCopy(language: AppLanguage): Copy {
  const locale = localeByLanguage[language];
  const dateFormatter = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options).format(date);
  const copyByLanguage: Record<AppLanguage, Omit<Copy, 'monthLabel' | 'dateLabel' | 'dayLetter' | 'summary'>> = {
    uz: {
      title: 'Faollik ritmi',
      description: 'Kundalik, diqqat va o‘rganish izlarini bir joyda ko‘ring.',
      periods: { weekly: 'Haftalik', monthly: 'Oylik', yearly: 'Yillik' },
      activity: 'faollik',
      less: 'Kamroq',
      more: 'Ko‘proq',
      loading: 'Faollik xaritasi yuklanmoqda',
      errorTitle: 'Faollikni yuklab bo‘lmadi.',
      errorDescription: 'Ma’lumotlarni olishda muammo yuz berdi. Yana bir bor urinib ko‘ring.',
      retry: 'Qayta urinish',
      noActivity: 'Bu davrda faollik hali qayd etilmagan.',
      formula: '1 ball: yozuv, topshiriq yoki mashq · 25 daq. Pomodoro · 10 kartochka',
      partialData: 'Ayrim manbalar mavjud emas; ular vaqtincha 0 ball sifatida hisoblanadi.',
      recorded: 'qayd etilgan kun',
      metricLabels: {
        journalEntries: 'Kundalik yozuvlari',
        tasksCompleted: 'Bajarilgan topshiriqlar',
        pomodoroMinutes: 'Pomodoro daqiqalari',
        flashcardsReviewed: 'Ko‘rilgan kartochkalar',
        exerciseCompletions: 'Bajarilgan mashqlar',
        exerciseScore: 'Miya mashqlari natijasi',
      },
    },
    en: {
      title: 'Activity rhythm',
      description: 'See the small traces of journaling, focus, and learning together.',
      periods: { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' },
      activity: 'activity',
      less: 'Less',
      more: 'More',
      loading: 'Loading activity map',
      errorTitle: 'Activity could not be loaded.',
      errorDescription: 'Something went wrong while getting your data. Try once more.',
      retry: 'Try again',
      noActivity: 'No activity has been recorded in this period yet.',
      formula: '1 point: entry, task, or exercise · 25 Pomodoro min · 10 flashcards',
      partialData: 'Some sources are unavailable; they temporarily contribute 0 points.',
      recorded: 'recorded day',
      metricLabels: {
        journalEntries: 'Journal entries',
        tasksCompleted: 'Tasks completed',
        pomodoroMinutes: 'Pomodoro minutes',
        flashcardsReviewed: 'Flashcards reviewed',
        exerciseCompletions: 'Exercises completed',
        exerciseScore: 'Brain Gym score',
      },
    },
    ru: {
      title: 'Ритм активности',
      description: 'Следите за дневником, фокусом и обучением в одном месте.',
      periods: { weekly: 'Неделя', monthly: 'Месяц', yearly: 'Год' },
      activity: 'активность',
      less: 'Меньше',
      more: 'Больше',
      loading: 'Карта активности загружается',
      errorTitle: 'Не удалось загрузить активность.',
      errorDescription: 'При загрузке данных произошла ошибка. Попробуйте ещё раз.',
      retry: 'Повторить',
      noActivity: 'За этот период активность ещё не записана.',
      formula: '1 балл: запись, задача или упражнение · 25 мин Pomodoro · 10 карточек',
      partialData: 'Некоторые источники недоступны; временно они дают 0 баллов.',
      recorded: 'день записан',
      metricLabels: {
        journalEntries: 'Записи дневника',
        tasksCompleted: 'Выполненные задачи',
        pomodoroMinutes: 'Минуты Pomodoro',
        flashcardsReviewed: 'Повторенные карточки',
        exerciseCompletions: 'Выполненные упражнения',
        exerciseScore: 'Баллы упражнений для памяти',
      },
    },
    ko: {
      title: '활동 리듬',
      description: '일기, 집중, 학습의 흔적을 한곳에서 살펴보세요.',
      periods: { weekly: '주간', monthly: '월간', yearly: '연간' },
      activity: '활동',
      less: '적게',
      more: '많이',
      loading: '활동 지도를 불러오는 중',
      errorTitle: '활동을 불러오지 못했습니다.',
      errorDescription: '데이터를 가져오는 중 문제가 발생했습니다. 다시 시도해 주세요.',
      retry: '다시 시도',
      noActivity: '이 기간에는 아직 기록된 활동이 없습니다.',
      formula: '1점: 기록·작업·운동 · 포모도로 25분 · 플래시카드 10장',
      partialData: '일부 데이터를 사용할 수 없어 해당 항목은 일시적으로 0점으로 계산됩니다.',
      recorded: '기록된 날',
      metricLabels: {
        journalEntries: '일기 기록',
        tasksCompleted: '완료한 작업',
        pomodoroMinutes: '포모도로 시간(분)',
        flashcardsReviewed: '복습한 플래시카드',
        exerciseCompletions: '완료한 운동',
        exerciseScore: '기억 훈련 점수',
      },
    },
  };
  const base = copyByLanguage[language];
  return {
    ...base,
    monthLabel: (date) => dateFormatter(date, { month: 'short' }),
    dateLabel: (date) => dateFormatter(date, { dateStyle: 'full' }),
    dayLetter: (date) => dateFormatter(date, { weekday: 'short' }).slice(0, 1),
    summary: (days, total) => {
      if (language === 'uz') return `${days} kun qayd etilgan · ${total} ${base.activity}`;
      if (language === 'en') return `${days} ${days === 1 ? 'day' : 'days'} recorded · ${total} activity`;
      if (language === 'ru') return `${days} ${days === 1 ? 'день' : 'дней'} записано · ${total} активности`;
      return `${days}일 기록됨 · 활동 ${total}`;
    },
  };
}

function activityLevel(score: number): number {
  if (score <= 0) return 0;
  if (score < 3) return 1;
  if (score < 6) return 2;
  if (score < 10) return 3;
  return 4;
}

function levelClass(level: number): string {
  return [
    'border-border/80 bg-muted/55',
    'border-[#ead9b4] bg-[#f3e7c8]',
    'border-[#dfc482] bg-[#e5cc91]',
    'border-[#c39b52] bg-[#cda661]',
    'border-[#9a6b23] bg-[#a7782c]',
  ][level];
}

function ActivityCell({
  day,
  level,
  copy,
  compact = false,
  tooltipAlign = 'center',
}: {
  day: ActivityDay;
  level: number;
  copy: Copy;
  compact?: boolean;
  tooltipAlign?: 'start' | 'center' | 'end';
}) {
  const date = parseLocalDate(day.date);
  if (!date) return null;
  const scoreLabel = day.exercisePossible
    ? `${copy.metricLabels.exerciseScore}: ${metricCount(day.exerciseScore ?? 0)} / ${metricCount(day.exercisePossible)}`
    : '';
  const accessibleLabel = `${copy.dateLabel(date)}. ${copy.metricLabels.journalEntries}: ${metricCount(day.journalEntries)}. ${copy.metricLabels.tasksCompleted}: ${metricCount(day.tasksCompleted)}. ${copy.metricLabels.pomodoroMinutes}: ${metricCount(day.pomodoroMinutes)}. ${copy.metricLabels.flashcardsReviewed}: ${metricCount(day.flashcardsReviewed)}. ${copy.metricLabels.exerciseCompletions}: ${metricCount(day.exerciseCompletions)}.${scoreLabel ? ` ${scoreLabel}.` : ''}`;
  return (
    <div
      role="gridcell"
      tabIndex={0}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className={`group relative aspect-square rounded-[4px] border outline-none transition-transform duration-150 hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${compact ? 'min-w-0' : ''} ${levelClass(level)}`}
      data-testid={`activity-cell-${day.date}`}
    >
      <div className={`pointer-events-none absolute bottom-[calc(100%+7px)] z-30 w-[min(220px,calc(100vw-2rem))] translate-y-1 opacity-0 transition-opacity duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${tooltipAlign === 'start' ? 'left-0' : tooltipAlign === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
        <div className="rounded-xl border border-[#d8c69b] bg-[#fffaf0] px-3 py-2.5 text-left text-[10px] leading-[1.55] text-[#5c503e] shadow-lg dark:border-[#5d4b2d] dark:bg-[#30291f] dark:text-[#eee1c2]">
          <p className="mb-1 font-semibold">{copy.dateLabel(date)}</p>
          <p>{copy.metricLabels.journalEntries}: {metricCount(day.journalEntries)}</p>
          <p>{copy.metricLabels.tasksCompleted}: {metricCount(day.tasksCompleted)}</p>
          <p>{copy.metricLabels.pomodoroMinutes}: {metricCount(day.pomodoroMinutes)}</p>
          <p>{copy.metricLabels.flashcardsReviewed}: {metricCount(day.flashcardsReviewed)}</p>
          <p>{copy.metricLabels.exerciseCompletions}: {metricCount(day.exerciseCompletions)}</p>
          {scoreLabel && <p>{scoreLabel}</p>}
        </div>
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="mt-5" aria-label={label} role="status">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: 35 }, (_, index) => <span key={index} className="skeleton aspect-square rounded-[4px]" />)}
      </div>
      <div className="mt-4 skeleton h-3 w-44 rounded-full" />
    </div>
  );
}

export function ActivityHeatmap({ days, loading = false, error = false, onRetry, partialData = false }: ActivityHeatmapProps) {
  const { language } = useI18n();
  const [period, setPeriod] = useState<Period>('monthly');
  const copy = useMemo(() => createCopy(language), [language]);
  const today = useMemo(() => new Date(), []);

  const model = useMemo(() => {
    const aggregated = new Map<string, ActivityDay>();
    for (const day of days) {
      const parsed = parseLocalDate(day.date);
      if (!parsed) continue;
      const existing = aggregated.get(day.date);
      aggregated.set(day.date, existing ? {
        date: day.date,
        journalEntries: existing.journalEntries + Math.max(0, day.journalEntries || 0),
        tasksCompleted: existing.tasksCompleted + Math.max(0, day.tasksCompleted || 0),
        pomodoroMinutes: existing.pomodoroMinutes + Math.max(0, day.pomodoroMinutes || 0),
        flashcardsReviewed: existing.flashcardsReviewed + Math.max(0, day.flashcardsReviewed || 0),
        exerciseCompletions: existing.exerciseCompletions + Math.max(0, day.exerciseCompletions || 0),
        exerciseScore: (existing.exerciseScore ?? 0) + Math.max(0, day.exerciseScore || 0),
        exercisePossible: (existing.exercisePossible ?? 0) + Math.max(0, day.exercisePossible || 0),
      } : {
        date: day.date,
        journalEntries: Math.max(0, day.journalEntries || 0),
        tasksCompleted: Math.max(0, day.tasksCompleted || 0),
        pomodoroMinutes: Math.max(0, day.pomodoroMinutes || 0),
        flashcardsReviewed: Math.max(0, day.flashcardsReviewed || 0),
        exerciseCompletions: Math.max(0, day.exerciseCompletions || 0),
        exerciseScore: Math.max(0, day.exerciseScore || 0),
        exercisePossible: Math.max(0, day.exercisePossible || 0),
      });
    }

    const weekStart = startOfWeek(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const rangeStart = period === 'weekly' ? weekStart : period === 'monthly' ? monthStart : yearStart;
    const rangeEnd = period === 'weekly'
      ? addDays(weekStart, 6)
      : period === 'monthly'
        ? new Date(today.getFullYear(), today.getMonth() + 1, 0)
        : new Date(today.getFullYear(), 11, 31);

    const inRange = [...aggregated.values()].filter((day) => {
      const date = parseLocalDate(day.date);
      return date !== null && date >= rangeStart && date <= rangeEnd;
    });
    const byDate = new Map(inRange.map((day) => [day.date, day]));
    const total = Math.round(inRange.reduce((sum, day) => sum + metricValue(day), 0));
    const recordedDays = inRange.filter((day) => metricValue(day) > 0).length;

    if (period === 'yearly') {
      const months = Array.from({ length: 12 }, (_, month) => {
        const first = new Date(today.getFullYear(), month, 1);
        const count = new Date(today.getFullYear(), month + 1, 0).getDate();
        const leading = first.getDay() === 0 ? 6 : first.getDay() - 1;
        return {
          date: first,
          days: Array.from({ length: leading + count }, (_, index) => {
            if (index < leading) return null;
            const date = new Date(today.getFullYear(), month, index - leading + 1);
            const day = byDate.get(localDateKey(date)) ?? {
              date: localDateKey(date),
              journalEntries: 0,
              tasksCompleted: 0,
              pomodoroMinutes: 0,
              flashcardsReviewed: 0,
              exerciseCompletions: 0,
            };
            return { day, level: activityLevel(metricValue(day)) };
          }),
        };
      });
      return { period, months, days: [], total, recordedDays };
    }

    const count = period === 'weekly' ? 7 : rangeEnd.getDate();
    const leading = period === 'monthly' ? (monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1) : 0;
    const cells = Array.from({ length: leading + count }, (_, index) => {
      if (index < leading) return null;
      const date = period === 'weekly' ? addDays(weekStart, index) : new Date(today.getFullYear(), today.getMonth(), index - leading + 1);
      const day = byDate.get(localDateKey(date)) ?? {
        date: localDateKey(date),
        journalEntries: 0,
        tasksCompleted: 0,
        pomodoroMinutes: 0,
        flashcardsReviewed: 0,
        exerciseCompletions: 0,
      };
      return { day, level: activityLevel(metricValue(day)) };
    });
    return { period, months: [], days: cells, total, recordedDays };
  }, [days, period, today]);

  return (
    <section className="w-full min-w-0 rounded-[24px] border border-card-border bg-card p-4 shadow-sm sm:p-6" aria-labelledby="activity-heatmap-title" data-testid="activity-heatmap">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#9a6b23]">{copy.activity}</p>
          <h2 id="activity-heatmap-title" className="mt-1.5 font-serif text-[26px] leading-none tracking-[-.035em]">{copy.title}</h2>
           <p className="mt-2 max-w-md text-[11px] leading-relaxed text-muted-foreground">{copy.description}</p>
           <p className="mt-1 max-w-md text-[10px] leading-relaxed text-muted-foreground/80" data-testid="activity-points-formula">{copy.formula}</p>
        </div>
        <div className="grid grid-cols-3 rounded-xl border border-border bg-background/70 p-1" role="group" aria-label={copy.title}>
          {(['weekly', 'monthly', 'yearly'] as Period[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              aria-pressed={period === item}
              className={`min-h-9 rounded-lg px-2 text-[10px] font-semibold transition-colors sm:px-3 ${period === item ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              data-testid={`activity-period-${item}`}
            >
              {copy.periods[item]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingState label={copy.loading} /> : error ? (
        <div className="mt-5 rounded-2xl border border-[#ecc6bd] bg-[#fff0ec] px-5 py-7 text-center dark:border-[#684139] dark:bg-[#33231f]" role="alert">
          <p className="font-serif text-[22px]">{copy.errorTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">{copy.errorDescription}</p>
          {onRetry && <button type="button" onClick={onRetry} className="mt-5 rounded-xl border border-destructive/30 bg-card px-4 py-2.5 text-[11px] font-semibold text-destructive transition-colors hover:bg-destructive/5" data-testid="activity-heatmap-retry">{copy.retry}</button>}
        </div>
      ) : (
        <>
           {partialData && <p className="mt-4 rounded-xl border border-[#e1d4ac] bg-[#faf2dc] px-3 py-2 text-[10px] leading-relaxed text-[#755b25]" role="status" data-testid="activity-heatmap-partial-data">{copy.partialData}</p>}
           <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-[10px] text-muted-foreground">{copy.summary(model.recordedDays, model.total)}</p>
            {model.recordedDays === 0 && <span className="text-right text-[10px] text-muted-foreground">{copy.noActivity}</span>}
          </div>
          {model.period === 'yearly' ? (
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5" role="grid" aria-label={`${copy.periods.yearly} ${today.getFullYear()}`}>
              {model.months.map((month) => (
                <div key={month.date.getMonth()} className="min-w-0">
                  <p className="mb-2 text-[10px] font-semibold capitalize text-muted-foreground">{copy.monthLabel(month.date)}</p>
                  <div className="grid grid-cols-7 gap-[3px]" role="row">
              {month.days.map((cell, index) => cell ? <ActivityCell key={cell.day.date} day={cell.day} level={cell.level} copy={copy} compact tooltipAlign={index % 7 === 0 ? 'start' : index % 7 === 6 ? 'end' : 'center'} /> : <span key={`blank-${index}`} aria-hidden="true" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4" role="grid" aria-label={`${copy.periods[period]} ${today.getFullYear()}`}>
              <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2" role="row">
                {Array.from({ length: 7 }, (_, index) => {
                  const date = addDays(startOfWeek(today), index);
                  return <span key={index} className="text-center text-[9px] font-medium text-muted-foreground" role="columnheader">{copy.dayLetter(date)}</span>;
                })}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="row">
                {model.days.map((cell, index) => cell ? <ActivityCell key={cell.day.date} day={cell.day} level={cell.level} copy={copy} tooltipAlign={index % 7 === 0 ? 'start' : index % 7 === 6 ? 'end' : 'center'} /> : <span key={`blank-${index}`} aria-hidden="true" />)}
              </div>
            </div>
          )}
          <div className="mt-5 flex items-center justify-end gap-2 text-[9px] text-muted-foreground" aria-hidden="true">
            <span>{copy.less}</span>
            {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`size-3 rounded-[3px] border ${levelClass(level)}`} />)}
            <span>{copy.more}</span>
          </div>
          <p className="sr-only">{copy.recorded}</p>
        </>
      )}
    </section>
  );
}

export default ActivityHeatmap;