import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Circle, X } from 'lucide-react';
import { useI18n, getCurrentIntlLocale } from '@/lib/i18n';
import type { GoalDailyCheckInStatus, PersonalGoal } from '@/lib/local-life-data';

const DAILY_TRACKER_COPY = {
  uz: {
    title: 'Kunlik bajarilish',
    previousMonth: 'Oldingi oy',
    nextMonth: 'Keyingi oy',
    done: 'Bajarildi',
    missed: 'Bajarilmadi',
    empty: 'Bo‘sh',
    completedDays: 'Bajarilgan kunlar',
    currentStreak: 'Joriy ketma-ketlik',
    missedDays: 'O‘tkazib yuborilgan kunlar',
    daySingular: 'kun uzluksiz',
    dayPlural: 'kun uzluksiz',
    checkInFor: 'Tanlangan sana uchun holat',
    markDone: 'Bajarildi ✅',
    markMissed: 'Bajarilmadi ❌',
    noEntry: 'Bu kun uchun hali qayd yo‘q.',
    reflectionTitle: 'Nima uchun bajara olmadingiz?',
    reflectionLabel: 'Qisqa izoh (ixtiyoriy)',
    reflectionPlaceholder: 'Masalan, vaqt yetmadi, charchoq yoki kutilmagan ish chiqdi.',
    saveReflection: 'Izohni saqlash',
  },
  en: {
    title: 'Daily check-in',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    done: 'Completed',
    missed: 'Missed',
    empty: 'No entry',
    completedDays: 'Completed days',
    currentStreak: 'Current streak',
    missedDays: 'Missed days',
    daySingular: 'day in a row',
    dayPlural: 'days in a row',
    checkInFor: 'Status for selected date',
    markDone: 'Completed ✅',
    markMissed: 'Missed ❌',
    noEntry: 'No check-in recorded for this day.',
    reflectionTitle: 'Why were you unable to complete it?',
    reflectionLabel: 'Short note (optional)',
    reflectionPlaceholder: 'For example, not enough time, tiredness, or an unexpected task.',
    saveReflection: 'Save reflection',
  },
  ru: {
    title: 'Ежедневная отметка',
    previousMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    done: 'Выполнено',
    missed: 'Пропущено',
    empty: 'Нет записи',
    completedDays: 'Выполненные дни',
    currentStreak: 'Текущая серия',
    missedDays: 'Пропущенные дни',
    daySingular: 'день подряд',
    dayPlural: 'дней подряд',
    russianStreak: ['дней подряд', 'день подряд', 'дня подряд'],
    checkInFor: 'Статус за выбранную дату',
    markDone: 'Выполнено ✅',
    markMissed: 'Пропущено ❌',
    noEntry: 'За этот день отметки пока нет.',
    reflectionTitle: 'Почему не удалось выполнить?',
    reflectionLabel: 'Краткая заметка (необязательно)',
    reflectionPlaceholder: 'Например, не хватило времени, усталость или срочное дело.',
    saveReflection: 'Сохранить заметку',
  },
  ko: {
    title: '매일 실천 기록',
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    done: '완료',
    missed: '미완료',
    empty: '기록 없음',
    completedDays: '완료한 날',
    currentStreak: '현재 연속 기록',
    missedDays: '놓친 날',
    daySingular: '일 연속',
    dayPlural: '일 연속',
    checkInFor: '선택한 날짜의 상태',
    markDone: '완료 ✅',
    markMissed: '미완료 ❌',
    noEntry: '이 날짜에는 아직 기록이 없습니다.',
    reflectionTitle: '왜 실천하지 못했나요?',
    reflectionLabel: '간단한 이유 (선택)',
    reflectionPlaceholder: '예: 시간이 부족함, 피곤함, 갑작스러운 일정.',
    saveReflection: '이유 저장',
  },
} as const;

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getCurrentStreak(goal: PersonalGoal, todayKey: string) {
  const entries = goal.dailyCheckIns ?? {};
  const todayStatus = entries[todayKey]?.status;
  if (todayStatus === 'missed') return 0;

  const cursor = parseLocalDate(todayKey);
  if (todayStatus !== 'done') cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (entries[localDateValue(cursor)]?.status === 'done') {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function streakText(count: number, language: keyof typeof DAILY_TRACKER_COPY) {
  if (language === 'ru') {
    const lastTwo = count % 100;
    const lastDigit = count % 10;
    const form = lastTwo >= 11 && lastTwo <= 14 ? 0 : lastDigit === 1 ? 1 : lastDigit >= 2 && lastDigit <= 4 ? 2 : 0;
    return `${count} ${DAILY_TRACKER_COPY.ru.russianStreak[form]}`;
  }
  if (language === 'ko') return `${count}일 연속`;
  const copy = DAILY_TRACKER_COPY[language];
  return `${count} ${count === 1 ? copy.daySingular : copy.dayPlural}`;
}

type GoalDailyTrackerProps = {
  goal: PersonalGoal;
  onSetStatus: (date: string, status: GoalDailyCheckInStatus) => void;
  onSaveReflection: (date: string, reflection: string) => void;
};

export function GoalDailyTracker({ goal, onSetStatus, onSaveReflection }: GoalDailyTrackerProps) {
  const { language } = useI18n();
  const copy = DAILY_TRACKER_COPY[language];
  const locale = getCurrentIntlLocale();
  const today = new Date();
  const todayKey = localDateValue(today);
  const currentMonth = monthValue(today);
  const [visibleMonth, setVisibleMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [reflectionDraft, setReflectionDraft] = useState('');

  const monthStart = parseMonth(visibleMonth);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const monthDayCount = new Date(year, month + 1, 0).getDate();
  const weekStartDay = language === 'en' || language === 'ko' ? 0 : 1;
  const firstDayOffset = (monthStart.getDay() - weekStartDay + 7) % 7;
  const gridCellCount = Math.ceil((firstDayOffset + monthDayCount) / 7) * 7;
  const selectedEntry = goal.dailyCheckIns?.[selectedDate];
  const selectedDateIsFuture = selectedDate > todayKey;
  const selectedFormattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDate(selectedDate));
  const monthTitle = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(monthStart);
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const weekday = new Date(2023, 0, 1 + weekStartDay + index);
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(weekday);
  });

  const daysElapsed = visibleMonth === currentMonth ? today.getDate() : monthDayCount;
  const monthEntries = Object.entries(goal.dailyCheckIns ?? {}).filter(([date]) =>
    date.startsWith(`${visibleMonth}-`) && date <= todayKey,
  );
  const completedCount = monthEntries.filter(([, entry]) => entry.status === 'done').length;
  const missedCount = monthEntries.filter(([, entry]) => entry.status === 'missed').length;
  const completionPercent = daysElapsed ? Math.round((completedCount / daysElapsed) * 100) : 0;
  const currentStreak = getCurrentStreak(goal, todayKey);
  const number = new Intl.NumberFormat(locale);
  const reflectionSaved = selectedEntry?.reflection ?? '';

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setReflectionDraft(goal.dailyCheckIns?.[date]?.reflection ?? '');
  };

  const moveMonth = (amount: number) => {
    const nextMonth = new Date(year, month + amount, 1);
    const nextMonthKey = monthValue(nextMonth);
    if (nextMonthKey > currentMonth) return;
    const targetDay = Math.min(Number(selectedDate.slice(-2)), new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate());
    let nextDate = localDateValue(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), targetDay));
    if (nextDate > todayKey) nextDate = todayKey;
    setVisibleMonth(nextMonthKey);
    selectDate(nextDate);
  };

  const cells = Array.from({ length: gridCellCount }, (_, index) => {
    const day = index - firstDayOffset + 1;
    if (day < 1 || day > monthDayCount) return <span key={`blank-${index}`} aria-hidden="true" className="aspect-square" />;
    const date = localDateValue(new Date(year, month, day));
    const entry = goal.dailyCheckIns?.[date];
    const isFuture = date > todayKey;
    const status = isFuture ? undefined : entry?.status;
    const statusLabel = status === 'done' ? copy.done : status === 'missed' ? copy.missed : copy.empty;
    const colorClass = status === 'done'
      ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
      : status === 'missed'
        ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
        : 'border-border bg-muted/55 text-muted-foreground hover:bg-muted';

    return (
      <button
        key={date}
        type="button"
        onClick={() => selectDate(date)}
        disabled={isFuture}
        aria-label={`${new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(parseLocalDate(date))}: ${statusLabel}`}
        aria-pressed={selectedDate === date}
        title={statusLabel}
        className={`grid aspect-square min-w-0 place-items-center rounded-lg border text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${colorClass} ${selectedDate === date ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''}`}
        data-testid={`goal-checkin-day-${goal.id}-${date}`}
      >
        {number.format(day)}
      </button>
    );
  });

  return (
    <section className="mt-5 border-t border-border/70 pt-4" aria-label={`${goal.title}: ${copy.title}`} data-testid={`goal-daily-tracker-${goal.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-[13px] font-semibold text-muted-foreground">{copy.title}</h4>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label={copy.previousMonth}
            className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground"
            data-testid={`button-goal-previous-month-${goal.id}`}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[118px] text-center text-[12px] font-semibold capitalize">{monthTitle}</span>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            disabled={visibleMonth >= currentMonth}
            aria-label={copy.nextMonth}
            className="grid size-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            data-testid={`button-goal-next-month-${goal.id}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1" aria-label={monthTitle}>
        {weekdayLabels.map((weekday, index) => (
          <span key={`${weekday}-${index}`} className="grid h-7 place-items-center text-[9px] font-medium text-muted-foreground">
            {weekday}
          </span>
        ))}
        {cells}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-emerald-600" />{copy.done}</span>
        <span className="inline-flex items-center gap-1.5"><X size={12} className="text-red-500" />{copy.missed}</span>
        <span className="inline-flex items-center gap-1.5"><Circle size={10} />{copy.empty}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-xl bg-muted/55 p-2.5">
          <p className="text-[9px] leading-snug text-muted-foreground">{copy.completedDays}</p>
          <p className="mt-1 break-words text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
            {number.format(completedCount)}/{number.format(daysElapsed)} · {number.format(completionPercent)}%
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-muted/55 p-2.5">
          <p className="text-[9px] leading-snug text-muted-foreground">{copy.currentStreak}</p>
          <p className="mt-1 break-words text-[12px] font-semibold text-amber-700 dark:text-amber-300">
            {streakText(currentStreak, language)}
          </p>
        </div>
        <div className="min-w-0 rounded-xl bg-muted/55 p-2.5">
          <p className="text-[9px] leading-snug text-muted-foreground">{copy.missedDays}</p>
          <p className="mt-1 text-[13px] font-semibold text-red-600 dark:text-red-300">{number.format(missedCount)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-3 sm:p-4">
        <p className="text-[11px] font-medium text-muted-foreground">
          {copy.checkInFor}: <span className="font-semibold text-foreground">{selectedFormattedDate}</span>
        </p>
        {!selectedEntry && <p className="mt-1 text-[10px] text-muted-foreground">{copy.noEntry}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetStatus(selectedDate, 'done')}
            disabled={selectedDateIsFuture}
            aria-pressed={selectedEntry?.status === 'done'}
            className={`min-h-10 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors disabled:opacity-45 ${selectedEntry?.status === 'done' ? 'bg-emerald-600 text-white' : 'border border-emerald-700/25 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200'}`}
            data-testid={`button-goal-day-done-${goal.id}`}
          >
            {copy.markDone}
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(selectedDate, 'missed')}
            disabled={selectedDateIsFuture}
            aria-pressed={selectedEntry?.status === 'missed'}
            className={`min-h-10 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors disabled:opacity-45 ${selectedEntry?.status === 'missed' ? 'bg-red-500 text-white' : 'border border-red-600/25 bg-red-50 text-red-800 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-200'}`}
            data-testid={`button-goal-day-missed-${goal.id}`}
          >
            {copy.markMissed}
          </button>
        </div>
        {selectedEntry?.status === 'missed' && (
          <div className="mt-4 space-y-2">
            <label htmlFor={`goal-reflection-${goal.id}-${selectedDate}`} className="block text-[12px] font-semibold">
              {copy.reflectionTitle}
            </label>
            <p className="text-[10px] text-muted-foreground">{copy.reflectionLabel}</p>
            <textarea
              id={`goal-reflection-${goal.id}-${selectedDate}`}
              value={reflectionDraft}
              onChange={(event) => setReflectionDraft(event.target.value.slice(0, 500))}
              maxLength={500}
              rows={2}
              placeholder={copy.reflectionPlaceholder}
              className="w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-[12px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-primary"
              data-testid={`input-goal-reflection-${goal.id}-${selectedDate}`}
            />
            <button
              type="button"
              onClick={() => onSaveReflection(selectedDate, reflectionDraft)}
              disabled={reflectionDraft.trim() === reflectionSaved}
              className="min-h-10 rounded-xl bg-primary px-3.5 py-2 text-[11px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
              data-testid={`button-save-goal-reflection-${goal.id}`}
            >
              {copy.saveReflection}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}