import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getListDiaryEntriesQueryKey, Mood, useListDiaryEntries } from '@workspace/api-client-react';
import type { DiaryEntry } from '@workspace/api-client-react';
import { moodMeta, MoodBadge } from '@/components/diary-ui';

type AnalyticsMode = 'calendar' | 'analytics';

const weekdayLabels = ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'];
const moodValues = Object.values(Mood);

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseEntryDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('uz-UZ', { month: 'long', year: 'numeric' }).format(date);
}

function shortMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('uz-UZ', { month: 'short' }).format(date).replace('.', '');
}

function countMoods(entries: DiaryEntry[]) {
  return entries.reduce<Record<Mood, number>>((counts, entry) => {
    counts[entry.mood] += 1;
    return counts;
  }, moodValues.reduce((counts, mood) => ({ ...counts, [mood]: 0 }), {} as Record<Mood, number>));
}

function CalendarSkeleton() {
  return <div className="grid grid-cols-7 gap-2 pt-6" aria-label="Taqvim yuklanmoqda">{Array.from({ length: 35 }, (_, index) => <span key={index} className="skeleton aspect-square rounded-xl" />)}</div>;
}

function CalendarView({ entries, visibleMonth, setVisibleMonth }: { entries: DiaryEntry[]; visibleMonth: Date; setVisibleMonth: (date: Date) => void }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const entriesByDate = useMemo(() => entries.reduce<Record<string, DiaryEntry[]>>((result, entry) => ({ ...result, [entry.entryDate.slice(0, 10)]: [...(result[entry.entryDate.slice(0, 10)] ?? []), entry] }), {}), [entries]);
  const monthEntries = entries.filter((entry) => {
    const date = parseEntryDate(entry.entryDate);
    return date.getFullYear() === visibleMonth.getFullYear() && date.getMonth() === visibleMonth.getMonth();
  });
  const entryDates = Object.keys(entriesByDate).map(parseEntryDate);
  const selectedEntries = selectedDate ? entriesByDate[selectedDate] ?? [] : [];
  const monthDays = new Set(monthEntries.map((entry) => entry.entryDate.slice(0, 10))).size;

  return (
    <div className="rounded-[24px] border border-card-border bg-card p-5 sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Yozuvlar taqvimi</p><p className="mt-1 font-serif text-[23px] capitalize">{monthLabel(visibleMonth)}</p></div>
        <div className="text-right"><p className="font-serif text-[27px] leading-none">{monthEntries.length}</p><p className="mt-1 text-[10px] text-muted-foreground">{monthDays} kun yozilgan</p></div>
      </div>
      <Calendar
        month={visibleMonth}
        onMonthChange={setVisibleMonth}
        selected={selectedDate ? parseEntryDate(selectedDate) : undefined}
        onSelect={(date: Date | undefined) => setSelectedDate(date ? dateKey(date) : null)}
        modifiers={{ hasEntry: entryDates }}
        modifiersClassNames={{ hasEntry: 'bg-[#f8e9bf] text-[#6c4c21] rounded-xl' }}
        className="w-full [--cell-size:clamp(2.25rem,8vw,3.7rem)]"
        formatters={{ formatCaption: monthLabel, formatWeekdayName: (date) => weekdayLabels[date.getDay()] }}
        labels={{ labelPrevious: () => 'Oldingi oy', labelNext: () => 'Keyingi oy', labelDayButton: (date) => `${date.getDate()}-${monthLabel(date)}` }}
        aria-label="Yozuvlar taqvimi"
      />
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#d9a441]" /> yozuv bor</span><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full border border-[#cfc09c] bg-background" /> bo‘sh kun</span><span className="ml-auto">Sanani tanlang</span></div>
      {selectedDate && <div className="mt-5 rounded-2xl border border-[#d9c795] bg-[#faf2dc] p-4 dark:border-[#6b5832] dark:bg-[#332c21]" data-testid="selected-date-entries"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8f601a]">Tanlangan kun</p><button type="button" onClick={() => setSelectedDate(null)} className="text-[10px] text-muted-foreground underline-offset-2 hover:underline" aria-label="Tanlangan sanani yopish">Yopish</button></div><p className="mt-1 font-serif text-[21px]">{new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(parseEntryDate(selectedDate))}</p>{selectedEntries.length > 0 ? <div className="mt-3 space-y-2">{selectedEntries.map((entry) => <Link key={entry.id} href={`/entry/${entry.id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-[#e3d5ad] bg-card/70 px-3 py-2.5 transition-colors hover:border-[#b89c5c]" data-testid={`calendar-entry-${entry.id}`}><span className="min-w-0 truncate font-serif text-[17px] group-hover:text-[#6c4c21]">{entry.title}</span><MoodBadge mood={entry.mood} small /></Link>)}</div> : <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">Bu kunda yozuv saqlanmagan.</p>}</div>}
    </div>
  );
}

