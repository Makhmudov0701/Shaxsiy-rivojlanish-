import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  getListDiaryEntriesQueryKey,
  useListDiaryEntries,
  Mood,
} from '@workspace/api-client-react';
import type { DiaryEntry } from '@workspace/api-client-react';
import { moodMeta, MoodBadge } from '@/components/diary-ui';

const weekdayLabels = ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha'];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function makeMoodCounts(entries: DiaryEntry[]) {
  const counts = Object.values(Mood).reduce((result, mood) => {
    result[mood] = 0;
    return result;
  }, {} as Record<Mood, number>);

  entries.forEach((entry) => {
    counts[entry.mood] += 1;
  });
  return counts;
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2 pt-6" aria-label="Taqvim yuklanmoqda">
      {Array.from({ length: 35 }, (_, index) => (
        <span key={index} className="skeleton aspect-square rounded-xl" />
      ))}
    </div>
  );
}

export function CalendarAnalytics() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const entriesQuery = useListDiaryEntries(undefined, {
    query: { queryKey: getListDiaryEntriesQueryKey() },
  });

  const entries = entriesQuery.data ?? [];
  const entriesByDate = useMemo(() => {
    return entries.reduce<Record<string, DiaryEntry[]>>((result, entry) => {
      const key = entry.entryDate.slice(0, 10);
      result[key] = result[key] ? [...result[key], entry] : [entry];
      return result;
    }, {});
  }, [entries]);

  const monthEntries = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    return entries.filter((entry) => {
      const date = parseEntryDate(entry.entryDate);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [entries, visibleMonth]);

  const moodCounts = useMemo(() => makeMoodCounts(entries), [entries]);
  const moodData = useMemo(
    () =>
      Object.values(Mood)
        .map((mood) => ({
          mood,
          name: moodMeta[mood].label,
          count: moodCounts[mood],
          fill: moodMeta[mood].color,
        }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count),
    [moodCounts],
  );

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 5 + index, 1);
      const count = entries.filter((entry) => {
        const entryDate = parseEntryDate(entry.entryDate);
        return entryDate.getFullYear() === date.getFullYear() && entryDate.getMonth() === date.getMonth();
      }).length;
      return { month: shortMonthLabel(date), count };
    });
  }, [entries, visibleMonth]);

  const entryDates = useMemo(
    () => Object.keys(entriesByDate).map((value) => parseEntryDate(value)),
    [entriesByDate],
  );
  const selectedEntries = selectedDate ? entriesByDate[selectedDate] ?? [] : [];
  const dominantMood = moodData[0];
  const monthDays = new Set(monthEntries.map((entry) => entry.entryDate.slice(0, 10))).size;

  if (entriesQuery.isLoading) {
    return (
      <section className="mt-12 rounded-[28px] border border-card-border bg-card/70 p-5 sm:p-7" aria-label="Taqvim va kayfiyat tahlili">
        <div className="skeleton h-3 w-32 rounded-full" />
        <div className="mt-3 skeleton h-9 w-72 max-w-full rounded-lg" />
        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
          <CalendarSkeleton />
          <div className="space-y-4">
            <div className="skeleton h-56 rounded-2xl" />
            <div className="skeleton h-36 rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  if (entriesQuery.isError) {
    return (
      <section className="mt-12 rounded-[28px] border border-[#ecc6bd] bg-[#fff0ec] p-7" aria-label="Taqvim va kayfiyat tahlili">
        <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#9a6b23]">Kuzatuvlar</p>
        <h2 className="mt-3 font-serif text-[30px]">Tahlilni hozircha ochib bo‘lmadi.</h2>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">Yozuvlaringiz yuklangach, shu yerda kunlar ritmi va kayfiyatlar ko‘rinadi.</p>
        <button type="button" onClick={() => entriesQuery.refetch()} className="mt-5 rounded-xl border border-destructive/30 bg-card px-4 py-2.5 text-[11px] font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground" data-testid="button-retry-analytics">Qayta urinish</button>
      </section>
    );
  }

  return (
    <section className="mt-12 overflow-hidden rounded-[28px] border border-card-border bg-card/75 shadow-sm" aria-label="Taqvim va kayfiyat tahlili" data-testid="calendar-analytics">
      <div className="border-b border-border/80 px-5 py-6 sm:px-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Kuzatuvlar</p>
            <h2 className="mt-2 font-serif text-[clamp(2rem,4vw,3.25rem)] leading-none tracking-[-.04em]">Kunlar qanday o‘tdi?</h2>
          </div>
          <p className="max-w-[280px] text-[12px] leading-relaxed text-muted-foreground sm:text-right">Yozgan kunlaringizga bir qarash — hukm emas, o‘zingizga qaytish uchun muloyim iz.</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.08fr_.92fr]">
        <div className="border-b border-border/80 p-5 sm:p-7 xl:border-b-0 xl:border-r">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Yozuvlar taqvimi</p>
              <p className="mt-1 font-serif text-[23px] capitalize">{monthLabel(visibleMonth)}</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-[27px] leading-none">{monthEntries.length}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{monthDays} kun yozilgan</p>
            </div>
          </div>

          <Calendar
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            selected={selectedDate ? parseEntryDate(selectedDate) : undefined}
            onSelect={(date: Date | undefined) => setSelectedDate(date ? dateKey(date) : null)}
            modifiers={{ hasEntry: entryDates }}
            modifiersClassNames={{ hasEntry: 'bg-[#f8e9bf] text-[#6c4c21] rounded-xl' }}
            className="w-full [--cell-size:clamp(2.25rem,8vw,3.7rem)]"
            formatters={{
              formatCaption: (date) => monthLabel(date),
              formatWeekdayName: (date) => weekdayLabels[date.getDay()],
            }}
            labels={{
              labelPrevious: () => 'Oldingi oy',
              labelNext: () => 'Keyingi oy',
              labelDayButton: (date) => `${date.getDate()}-${monthLabel(date)}`,
            }}
            aria-label="Yozuvlar taqvimi"
          />

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#d9a441]" /> yozuv bor</span>
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full border border-[#cfc09c] bg-background" /> bo‘sh kun</span>
            <span className="ml-auto">Sanani tanlang</span>
          </div>

          {selectedDate && (
            <div className="mt-5 rounded-2xl border border-[#d9c795] bg-[#faf2dc] p-4 dark:border-[#6b5832] dark:bg-[#332c21]" data-testid="selected-date-entries">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#8f601a]">Tanlangan kun</p>
                <button type="button" onClick={() => setSelectedDate(null)} className="text-[10px] text-muted-foreground underline-offset-2 hover:underline" aria-label="Tanlangan sanani yopish">Yopish</button>
              </div>
              <p className="mt-1 font-serif text-[21px]">{new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(parseEntryDate(selectedDate))}</p>
              {selectedEntries.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {selectedEntries.map((entry) => (
                    <Link key={entry.id} href={`/entry/${entry.id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-[#e3d5ad] bg-card/70 px-3 py-2.5 transition-colors hover:border-[#b89c5c]" data-testid={`calendar-entry-${entry.id}`}>
                      <span className="min-w-0 truncate font-serif text-[17px] group-hover:text-[#6c4c21]">{entry.title}</span>
                      <MoodBadge mood={entry.mood} small />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">Bu kunda yozuv saqlanmagan.</p>
              )}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Kayfiyatlar xaritasi</p>
              <h3 className="mt-2 font-serif text-[25px] leading-tight">{dominantMood ? `Ko‘proq ${dominantMood.name.toLowerCase()}` : 'Hali kuzatuv yo‘q'}</h3>
            </div>
            {dominantMood && <span className="rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.08em]" style={{ color: moodMeta[dominantMood.mood].color, backgroundColor: moodMeta[dominantMood.mood].soft }}>eng ko‘p</span>}
          </div>

          {moodData.length > 0 ? (
            <>
              <div className="mt-4 grid items-center gap-3 sm:grid-cols-[180px_1fr]">
                <ChartContainer config={{ count: { label: 'Yozuvlar', color: '#30243f' } }} className="mx-auto aspect-square h-[180px] w-full max-w-[180px]" aria-label="Kayfiyatlar taqsimoti">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={moodData} dataKey="count" nameKey="name" innerRadius={53} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                      {moodData.map((item) => <Cell key={item.mood} fill={item.fill} />)}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2.5">
                  {moodData.map((item) => (
                    <div key={item.mood} className="flex items-center gap-2.5 text-[11px]">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                      <span className="font-mono text-[10px] text-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 border-t border-border/70 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Oxirgi olti oy</p>
                  <span className="text-[10px] text-muted-foreground">{entries.length} ta yozuv</span>
                </div>
                <ChartContainer config={{ count: { label: 'Yozuvlar', color: '#47796c' } }} className="mt-4 h-[150px] w-full" aria-label="Oxirgi olti oyda yozuvlar soni">
                  <BarChart data={monthlyData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} />
                    <ChartTooltip cursor={{ fill: 'hsl(var(--muted) / .5)' }} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[5, 5, 2, 2]} maxBarSize={28} />
                  </BarChart>
                </ChartContainer>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-5 py-10 text-center dark:border-[#584c37] dark:bg-[#2b271f]">
              <p className="font-serif text-[24px]">Kayfiyatlar hali yozilmagan.</p>
              <p className="mx-auto mt-2 max-w-xs text-[12px] leading-relaxed text-muted-foreground">Birinchi yozuvingizdan keyin bu yerda sizning ichki ritmingiz ko‘rina boshlaydi.</p>
              <Link href="/entry/new" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-[11px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Yangi yozuv</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}