import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, Link, useLocation, useParams } from 'wouter';
import { useAuth, SignIn, SignUp } from '@clerk/react';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleAlert, Heart, LoaderCircle, LockKeyhole, Search } from 'lucide-react';
import {
  DiaryEntryInput,
  DiaryEntryUpdate,
  Mood,
  getGetDiaryEntryQueryKey,
  getGetDiarySummaryQueryKey,
  getListDiaryEntriesQueryKey,
  useCreateDiaryEntry,
  useDeleteDiaryEntry,
  useGetDiaryEntry,
  useGetDiarySummary,
  useListDiaryEntries,
  useToggleDiaryEntryFavorite,
  useUpdateDiaryEntry,
} from '@workspace/api-client-react';
import type { DiaryEntry } from '@workspace/api-client-react';
import { DiaryShell, EmptyEntries, EntryCard, FlashNotice, LogoMark, MoodBadge, moodMeta } from '@/components/diary-ui';

const moods = Object.values(Mood);

function LoadingRows() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-[218px] rounded-[22px] border border-border bg-card p-5" data-testid={`skeleton-entry-${item}`}><div className="skeleton h-3 w-24 rounded-full" /><div className="skeleton mt-8 h-8 w-4/5 rounded-lg" /><div className="skeleton mt-3 h-3 w-full rounded-full" /><div className="skeleton mt-2 h-3 w-3/4 rounded-full" /></div>)}</div>;
}

function ErrorPanel({ onRetry, detail = false }: { onRetry: () => void; detail?: boolean }) {
  return <div className="rounded-[24px] border border-[#ecc6bd] bg-[#fff0ec] px-6 py-12 text-center" data-testid="status-error"><CircleAlert className="mx-auto text-destructive" size={24} /><h2 className="mt-4 font-serif text-[27px]">{detail ? 'This page is out of reach.' : 'The pages are taking a moment.'}</h2><p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">We could not load your diary right now. Your words are safe; try once more.</p><button type="button" onClick={onRetry} className="mt-6 rounded-xl border border-destructive/30 bg-card px-4 py-2.5 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground" data-testid="button-retry">Try again</button></div>;
}