function MoodAnalytics({ entries, visibleMonth, setVisibleMonth }: { entries: DiaryEntry[]; visibleMonth: Date; setVisibleMonth: (date: Date) => void }) {
  const monthEntries = entries.filter((entry) => {
    const date = parseEntryDate(entry.entryDate);
    return date.getFullYear() === visibleMonth.getFullYear() && date.getMonth() === visibleMonth.getMonth();
  });
  const moodCounts = countMoods(monthEntries);
  const moodData = moodValues.map((mood) => ({ mood, name: moodMeta[mood].label, count: moodCounts[mood], fill: moodMeta[mood].color })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  const monthlyMoodData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 5 + index, 1);
    const monthEntriesForChart = entries.filter((entry) => {
      const entryDate = parseEntryDate(entry.entryDate);
      return entryDate.getFullYear() === date.getFullYear() && entryDate.getMonth() === date.getMonth();
    });
    const counts = countMoods(monthEntriesForChart);
    return { month: shortMonthLabel(date), ...counts };
  });
  const dominantMood = moodData[0];
  const chartConfig = moodValues.reduce((config, mood) => ({ ...config, [mood]: { label: moodMeta[mood].label, color: moodMeta[mood].color } }), {});

  return (
    <div className="rounded-[24px] border border-card-border bg-card p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Kayfiyatlar xaritasi</p><h3 className="mt-2 font-serif text-[25px] leading-tight">{dominantMood ? `Ko‘proq ${dominantMood.name.toLowerCase()}` : 'Hali kuzatuv yo‘q'}</h3><p className="mt-1 text-[11px] text-muted-foreground">{monthLabel(visibleMonth)}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted" aria-label="Oldingi oy"><ChevronLeft size={15} /></button><button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted" aria-label="Keyingi oy"><ChevronRight size={15} /></button></div></div>
      {moodData.length > 0 ? <><div className="mt-5 grid items-center gap-3 sm:grid-cols-[180px_1fr]"><ChartContainer config={{ count: { label: 'Yozuvlar', color: '#30243f' } }} className="mx-auto aspect-square h-[180px] w-full max-w-[180px]" aria-label="Tanlangan oydagi kayfiyatlar taqsimoti"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel />} /><Pie data={moodData} dataKey="count" nameKey="name" innerRadius={53} outerRadius={78} paddingAngle={3} strokeWidth={0} isAnimationActive={false}>{moodData.map((item) => <Cell key={item.mood} fill={item.fill} />)}</Pie></PieChart></ChartContainer><div className="space-y-2.5">{moodData.map((item) => <div key={item.mood} className="flex items-center gap-2.5 text-[11px]"><span className="size-2 rounded-full" style={{ backgroundColor: item.fill }} /><span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span><span className="font-mono text-[10px] text-foreground">{item.count}</span></div>)}</div></div></> : <div className="mt-5 rounded-2xl border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-5 py-8 text-center dark:border-[#584c37] dark:bg-[#2b271f]"><p className="font-serif text-[24px]">Bu oyda kayfiyatlar yozilmagan.</p><p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed text-muted-foreground">Boshqa oyga o‘ting yoki yangi yozuv bilan kuzatuvni boshlang.</p></div>}
      <div className="mt-7 border-t border-border/70 pt-5"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Oxirgi olti oy</p><span className="text-[10px] text-muted-foreground">{entries.length} ta yozuv</span></div><ChartContainer config={chartConfig} className="mt-4 h-[250px] w-full" aria-label="Oxirgi olti oyda kayfiyatlar soni"><BarChart data={monthlyMoodData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}><XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} /><ChartTooltip cursor={{ fill: 'hsl(var(--muted) / .5)' }} content={<ChartTooltipContent />} /><Bar dataKey="peaceful" name={moodMeta.peaceful.label} stackId="mood" fill="var(--color-peaceful)" isAnimationActive={false} /><Bar dataKey="happy" name={moodMeta.happy.label} stackId="mood" fill="var(--color-happy)" isAnimationActive={false} /><Bar dataKey="grateful" name={moodMeta.grateful.label} stackId="mood" fill="var(--color-grateful)" isAnimationActive={false} /><Bar dataKey="energized" name={moodMeta.energized.label} stackId="mood" fill="var(--color-energized)" isAnimationActive={false} /><Bar dataKey="thoughtful" name={moodMeta.thoughtful.label} stackId="mood" fill="var(--color-thoughtful)" isAnimationActive={false} /><Bar dataKey="sad" name={moodMeta.sad.label} stackId="mood" fill="var(--color-sad)" isAnimationActive={false} /><Bar dataKey="anxious" name={moodMeta.anxious.label} stackId="mood" fill="var(--color-anxious)" radius={[5, 5, 2, 2]} isAnimationActive={false} /></BarChart></ChartContainer><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{moodValues.map((mood) => <span key={mood} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: moodMeta[mood].color }} />{moodMeta[mood].label}</span>)}</div></div>
    </div>
  );
}

