import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, Link, useLocation, useParams } from 'wouter';
import { useAuth, useSignIn, useSignUp } from '@clerk/react';
import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE, passwordSchema } from '@workspace/api-zod';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleAlert, FileJson, FileText, Heart, ImagePlus, LoaderCircle, LockKeyhole, Mic, MicOff, Search, ShieldCheck, X } from 'lucide-react';
import {
  DiaryEntryInput,
  DiaryEntryUpdate,
  Mood,
  getGetDiaryEntryQueryKey,
  getGetDiarySettingsQueryKey,
  getGetDiarySummaryQueryKey,
  getGetDiaryWeeklySummaryQueryKey,
  getListDiaryEntriesQueryKey,
  exportDiary,
  useDeleteDiaryPhoto,
  useGetDiarySettings,
  useRemoveDiaryPin,
  useSetDiaryPin,
  useGetDiaryWeeklySummary,
  useCreateDiaryEntry,
  useDeleteDiaryEntry,
  useGetDiaryEntry,
  useGetDiarySummary,
  useListDiaryEntries,
  useToggleDiaryEntryFavorite,
  useUpdateDiaryEntry,
  uploadDiaryPhoto,
} from '@workspace/api-client-react';
import type { DiaryEntry, DiaryPhoto, DiaryWeeklySummary } from '@workspace/api-client-react';
import { DiaryShell, EmptyEntries, EntryCard, FlashNotice, LogoMark, MoodBadge, ThemeToggle, moodMeta } from '@/components/diary-ui';
import { CalendarAnalytics } from '@/components/calendar-analytics';

const moods = Object.values(Mood);

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionResultEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return undefined;
  const browserWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
}

function LoadingRows() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-[218px] rounded-[22px] border border-border bg-card p-5" data-testid={`skeleton-entry-${item}`}><div className="skeleton h-3 w-24 rounded-full" /><div className="skeleton mt-8 h-8 w-4/5 rounded-lg" /><div className="skeleton mt-3 h-3 w-full rounded-full" /><div className="skeleton mt-2 h-3 w-3/4 rounded-full" /></div>)}</div>;
}

function ErrorPanel({ onRetry, detail = false }: { onRetry: () => void; detail?: boolean }) {
  return <div className="rounded-[24px] border border-[#ecc6bd] bg-[#fff0ec] px-6 py-12 text-center" data-testid="status-error"><CircleAlert className="mx-auto text-destructive" size={24} /><h2 className="mt-4 font-serif text-[27px]">{detail ? 'Bu sahifaga kirib bo‘lmadi.' : 'Yozuvlar biroz kutmoqda.'}</h2><p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">Kundaligingizni hozircha yuklay olmadik. So‘zlaringiz xavfsiz, yana bir bor urinib ko‘ring.</p><button type="button" onClick={onRetry} className="mt-6 rounded-xl border border-destructive/30 bg-card px-4 py-2.5 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground" data-testid="button-retry">Qayta urinish</button></div>;
}

function WeeklySummaryCard({ summary, isLoading, isError, onRetry }: { summary?: DiaryWeeklySummary; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  if (isLoading) {
    return <section className="mt-8 rounded-[24px] border border-card-border bg-card p-5 sm:p-6" aria-label="Haftalik xulosa yuklanmoqda"><div className="skeleton h-3 w-28 rounded-full" /><div className="mt-4 skeleton h-5 w-3/4 max-w-lg rounded-lg" /><div className="mt-3 skeleton h-3 w-full max-w-2xl rounded-full" /><div className="mt-2 skeleton h-3 w-4/5 max-w-xl rounded-full" /></section>;
  }
  if (isError) {
    return <section className="mt-8 flex flex-col gap-3 rounded-[24px] border border-[#ecc6bd] bg-[#fff0ec] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" role="alert" data-testid="weekly-summary-error"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#9a6b23]">Haftalik xulosa</p><p className="mt-2 text-[12px] text-muted-foreground">Xulosani hozircha yuklab bo‘lmadi.</p></div><button type="button" onClick={onRetry} className="self-start rounded-xl border border-destructive/30 bg-card px-3 py-2 text-[11px] font-semibold text-destructive sm:self-auto" data-testid="button-retry-weekly-summary">Qayta urinish</button></section>;
  }
  if (!summary) return null;
  const dateFormat = new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'short' });
  const range = `${dateFormat.format(new Date(`${summary.weekStart}T12:00:00`))} — ${dateFormat.format(new Date(`${summary.weekEnd}T12:00:00`))}`;
  return <section className="mt-8 overflow-hidden rounded-[24px] border border-[#d7c795] bg-[#faf3df] dark:border-[#5e5037] dark:bg-[#302a20]" data-testid="weekly-summary-card"><div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"><div className="max-w-3xl"><div className="flex flex-wrap items-center gap-3"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Haftalik xulosa</p><span className="rounded-full border border-[#d8c38d] bg-[#f4e4b6] px-2 py-1 font-mono text-[9px] uppercase tracking-[.08em] text-[#8f601a]">Sokin tahlil</span></div><p className="mt-4 font-serif text-[clamp(1.45rem,3vw,2.1rem)] leading-tight text-primary">{summary.summary}</p><div className="mt-4 rounded-2xl border border-[#e2d4ad] bg-card/55 p-4 dark:border-[#5a4d38]"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#9a6b23]">Yaxshi jihat</p><p className="mt-2 text-[13px] leading-relaxed text-foreground">{summary.insight}</p></div></div><div className="flex shrink-0 gap-2 text-center"><div className="rounded-2xl border border-[#e2d4ad] bg-card/55 px-3 py-2.5 dark:border-[#5a4d38]"><p className="font-serif text-[24px] leading-none">{summary.entryCount}</p><p className="mt-1 text-[10px] text-muted-foreground">yozuv</p></div><div className="rounded-2xl border border-[#e2d4ad] bg-card/55 px-3 py-2.5 dark:border-[#5a4d38]"><p className="font-serif text-[24px] leading-none">{summary.activeDays}</p><p className="mt-1 text-[10px] text-muted-foreground">faol kun</p></div></div></div><div className="flex flex-wrap items-center gap-3 border-t border-[#e2d4ad] px-5 py-3.5 text-[10px] text-muted-foreground dark:border-[#5a4d38] sm:px-6"><span>{range}</span>{summary.topMoods.length > 0 && <><span className="text-[#c8b684]">•</span><span>Ko‘p uchragan kayfiyatlar:</span>{summary.topMoods.map((item) => <MoodBadge key={item.mood} mood={item.mood} small />)}</>}</div></section>;
}

