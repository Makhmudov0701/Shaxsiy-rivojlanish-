import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Clock3 } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { getCurrentIntlLocale, getCurrentLanguage } from '@/lib/i18n';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ReportRange = 'kun' | 'hafta' | 'oy' | 'yil' | 'custom';
type ChartUnit = 'hour' | 'day' | 'week' | 'month';

type ReportSession = {
  mode: string;
  startedAt: number;
  durationMinutes: number;
  project: string;
};

type ReportTask = {
  completed: boolean;
  completedAt?: number;
};

type DateBounds = {
  start: Date;
  end: Date;
};

type ChartBucket = {
  startAt: number;
  endAt: number;
  label: string;
  detail: string;
  minutes: number;
};

const REPORT_RANGES: { key: Exclude<ReportRange, 'custom'>; label: string }[] = [
  { key: 'kun', label: 'Kunlik' },
  { key: 'hafta', label: 'Haftalik' },
  { key: 'oy', label: 'Oylik' },
  { key: 'yil', label: 'Yillik' },
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date: Date) {
  const day = startOfDay(date);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
}

function dayKey(dateOrTimestamp: Date | number) {
  const date = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateLabel(date: Date, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat(getCurrentIntlLocale(), options).format(date);
}

function getPersonalProjectLabel() {
  return {
    uz: 'Shaxsiy',
    en: 'Personal',
    ru: 'Личное',
    ko: '개인',
  }[getCurrentLanguage()];
}

function formatFocusMinutes(minutes: number) {
  const language = getCurrentLanguage();
  if (language === 'uz') return `${minutes} daqiqa`;
  if (language === 'en') return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  if (language === 'ko') return `${minutes}분`;
  const plural = new Intl.PluralRules('ru-RU').select(minutes);
  return `${minutes} ${plural === 'one' ? 'минута' : plural === 'few' ? 'минуты' : 'минут'}`;
}

function formatFocusSessionCount(count: number) {
  const language = getCurrentLanguage();
  if (language === 'uz') return `${count} ta fokus sessiyasi`;
  if (language === 'en') return `${count} ${count === 1 ? 'focus session' : 'focus sessions'}`;
  if (language === 'ko') return `${count}회 집중 세션`;
  const plural = new Intl.PluralRules('ru-RU').select(count);
  return `${count} ${plural === 'one' ? 'фокус-сессия' : plural === 'few' ? 'фокус-сессии' : 'фокус-сессий'}`;
}

function formatTaskCount(count: number) {
  const language = getCurrentLanguage();
  if (language === 'uz') return `${count} ta`;
  if (language === 'en') return `${count} ${count === 1 ? 'task' : 'tasks'}`;
  if (language === 'ko') return `${count}개`;
  const plural = new Intl.PluralRules('ru-RU').select(count);
  return `${count} ${plural === 'one' ? 'задача' : plural === 'few' ? 'задачи' : 'задач'}`;
}

function formatFocusBucketTooltip(detail: string, minutes: number) {
  return `${detail}: ${formatFocusMinutes(minutes)}`;
}

function formatSessionHeatmapTooltip(date: Date, count: number) {
  const formattedDate = dateLabel(date);
  const language = getCurrentLanguage();
  if (language === 'uz') return `${formattedDate}: ${count} sessiya`;
  if (language === 'en') return `${formattedDate}: ${count} ${count === 1 ? 'session' : 'sessions'}`;
  if (language === 'ko') return `${formattedDate}: ${count}회 세션`;
  const plural = new Intl.PluralRules('ru-RU').select(count);
  return `${formattedDate}: ${count} ${plural === 'one' ? 'сессия' : plural === 'few' ? 'сессии' : 'сессий'}`;
}

function formatSessionHeatmapAriaLabel(periodLabel: string) {
  return {
    uz: `Tanlangan davrdagi sessiyalar: ${periodLabel}`,
    en: `Sessions in the selected period: ${periodLabel}`,
    ru: `Сессии за выбранный период: ${periodLabel}`,
    ko: `선택한 기간의 세션: ${periodLabel}`,
  }[getCurrentLanguage()];
}

function getDateBounds(range: ReportRange, customRange?: DateRange): DateBounds {
  const today = startOfDay(new Date());
  if (range === 'custom' && customRange?.from) {
    const first = startOfDay(customRange.from);
    const second = startOfDay(customRange.to ?? customRange.from);
    return first.getTime() <= second.getTime() ? { start: first, end: second } : { start: second, end: first };
  }
  if (range === 'kun') return { start: today, end: today };
  if (range === 'hafta') {
    const start = startOfWeek(today);
    return { start, end: addDays(start, 6) };
  }
  if (range === 'oy') {
    return {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    };
  }
  if (range === 'yil') {
    return {
      start: new Date(today.getFullYear(), 0, 1),
      end: new Date(today.getFullYear(), 11, 31),
    };
  }
  return { start: today, end: today };
}

function inclusiveDayCount(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((endUtc - startUtc) / 86400000) + 1);
}