export function CalendarAnalytics({ mode }: { mode: AnalyticsMode }) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const entriesQuery = useListDiaryEntries(undefined, { query: { queryKey: getListDiaryEntriesQueryKey() } });
  const entries = entriesQuery.data ?? [];

  if (entriesQuery.isLoading) return <section className="mt-10 rounded-[28px] border border-card-border bg-card/70 p-5 sm:p-7" aria-label={mode === 'calendar' ? 'Taqvim yuklanmoqda' : 'Kayfiyat tahlili yuklanmoqda'}><div className="skeleton h-3 w-32 rounded-full" /><div className="mt-3 skeleton h-9 w-72 max-w-full rounded-lg" /><div className="mt-8 grid gap-8 lg:grid-cols-2"><CalendarSkeleton /><div className="skeleton h-56 rounded-2xl" /></div></section>;
  if (entriesQuery.isError) return <section className="mt-10 rounded-[28px] border border-[#ecc6bd] bg-[#fff0ec] p-7" aria-label="Tahlil xatosi"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#9a6b23]">Kuzatuvlar</p><h2 className="mt-3 font-serif text-[30px]">Tahlilni hozircha ochib bo‘lmadi.</h2><p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">Yozuvlaringiz yuklangach, shu yerda kunlar ritmi va kayfiyatlar ko‘rinadi.</p><button type="button" onClick={() => entriesQuery.refetch()} className="mt-5 rounded-xl border border-destructive/30 bg-card px-4 py-2.5 text-[11px] font-semibold text-destructive" data-testid="button-retry-analytics">Qayta urinish</button></section>;

  return <section className="mt-10" aria-label={mode === 'calendar' ? 'Taqvim ko‘rinishi' : 'Kayfiyat tahlili'} data-testid={mode === 'calendar' ? 'calendar-view' : 'mood-analytics'}><div className="mb-5"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">{mode === 'calendar' ? 'Yozuvlar taqvimi' : 'Oylik kuzatuvlar'}</p><h2 className="mt-2 font-serif text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.04em]">{mode === 'calendar' ? 'Kunlar qanday o‘tdi?' : 'Kayfiyatingiz ritmi'}</h2><p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground">{mode === 'calendar' ? 'Yozgan kunlaringizga bir qarash — tanlangan kunda yozuvni oching.' : 'Har oyda qayd etilgan kayfiyatlarni ko‘rib, ichki ritmingizni kuzating.'}</p></div>{mode === 'calendar' ? <CalendarView entries={entries} visibleMonth={visibleMonth} setVisibleMonth={setVisibleMonth} /> : <MoodAnalytics entries={entries} visibleMonth={visibleMonth} setVisibleMonth={setVisibleMonth} />}</section>;
}