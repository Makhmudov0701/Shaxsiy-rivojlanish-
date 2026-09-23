import { useClerk, useUser } from '@clerk/react';
import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, BookOpen, CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, FolderOpen, LogOut, LockKeyhole, Menu, Moon, Plus, Settings, Sparkles, Star, Sun, Timer, X } from 'lucide-react';
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

export type PortalView = 'entries' | 'calendar' | 'folders' | 'analytics';

export function portalViewFromLocation(location: string): PortalView {
  const query = location.split('?')[1]?.split('#')[0] ?? '';
  const view = new URLSearchParams(query).get('view');
  return view === 'calendar' || view === 'folders' || view === 'analytics' ? view : 'entries';
}

function SidebarNavLink({
  href,
  label,
  icon,
  active,
  collapsed,
  onNavigate,
  testId,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
  testId: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[12px] transition-all ${collapsed ? 'md:justify-center md:px-2' : ''} ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
      data-testid={testId}
    >
      <span className={`grid shrink-0 place-items-center rounded-lg ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/55 group-hover:text-sidebar-foreground'}`}>{icon}</span>
      <span className={collapsed ? 'md:hidden' : ''}>{label}</span>
      {active && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
    </Link>
  );
}

export function DiaryShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  const firstName = user?.firstName || 'Yozuvchi';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('kundalik-sidebar-yig‘iq') === 'ha');
  const pathname = location.split('?')[0];
  const query = location.split('?')[1]?.split('#')[0] ?? '';
  const searchParams = new URLSearchParams(query);
  const portalView = portalViewFromLocation(location);
  const pomodoroSelected = pathname === '/pomodoro';

  useEffect(() => {
    window.localStorage.setItem('kundalik-sidebar-yig‘iq', sidebarCollapsed ? 'ha' : 'yo‘q');
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const mainDiarySelected = (pathname === '/user-portal' && portalView === 'entries') || (pathname.startsWith('/entry') && !pomodoroSelected);
  return (
    <div className="paper-grain min-h-[100dvh] bg-background text-foreground">
      {mobileOpen && <button type="button" onClick={closeMobile} className="fixed inset-0 z-30 bg-[#1f1830]/45 backdrop-blur-[2px] md:hidden" aria-label="Yon menyuni yopish" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[272px] -translate-x-full flex-col justify-between bg-sidebar px-4 py-5 text-sidebar-foreground shadow-2xl transition-[width,transform] duration-300 md:translate-x-0 md:shadow-none ${sidebarCollapsed ? 'md:w-[82px]' : 'md:w-[258px]'} ${mobileOpen ? 'translate-x-0' : ''}`}>
        <div>
          <div className={`flex items-center ${sidebarCollapsed ? 'md:justify-center' : 'justify-between'}`}>
            <LogoMark compact={sidebarCollapsed} />
            <button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden" aria-label="Yon menyuni yopish" title="Yon menyuni yopish"><X size={17} /></button>
            <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="hidden size-9 place-items-center rounded-xl text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:grid" aria-label={sidebarCollapsed ? 'Yon menyuni kengaytirish' : 'Yon menyuni yig‘ish'} title={sidebarCollapsed ? 'Yon menyuni kengaytirish' : 'Yon menyuni yig‘ish'}>
              {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          </div>
          <div className="mt-10">
            <p className={`mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/45 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Asosiy menyu</p>
            <nav className="space-y-1">
              <SidebarNavLink href="/user-portal" label="Bosh sahifa / Kundalik" icon={<BookOpen size={16} strokeWidth={1.8} />} active={mainDiarySelected} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-portal" />
              <SidebarNavLink href="/user-portal?view=calendar" label="Kalendar" icon={<CalendarDays size={16} strokeWidth={1.8} />} active={pathname === '/user-portal' && portalView === 'calendar'} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-calendar" />
              <SidebarNavLink href="/user-portal?view=folders" label="Papkalar va Teglar" icon={<FolderOpen size={16} strokeWidth={1.8} />} active={pathname === '/user-portal' && portalView === 'folders'} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-folders-tags" />
              <SidebarNavLink href="/user-portal?view=analytics" label="Tahlil va Kayfiyat" icon={<BarChart3 size={16} strokeWidth={1.8} />} active={pathname === '/user-portal' && portalView === 'analytics'} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-analytics" />
              <SidebarNavLink href="/pomodoro" label="Pomodoro va Vazifalar" icon={<Timer size={16} strokeWidth={1.8} />} active={pomodoroSelected} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-pomodoro" />
              <SidebarNavLink href="/settings" label="Sozlamalar va Zaxira" icon={<Settings size={16} strokeWidth={1.8} />} active={pathname === '/settings'} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-settings" />
            </nav>
            <p className={`mb-3 mt-8 px-3 font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/45 ${sidebarCollapsed ? 'md:hidden' : ''}`}>Shaxsiy vositalar</p>
            <nav className="space-y-1">
              <SidebarNavLink href="/entry/new" label="Yangi yozuv" icon={<Plus size={16} strokeWidth={1.8} />} active={pathname === '/entry/new' && !pomodoroSelected} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-new-entry" />
              <SidebarNavLink href="/habits" label="Odatlar" icon={<CalendarCheck2 size={16} strokeWidth={1.8} />} active={pathname === '/habits'} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-habits" />
              <SidebarNavLink href="/vault" label="Maxfiy jild" icon={<LockKeyhole size={16} strokeWidth={1.8} />} active={pathname === '/vault'} collapsed={sidebarCollapsed} onNavigate={closeMobile} testId="link-vault" />
            </nav>
          </div>
        </div>
        <div className={sidebarCollapsed ? 'md:flex md:flex-col md:items-center' : ''}>
          <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
            <Sparkles size={16} className={sidebarCollapsed ? 'md:mb-0' : 'mb-3'} />
            <p className={sidebarCollapsed ? 'md:hidden' : 'font-serif text-[18px] leading-tight text-sidebar-foreground'}>Siz uchun yaratilgan sokin makon.</p>
          </div>
          <div className={`flex items-center justify-between border-t border-sidebar-border pt-4 ${sidebarCollapsed ? 'md:flex-col md:gap-3' : ''}`}>
            <div className={`min-w-0 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
              <p className="truncate text-[12px] font-medium">{firstName}</p>
              <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.12em] text-sidebar-foreground/45">shaxsiy kundalik</p>
            </div>
            <div className={`flex items-center gap-1 ${sidebarCollapsed ? 'md:flex-col' : ''}`}>
              <ThemeToggle />
              <button type="button" onClick={() => signOut({ redirectUrl: appBasePath })} className="rounded-lg p-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Chiqish" title="Chiqish" data-testid="button-sign-out"><LogOut size={15} /></button>
            </div>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground" aria-label="Yon menyuni ochish" title="Yon menyuni ochish" data-testid="button-mobile-menu"><Menu size={18} /></button>
          <LogoMark compact />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/entry/new" className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground" aria-label="Yangi yozuv" data-testid="link-mobile-new"><Plus size={17} /></Link>
        </div>
      </header>
      <main className={`min-h-[100dvh] transition-[padding] duration-300 ${sidebarCollapsed ? 'md:pl-[82px]' : 'md:pl-[258px]'}`}>{children}</main>
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