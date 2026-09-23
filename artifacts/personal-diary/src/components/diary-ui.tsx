import { useClerk, useUser } from '@clerk/react';
import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen, CalendarCheck2, LogOut, LockKeyhole, Moon, Plus, Search, Settings, Sparkles, Star, Sun } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { DiaryEntry, Mood } from '@workspace/api-client-react';
import { formatUzbekDate } from '@/lib/date-utils';
import { estimatedReadingMinutes, plainTextFromRichText, richTextWordCount } from '@/components/rich-text';

export const moodMeta: Record<Mood, { label: string; color: string; soft: string }> = {
  peaceful: { label: 'Tinch', color: '#47796c', soft: '#dcebe4' },
  happy: { label: 'A’lo', color: '#ae7419', soft: '#f8e9bf' },
  grateful: { label: 'Minnatdor', color: '#8a5f7a', soft: '#ecdce9' },
  energized: { label: 'G‘ayratli', color: '#b75539', soft: '#f4ddd4' },
  thoughtful: { label: 'O‘ylangan', color: '#5b587f', soft: '#dfdef0' },
  sad: { label: 'Xafa', color: '#54788a', soft: '#d9e7ed' },
  anxious: { label: 'Xavotirli', color: '#85634c', soft: '#eee1d2' },
};

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" data-testid="link-logo">
      <span className="relative grid size-10 place-items-center rounded-[14px] bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <BookOpen size={18} strokeWidth={1.7} />
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#D9A441]" />
      </span>
      {!compact && <span className="font-serif text-[25px] leading-none tracking-[-0.04em] text-foreground">Shaxsiy kundalik</span>}
    </Link>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('kundalik-mavzu');
    const initialDark = saved ? saved === 'qorong‘i' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    window.localStorage.setItem('kundalik-mavzu', next ? 'qorong‘i' : 'yorug‘');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      aria-label={dark ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}
      title={dark ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}
      data-testid="button-theme-toggle"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function MoodBadge({ mood, small = false }: { mood: Mood; small?: boolean }) {
  const meta = moodMeta[mood];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[0.08em] ${small ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[10px]'}`} style={{ color: meta.color, backgroundColor: meta.soft }} data-testid={`badge-mood-${mood}`}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

export function formatEntryDate(value: string | null | undefined) {
  return formatUzbekDate(value, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function EntryCard({ entry, onFavorite, onDelete, busyFavorite }: { entry: DiaryEntry; onFavorite: (entry: DiaryEntry) => void; onDelete: (entry: DiaryEntry) => void; busyFavorite?: boolean }) {
  const excerpt = entry.content.replace(/\s+/g, ' ').trim();
  return (
    <article className="group relative flex min-h-[218px] flex-col justify-between rounded-[22px] border border-card-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c9b88a] hover:shadow-lg" data-testid={`card-entry-${entry.id}`}>
      <div>
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{formatEntryDate(entry.entryDate)}</span>
          <button type="button" onClick={() => onFavorite(entry)} disabled={busyFavorite} className={`grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-200 ${entry.favorite ? 'border-[#d9a441] bg-[#f8e9bf] text-[#a66a13]' : 'border-border text-muted-foreground hover:border-[#d9a441] hover:text-[#a66a13]'}`} aria-label={entry.favorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'} data-testid={`button-favorite-${entry.id}`}>
            <Star size={15} fill={entry.favorite ? 'currentColor' : 'none'} className={`transition-transform ${busyFavorite ? 'scale-75 opacity-50' : 'group-hover:scale-110'}`} />
          </button>
        </div>
        <Link href={`/entry/${entry.id}`} className="block" data-testid={`link-entry-${entry.id}`}>
          <h3 className="line-clamp-2 font-serif text-[26px] leading-[1.04] tracking-[-0.025em] text-foreground transition-colors group-hover:text-[#6c4c21]">{entry.title}</h3>
          <p className="mt-3 line-clamp-3 text-[13px] leading-[1.65] text-muted-foreground">{plainTextFromRichText(excerpt)}</p>
        </Link>
      </div>
      <div className="mt-6 flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
          <MoodBadge mood={entry.mood} small />
            <span className="rounded-full bg-[#eee8d5] px-2 py-1 text-[10px] text-[#756d5e]">{entry.folder}</span>
          {entry.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">#{tag}</span>)}
        </div>
        <button type="button" onClick={() => onDelete(entry)} className="text-muted-foreground/50 opacity-100 transition-all hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" aria-label={`${entry.title} yozuvini o‘chirish`} data-testid={`button-delete-${entry.id}`}>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em]">o‘chirish</span>
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>{richTextWordCount(entry.content)} ta so‘z</span>
        <span>•</span>
        <span>{estimatedReadingMinutes(entry.content)} daqiqa o‘qish</span>
      </div>
    </article>
  );
}

export function DiaryShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  const firstName = user?.firstName || 'Yozuvchi';
  return (
    <div className="paper-grain min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col justify-between bg-sidebar px-5 py-7 text-sidebar-foreground md:flex">
        <div>
          <LogoMark />
          <div className="mt-16">
            <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/45">Sahifalarim</p>
            <nav className="space-y-1">
              <Link href="/user-portal" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors ${location === '/user-portal' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid="link-portal"><BookOpen size={16} strokeWidth={1.8} /> Barcha yozuvlar</Link>
              <Link href="/entry/new" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground" data-testid="link-new-entry"><Plus size={16} strokeWidth={1.8} /> Yangi yozuv</Link>
              <Link href="/habits" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors ${location === '/habits' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid="link-habits"><CalendarCheck2 size={16} strokeWidth={1.8} /> Odatlar</Link>
              <Link href="/vault" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors ${location === '/vault' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid="link-vault"><LockKeyhole size={16} strokeWidth={1.8} /> Maxfiy jild</Link>
              <Link href="/settings" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors ${location === '/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`} data-testid="link-settings"><Settings size={16} strokeWidth={1.8} /> Sozlamalar</Link>
            </nav>
          </div>
        </div>
        <div>
          <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
            <Sparkles size={16} className="mb-3 text-sidebar-primary" />
            <p className="font-serif text-[18px] leading-tight text-sidebar-foreground">Siz uchun yaratilgan sokin makon.</p>
          </div>
          <div className="flex items-center justify-between border-t border-sidebar-border pt-4">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium">{firstName}</p>
              <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.12em] text-sidebar-foreground/45">shaxsiy kundalik</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button type="button" onClick={() => signOut({ redirectUrl: appBasePath })} className="rounded-lg p-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Chiqish" data-testid="button-sign-out"><LogOut size={15} /></button>
            </div>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/90 px-5 py-4 backdrop-blur md:hidden">
        <LogoMark compact />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/settings" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Sozlamalar" data-testid="link-mobile-settings"><Settings size={17} /></Link>
          <Link href="/habits" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Odatlar" data-testid="link-mobile-habits"><CalendarCheck2 size={17} /></Link>
          <Link href="/vault" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Maxfiy jild" data-testid="link-mobile-vault"><LockKeyhole size={17} /></Link>
          <Link href="/user-portal" className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Yozuvlar" data-testid="link-mobile-portal"><Search size={17} /></Link>
          <Link href="/entry/new" className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground" aria-label="Yangi yozuv" data-testid="link-mobile-new"><Plus size={17} /></Link>
        </div>
      </header>
      <main className="min-h-[100dvh] md:pl-[238px]">{children}</main>
    </div>
  );
}

export function FlashNotice({ message, tone = 'success' }: { message: string; tone?: 'success' | 'error' }) {
  return <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-[12px] shadow-lg diary-rise ${tone === 'success' ? 'border-[#c3ddcf] bg-[#edf6f0] text-[#35614f]' : 'border-[#ecc6bd] bg-[#fff0ec] text-[#8f3f2d]'}`} role="status" data-testid="status-feedback"><span className="size-1.5 rounded-full bg-current" />{message}</div>;
}

export function EmptyEntries({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-6 py-16 text-center">
      <div className="absolute -right-10 -top-10 size-36 rounded-full border-[18px] border-[#eadab0]/70" />
      <div className="absolute -bottom-16 -left-8 size-32 rounded-full border-[14px] border-[#d8e7dc]/80" />
      <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-[#30243f] text-[#f8f3e9]"><BookOpen size={23} strokeWidth={1.5} /></span>
      <h2 className="relative mt-6 font-serif text-[30px] tracking-[-0.03em]">{filtered ? 'Bu qidiruvga mos yozuv topilmadi.' : 'Birinchi yozuvingizni kutmoqda.'}</h2>
      <p className="relative mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{filtered ? 'Boshqa so‘z bilan qidiring yoki filterlarni tozalang.' : 'Bugun deyarli unutgan kichik bir narsadan boshlang. Boshlashning to‘g‘ri yoki noto‘g‘ri usuli yo‘q.'}</p>
      <button type="button" onClick={onCreate} className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-empty-create"><Plus size={15} /> Yozuv yaratish</button>
    </div>
  );
}