function getChartUnit(range: ReportRange, bounds: DateBounds): ChartUnit {
  if (range === 'kun') return 'hour';
  if (range === 'hafta') return 'day';
  if (range === 'oy') return 'week';
  if (range === 'yil') return 'month';
  const days = inclusiveDayCount(bounds.start, bounds.end);
  if (days === 1) return 'hour';
  if (days <= 31) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}

function getChartUnitLabel(unit: ChartUnit) {
  const labels: Record<ChartUnit, Record<ReturnType<typeof getCurrentLanguage>, string>> = {
    hour: { uz: 'Soatlar bo‘yicha', en: 'By hour', ru: 'По часам', ko: '시간별' },
    day: { uz: 'Hafta kunlari bo‘yicha', en: 'By day', ru: 'По дням', ko: '일별' },
    week: { uz: 'Haftalar bo‘yicha', en: 'By week', ru: 'По неделям', ko: '주별' },
    month: { uz: 'Oylar bo‘yicha', en: 'By month', ru: 'По месяцам', ko: '월별' },
  };
  return labels[unit][getCurrentLanguage()];
}

function createBucket(start: Date, endInclusive: Date, label: string, detail: string): ChartBucket {
  return {
    startAt: start.getTime(),
    endAt: addDays(endInclusive, 1).getTime(),
    label,
    detail,
    minutes: 0,
  };
}

function buildChartBuckets(unit: ChartUnit, bounds: DateBounds): ChartBucket[] {
  const buckets: ChartBucket[] = [];
  if (unit === 'hour') {
    for (let hour = 0; hour < 24; hour += 1) {
      const start = new Date(bounds.start);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(bounds.start);
      end.setHours(hour + 1, 0, 0, 0);
      buckets.push({
        startAt: start.getTime(),
        endAt: end.getTime(),
        label: hour % 3 === 0 ? String(hour).padStart(2, '0') : '',
        detail: `${String(hour).padStart(2, '0')}:00`,
        minutes: 0,
      });
    }
    return buckets;
  }

  if (unit === 'day') {
    for (let date = startOfDay(bounds.start); date.getTime() <= bounds.end.getTime(); date = addDays(date, 1)) {
      const weekday = new Intl.DateTimeFormat(getCurrentIntlLocale(), { weekday: 'short' }).format(date);
      buckets.push(createBucket(date, date, String(date.getDate()), `${dateLabel(date)} · ${weekday}`));
    }
    return buckets;
  }

  if (unit === 'week') {
    for (let cursor = startOfWeek(bounds.start); cursor.getTime() <= bounds.end.getTime(); cursor = addDays(cursor, 7)) {
      const weekEnd = addDays(cursor, 6);
      const start = cursor.getTime() < bounds.start.getTime() ? bounds.start : cursor;
      const end = weekEnd.getTime() > bounds.end.getTime() ? bounds.end : weekEnd;
      const label = `${start.getDate()}–${end.getDate()}`;
      buckets.push(createBucket(start, end, label, `${dateLabel(start, { day: 'numeric', month: 'short' })} – ${dateLabel(end)}`));
    }
    return buckets;
  }

  let month = new Date(bounds.start.getFullYear(), bounds.start.getMonth(), 1);
  const lastMonth = new Date(bounds.end.getFullYear(), bounds.end.getMonth(), 1);
  while (month.getTime() <= lastMonth.getTime()) {
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const start = month.getTime() < bounds.start.getTime() ? bounds.start : month;
    const end = monthEnd.getTime() > bounds.end.getTime() ? bounds.end : monthEnd;
    const label = new Intl.DateTimeFormat(getCurrentIntlLocale(), { month: 'short' }).format(month);
    buckets.push(createBucket(start, end, label, `${label} ${month.getFullYear()}`));
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  }
  return buckets;
}