export function HomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  if (isSignedIn) return <Redirect to="/user-portal" />;
  return <div className="paper-grain min-h-[100dvh] overflow-hidden bg-background text-foreground">
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
      <LogoMark />
      <div className="flex items-center gap-2"><ThemeToggle /><Link href="/sign-in" className="hidden rounded-xl px-4 py-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block" data-testid="link-sign-in">Kirish</Link><Link href="/sign-up" className="rounded-xl bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-sign-up">Boshlash <ArrowUpRight className="ml-1 inline-block" size={14} /></Link></div>
    </nav>
    <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:pb-32 md:pt-24 lg:px-12">
      <div className="relative z-10 diary-rise"><p className="font-mono text-[10px] uppercase tracking-[0.23em] text-[#9a6b23]">Har kunlik shaxsiy odat</p><h1 className="mt-5 max-w-2xl font-serif text-[clamp(4rem,8vw,7.7rem)] leading-[.86] tracking-[-0.055em] text-primary">Kichik<br /><em className="text-[#a66a13]">lahzalarni saqlang.</em></h1><p className="mt-8 max-w-md text-[16px] leading-[1.7] text-muted-foreground">Kun haqida xotirjam yozish uchun joy. Samimiy yozing, kerak bo‘lsa keyin toping va eslashga arzigulik lahzalarni asrang.</p><div className="mt-9 flex flex-wrap items-center gap-4"><Link href="/sign-up" className="group inline-flex items-center gap-3 rounded-2xl bg-primary px-5 py-3.5 text-[13px] font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-1 hover:shadow-lg" data-testid="button-hero-start">Kundalikni ochish <span className="grid size-6 place-items-center rounded-full bg-[#d9a441] text-primary"><ArrowUpRight size={14} /></span></Link><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Faqat siz uchun</span></div></div>
      <div className="relative mx-auto h-[420px] w-full max-w-[480px] diary-drift diary-delay-2"><div className="absolute right-2 top-2 h-[350px] w-[74%] rotate-[6deg] rounded-[28px] border border-[#cfc09c] bg-[#eadfbf] shadow-lg" /><div className="absolute bottom-4 left-5 h-[360px] w-[78%] -rotate-[7deg] rounded-[28px] border border-[#cfc09c] bg-[#f9f1de] shadow-xl" /><div className="absolute left-[14%] top-8 h-[365px] w-[78%] rotate-[1deg] rounded-[28px] border border-[#d4c7a7] bg-[#fffaf0] p-8 shadow-2xl"><div className="flex items-center justify-between border-b border-[#e6dcc3] pb-5"><span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#9a8e76]">Seshanba / 08.13</span><span className="size-2 rounded-full bg-[#d9a441]" /></div><p className="mt-10 font-serif text-[31px] leading-[1.02] text-primary">“Kunni<br />imtihon emas,<br /><em>tashrif deb biling.”</em></p><div className="mt-9 space-y-3"><div className="h-px w-full bg-[#e6dcc3]" /><div className="h-px w-[82%] bg-[#e6dcc3]" /><div className="h-px w-[91%] bg-[#e6dcc3]" /></div><p className="mt-7 font-mono text-[9px] uppercase tracking-[.15em] text-[#9a8e76]">bugungi yaxshilik: yomg‘ir</p></div><span className="absolute -bottom-1 right-4 grid size-16 rotate-12 place-items-center rounded-full border border-[#d0a84f] bg-[#e9c66e] text-center font-mono text-[9px] uppercase leading-tight tracking-[.1em] text-[#60431f] shadow-md">qaytish<br />uchun</span></div>
    </section>
    <section className="border-y border-[#d8ccb0] bg-[#ece5d1] px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[.7fr_1.3fr]"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">Odat</p><h2 className="mt-5 max-w-sm font-serif text-[47px] leading-[.94] tracking-[-.04em] text-primary">O‘z ovozingiz uchun joy yarating.</h2></div><div className="grid gap-10 sm:grid-cols-3"><div><span className="font-mono text-[12px] text-[#9a6b23]">01</span><h3 className="mt-4 font-serif text-[25px]">Yozib qo‘ying</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Boshlashga yordam beradigan shakl bor, lekin yo‘lingizni to‘sadigan qoidalar yo‘q.</p></div><div><span className="font-mono text-[12px] text-[#9a6b23]">02</span><h3 className="mt-4 font-serif text-[25px]">Tuyg‘uni nomlang</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Kayfiyatni belgilang, bir nechta teg qo‘shing va lahzaning mazmunini saqlang.</p></div><div><span className="font-mono text-[12px] text-[#9a6b23]">03</span><h3 className="mt-4 font-serif text-[25px]">Yana qayting</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Muhim bo‘lgan narsani eslash yoki shunchaki xotiraga qaytish uchun arxivni qidiring.</p></div></div></div></section>
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-[1fr_1.1fr] lg:px-12"><div className="relative mx-auto h-64 w-full max-w-[430px]"><div className="absolute left-8 top-7 h-44 w-44 rounded-full bg-[#d7e7dc]" /><div className="absolute bottom-0 right-6 h-40 w-40 rounded-full bg-[#efcf86]" /><div className="absolute left-24 top-16 grid size-36 place-items-center rounded-[42%] bg-primary shadow-xl"><LockKeyhole className="text-[#f9f1de]" size={36} strokeWidth={1.3} /></div></div><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">Faqat sizniki</p><h2 className="mt-5 max-w-lg font-serif text-[clamp(3rem,5vw,5rem)] leading-[.9] tracking-[-.05em]">Maxfiylik — asosiy qoida.<br /><span className="text-[#a66a13]">Siz — markazda.</span></h2><p className="mt-6 max-w-md text-[15px] leading-[1.75] text-muted-foreground">Kundaligingiz ko‘rgazma emas. Unda layklar, lenta yoki bosim yo‘q. Faqat ichki kechinmalaringiz uchun sokin va o‘ylangan joy bor.</p></div></section>
    <section className="bg-primary px-5 py-20 text-primary-foreground sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e6bf65]">Bugun yaxshi kun</p><h2 className="mt-4 max-w-xl font-serif text-[clamp(3rem,6vw,6rem)] leading-[.88] tracking-[-.05em]">Bitta rost gap yozing.</h2></div><Link href="/sign-up" className="inline-flex items-center gap-2 rounded-2xl bg-[#d9a441] px-5 py-3.5 text-[13px] font-semibold text-primary transition-transform hover:-translate-y-1" data-testid="button-footer-start">Kundalikni boshlash <ArrowUpRight size={15} /></Link></div></section>
    <footer className="flex flex-col justify-between gap-3 px-5 py-7 text-[11px] text-muted-foreground sm:flex-row sm:px-8 lg:px-12"><LogoMark compact /><span>Eslashga arzigulik kunlar uchun.</span></footer>
  </div>;
}

export function UserPortalPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState<'all' | Mood>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [activeView, setActiveView] = useState<'entries' | 'calendar' | 'analytics'>('entries');
  const [notice, setNotice] = useState('');
  const params = useMemo(() => ({ q: search.trim() || undefined, mood: filterMood === 'all' ? undefined : filterMood, favorite: favoritesOnly ? true : undefined, from: fromDate || undefined, to: toDate || undefined, sort }), [search, filterMood, favoritesOnly, fromDate, toDate, sort]);
  const summary = useGetDiarySummary();
  const weeklySummary = useGetDiaryWeeklySummary();
  const entries = useListDiaryEntries(params, { query: { queryKey: getListDiaryEntriesQueryKey(params) } });
  const queryClient = useQueryClient();
  const favoriteMutation = useToggleDiaryEntryFavorite();
  const deleteMutation = useDeleteDiaryEntry();
  const flash = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 2600); };
  const [exporting, setExporting] = useState<'json' | 'pdf' | ''>('');
  const updateQueries = (entry?: DiaryEntry) => { queryClient.invalidateQueries({ queryKey: getListDiaryEntriesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDiarySummaryQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDiaryWeeklySummaryQueryKey() }); if (entry) queryClient.invalidateQueries({ queryKey: getGetDiaryEntryQueryKey(entry.id) }); };
  const onFavorite = (entry: DiaryEntry) => favoriteMutation.mutate({ id: entry.id, data: { favorite: !entry.favorite } }, { onSuccess: (updated) => { updateQueries(updated); flash(updated.favorite ? 'Sevimlilarga qo‘shildi.' : 'Sevimlilardan olib tashlandi.'); }, onError: () => flash('Yozuvni yangilab bo‘lmadi.') });
  const onDelete = (entry: DiaryEntry) => { if (!window.confirm(`“${entry.title}” yozuvini o‘chirishni xohlaysizmi?`)) return; deleteMutation.mutate({ id: entry.id }, { onSuccess: () => { updateQueries(); flash('Yozuv o‘chirildi.'); }, onError: () => flash('Yozuvni o‘chirib bo‘lmadi.') }); };
  const downloadExport = async (format: 'json' | 'pdf') => {
    setExporting(format);
    try {
      const result = await exportDiary({ format, q: search.trim() || undefined, from: fromDate || undefined, to: toDate || undefined }, { responseType: format === 'pdf' ? 'blob' : 'json' });
      const blob = result instanceof Blob ? result : new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = format === 'pdf' ? 'shaxsiy-kundalik.pdf' : 'shaxsiy-kundalik.json';
      anchor.click();
      URL.revokeObjectURL(url);
      flash(format === 'pdf' ? 'PDF yuklab olindi.' : 'JSON yuklab olindi.');
    } catch {
      flash('Eksportni tayyorlab bo‘lmadi.');
    } finally {
      setExporting('');
    }
  };
  const data = summary.data;
  const stats = [['Jami yozuvlar', data?.totalEntries ?? 0, 'barchasi'], ['Bu oy', data?.thisMonth ?? 0, 'yozuv'], ['Ketma-ket kunlar', data?.writingStreak ?? 0, 'kun'], ['Sevimlilar', data?.favoriteCount ?? 0, 'saqlangan']];
  return <DiaryShell><div className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-12">
    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div className="diary-rise"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">Shaxsiy arxivingiz</p><h1 className="mt-3 font-serif text-[clamp(3rem,5vw,5.2rem)] leading-[.9] tracking-[-.05em]">Xush kelibsiz<span className="text-[#a66a13]">.</span></h1><p className="mt-4 text-[14px] text-muted-foreground">Asrashga arziydigan kunlaringiz uchun joy.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => downloadExport('json')} disabled={Boolean(exporting)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-[11px] font-semibold text-foreground transition-colors hover:border-[#b89c5c] disabled:opacity-60" data-testid="button-export-json"><FileJson size={15} /> {exporting === 'json' ? 'Tayyorlanmoqda...' : 'JSON yuklash'}</button><button type="button" onClick={() => downloadExport('pdf')} disabled={Boolean(exporting)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-[11px] font-semibold text-foreground transition-colors hover:border-[#b89c5c] disabled:opacity-60" data-testid="button-export-pdf"><FileText size={15} /> {exporting === 'pdf' ? 'Tayyorlanmoqda...' : 'PDF yuklash'}</button><Link href="/entry/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" data-testid="button-new-entry"><span className="grid size-5 place-items-center rounded-full bg-[#d9a441] text-primary"><span className="text-[17px] leading-none">+</span></span> Yangi yozuv</Link></div></div>
    <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value, note], i) => <div key={label} className={`rounded-2xl border border-card-border bg-card p-5 diary-rise diary-delay-${i + 1}`} data-testid={`stat-${String(label).toLowerCase().replace(' ', '-')}`}><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{label}</p><div className="mt-4 flex items-end justify-between"><span className="font-serif text-[38px] leading-none">{data ? value : <span className="skeleton inline-block h-10 w-12 rounded-lg" />}</span><span className="text-[11px] text-muted-foreground">{note}</span></div></div>)}</div>
    <WeeklySummaryCard summary={weeklySummary.data} isLoading={weeklySummary.isLoading} isError={weeklySummary.isError} onRetry={() => weeklySummary.refetch()} />
     <div className="mt-10 flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Kundalik ko‘rinishlari">
       {([['entries', 'Yozuvlar'], ['calendar', 'Taqvim'], ['analytics', 'Kayfiyat tahlili']] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={activeView === value} onClick={() => setActiveView(value)} className={`rounded-xl px-4 py-2.5 text-[12px] font-semibold transition-colors ${activeView === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`tab-${value}`}>{label}</button>)}
     </div>
     {activeView === 'calendar' && <CalendarAnalytics mode="calendar" />}
     {activeView === 'analytics' && <CalendarAnalytics mode="analytics" />}
     {activeView === 'entries' && <>
     <div className="mt-12 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"><div className="relative w-full max-w-[440px]"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="So‘z yoki #teg qidiring..." className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9a441]/20" type="search" aria-label="So‘z yoki hashtag bo‘yicha qidirish" data-testid="input-search-entries" /></div><div className="flex flex-wrap gap-2"><div className="relative"><select value={filterMood} onChange={(e) => setFilterMood(e.target.value as 'all' | Mood)} className="h-10 appearance-none rounded-xl border border-border bg-card pl-3 pr-9 text-[11px] text-foreground outline-none focus:border-[#b89c5c]" aria-label="Kayfiyat bo‘yicha filter" data-testid="select-mood-filter"><option value="all">Barcha kayfiyatlar</option>{moods.map((mood) => <option key={mood} value={mood}>{moodMeta[mood].label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} /></div><button type="button" onClick={() => setFavoritesOnly(!favoritesOnly)} className={`h-10 rounded-xl border px-3 text-[11px] transition-colors ${favoritesOnly ? 'border-[#d9a441] bg-[#f8e9bf] text-[#8f601a]' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`} data-testid="button-filter-favorites"><Heart size={13} className="mr-1.5 inline-block" fill={favoritesOnly ? 'currentColor' : 'none'} /> Sevimlilar</button><div className="relative"><select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')} className="h-10 appearance-none rounded-xl border border-border bg-card pl-3 pr-9 text-[11px] text-foreground outline-none focus:border-[#b89c5c]" aria-label="Saralash tartibi" data-testid="select-sort"><option value="newest">Avval yangilari</option><option value="oldest">Avval eskilari</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} /></div></div><div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span>Sanadan:</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-foreground outline-none focus:border-[#b89c5c]" aria-label="Boshlanish sanasi" /><span>—</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-foreground outline-none focus:border-[#b89c5c]" aria-label="Tugash sanasi" /></div></div>
    <div className="mt-7 flex items-center justify-between border-b border-border pb-4"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{entries.data?.length ?? 0} ta yozuv</p>{data?.latestMood && <p className="text-[11px] text-muted-foreground">So‘nggi kayfiyat: <MoodBadge mood={data.latestMood} small /></p>}</div>
    <div className="mt-6">{entries.isLoading ? <LoadingRows /> : entries.isError ? <ErrorPanel onRetry={() => entries.refetch()} /> : entries.data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{entries.data.map((entry) => <EntryCard key={entry.id} entry={entry} onFavorite={onFavorite} onDelete={onDelete} busyFavorite={favoriteMutation.isPending && favoriteMutation.variables?.id === entry.id} />)}</div> : <EmptyEntries filtered={Boolean(search || favoritesOnly || filterMood !== 'all' || fromDate || toDate)} onCreate={() => setLocation('/entry/new')} />}</div>
     {notice && <FlashNotice message={notice} />}
     </>}
  </div></DiaryShell>;
}

function normalizeTags(value: string) {
  return [...new Set(value.split(/[,\s]+/).map((tag) => tag.replace(/^#+/, '').trim().toLowerCase()).filter(Boolean))].slice(0, 8);
}

function EntryForm({ entry, isNew }: { entry?: DiaryEntry; isNew: boolean }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [mood, setMood] = useState<Mood>(entry?.mood ?? Mood.thoughtful);
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState(entry?.tags.join(', ') ?? '');
  const [favorite, setFavorite] = useState(entry?.favorite ?? false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoList, setPhotoList] = useState<DiaryPhoto[]>(entry?.photos ?? []);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicePreview, setVoicePreview] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const create = useCreateDiaryEntry();
  const update = useUpdateDiaryEntry();
  const deletePhoto = useDeleteDiaryPhoto();
  const photoPreviews = useMemo(() => pendingFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [pendingFiles]);

  useEffect(() => () => photoPreviews.forEach(({ url }) => URL.revokeObjectURL(url)), [photoPreviews]);

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
    };
  }, []);

  const addPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const existingCount = photoList.filter((photo) => !removedPhotoIds.includes(photo.id)).length + pendingFiles.length;
    const available = Math.max(0, 8 - existingCount);
    const accepted = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) && file.size <= 5 * 1024 * 1024).slice(0, available);
    if (accepted.length !== files.length) setPhotoError('JPG, PNG, WEBP yoki GIF rasmlari, har biri 5 MB gacha. Eng ko‘pi bilan 8 ta surat qo‘shing.');
    else setPhotoError('');
    setPendingFiles((current) => [...current, ...accepted]);
    event.target.value = '';
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setVoiceError('Ovozli yozish bu brauzerda qo‘llab-quvvatlanmaydi.');
      return;
    }

    setVoiceError('');
    setVoicePreview('');
    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? '';
        if (event.results[index].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      if (finalTranscript.trim()) {
        setContent((current) => `${current.trim()}${current.trim() ? ' ' : ''}${finalTranscript.trim()}`);
      }
      setVoicePreview(interimTranscript.trim());
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        'not-allowed': 'Mikrofon uchun ruxsat bering va qayta urinib ko‘ring.',
        'no-speech': 'Ovoz aniqlanmadi. Yana bir bor urinib ko‘ring.',
        network: 'Ovozli xizmatga ulanib bo‘lmadi. Internetni tekshiring.',
      };
      setVoiceError(messages[event.error] ?? 'Ovozli yozishda xatolik yuz berdi. Yana urinib ko‘ring.');
      setVoicePreview('');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setVoicePreview('');
      speechRecognitionRef.current = null;
    };
    speechRecognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setVoiceError('Ovozli yozishni boshlab bo‘lmadi. Yana urinib ko‘ring.');
      setIsListening(false);
      speechRecognitionRef.current = null;
    }
  };

  const save = async () => {
    if (!title.trim() || !content.trim() || !entryDate) { setError('Sarlavha, matn va sanani to‘ldiring.'); return; }
    setError('');
    setPhotoError('');
    setSaving(true);
    try {
      const normalizedTags = normalizeTags(tags);
      const saved = isNew
        ? await create.mutateAsync({ data: { title: title.trim(), content: content.trim(), mood, entryDate, tags: normalizedTags, favorite } satisfies DiaryEntryInput })
        : entry
          ? await update.mutateAsync({ id: entry.id, data: { title: title.trim(), content: content.trim(), mood, entryDate, tags: normalizedTags, favorite } satisfies DiaryEntryUpdate })
          : null;
      if (!saved) return;
      const uploaded = await Promise.all(pendingFiles.map((file) => uploadDiaryPhoto(saved.id, file, { headers: { 'X-File-Name': encodeURIComponent(file.name) } })));
      await Promise.all(removedPhotoIds.map((id) => deletePhoto.mutateAsync({ id })));
      const nextPhotos = [...photoList.filter((photo) => !removedPhotoIds.includes(photo.id)), ...uploaded];
      queryClient.setQueryData(getGetDiaryEntryQueryKey(saved.id), { ...saved, photos: nextPhotos });
      queryClient.invalidateQueries({ queryKey: getListDiaryEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDiarySummaryQueryKey() });
       queryClient.invalidateQueries({ queryKey: getGetDiaryWeeklySummaryQueryKey() });
      setPhotoList(nextPhotos);
      setPendingFiles([]);
      setRemovedPhotoIds([]);
      if (isNew) setLocation(`/entry/${saved.id}`);
      else {
        setNotice('Hozirgina saqlandi.');
        window.setTimeout(() => setNotice(''), 2200);
      }
    } catch {
      setError('Yozuv yoki suratlarni saqlab bo‘lmadi. Yana urinib ko‘ring.');
    } finally {
      setSaving(false);
    }
  };
  const pending = saving || create.isPending || update.isPending || deletePhoto.isPending;
  return <DiaryShell><div className="mx-auto max-w-[1050px] px-5 py-7 sm:px-8 md:px-10 lg:px-14 lg:py-12">
    <Link href={isNew ? '/user-portal' : `/entry/${entry?.id}`} className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-back"><ArrowLeft size={15} /> {isNew ? 'Arxivga qaytish' : 'Yozuvga qaytish'}</Link>
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px]"><div><div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#9a6b23]">{isNew ? 'Yangi sahifa' : 'Sahifani tahrirlash'}</span>{!isNew && notice && <span className="inline-flex items-center gap-1 text-[10px] text-[#47796c]"><Check size={13} /> {notice}</span>}</div><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-5 w-full border-0 bg-transparent font-serif text-[clamp(3.2rem,7vw,6.5rem)] leading-[.88] tracking-[-.055em] text-primary outline-none placeholder:text-primary/20" placeholder="Saqlashga arzigulik fikr..." maxLength={160} aria-label="Sarlavha" data-testid="input-entry-title" /><div className="mt-8 flex items-center gap-3 border-b border-border pb-5 text-[11px] text-muted-foreground"><CalendarDays size={15} /><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-transparent outline-none" aria-label="Sana" data-testid="input-entry-date" /><span className="text-border">/</span><span>{moodMeta[mood].label}</span></div><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Bugundan siz bilan nima qoldi? Istalgan joydan boshlang." className="mt-8 min-h-[380px] w-full resize-none border-0 bg-transparent font-serif text-[23px] leading-[1.55] text-foreground outline-none placeholder:text-muted-foreground/45" aria-label="Matn" data-testid="textarea-entry-content" /><div className="mt-4 rounded-2xl border border-[#d8cdaF] bg-[#fbf6e9] p-4 dark:border-[#5d523f] dark:bg-[#2d291f]" data-testid="voice-input-panel"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#9a6b23]">Ovozli yozish</p><p className="mt-1 text-[11px] text-muted-foreground">{isListening ? 'Sizni tinglayapman. Gapiring.' : 'Gapiring — so‘zlaringiz matnga aylanadi.'}</p></div><button type="button" onClick={toggleVoiceInput} disabled={pending || (!voiceSupported && !isListening)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-55 ${isListening ? 'border-[#b75539] bg-[#f4ddd4] text-[#9d432d] shadow-sm' : 'border-[#cdbd8e] bg-card text-foreground hover:border-[#b89c5c] hover:bg-[#f8e9bf]'}`} aria-label={isListening ? 'Ovozli yozishni to‘xtatish' : 'Ovoz orqali yozish'} data-testid="button-voice-input">{isListening ? <MicOff size={15} /> : <Mic size={15} />}{isListening ? 'To‘xtatish' : 'Ovoz orqali yozish'}</button></div>{isListening && <p className="mt-3 flex items-center gap-2 text-[11px] text-[#9d432d]" aria-live="polite"><span className="size-2 animate-pulse rounded-full bg-[#b75539]" />{voicePreview || 'Tinglanmoqda...'}</p>}{!voiceSupported && <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Ovozli yozish bu brauzerda qo‘llab-quvvatlanmaydi.</p>}{voiceError && <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-destructive" role="alert"><CircleAlert size={14} className="mt-0.5 shrink-0" />{voiceError}</p>}</div><div className="mt-8 rounded-2xl border border-card-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Suratlar</p><p className="mt-1 text-[11px] text-muted-foreground">Yozuvingizga 8 tagacha surat qo‘shing.</p></div><label htmlFor="entry-photos" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-semibold transition-colors hover:border-[#b89c5c]"><ImagePlus size={14} /> Surat qo‘shish</label><input ref={fileInputRef} id="entry-photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={addPhotos} className="sr-only" /></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{photoList.filter((photo) => !removedPhotoIds.includes(photo.id)).map((photo) => <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted"><img src={photo.url} alt={photo.fileName} className="size-full object-cover" /><button type="button" onClick={() => setRemovedPhotoIds((current) => [...current, photo.id])} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#30243f]/85 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label={`${photo.fileName} rasmini olib tashlash`}><X size={14} /></button></div>)}{photoPreviews.map(({ file, url }, index) => <div key={`${file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl bg-muted"><img src={url} alt={file.name} className="size-full object-cover" /><button type="button" onClick={() => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#30243f]/85 text-white opacity-0 transition-opacity sm:group-hover:opacity-100" aria-label={`${file.name} rasmini olib tashlash`}><X size={14} /></button></div>)}</div>{photoError && <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-destructive"><CircleAlert size={14} className="mt-0.5 shrink-0" />{photoError}</p>}<p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Rasmlar faqat sizning hisobingiz orqali ko‘rinadi.</p></div></div>
      <aside className="space-y-6 lg:pt-14"><div className="rounded-2xl border border-card-border bg-card p-5"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Kayfiyat</p><div className="mt-4 grid grid-cols-2 gap-2">{moods.map((item) => <button type="button" key={item} onClick={() => setMood(item)} className={`rounded-xl px-2 py-2.5 text-left text-[11px] transition-all ${mood === item ? 'ring-2 ring-[#d9a441]/60' : 'opacity-75 hover:opacity-100'}`} style={{ color: moodMeta[item].color, backgroundColor: moodMeta[item].soft }} data-testid={`button-mood-${item}`}>{moodMeta[item].label}</button>)}</div></div><div className="rounded-2xl border border-card-border bg-card p-5"><label className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground" htmlFor="entry-tags">Hashtaglar</label><input id="entry-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#oila, #ish yoki #shaxsiy" className="mt-3 w-full border-b border-border bg-transparent pb-2 text-[12px] outline-none placeholder:text-muted-foreground/55 focus:border-[#b89c5c]" data-testid="input-entry-tags" /><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Vergul yoki bo‘sh joy bilan ajrating.</p><button type="button" onClick={() => setFavorite(!favorite)} className={`mt-5 flex items-center gap-2 text-[11px] ${favorite ? 'text-[#a66a13]' : 'text-muted-foreground'}`} data-testid="button-entry-favorite"><Heart size={15} fill={favorite ? 'currentColor' : 'none'} /> Sevimlilarga saqlash</button></div><button type="button" onClick={save} disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[12px] font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-save-entry">{pending ? <LoaderCircle className="animate-spin" size={15} /> : <Check size={15} />}{pending ? 'Saqlanmoqda...' : 'Saqlash'}</button>{error && <p className="flex gap-2 text-[11px] leading-relaxed text-destructive" data-testid="status-form-error"><CircleAlert size={14} className="mt-0.5 shrink-0" />{error}</p>}<p className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[.1em] text-muted-foreground/70">Faqat siz uchun · har doim</p></aside>
    </div>
  </div></DiaryShell>;
}

export function EntryPage() {
  const params = useParams<{ id?: string }>();
  const isNew = !params.id || params.id === 'new';
  const id = Number(params.id);
  const entryQuery = useGetDiaryEntry(id, { query: { enabled: !isNew && Number.isFinite(id), queryKey: getGetDiaryEntryQueryKey(id) } });
  if (isNew) return <EntryForm isNew />;
  if (entryQuery.isLoading) return <DiaryShell><div className="mx-auto max-w-[1050px] px-5 py-16 sm:px-8"><div className="skeleton h-4 w-24 rounded" /><div className="skeleton mt-12 h-20 w-3/4 rounded-2xl" /><div className="skeleton mt-8 h-6 w-full rounded" /><div className="skeleton mt-3 h-6 w-5/6 rounded" /></div></DiaryShell>;
  if (entryQuery.isError || !entryQuery.data) return <DiaryShell><div className="mx-auto max-w-[700px] px-5 py-24 sm:px-8"><ErrorPanel detail onRetry={() => entryQuery.refetch()} /></div></DiaryShell>;
  return <EntryForm entry={entryQuery.data} isNew={false} />;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useGetDiarySettings();
  const setPinMutation = useSetDiaryPin();
  const removePinMutation = useRemoveDiaryPin();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const savePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN kodi aynan 4 ta raqamdan iborat bo‘lishi kerak.');
      return;
    }
    setError('');
    try {
      const result = await setPinMutation.mutateAsync({ data: { pin } });
      queryClient.setQueryData(getGetDiarySettingsQueryKey(), result);
      setPin('');
      setNotice('PIN kodi saqlandi.');
      window.setTimeout(() => setNotice(''), 2400);
    } catch {
      setError('PIN kodini saqlab bo‘lmadi. Qayta urinib ko‘ring.');
    }
  };

  const removePin = async () => {
    setError('');
    try {
      const result = await removePinMutation.mutateAsync();
      queryClient.setQueryData(getGetDiarySettingsQueryKey(), result);
      Object.keys(window.sessionStorage).filter((key) => key.startsWith('kundalik-pin-')).forEach((key) => window.sessionStorage.removeItem(key));
      setNotice('PIN kodi olib tashlandi.');
      window.setTimeout(() => setNotice(''), 2400);
    } catch {
      setError('PIN kodini olib tashlab bo‘lmadi.');
    }
  };

  const pending = setPinMutation.isPending || removePinMutation.isPending;
  return <DiaryShell><div className="mx-auto max-w-[850px] px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-12">
    <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">Shaxsiy makon</p>
    <h1 className="mt-3 font-serif text-[clamp(3rem,6vw,5.8rem)] leading-[.9] tracking-[-.05em]">Sozlamalar<span className="text-[#a66a13]">.</span></h1>
    <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted-foreground">Kundaligingizga kirish va shaxsiylikni o‘zingizga moslang.</p>
    <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_280px]">
      <section className="rounded-[24px] border border-card-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7def0] text-[#5b3f69]"><ShieldCheck size={21} strokeWidth={1.6} /></span><div><h2 className="font-serif text-[27px]">PIN bilan himoya</h2><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Kundalik ochilganda 4 xonali kod so‘ralsin.</p></div></div>
        <form onSubmit={savePin} className="mt-7 border-t border-border pt-6"><label htmlFor="diary-pin" className="text-[12px] font-medium">Yangi 4 xonali PIN kodi</label><input id="diary-pin" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-[18px] tracking-[.4em] outline-none focus:border-[#b89c5c]" inputMode="numeric" maxLength={4} placeholder="••••" autoComplete="new-password" /><button type="submit" disabled={pending} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={15} /> : <ShieldCheck size={15} />} {settings.data?.pinEnabled ? 'PIN kodini yangilash' : 'PIN kodini yoqish'}</button></form>
        {settings.data?.pinEnabled && <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[#c3ddcf] bg-[#edf6f0] px-4 py-3 text-[12px] text-[#35614f]"><span>PIN kodi yoqilgan.</span><button type="button" onClick={removePin} disabled={pending} className="font-semibold underline underline-offset-2 disabled:opacity-60">O‘chirish</button></div>}
        {error && <p className="mt-4 flex gap-2 text-[12px] text-destructive"><CircleAlert size={14} className="mt-0.5 shrink-0" />{error}</p>}
        {notice && <p className="mt-4 flex items-center gap-2 text-[12px] text-[#47796c]"><Check size={14} />{notice}</p>}
      </section>
      <aside className="rounded-[24px] border border-[#d8ccb0] bg-[#f7f0df] p-6"><LockKeyhole size={20} className="text-[#9a6b23]" /><h2 className="mt-5 font-serif text-[24px] leading-tight">Faqat siz uchun</h2><p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">PIN kodi serverda ochiq matn sifatida saqlanmaydi. Kirish kodi faqat sizning kundaligingizni ochish uchun ishlatiladi.</p></aside>
    </div>
  </div></DiaryShell>;
}

function clerkErrorMessage(error: unknown) {
  const first = (error as {
    errors?: Array<{ code?: string; longMessage?: string; message?: string }>;
    message?: string;
  })?.errors?.[0];
  if (first?.code === 'form_password_pwned') return 'Bu parol xavfsiz emas. Boshqa parol tanlang.';
  if (first?.code === 'form_password_length') return PASSWORD_TOO_SHORT_MESSAGE;
  if (first?.code === 'form_password_not_enabled') return 'Email va parol orqali ro‘yxatdan o‘tish yoqilmagan.';
  if (first?.code === 'form_identifier_exists') return 'Bu email manzili allaqachon ro‘yxatdan o‘tgan.';
  if (first?.code === 'form_identifier_not_allowed') return 'Bu email manzilidan ro‘yxatdan o‘tish mumkin emas.';
  if (first?.code === 'form_identifier_not_found') return 'Bu email manzili bilan hisob topilmadi.';
  if (first?.code === 'form_password_incorrect') return 'Parol noto‘g‘ri.';
  if (first?.code === 'form_param_format_invalid') return 'Kiritilgan ma’lumot formatini tekshiring.';
  if (first?.code === 'strategy_for_user_invalid') return 'Email va parol orqali ro‘yxatdan o‘tish Clerk sozlamalarida yoqilmagan.';
  if (first?.code === 'captcha_invalid' || first?.code === 'captcha_missing') return 'Xavfsizlik tekshiruvi bajarilmadi. Sahifani yangilang va qayta urinib ko‘ring.';
  if (first?.code === 'too_many_requests') return 'Juda ko‘p urinish bo‘ldi. Biroz kutib, qayta urinib ko‘ring.';
  if (first?.longMessage || first?.message) return first.longMessage ?? first.message ?? 'Clerk auth xatosi.';
  const message = (error as { message?: string })?.message;
  if (message) return message;
  return 'Amalni bajarib bo‘lmadi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.';
}

function logClerkError(context: string, error: unknown) {
  const clerkError = error as {
    errors?: Array<{ code?: string; longMessage?: string; message?: string; meta?: unknown }>;
    message?: string;
  };
  console.error(`[Clerk ${context}]`, {
    message: clerkError?.message,
    errors: clerkError?.errors?.map(({ code, longMessage, message }) => ({
      code,
      longMessage,
      message,
    })),
  });
}

function AuthCard({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const isSignUp = mode === 'sign-up';
  const [, setLocation] = useLocation();
  const signInHook = useSignIn();
  const signUpHook = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loaded = isSignUp ? signUpHook.fetchStatus !== 'fetching' : signInHook.fetchStatus !== 'fetching';

  const finish = async () => {
    const result = await (isSignUp ? signUpHook.signUp.finalize() : signInHook.signIn.finalize());
    if (result.error) throw result.error;
    setLocation('/user-portal');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) { setError('Email manzili va parolni kiriting.'); return; }
    setBusy(true); setError('');
    try {
      if (isSignUp) {
        const passwordResult = passwordSchema.safeParse(password);
        if (!passwordResult.success) {
          setError(passwordResult.error.issues[0]?.message ?? PASSWORD_TOO_SHORT_MESSAGE);
          return;
        }
        const result = await signUpHook.signUp.password({ emailAddress: email.trim(), password });
        if (result.error) throw result.error;
        if (signUpHook.signUp.status === 'complete') await finish();
        else { const verification = await signUpHook.signUp.verifications.sendEmailCode(); if (verification.error) throw verification.error; setVerificationSent(true); }
      } else {
        const result = await signInHook.signIn.password({ identifier: email.trim(), password });
        if (result.error) throw result.error;
        if (signInHook.signIn.status === 'complete') await finish();
        else setError('Qo‘shimcha tasdiqlash talab qilindi. Hisob sozlamalarini tekshiring.');
      }
    } catch (submissionError) { logClerkError(isSignUp ? 'sign-up' : 'sign-in', submissionError); setError(clerkErrorMessage(submissionError)); } finally { setBusy(false); }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) { setError('Tasdiqlash kodini kiriting.'); return; }
    setBusy(true); setError('');
    try {
      const result = await signUpHook.signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (result.error) throw result.error;
      if (signUpHook.signUp.status === 'complete') await finish();
      else setError('Kod hali tasdiqlanmadi. Qayta urinib ko‘ring.');
    } catch (verificationError) { logClerkError('email-verification', verificationError); setError(clerkErrorMessage(verificationError)); } finally { setBusy(false); }
  };

  return <div className="w-full max-w-[440px] rounded-[24px] border border-[#d8ccb0] bg-[#fffaf0] p-7 shadow-xl sm:p-9">
    <div className="mb-8 flex items-start justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Shaxsiy kundalik</p><h1 className="mt-3 font-serif text-[38px] leading-none text-[#30243f]">{verificationSent ? 'Emailni tasdiqlang' : isSignUp ? 'Kundalik oching' : 'Xush kelibsiz'}</h1><p className="mt-3 text-[13px] leading-relaxed text-[#756d7e]">{verificationSent ? 'Emailingizga yuborilgan kodni kiriting.' : isSignUp ? 'Faqat sizga tegishli sokin makon.' : 'Yozuvlaringizga qaytish vaqti keldi.'}</p></div><ThemeToggle /></div>
    {verificationSent ? <form onSubmit={verify} className="space-y-5"><label className="block text-[12px] font-medium text-[#30243f]">Tasdiqlash kodi<input value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8ccb0] bg-[#f7f0df] px-3 text-[#30243f] outline-none focus:border-[#b89c5c]" placeholder="6 xonali kod" inputMode="numeric" autoComplete="one-time-code" /></label><button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#30243f] text-[13px] font-semibold text-[#fffaf0] transition-colors hover:bg-[#4c3a5d] disabled:opacity-60">{busy && <LoaderCircle className="animate-spin" size={15} />} Tasdiqlash</button></form> : <form onSubmit={submit} noValidate className="space-y-5"><label className="block text-[12px] font-medium text-[#30243f]">Email manzili<input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8ccb0] bg-[#f7f0df] px-3 text-[#30243f] outline-none focus:border-[#b89c5c]" placeholder="sizning@email.uz" type="email" autoComplete="email" /></label><label className="block text-[12px] font-medium text-[#30243f]">Parol<input value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8ccb0] bg-[#f7f0df] px-3 text-[#30243f] outline-none focus:border-[#b89c5c]" placeholder="Parolingiz" type="password" minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined} autoComplete={isSignUp ? 'new-password' : 'current-password'} /></label><button type="submit" disabled={busy || !loaded} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#30243f] text-[13px] font-semibold text-[#fffaf0] transition-colors hover:bg-[#4c3a5d] disabled:opacity-60">{busy && <LoaderCircle className="animate-spin" size={15} />}{isSignUp ? 'Ro‘yxatdan o‘tish' : 'Kirish'}</button></form>}
    {error && <p className="mt-5 rounded-xl border border-[#ecc6bd] bg-[#fff0ec] px-3 py-2.5 text-[12px] leading-relaxed text-[#8f3f2d]" role="alert">{error}</p>}
    <p className="mt-7 border-t border-[#e4dac3] pt-5 text-center text-[12px] text-[#756d7e]">{isSignUp ? 'Hisobingiz bormi?' : 'Hisobingiz yo‘qmi?'} <Link href={isSignUp ? '/sign-in' : '/sign-up'} className="font-semibold text-[#9a6b23]">{isSignUp ? 'Kirish' : 'Ro‘yxatdan o‘ting'}</Link></p>
  </div>;
}

export function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><LogoMark /></div><AuthCard mode="sign-in" /></div>;
}

export function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><LogoMark /></div><AuthCard mode="sign-up" /></div>;
}