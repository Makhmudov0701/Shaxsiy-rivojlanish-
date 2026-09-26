import { useClerk, useUser } from '@clerk/react';
import { useEffect, useState, type ReactNode } from 'react';
import { BarChart3, BookMarked, BookOpen, CalendarCheck2, CalendarDays, ChevronDown, Clock3, FolderOpen, Lightbulb, ListTodo, LogOut, LockKeyhole, Menu, Moon, Plus, Repeat2, Settings, Star, Sun, UserCircle, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { DiaryEntry, Mood } from '@workspace/api-client-react';
import { formatUzbekDate } from '@/lib/date-utils';
import { estimatedReadingMinutes, plainTextFromRichText, richTextWordCount } from '@/components/rich-text';
import { AmbientSoundControl } from '@/components/ambient-sound';
import { SectionMotivationCard } from '@/components/section-motivation-card';
import { sectionIdForPath, sectionMotivationContent } from '@/components/section-motivation-content';
import { formatDeleteItemLabel, formatMoodAriaLabel, LanguageSelector, translateUiText, useI18n } from '@/lib/i18n';
import { vaultNavigationLabel } from '@/lib/vault-i18n';
import { applyThemePreference, readProfilePreferences, updateProfilePreference, type ThemePreference } from '@/lib/profile-preferences';

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
  const { user } = useUser();
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    if (user?.id) return readProfilePreferences(user.id).value.theme;
    const saved = window.localStorage.getItem('kundalik-mavzu');
    return saved === 'qorong‘i' ? 'dark' : saved === 'yorug‘' ? 'light' : 'system';
  });

  useEffect(() => {
    if (user?.id) {
      const stored = readProfilePreferences(user.id).value.theme;
      setTheme(stored);
      applyThemePreference(stored);
      return;
    }
    const saved = window.localStorage.getItem('kundalik-mavzu');
    const nextTheme: ThemePreference = saved === 'qorong‘i' ? 'dark' : saved === 'yorug‘' ? 'light' : 'system';
    setTheme(nextTheme);
    applyThemePreference(nextTheme);
  }, [user?.id]);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId !== user?.id || !user?.id) return;
      const nextTheme = readProfilePreferences(user.id).value.theme;
      setTheme(nextTheme);
      applyThemePreference(nextTheme);
    };
    const syncTheme = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: ThemePreference }>).detail;
      if (detail?.theme === 'system' || detail?.theme === 'light' || detail?.theme === 'dark') {
        setTheme(detail.theme);
      }
    };
    window.addEventListener('kundalik-profile-preferences', sync);
    window.addEventListener('kundalik-theme-preference-changed', syncTheme);
    return () => {
      window.removeEventListener('kundalik-profile-preferences', sync);
      window.removeEventListener('kundalik-theme-preference-changed', syncTheme);
    };
  }, [user?.id]);

  const dark = theme === 'dark' || (theme === 'system' && (typeof window !== 'undefined' && (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)));
  const toggle = () => {
    const next: ThemePreference = dark ? 'light' : 'dark';
    setTheme(next);
    applyThemePreference(next);
    if (user?.id) {
      updateProfilePreference(user.id, { theme: next });
    } else {
      window.localStorage.setItem('kundalik-mavzu', next === 'dark' ? 'qorong‘i' : 'yorug‘');
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid size-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
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
          {entry.tags.slice(0, 2).map((tag) => { const taggedMood = tag.startsWith('mood:') ? tag.slice('mood:'.length) as Mood : null; return <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{taggedMood && taggedMood in moodMeta ? formatMoodAriaLabel(translateUiText(moodMeta[taggedMood].label)) : `#${tag}`}</span>; })}
        </div>
        <button type="button" onClick={() => onDelete(entry)} className="text-muted-foreground/50 opacity-100 transition-all hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" aria-label={formatDeleteItemLabel(entry.title, 'entry')} data-testid={`button-delete-${entry.id}`}>
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
  onNavigate,
  testId,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onNavigate: () => void;
  testId: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={label}
      className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-medium transition-all ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}
      data-testid={testId}
    >
      <span className={`grid size-6 shrink-0 place-items-center rounded-lg ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'}`}>{icon}</span>
      <span className="min-w-0 flex-1">{label}</span>
      {active && <span className="size-2 shrink-0 rounded-full bg-sidebar-primary" />}
    </Link>
  );
}