function getPeriodLabel(range: ReportRange, bounds: DateBounds, customRange?: DateRange) {
  const language = getCurrentLanguage();
  if (range === 'custom' && !customRange?.from) {
    return {
      uz: 'Sana oralig‘ini tanlang',
      en: 'Select a date range',
      ru: 'Выберите диапазон дат',
      ko: '날짜 범위를 선택하세요',
    }[language];
  }
  if (range === 'custom' && customRange?.from && !customRange.to) {
    const endDatePrompt = {
      uz: 'tugash sanasini tanlang',
      en: 'select an end date',
      ru: 'выберите дату окончания',
      ko: '종료 날짜를 선택하세요',
    }[language];
    return `${dateLabel(bounds.start)} · ${endDatePrompt}`;
  }
  if (dayKey(bounds.start) === dayKey(bounds.end)) return dateLabel(bounds.start);
  return `${dateLabel(bounds.start, { day: 'numeric', month: 'short' })} – ${dateLabel(bounds.end)}`;
}

function getCustomRangeLabel(customRange?: DateRange) {
  if (!customRange?.from) {
    return {
      uz: 'Sana tanlash',
      en: 'Choose dates',
      ru: 'Выбрать даты',
      ko: '날짜 선택',
    }[getCurrentLanguage()];
  }
  const from = dateLabel(customRange.from, { day: 'numeric', month: 'short' });
  if (!customRange.to) return `${from} – ...`;
  return `${from} – ${dateLabel(customRange.to)}`;
}

function getHeatColor(count: number) {
  if (count >= 3) return 'bg-[#47796c]';
  if (count === 2) return 'bg-[#82a995]';
  if (count === 1) return 'bg-[#bed2c4]';
  return 'bg-[#ecebe4] dark:bg-[#3a3d36]';
}