export function HomePage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  if (isSignedIn) return <Redirect to="/user-portal" />;
  return <div className="paper-grain min-h-[100dvh] overflow-hidden bg-background text-foreground">
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
      <LogoMark />
      <div className="flex items-center gap-3"><Link href="/sign-in" className="hidden rounded-xl px-4 py-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block" data-testid="link-sign-in">Sign in</Link><Link href="/sign-up" className="rounded-xl bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-sign-up">Start writing <ArrowUpRight className="ml-1 inline-block" size={14} /></Link></div>
    </nav>
    <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:pb-32 md:pt-24 lg:px-12">
      <div className="relative z-10 diary-rise"><p className="font-mono text-[10px] uppercase tracking-[0.23em] text-[#9a6b23]">A private daily practice</p><h1 className="mt-5 max-w-2xl font-serif text-[clamp(4rem,8vw,7.7rem)] leading-[.86] tracking-[-0.055em] text-primary">Keep the<br /><em className="text-[#a66a13]">little things.</em></h1><p className="mt-8 max-w-md text-[16px] leading-[1.7] text-muted-foreground">A quiet place to put the day down. Write honestly, find the thread later, and keep the moments that deserve more than a passing thought.</p><div className="mt-9 flex flex-wrap items-center gap-4"><Link href="/sign-up" className="group inline-flex items-center gap-3 rounded-2xl bg-primary px-5 py-3.5 text-[13px] font-semibold text-primary-foreground shadow-md transition-all hover:-translate-y-1 hover:shadow-lg" data-testid="button-hero-start">Open your diary <span className="grid size-6 place-items-center rounded-full bg-[#d9a441] text-primary"><ArrowUpRight size={14} /></span></Link><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">No audience. Just you.</span></div></div>
      <div className="relative mx-auto h-[420px] w-full max-w-[480px] diary-drift diary-delay-2">
        <div className="absolute right-2 top-2 h-[350px] w-[74%] rotate-[6deg] rounded-[28px] border border-[#cfc09c] bg-[#eadfbf] shadow-lg" /><div className="absolute bottom-4 left-5 h-[360px] w-[78%] -rotate-[7deg] rounded-[28px] border border-[#cfc09c] bg-[#f9f1de] shadow-xl" /><div className="absolute left-[14%] top-8 h-[365px] w-[78%] rotate-[1deg] rounded-[28px] border border-[#d4c7a7] bg-[#fffaf0] p-8 shadow-2xl"><div className="flex items-center justify-between border-b border-[#e6dcc3] pb-5"><span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#9a8e76]">Tuesday / 08.13</span><span className="size-2 rounded-full bg-[#d9a441]" /></div><p className="mt-10 font-serif text-[31px] leading-[1.02] text-primary">“Let the day be<br />a place you visit,<br /><em>not a test you take.”</em></p><div className="mt-9 space-y-3"><div className="h-px w-full bg-[#e6dcc3]" /><div className="h-px w-[82%] bg-[#e6dcc3]" /><div className="h-px w-[91%] bg-[#e6dcc3]" /></div><p className="mt-7 font-mono text-[9px] uppercase tracking-[.15em] text-[#9a8e76]">one good thing: rain</p></div><span className="absolute -bottom-1 right-4 grid size-16 rotate-12 place-items-center rounded-full border border-[#d0a84f] bg-[#e9c66e] text-center font-mono text-[9px] uppercase leading-tight tracking-[.1em] text-[#60431f] shadow-md">made for<br />returning</span>
      </div>
    </section>
    <section className="border-y border-[#d8ccb0] bg-[#ece5d1] px-5 py-20 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[.7fr_1.3fr]"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">The ritual</p><h2 className="mt-5 max-w-sm font-serif text-[47px] leading-[.94] tracking-[-.04em] text-primary">Make room for your own voice.</h2></div><div className="grid gap-10 sm:grid-cols-3"><div><span className="font-mono text-[12px] text-[#9a6b23]">01</span><h3 className="mt-4 font-serif text-[25px]">Put it down</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">A blank page with enough shape to help you begin, never enough rules to get in the way.</p></div><div><span className="font-mono text-[12px] text-[#9a6b23]">02</span><h3 className="mt-4 font-serif text-[25px]">Name the feeling</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Mark the mood, add a few threads, and let the context stay close to the moment.</p></div><div><span className="font-mono text-[12px] text-[#9a6b23]">03</span><h3 className="mt-4 font-serif text-[25px]">Come back gently</h3><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Search the archive when you need a reminder of what mattered, or simply want to remember.</p></div></div></div></section>
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:px-8 md:grid-cols-[1fr_1.1fr] lg:px-12"><div className="relative mx-auto h-64 w-full max-w-[430px]"><div className="absolute left-8 top-7 h-44 w-44 rounded-full bg-[#d7e7dc]" /><div className="absolute bottom-0 right-6 h-40 w-40 rounded-full bg-[#efcf86]" /><div className="absolute left-24 top-16 grid size-36 place-items-center rounded-[42%] bg-primary shadow-xl"><LockKeyhole className="text-[#f9f1de]" size={36} strokeWidth={1.3} /></div></div><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">Yours alone</p><h2 className="mt-5 max-w-lg font-serif text-[clamp(3rem,5vw,5rem)] leading-[.9] tracking-[-.05em]">Private by design.<br /><span className="text-[#a66a13]">Present by default.</span></h2><p className="mt-6 max-w-md text-[15px] leading-[1.75] text-muted-foreground">Your diary is not a performance dashboard. There are no likes, no feeds, and no pressure to keep up. Just a calm, considered home for your inner weather.</p></div></section>
    <section className="bg-primary px-5 py-20 text-primary-foreground sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e6bf65]">Today is a good day</p><h2 className="mt-4 max-w-xl font-serif text-[clamp(3rem,6vw,6rem)] leading-[.88] tracking-[-.05em]">Write one true thing.</h2></div><Link href="/sign-up" className="inline-flex items-center gap-2 rounded-2xl bg-[#d9a441] px-5 py-3.5 text-[13px] font-semibold text-primary transition-transform hover:-translate-y-1" data-testid="button-footer-start">Begin your diary <ArrowUpRight size={15} /></Link></div></section>
    <footer className="flex flex-col justify-between gap-3 px-5 py-7 text-[11px] text-muted-foreground sm:flex-row sm:px-8 lg:px-12"><LogoMark compact /><span>For the days you want to remember.</span></footer>
  </div>;
}

export function UserPortalPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState<'all' | Mood>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [notice, setNotice] = useState('');
  const params = useMemo(() => ({ q: search.trim() || undefined, mood: filterMood === 'all' ? undefined : filterMood, favorite: favoritesOnly ? true : undefined, sort }), [search, filterMood, favoritesOnly, sort]);
  const summary = useGetDiarySummary();
  const entries = useListDiaryEntries(params, { query: { queryKey: getListDiaryEntriesQueryKey(params) } });
  const queryClient = useQueryClient();
  const favoriteMutation = useToggleDiaryEntryFavorite();
  const deleteMutation = useDeleteDiaryEntry();
  const flash = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 2600); };
  const updateQueries = (entry?: DiaryEntry) => { queryClient.invalidateQueries({ queryKey: getListDiaryEntriesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDiarySummaryQueryKey() }); if (entry) queryClient.invalidateQueries({ queryKey: getGetDiaryEntryQueryKey(entry.id) }); };
  const onFavorite = (entry: DiaryEntry) => favoriteMutation.mutate({ id: entry.id, data: { favorite: !entry.favorite } }, { onSuccess: (updated) => { updateQueries(updated); flash(updated.favorite ? 'Saved to favorites.' : 'Removed from favorites.'); }, onError: () => flash('Could not update that page.') }); 
  const onDelete = (entry: DiaryEntry) => { if (!window.confirm(`Remove “${entry.title}” from your diary?`)) return; deleteMutation.mutate({ id: entry.id }, { onSuccess: () => { updateQueries(); flash('Entry removed.'); }, onError: () => flash('Could not remove that page.') }); };
  const data = summary.data;
  return <DiaryShell><div className="mx-auto max-w-[1360px] px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-12">
    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div className="diary-rise"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">Your private archive</p><h1 className="mt-3 font-serif text-[clamp(3rem,5vw,5.2rem)] leading-[.9] tracking-[-.05em]">Good to see you<span className="text-[#a66a13]">.</span></h1><p className="mt-4 text-[14px] text-muted-foreground">A home for the days you want to keep.</p></div><Link href="/entry/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" data-testid="button-new-entry"><span className="grid size-5 place-items-center rounded-full bg-[#d9a441] text-primary"><span className="text-[17px] leading-none">+</span></span> New entry</Link></div>
    <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Entries', data?.totalEntries ?? 0, 'all'], ['This month', data?.thisMonth ?? 0, 'pages'], ['Writing streak', data?.writingStreak ?? 0, 'days'], ['Favorites', data?.favoriteCount ?? 0, 'kept close']].map(([label, value, note], i) => <div key={label} className={`rounded-2xl border border-card-border bg-card p-5 diary-rise diary-delay-${i + 1}`} data-testid={`stat-${String(label).toLowerCase().replace(' ', '-')}`}><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{label}</p><div className="mt-4 flex items-end justify-between"><span className="font-serif text-[38px] leading-none">{data ? value : <span className="skeleton inline-block h-10 w-12 rounded-lg" />}</span><span className="text-[11px] text-muted-foreground">{note}</span></div></div>)}</div>
    <div className="mt-12 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="relative w-full max-w-[440px]"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your pages..." className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-[13px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9a441]/20" type="search" data-testid="input-search-entries" /></div><div className="flex flex-wrap gap-2"><div className="relative"><select value={filterMood} onChange={(e) => setFilterMood(e.target.value as 'all' | Mood)} className="h-10 appearance-none rounded-xl border border-border bg-card pl-3 pr-9 text-[11px] text-foreground outline-none focus:border-[#b89c5c]" data-testid="select-mood-filter"><option value="all">Every mood</option>{moods.map((mood) => <option key={mood} value={mood}>{moodMeta[mood].label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} /></div><button type="button" onClick={() => setFavoritesOnly(!favoritesOnly)} className={`h-10 rounded-xl border px-3 text-[11px] transition-colors ${favoritesOnly ? 'border-[#d9a441] bg-[#f8e9bf] text-[#8f601a]' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`} data-testid="button-filter-favorites"><Heart size={13} className="mr-1.5 inline-block" fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites</button><div className="relative"><select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')} className="h-10 appearance-none rounded-xl border border-border bg-card pl-3 pr-9 text-[11px] text-foreground outline-none focus:border-[#b89c5c]" data-testid="select-sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} /></div></div></div>
    <div className="mt-7 flex items-center justify-between border-b border-border pb-4"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{entries.data?.length ?? 0} {entries.data?.length === 1 ? 'entry' : 'entries'}</p>{data?.latestMood && <p className="text-[11px] text-muted-foreground">Lately feeling <MoodBadge mood={data.latestMood} small /></p>}</div>
    <div className="mt-6">{entries.isLoading ? <LoadingRows /> : entries.isError ? <ErrorPanel onRetry={() => entries.refetch()} /> : entries.data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{entries.data.map((entry) => <EntryCard key={entry.id} entry={entry} onFavorite={onFavorite} onDelete={onDelete} busyFavorite={favoriteMutation.isPending && favoriteMutation.variables?.id === entry.id} />)}</div> : <EmptyEntries filtered={Boolean(search || favoritesOnly || filterMood !== 'all')} onCreate={() => setLocation('/entry/new')} />}</div>
    {notice && <FlashNotice message={notice} />}
  </div></DiaryShell>;
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
  const create = useCreateDiaryEntry();
  const update = useUpdateDiaryEntry();
  const save = () => {
    if (!title.trim() || !content.trim() || !entryDate) { setError('Give this page a title, a few words, and a date.'); return; }
    setError('');
    const normalizedTags = tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
    if (isNew) {
      const data: DiaryEntryInput = { title: title.trim(), content: content.trim(), mood, entryDate, tags: normalizedTags, favorite };
      create.mutate({ data }, { onSuccess: (created) => { queryClient.invalidateQueries({ queryKey: getListDiaryEntriesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDiarySummaryQueryKey() }); setLocation(`/entry/${created.id}`); }, onError: () => setError('That page could not be saved. Please try again.') });
    } else if (entry) {
      const data: DiaryEntryUpdate = { title: title.trim(), content: content.trim(), mood, entryDate, tags: normalizedTags, favorite };
      update.mutate({ id: entry.id, data }, { onSuccess: (updated) => { queryClient.setQueryData(getGetDiaryEntryQueryKey(entry.id), updated); queryClient.invalidateQueries({ queryKey: getListDiaryEntriesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDiarySummaryQueryKey() }); setNotice('Saved just now.'); window.setTimeout(() => setNotice(''), 2200); }, onError: () => setError('Your changes could not be saved. Please try again.') });
    }
  };
  const pending = create.isPending || update.isPending;
  return <DiaryShell><div className="mx-auto max-w-[1050px] px-5 py-7 sm:px-8 md:px-10 lg:px-14 lg:py-12">
    <Link href={isNew ? '/user-portal' : `/entry/${entry?.id}`} className="inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-back"><ArrowLeft size={15} /> Back to {isNew ? 'your archive' : 'entry'}</Link>
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px]"><div><div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#9a6b23]">{isNew ? 'New page' : 'Edit page'}</span>{!isNew && notice && <span className="inline-flex items-center gap-1 text-[10px] text-[#47796c]"><Check size={13} /> {notice}</span>}</div><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-5 w-full border-0 bg-transparent font-serif text-[clamp(3.2rem,7vw,6.5rem)] leading-[.88] tracking-[-.055em] text-primary outline-none placeholder:text-primary/20" placeholder="A thought worth keeping..." maxLength={160} data-testid="input-entry-title" /><div className="mt-8 flex items-center gap-3 border-b border-border pb-5 text-[11px] text-muted-foreground"><CalendarDays size={15} /><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-transparent outline-none" data-testid="input-entry-date" /><span className="text-border">/</span><span>{moodMeta[mood].label}</span></div><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start anywhere. What is still with you from today?" className="mt-8 min-h-[380px] w-full resize-none border-0 bg-transparent font-serif text-[23px] leading-[1.55] text-foreground outline-none placeholder:text-muted-foreground/45" data-testid="textarea-entry-content" /></div>
      <aside className="space-y-6 lg:pt-14"><div className="rounded-2xl border border-card-border bg-card p-5"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">The feeling</p><div className="mt-4 grid grid-cols-2 gap-2">{moods.map((item) => <button type="button" key={item} onClick={() => setMood(item)} className={`rounded-xl px-2 py-2.5 text-left text-[11px] transition-all ${mood === item ? 'ring-2 ring-[#d9a441]/60' : 'opacity-75 hover:opacity-100'}`} style={{ color: moodMeta[item].color, backgroundColor: moodMeta[item].soft }} data-testid={`button-mood-${item}`}>{moodMeta[item].label}</button>)}</div></div><div className="rounded-2xl border border-card-border bg-card p-5"><label className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground" htmlFor="entry-tags">Threads</label><input id="entry-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated, tags" className="mt-3 w-full border-b border-border bg-transparent pb-2 text-[12px] outline-none placeholder:text-muted-foreground/55 focus:border-[#b89c5c]" data-testid="input-entry-tags" /><button type="button" onClick={() => setFavorite(!favorite)} className={`mt-5 flex items-center gap-2 text-[11px] ${favorite ? 'text-[#a66a13]' : 'text-muted-foreground'}`} data-testid="button-entry-favorite"><Heart size={15} fill={favorite ? 'currentColor' : 'none'} /> Keep close to heart</button></div><button type="button" onClick={save} disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[12px] font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-save-entry">{pending ? <LoaderCircle className="animate-spin" size={15} /> : <Check size={15} />}{pending ? 'Saving...' : 'Save page'}</button>{error && <p className="flex gap-2 text-[11px] leading-relaxed text-destructive" data-testid="status-form-error"><CircleAlert size={14} className="mt-0.5 shrink-0" />{error}</p>}<p className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[.1em] text-muted-foreground/70">Private to you · always</p></aside>
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

export function SignInPage({ basePath }: { basePath: string }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><LogoMark /></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

export function SignUpPage({ basePath }: { basePath: string }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><LogoMark /></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}