export function DiaryShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { language } = useI18n();
  const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  const firstName = user?.firstName || 'Yozuvchi';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = location.split('?')[0];
  const sectionId = sectionIdForPath(pathname);
  const profileLabel = { uz: 'Shaxsiy profil', en: 'Personal profile', ru: 'Личный профиль', ko: '개인 프로필' }[language];
  const pageTitle = pathname === '/profile' ? profileLabel : pathname === '/vault' ? vaultNavigationLabel(language) : sectionId
    ? translateUiText(sectionMotivationContent[sectionId].title)
    : 'Shaxsiy kundalik';
  const query = location.split('?')[1]?.split('#')[0] ?? '';
  const portalView = portalViewFromLocation(location);
  const secondarySelected = pathname === '/settings' || pathname === '/ideas' || pathname === '/habits' || (pathname === '/user-portal' && portalView !== 'entries');
  const pomodoroSelected = pathname === '/pomodoro';
  const repetitionSelected = pathname === '/repetition';

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

  useEffect(() => {
    if (secondarySelected) setMoreOpen(true);
  }, [secondarySelected]);

  const closeMobile = () => setMobileOpen(false);
  const mainDiarySelected = (pathname === '/user-portal' && portalView === 'entries') || (pathname.startsWith('/entry') && !pomodoroSelected);
  return (
    <div className="paper-grain box-border min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-background text-foreground">
      {mobileOpen && <button type="button" onClick={closeMobile} className="fixed inset-0 z-30 bg-[#1f1830]/45 backdrop-blur-[2px] md:hidden" aria-label="Yon menyuni yopish" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[288px] -translate-x-full flex-col justify-between overflow-y-auto overscroll-contain bg-sidebar px-4 py-5 text-sidebar-foreground shadow-2xl transition-transform duration-300 md:translate-x-0 md:w-[264px] md:shadow-none ${mobileOpen ? 'translate-x-0' : ''}`}>
        <div>
          <div className="flex items-center justify-between">
            <LogoMark />
            <button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden" aria-label="Yon menyuni yopish" title="Yon menyuni yopish"><X size={17} /></button>
          </div>
          <div className="mt-8">
            <p className="mb-3 px-3 text-[12px] font-semibold text-sidebar-foreground/55">Asosiy bo‘limlar</p>
            <nav className="space-y-1">
              <SidebarNavLink href="/user-portal" label="Kundalik" icon={<BookOpen size={20} strokeWidth={1.8} />} active={mainDiarySelected} onNavigate={closeMobile} testId="link-portal" />
              <SidebarNavLink href="/pomodoro" label="Diqqat" icon={<Clock3 size={20} strokeWidth={1.8} />} active={pomodoroSelected} onNavigate={closeMobile} testId="link-pomodoro" />
              <SidebarNavLink href="/goals" label="Maqsadlar" icon={<Star size={20} strokeWidth={1.8} />} active={pathname === '/goals'} onNavigate={closeMobile} testId="link-goals" />
              <SidebarNavLink href="/tasks" label="Topshiriqlar" icon={<ListTodo size={20} strokeWidth={1.8} />} active={pathname === '/tasks'} onNavigate={closeMobile} testId="link-tasks" />
              <SidebarNavLink href="/books" label="Kitoblar" icon={<BookMarked size={20} strokeWidth={1.8} />} active={pathname === '/books'} onNavigate={closeMobile} testId="link-books" />
              <SidebarNavLink href="/repetition" label="Takrorlash" icon={<Repeat2 size={20} strokeWidth={1.8} />} active={repetitionSelected} onNavigate={closeMobile} testId="link-repetition" />
              <SidebarNavLink href="/vault" label={vaultNavigationLabel(language)} icon={<LockKeyhole size={20} />} active={pathname === '/vault'} onNavigate={closeMobile} testId="link-vault" />
               <SidebarNavLink href="/profile" label={profileLabel} icon={<UserCircle size={20} />} active={pathname === '/profile'} onNavigate={closeMobile} testId="link-profile" />
            </nav>
            <button type="button" onClick={() => setMoreOpen((value) => !value)} className="mt-5 flex min-h-12 w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[14px] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground" aria-expanded={moreOpen} aria-controls="secondary-navigation" data-testid="button-more-navigation">
              <span className="grid size-6 place-items-center"><ChevronDown size={19} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} /></span>
              <span className="flex-1">Boshqa bo‘limlar</span>
              <span className="text-[12px] text-sidebar-foreground/50">{moreOpen ? 'Yopish' : 'Ochish'}</span>
            </button>
            {moreOpen && <nav id="secondary-navigation" className="mt-1 space-y-1 border-l border-sidebar-border pl-2">
              <SidebarNavLink href="/user-portal?view=calendar" label="Taqvim" icon={<CalendarDays size={20} />} active={pathname === '/user-portal' && portalView === 'calendar'} onNavigate={closeMobile} testId="link-calendar" />
              <SidebarNavLink href="/user-portal?view=folders" label="Mavzular" icon={<FolderOpen size={20} />} active={pathname === '/user-portal' && portalView === 'folders'} onNavigate={closeMobile} testId="link-folders-tags" />
              <SidebarNavLink href="/user-portal?view=analytics" label="Kayfiyat" icon={<BarChart3 size={20} />} active={pathname === '/user-portal' && portalView === 'analytics'} onNavigate={closeMobile} testId="link-analytics" />
              <SidebarNavLink href="/ideas" label="G‘oyalar" icon={<Lightbulb size={20} />} active={pathname === '/ideas'} onNavigate={closeMobile} testId="link-ideas" />
              <SidebarNavLink href="/habits" label="Odatlar" icon={<CalendarCheck2 size={20} />} active={pathname === '/habits'} onNavigate={closeMobile} testId="link-habits" />
              <SidebarNavLink href="/settings" label="Sozlamalar" icon={<Settings size={20} />} active={pathname === '/settings'} onNavigate={closeMobile} testId="link-settings" />
            </nav>}
          </div>
        </div>
        <div>
          <AmbientSoundControl collapsed={false} />
          <div className="flex items-center justify-between gap-3 border-t border-sidebar-border pt-4">
            <div className="min-w-0"><p className="truncate text-[13px] font-semibold">{firstName}</p><p className="mt-0.5 text-[11px] text-sidebar-foreground/55">Shaxsiy kundalik</p></div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => signOut({ redirectUrl: appBasePath })} className="grid size-11 place-items-center rounded-xl text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label="Hisobdan chiqish" title="Hisobdan chiqish" data-testid="button-sign-out"><LogOut size={19} /></button>
            </div>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border/70 bg-background/90 px-3 backdrop-blur sm:px-4 md:pl-[280px] md:pr-6">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMobileOpen(true)} className="grid size-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground" aria-label="Menyuni ochish" title="Menyuni ochish" data-testid="button-mobile-menu"><Menu size={20} /></button>
          <div className="md:hidden"><LogoMark compact /></div>
          <span className="hidden min-w-0 truncate font-serif text-[17px] text-foreground md:block" data-testid="text-header-title">{pageTitle}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSelector className="w-[4.5rem] shrink-0" />
          <ThemeToggle />
          <Link href="/entry/new" className="inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm sm:w-auto sm:px-3.5" aria-label="Yangi xotira yozish" data-testid="link-mobile-new"><Plus size={18} /><span className="hidden sm:inline">Yozish</span></Link>
        </div>
      </header>
      <main className="box-border min-h-[calc(100dvh-4rem)] w-full min-w-0 max-w-full md:pl-[264px]">
        {sectionId && <SectionMotivationCard key={sectionId} sectionId={sectionId} userId={user?.id ?? 'anonymous'} />}
        {children}
      </main>
    </div>
  );
}

export function FlashNotice({ message, tone = 'success' }: { message: string; tone?: 'success' | 'error' }) {
  return <div className={`fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex min-h-12 items-center justify-center gap-3 rounded-2xl border px-5 py-3 text-center text-[14px] font-medium shadow-lg diary-rise sm:inset-x-auto sm:right-5 sm:max-w-[min(28rem,calc(100vw-2.5rem))] ${tone === 'success' ? 'border-[#c3ddcf] bg-[#edf6f0] text-[#35614f]' : 'border-[#ecc6bd] bg-[#fff0ec] text-[#8f3f2d]'}`} role="status" data-testid="status-feedback"><span className="size-2 shrink-0 rounded-full bg-current" />{message}</div>;
}

export function EmptyEntries({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-6 py-16 text-center">
      <div className="absolute -right-10 -top-10 size-36 rounded-full border-[18px] border-[#eadab0]/70" />
      <div className="absolute -bottom-16 -left-8 size-32 rounded-full border-[14px] border-[#d8e7dc]/80" />
      <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-[#30243f] text-[#f8f3e9]"><BookOpen size={23} strokeWidth={1.5} /></span>
      <h2 className="relative mt-6 font-serif text-[30px] tracking-[-0.03em]">{filtered ? 'Bu qidiruvga mos yozuv topilmadi.' : 'Birinchi yozuvingizni kutmoqda.'}</h2>
      <p className="relative mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{filtered ? 'Boshqa so‘z bilan qidiring yoki filterlarni tozalang.' : 'Bugun deyarli unutgan kichik bir narsadan boshlang. Boshlashning to‘g‘ri yoki noto‘g‘ri usuli yo‘q.'}</p>
      <button type="button" onClick={onCreate} className="relative mt-7 inline-flex min-h-14 items-center gap-3 rounded-2xl bg-primary px-6 py-4 text-[16px] font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="button-empty-create"><Plus size={21} /> Yangi xotira yozish</button>
    </div>
  );
}