export function FocusReports({ sessions, tasks }: { sessions: ReportSession[]; tasks: ReportTask[] }) {
  const [range, setRange] = useState<ReportRange>('hafta');
  const [customRange, setCustomRange] = useState<DateRange>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const bounds = getDateBounds(range, customRange);
  const periodStart = bounds.start.getTime();
  const periodEnd = addDays(bounds.end, 1).getTime();
  const chartUnit = getChartUnit(range, bounds);

  const reportSessions = useMemo(
    () => sessions.filter((session) => session.mode === 'focus' && session.startedAt >= periodStart && session.startedAt < periodEnd),
    [sessions, periodStart, periodEnd],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed && task.completedAt !== undefined && task.completedAt >= periodStart && task.completedAt < periodEnd),
    [tasks, periodStart, periodEnd],
  );
  const focusMinutes = reportSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const projectData = useMemo(() => {
    const totals = new Map<string, number>();
    const fallbackProject = getPersonalProjectLabel();
    reportSessions.forEach((session) => totals.set(session.project || fallbackProject, (totals.get(session.project || fallbackProject) ?? 0) + session.durationMinutes));
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [reportSessions]);
  const chartBuckets = useMemo(() => {
    const buckets = buildChartBuckets(chartUnit, bounds);
    return buckets.map((bucket) => ({
      ...bucket,
      minutes: reportSessions
        .filter((session) => session.startedAt >= bucket.startAt && session.startedAt < bucket.endAt)
        .reduce((sum, session) => sum + session.durationMinutes, 0),
    }));
  }, [chartUnit, periodStart, periodEnd, reportSessions]);
  const maxBucket = Math.max(25, ...chartBuckets.map((bucket) => bucket.minutes));
  const maxProject = Math.max(1, ...projectData.map(([, value]) => value));
  const logs = [...reportSessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 12);
  const periodLabel = getPeriodLabel(range, bounds, customRange);

  const heatmapCells = useMemo(() => {
    const counts = new Map<string, number>();
    reportSessions.forEach((session) => {
      const key = dayKey(session.startedAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const gridStart = startOfWeek(bounds.start);
    const gridEnd = addDays(startOfWeek(bounds.end), 6);
    const count = inclusiveDayCount(gridStart, gridEnd);
    return Array.from({ length: count }, (_, index) => {
      const date = addDays(gridStart, index);
      const inRange = date.getTime() >= periodStart && date.getTime() < periodEnd;
      return { date, key: dayKey(date), count: counts.get(dayKey(date)) ?? 0, inRange };
    });
  }, [reportSessions, periodStart, periodEnd]);

  return (
    <section className="w-full min-w-0 max-w-full space-y-5" data-testid="focus-reports">
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Sokin hisob</p>
          <h2 className="mt-1 font-serif text-[clamp(2rem,4vw,3.1rem)] leading-none">Fokus hisobotlari</h2>
          <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-muted-foreground">Diqqat vaqtingizni kuzating, qaysi ishlar kuningizni to‘ldirayotganini ko‘ring.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-full overflow-x-auto pb-1">
            <div className="inline-flex min-w-max rounded-xl bg-muted p-1" role="tablist" aria-label="Hisobot davri">
              {REPORT_RANGES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={range === key}
                  onClick={() => { setRange(key); setDatePickerOpen(false); }}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] transition-colors ${range === key ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  data-testid={`button-report-${key}`}
                >
                  {label}
                </button>
              ))}
              <Popover open={datePickerOpen} onOpenChange={(open) => { setDatePickerOpen(open); if (open) setRange('custom'); }}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={range === 'custom'}
                    onClick={() => setRange('custom')}
                    className={`inline-flex max-w-[230px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] transition-colors ${range === 'custom' ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    data-testid="button-report-custom"
                  >
                    <CalendarDays size={13} className="shrink-0" />
                    <span className="truncate">{getCustomRangeLabel(customRange)}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto max-w-[calc(100vw-1rem)] p-3" data-testid="popover-report-date-range">
                  <p className="mb-2 px-1 text-[10px] font-medium text-muted-foreground">Boshlanish va tugash sanasini tanlang</p>
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={(selection) => {
                      setCustomRange(selection);
                      if (selection?.from && selection.to) setDatePickerOpen(false);
                    }}
                    numberOfMonths={1}
                    captionLayout="dropdown"
                    className="rounded-xl border"
                    data-testid="calendar-report-date-range"
                  />
                  <div className="mt-2 flex min-h-7 items-center justify-between gap-3 border-t border-border/70 pt-2">
                    <span className="text-[9px] text-muted-foreground" aria-live="polite">
                      {customRange?.from && !customRange.to ? 'Tugash sanasini tanlang' : 'Sana oralig‘i yangilanadi'}
                    </span>
                    {customRange?.from && (
                      <button type="button" onClick={() => setCustomRange(undefined)} className="text-[9px] font-semibold text-[#47796c] hover:underline" data-testid="button-clear-report-dates">Tozalash</button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <p className="shrink-0 text-[10px] text-muted-foreground" data-testid="text-report-period">{periodLabel}</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#e6efe8] p-5 dark:bg-[#283c32]" data-testid="metric-focus-time">
          <p className="text-[10px] text-[#527463] dark:text-[#b8d6c3]">Tanlangan davr · diqqat vaqti</p>
          <p className="mt-2 font-mono text-[30px] leading-none text-[#315d4e] dark:text-[#d1ebd9]">{Math.floor(focusMinutes / 60)}<span className="ml-1 text-[13px]">soat</span> {focusMinutes % 60}<span className="ml-1 text-[13px]">daq</span></p>
          <p className="mt-4 text-[10px] text-[#527463] dark:text-[#b8d6c3]">{formatFocusSessionCount(reportSessions.length)}</p>
        </div>
        <div className="rounded-2xl bg-[#f5eee2] p-5" data-testid="metric-focus-sessions">
          <p className="text-[10px] text-[#8d7047]">Fokus sessiyalari</p>
          <p className="mt-2 font-mono text-[30px] leading-none text-[#80583a]">{reportSessions.length}</p>
          <p className="mt-4 text-[10px] text-[#8d7047]">{periodLabel}</p>
        </div>
        <div className="rounded-2xl bg-[#eeebf3] p-5 dark:bg-[#34303d]" data-testid="metric-completed-tasks">
          <p className="text-[10px] text-[#706283] dark:text-[#cfc3dd]">Bajarilgan vazifalar</p>
          <p className="mt-2 font-mono text-[30px] leading-none text-[#5b4c6f] dark:text-[#e2d8eb]">{completedTasks.length}</p>
          <p className="mt-4 text-[10px] text-[#706283] dark:text-[#cfc3dd]">Tanlangan davrda yakunlandi</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#47796c]" />
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Diqqat taqsimoti</p>
            <span className="ml-auto text-[9px] text-muted-foreground">{getChartUnitLabel(chartUnit)}</span>
          </div>
          <div className="mt-5 overflow-x-auto pb-1">
            <div className={`flex h-[165px] items-end gap-2 ${chartBuckets.length > 14 ? 'min-w-[620px]' : ''}`}>
              {chartBuckets.map((bucket, index) => (
                <div key={`${bucket.startAt}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2" aria-label={formatFocusBucketTooltip(bucket.detail, bucket.minutes)}>
                  <span className="font-mono text-[9px] text-muted-foreground">{bucket.minutes || ''}</span>
                  <div className="flex h-[112px] w-full items-end rounded-lg bg-[#f0eee5] dark:bg-[#34372f]" title={formatFocusBucketTooltip(bucket.detail, bucket.minutes)}>
                    <div className="w-full rounded-lg bg-[#83a998] transition-[height]" style={{ height: `${Math.max(bucket.minutes ? 8 : 3, (bucket.minutes / maxBucket) * 100)}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Loyihalar taqsimoti</p>
          <p className="mt-1 text-[9px] text-muted-foreground">Tanlangan davr · daqiqalar</p>
          <div className="mt-5 space-y-4">
            {projectData.length ? projectData.map(([project, value], index) => (
              <div key={project} className="grid grid-cols-[minmax(80px,.6fr)_1fr_44px] items-center gap-3 text-[11px]">
                <span className="truncate">{project}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${index % 2 ? 'bg-[#b88b68]' : 'bg-[#6e9b87]'}`} style={{ width: `${(value / maxProject) * 100}%` }} /></span>
                <span className="font-mono text-[9px] text-muted-foreground">{formatFocusMinutes(value)}</span>
              </div>
            )) : <p className="rounded-xl bg-muted px-3 py-5 text-[11px] text-muted-foreground">Tanlangan davrda fokus sessiyalari yo‘q.</p>}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Sessiya issiqlik xaritasi</p>
            <span className="text-[9px] text-muted-foreground">{periodLabel}</span>
          </div>
          <div className="mt-4 max-w-full overflow-x-auto pb-1" aria-label={formatSessionHeatmapAriaLabel(periodLabel)}>
            <div className="grid w-max auto-cols-[10px] grid-flow-col grid-rows-7 gap-1.5">
              {heatmapCells.map((cell, index) => (
                <span
                  key={`${cell.key}-${index}`}
                  title={cell.inRange ? formatSessionHeatmapTooltip(cell.date, cell.count) : undefined}
                  aria-hidden={!cell.inRange}
                  className={`size-2.5 rounded-[3px] ${cell.inRange ? getHeatColor(cell.count) : 'invisible'}`}
                  data-testid={`heatmap-cell-${index}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground">
            <span>kam</span><span className="size-2.5 rounded-[3px] bg-[#ecebe4] dark:bg-[#3a3d36]" /><span className="size-2.5 rounded-[3px] bg-[#bed2c4]" /><span className="size-2.5 rounded-[3px] bg-[#82a995]" /><span className="size-2.5 rounded-[3px] bg-[#47796c]" /><span>ko‘p</span>
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5">
          <div className="flex items-center gap-2">
            <Clock3 size={15} className="text-[#9b6543]" />
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Bajarilgan sessiyalar</p>
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground">{periodLabel}</p>
          <div className="mt-4 space-y-2">
            {logs.length ? logs.map((session) => (
              <div key={`${session.startedAt}-${session.project}`} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-[10px]">
                <div className="min-w-0">
                  <p className="truncate font-medium">{session.project}</p>
                  <p className="mt-1 text-muted-foreground">{dateLabel(new Date(session.startedAt), { weekday: 'short', day: 'numeric', month: 'short' })} · {new Intl.DateTimeFormat(getCurrentIntlLocale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(session.startedAt))}</p>
                </div>
                <span className="shrink-0 font-mono text-[#47796c]">{formatFocusMinutes(session.durationMinutes)}</span>
              </div>
            )) : <p className="rounded-xl bg-muted px-3 py-5 text-[11px] text-muted-foreground">Tanlangan davrda bajarilgan fokus sessiyalari yo‘q.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}