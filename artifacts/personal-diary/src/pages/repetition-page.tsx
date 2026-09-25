import { zodResolver } from '@hookform/resolvers/zod';
import {
  getGetRepetitionStatsQueryKey,
  getListRepetitionCardsQueryKey,
  getListRepetitionDecksQueryKey,
  useCreateRepetitionCard,
  useCreateRepetitionDeck,
  useDeleteRepetitionCard,
  useDeleteRepetitionDeck,
  useGetRepetitionStats,
  useListRepetitionCards,
  useListRepetitionDecks,
  useReviewRepetitionCard,
  useUpdateRepetitionCard,
  useUpdateRepetitionDeck,
  type RepetitionCard,
  type RepetitionDeck,
  type RepetitionRating,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, Check, ChevronLeft, Edit3, Layers3, Lightbulb, Loader2, Plus, RotateCcw, Trash2, Volume2, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'wouter';
import { z } from 'zod';
import { DiaryShell, FlashNotice } from '@/components/diary-ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const deckSchema = z.object({ name: z.string().trim().min(1, 'Nom kiriting.').max(60, 'Nom 60 belgidan oshmasin.') });
const cardSchema = z.object({
  deckId: z.coerce.number().min(1, 'To‘plamni tanlang.'),
  front: z.string().trim().min(1, 'Savol tomonini kiriting.').max(5000, 'Matn 5000 belgidan oshmasin.'),
  back: z.string().trim().min(1, 'Javob tomonini kiriting.').max(5000, 'Matn 5000 belgidan oshmasin.'),
  pronunciation: z.string().max(120, 'Talaffuz 120 belgidan oshmasin.'),
  exampleSentence: z.string().max(2000, 'Misol jumla 2000 belgidan oshmasin.'),
});
type DeckForm = z.infer<typeof deckSchema>;
type CardForm = z.infer<typeof cardSchema>;
type Notice = { message: string; tone?: 'success' | 'error' } | null;

const ratingMeta: Array<{ key: RepetitionRating; label: string; detail: string; className: string }> = [
  { key: 'again', label: 'Yana', detail: '1 daqiqada', className: 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20' },
  { key: 'hard', label: 'Qiyin', detail: '1 kunda', className: 'border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20' },
  { key: 'good', label: 'Yaxshi', detail: '3 kunda', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20' },
  { key: 'easy', label: 'Oson', detail: '5+ kun', className: 'border-sky-500/30 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20' },
];

function LoadingRows({ count = 3 }: { count?: number }) {
  return <div className="space-y-3" aria-label="Yuklanmoqda" data-testid="status-loading">{Array.from({ length: count }).map((_, index) => <div key={index} className="skeleton h-[72px] rounded-2xl" />)}</div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-destructive/35 bg-destructive/10 p-5 text-sm text-destructive-foreground" data-testid="status-error"><p>{message}</p><button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-destructive/35 px-3 text-xs font-semibold hover:bg-destructive/10" data-testid="button-retry"><RotateCcw size={14} /> Qayta urinish</button></div>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-[24px] border border-dashed border-border bg-card/55 px-5 py-10 text-center" data-testid="status-empty"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Lightbulb size={22} /></span><h3 className="mt-4 font-serif text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>{action}</div>;
}

function DialogFrame({ title, description, onClose, children, testId }: { title: string; description: string; onClose: () => void; children: ReactNode; testId: string }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#09070e]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" data-testid={testId}>
    <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[26px] border border-border bg-card p-6 shadow-2xl sm:p-8">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Yopish" data-testid={`button-close-${testId}`}><X size={17} /></button>
      <h2 className="pr-8 font-serif text-3xl tracking-tight">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  </div>;
}

function DeckFormDialog({ deck, decks, onClose, onDone, setNotice }: { deck: RepetitionDeck | null; decks: RepetitionDeck[]; onClose: () => void; onDone: () => void; setNotice: (notice: Notice) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<DeckForm>({ resolver: zodResolver(deckSchema), defaultValues: { name: deck?.name ?? '' } });
  const create = useCreateRepetitionDeck();
  const update = useUpdateRepetitionDeck();
  const busy = create.isPending || update.isPending;
  const submit = (values: DeckForm) => {
    const duplicate = decks.some((item) => item.id !== deck?.id && item.name.trim().toLocaleLowerCase() === values.name.trim().toLocaleLowerCase());
    if (duplicate) {
      form.setError('name', { message: 'Bu nom allaqachon mavjud.' });
      return;
    }
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListRepetitionDecksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListRepetitionCardsQueryKey() });
      setNotice({ message: deck ? 'To‘plam nomi yangilandi.' : 'Yangi to‘plam yaratildi.' });
      onDone();
    };
    if (deck) update.mutate({ id: deck.id, data: { name: values.name.trim() } }, { onSuccess, onError: () => setNotice({ message: 'To‘plamni saqlab bo‘lmadi.', tone: 'error' }) });
    else create.mutate({ data: { name: values.name.trim() } }, { onSuccess, onError: () => setNotice({ message: 'To‘plamni yaratib bo‘lmadi.', tone: 'error' }) });
  };
  return <DialogFrame title={deck ? 'To‘plamni nomlash' : 'Yangi to‘plam'} description="O‘rganadigan mavzularingizni alohida to‘plamlarga ajrating." onClose={onClose} testId="dialog-deck-form">
    <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-5">
      <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>To‘plam nomi</FormLabel><FormControl><Input {...field} autoFocus placeholder="Masalan, Ispan tili" data-testid="input-deck-name" /></FormControl><FormMessage /></FormItem>} />
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" data-testid="button-cancel-deck">Bekor qilish</button><button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-deck">{busy && <Loader2 size={15} className="animate-spin" />} {deck ? 'Saqlash' : 'Yaratish'}</button></div>
    </form></Form>
  </DialogFrame>;
}

function CardFormDialog({ card, decks, defaultDeckId, onClose, onDone, setNotice }: { card: RepetitionCard | null; decks: RepetitionDeck[]; defaultDeckId: number | null; onClose: () => void; onDone: () => void; setNotice: (notice: Notice) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<CardForm>({ resolver: zodResolver(cardSchema), defaultValues: { deckId: card?.deckId ?? defaultDeckId ?? 0, front: card?.front ?? '', back: card?.back ?? '', pronunciation: card?.pronunciation ?? '', exampleSentence: card?.exampleSentence ?? '' } });
  const create = useCreateRepetitionCard();
  const update = useUpdateRepetitionCard();
  const busy = create.isPending || update.isPending;
  const submit = (values: CardForm) => {
    const data = { deckId: Number(values.deckId), front: values.front.trim(), back: values.back.trim(), pronunciation: values.pronunciation.trim() || null, exampleSentence: values.exampleSentence.trim() || null };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getListRepetitionCardsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRepetitionStatsQueryKey({ timeZone: getTimeZone() }) });
      setNotice({ message: card ? 'Kart yangilandi.' : 'Yangi kart qo‘shildi.' });
      onDone();
    };
    if (card) update.mutate({ id: card.id, data }, { onSuccess, onError: () => setNotice({ message: 'Kartni saqlab bo‘lmadi.', tone: 'error' }) });
    else create.mutate({ data }, { onSuccess, onError: () => setNotice({ message: 'Kartni yaratib bo‘lmadi.', tone: 'error' }) });
  };
  return <DialogFrame title={card ? 'Kartni tahrirlash' : 'Yangi kart'} description="So‘z, tarjima va eslab qolishga yordam beradigan kontekst yozing." onClose={onClose} testId="dialog-card-form">
    <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-5">
      <FormField control={form.control} name="deckId" render={({ field }) => <FormItem><FormLabel>To‘plam</FormLabel><FormControl><select {...field} value={String(field.value)} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="select-card-deck"><option value="0">To‘plamni tanlang</option>{decks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="front" render={({ field }) => <FormItem><FormLabel>Old tomoni</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="Savol, so‘z yoki tushuncha" data-testid="textarea-card-front" /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="back" render={({ field }) => <FormItem><FormLabel>Orqa tomoni</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="Javob, tarjima yoki izoh" data-testid="textarea-card-back" /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="pronunciation" render={({ field }) => <FormItem><FormLabel>Talaffuz ko‘rsatmasi <span className="font-normal text-muted-foreground">(ixtiyoriy, IPA)</span></FormLabel><FormControl><Input {...field} placeholder="Masalan, /həˈloʊ/" data-testid="input-card-pronunciation" /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="exampleSentence" render={({ field }) => <FormItem><FormLabel>Kontekstli misol <span className="font-normal text-muted-foreground">(ixtiyoriy)</span></FormLabel><FormControl><Textarea {...field} rows={3} placeholder="So‘zni ishlatgan tabiiy jumla..." data-testid="textarea-card-example" /></FormControl><FormMessage /></FormItem>} />
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted" data-testid="button-cancel-card">Bekor qilish</button><button type="submit" disabled={busy || decks.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-card">{busy && <Loader2 size={15} className="animate-spin" />} {card ? 'Saqlash' : 'Qo‘shish'}</button></div>
    </form></Form>
  </DialogFrame>;
}

function StatCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: ReactNode }) {
  return <div className="rounded-[22px] border border-border bg-card/80 p-5 shadow-sm" data-testid={`stat-${label}`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span><span className="text-primary">{icon}</span></div><p className="mt-4 font-serif text-4xl tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function ReviewCard({ card, onReviewed, setNotice }: { card: RepetitionCard; onReviewed: (rating: RepetitionRating) => void; setNotice: (notice: Notice) => void }) {
  const review = useReviewRepetitionCard();
  const [revealed, setRevealed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => { setRevealed(false); }, [card.id]);
  const speak = () => {
    if (!('speechSynthesis' in window)) {
      setNotice({ message: 'Brauzeringiz matnni ovoz chiqarib o‘qishni qo‘llamaydi.', tone: 'error' });
      return;
    }
    window.speechSynthesis.cancel();
     const utterance = new SpeechSynthesisUtterance(card.front);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };
  const rate = (rating: RepetitionRating) => review.mutate({ id: card.id, data: { rating, timeZone: getTimeZone() } }, {
    onSuccess: () => { setNotice({ message: 'Javobingiz saqlandi.' }); onReviewed(rating); },
    onError: () => setNotice({ message: 'Javobni saqlab bo‘lmadi.', tone: 'error' }),
  });
  return <div className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-6" data-testid={`review-card-${card.id}`}>
    <div className="mb-5 flex items-center justify-between"><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground"><BookOpenCheck size={16} className="text-primary" /> Bugungi mashq</span><span className="font-mono text-xs text-muted-foreground">{card.deckName}</span></div>
    <button type="button" onClick={() => !review.isPending && setRevealed((value) => !value)} className="group relative block min-h-[265px] w-full [perspective:1200px] sm:min-h-[300px]" aria-label={revealed ? 'Savolga qaytish' : 'Javobni ko‘rish'} data-testid="button-flip-card">
      <span className="absolute inset-0 block rounded-[22px] border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-7 text-left transition-transform duration-500 [backface-visibility:hidden] [transform-style:preserve-3d] sm:p-10" style={{ transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Savol</span><span className="mt-7 block whitespace-pre-wrap font-serif text-[clamp(1.6rem,4vw,2.7rem)] leading-tight tracking-tight">{card.front}</span>{card.pronunciation && <span className="mt-3 block text-sm text-muted-foreground" data-testid="text-card-pronunciation">{card.pronunciation}</span>}<span className="absolute bottom-6 left-7 text-xs text-muted-foreground sm:left-10">Javobni ko‘rish uchun bosing</span></span>
      <span className="absolute inset-0 block rounded-[22px] border border-emerald-400/20 bg-emerald-500/[0.07] p-7 text-left transition-transform duration-500 [backface-visibility:hidden] [transform:rotateY(180deg)] [transform-style:preserve-3d] sm:p-10" style={{ transform: revealed ? 'rotateY(0deg)' : 'rotateY(-180deg)' }}><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">Javob</span><span className="mt-7 block whitespace-pre-wrap font-serif text-[clamp(1.6rem,4vw,2.7rem)] leading-tight tracking-tight">{card.back}</span><span className="absolute bottom-6 left-7 text-xs text-muted-foreground sm:left-10">Savolga qaytish uchun bosing</span></span>
    </button>
     {revealed && <div className="mt-5 space-y-4" data-testid="review-feedback-panel"><button type="button" onClick={speak} disabled={speaking || review.isPending} className="mx-auto flex min-h-10 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60" data-testid="button-speak-answer">{speaking ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />} So‘zni talaffuz qilish</button>{card.exampleSentence && <div className="rounded-2xl border border-border bg-background/70 px-4 py-3" data-testid="review-example-sentence"><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Kontekstdagi misol</p><p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{card.exampleSentence}</p></div>}<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ratingMeta.map((item) => <button type="button" key={item.key} onClick={() => rate(item.key)} disabled={review.isPending} className={cn('flex min-h-[66px] flex-col items-start justify-center rounded-2xl border px-4 text-left transition-colors disabled:cursor-wait disabled:opacity-60', item.className)} data-testid={`button-rate-${item.key}`}><span className="flex items-center gap-2 text-sm font-semibold">{review.isPending && <Loader2 size={13} className="animate-spin" />}{item.label}</span><span className="mt-1 text-[11px] opacity-70">{item.detail}</span></button>)}</div></div>}
  </div>;
}

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function formatDue(value: string) {
  return new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function RepetitionPage() {
  const queryClient = useQueryClient();
  const timeZone = getTimeZone();
  const decksQuery = useListRepetitionDecks();
  const cardsQuery = useListRepetitionCards();
  const statsQuery = useGetRepetitionStats({ timeZone });
  const deleteDeck = useDeleteRepetitionDeck();
  const deleteCard = useDeleteRepetitionCard();
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [deckDialog, setDeckDialog] = useState<RepetitionDeck | null | false>(false);
  const [cardDialog, setCardDialog] = useState<RepetitionCard | null | false>(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [tab, setTab] = useState<'review' | 'library'>('review');
  const decks = decksQuery.data ?? [];
  const cards = cardsQuery.data ?? [];
  const activeDeckId = selectedDeckId ?? decks[0]?.id ?? null;
  const visibleCards = useMemo(() => selectedDeckId === null ? cards : cards.filter((card) => card.deckId === selectedDeckId), [selectedDeckId, cards]);
  const dueCards = useMemo(() => cards.filter((card) => new Date(card.dueAt).getTime() <= Date.now()), [cards]);
  const reviewCard = dueCards[reviewIndex % Math.max(dueCards.length, 1)];
  const stats = statsQuery.data;
  const learnedPercent = stats && stats.totalCards > 0 ? Math.round((stats.totalLearned / stats.totalCards) * 100) : 0;
  useEffect(() => { setReviewIndex(0); }, [activeDeckId]);
  useEffect(() => { if (notice) { const timer = window.setTimeout(() => setNotice(null), 4000); return () => window.clearTimeout(timer); } return undefined; }, [notice]);

  const retryAll = () => { void decksQuery.refetch(); void cardsQuery.refetch(); void statsQuery.refetch(); };
  const afterReview = (rating: RepetitionRating) => {
    queryClient.invalidateQueries({ queryKey: getListRepetitionCardsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRepetitionStatsQueryKey({ timeZone }) });
    setReviewIndex(0);
    if (rating === 'again') {
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: getListRepetitionCardsQueryKey() });
      }, 61_000);
    }
  };
  const removeDeck = (deck: RepetitionDeck) => {
    if (!window.confirm(`“${deck.name}” to‘plami va uning kartalarini o‘chirishni xohlaysizmi?`)) return;
    deleteDeck.mutate({ id: deck.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRepetitionDecksQueryKey() }); queryClient.invalidateQueries({ queryKey: getListRepetitionCardsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetRepetitionStatsQueryKey({ timeZone }) }); setSelectedDeckId(null); setNotice({ message: 'To‘plam o‘chirildi.' }); }, onError: () => setNotice({ message: 'To‘plamni o‘chirib bo‘lmadi.', tone: 'error' }) });
  };
  const removeCard = (card: RepetitionCard) => {
    if (!window.confirm('Bu kartni o‘chirishni xohlaysizmi?')) return;
    deleteCard.mutate({ id: card.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRepetitionCardsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetRepetitionStatsQueryKey({ timeZone }) }); setNotice({ message: 'Kart o‘chirildi.' }); }, onError: () => setNotice({ message: 'Kartni o‘chirib bo‘lmadi.', tone: 'error' }) });
  };
  const errorQuery = decksQuery.isError || cardsQuery.isError || statsQuery.isError;

  return <DiaryShell>
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
      <Link href="/user-portal" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="link-repetition-back"><ChevronLeft size={16} /> Kundalikka qaytish</Link>
      <div className="mt-7 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sokin yodlash</p><h1 className="mt-2 font-serif text-[clamp(2.6rem,6vw,5.2rem)] leading-[.9] tracking-[-.055em]">Takrorlash<span className="text-primary">.</span></h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">So‘zlarni shoshmasdan o‘rganing. Har bir kart sizga kerak bo‘lgan paytda qaytib keladi.</p></div><button type="button" onClick={() => setCardDialog(null)} disabled={decks.length === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-add-card"><Plus size={18} /> Yangi kart</button></div>
      {errorQuery && <div className="mt-7"><ErrorState message="Ma’lumotlarni yuklashda xatolik yuz berdi." onRetry={retryAll} /></div>}
      <section className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bugun" value={stats?.cardsDueToday ?? '—'} detail="kart sizni kutmoqda" icon={<BookOpenCheck size={18} />} />
        <StatCard label="O‘rganilgan" value={stats?.totalLearned ?? '—'} detail="avval o‘rganilgan kartlar" icon={<Check size={18} />} />
        <StatCard label="Ketma-ket kunlar" value={stats ? `${stats.dailyStreak} kun` : '—'} detail="kunlik o‘rganish streaki" icon={<RotateCcw size={18} />} />
        <div className="rounded-[22px] border border-border bg-card/80 p-5 shadow-sm" data-testid="stat-progress"><div className="flex items-start justify-between"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Jarayon</span><span className="font-mono text-xs text-primary">{stats ? `${learnedPercent}%` : '—'}</span></div><div className="mt-7 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="O‘rganilgan kartlar" aria-valuenow={learnedPercent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${learnedPercent}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">{stats ? `${stats.totalLearned} o‘rganilgan · ${stats.totalCards - stats.totalLearned} yangi` : 'Hisoblanmoqda'}</p></div>
      </section>
      <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3"><div className="inline-flex rounded-xl border border-border bg-card p-1"><button type="button" onClick={() => setTab('review')} className={cn('rounded-lg px-4 py-2 text-xs font-semibold transition-colors', tab === 'review' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')} data-testid="tab-review">Bugungi mashq</button><button type="button" onClick={() => setTab('library')} className={cn('rounded-lg px-4 py-2 text-xs font-semibold transition-colors', tab === 'library' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')} data-testid="tab-library">Kutubxona</button></div><span className="text-xs text-muted-foreground">{dueCards.length} ta navbatda</span></div>
          {tab === 'review' ? (cardsQuery.isLoading ? <LoadingRows count={1} /> : reviewCard ? <ReviewCard card={reviewCard} onReviewed={afterReview} setNotice={setNotice} /> : <EmptyState title="Bugun uchun kart yo‘q" description="Yangi kartlar qo‘shing yoki ertangi takrorlashgacha sokin tanaffus qiling." action={<button type="button" onClick={() => setCardDialog(null)} disabled={decks.length === 0} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-empty-add-card"><Plus size={16} /> Kart qo‘shish</button>} />) : <div className="space-y-3" data-testid="card-library">{cardsQuery.isLoading ? <LoadingRows count={4} /> : visibleCards.length === 0 ? <EmptyState title="Kutubxona hozircha bo‘sh" description="Birinchi kartingizni qo‘shing — keyin u sizga o‘z vaqtida qaytib keladi." action={<button type="button" onClick={() => setCardDialog(null)} disabled={decks.length === 0} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-library-add-card"><Plus size={16} /> Birinchi kartni qo‘shish</button>} /> : visibleCards.map((card) => <article key={card.id} className="group rounded-2xl border border-border bg-card/80 p-4 transition-colors hover:border-primary/40" data-testid={`row-card-${card.id}`}><div className="flex items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-primary"><span>{card.deckName}</span>{card.learnedAt && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">O‘rganilgan</span>}</div><p className="mt-3 truncate font-serif text-xl">{card.front}</p>{card.pronunciation && <p className="mt-0.5 text-xs text-muted-foreground">{card.pronunciation}</p>}<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{card.back}</p>{card.exampleSentence && <p className="mt-2 line-clamp-2 border-l-2 border-primary/25 pl-2 text-xs italic text-muted-foreground">{card.exampleSentence}</p>}</div><div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"><button type="button" onClick={() => setCardDialog(card)} className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Kartni tahrirlash" data-testid={`button-edit-card-${card.id}`}><Edit3 size={15} /></button><button type="button" onClick={() => removeCard(card)} disabled={deleteCard.isPending} className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Kartni o‘chirish" data-testid={`button-delete-card-${card.id}`}><Trash2 size={15} /></button></div></div><div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground"><span>{card.repetitions} marta takrorlangan</span><span>{new Date(card.dueAt).getTime() <= Date.now() ? 'Bugun takrorlash kerak' : `${formatDue(card.dueAt)} kuni`}</span></div></article>)}</div>}
        </section>
        <aside className="rounded-[26px] border border-border bg-card/70 p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">To‘plamlar</p><p className="mt-1 text-sm text-muted-foreground">{decks.length} ta mavzu</p></div><button type="button" onClick={() => setDeckDialog(null)} className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20" aria-label="Yangi to‘plam" data-testid="button-add-deck"><Plus size={18} /></button></div><div className="mt-5 space-y-2" data-testid="deck-list">{decksQuery.isLoading ? <LoadingRows count={3} /> : decks.length === 0 ? <p className="rounded-2xl bg-muted/70 p-4 text-sm leading-relaxed text-muted-foreground" data-testid="text-decks-empty">Yodlashni boshlash uchun birinchi to‘plamingizni yarating.</p> : <><button type="button" onClick={() => { setSelectedDeckId(null); setTab('library'); }} className={cn('flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 text-left transition-colors', selectedDeckId === null ? 'border-primary/40 bg-primary/10' : 'border-transparent hover:border-border hover:bg-muted/60')} data-testid="button-select-all-decks"><span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', selectedDeckId === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><Layers3 size={16} /></span><span className="min-w-0 flex-1 text-sm font-semibold">Barcha to‘plamlar</span><span className="text-[11px] text-muted-foreground">{cards.length} ta kart</span></button>{decks.map((deck) => <div key={deck.id} className={cn('group flex items-center gap-2 rounded-2xl border px-3 py-3 transition-colors', selectedDeckId === deck.id ? 'border-primary/40 bg-primary/10' : 'border-transparent hover:border-border hover:bg-muted/60')}><button type="button" onClick={() => { setSelectedDeckId(deck.id); setTab('library'); }} className="flex min-w-0 flex-1 items-center gap-3 text-left" data-testid={`button-select-deck-${deck.id}`}><span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', selectedDeckId === deck.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><Layers3 size={16} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{deck.name}</span><span className="block text-[11px] text-muted-foreground">{cards.filter((card) => card.deckId === deck.id).length} ta kart</span></span></button><button type="button" onClick={() => setDeckDialog(deck)} className="grid size-8 place-items-center rounded-lg text-muted-foreground opacity-100 hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100" aria-label="To‘plamni tahrirlash" data-testid={`button-edit-deck-${deck.id}`}><Edit3 size={14} /></button><button type="button" onClick={() => removeDeck(deck)} disabled={deleteDeck.isPending} className="grid size-8 place-items-center rounded-lg text-muted-foreground opacity-100 hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" aria-label="To‘plamni o‘chirish" data-testid={`button-delete-deck-${deck.id}`}><Trash2 size={14} /></button></div>)}</>}</div><div className="mt-6 border-t border-border pt-5"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">Yodlash eslatmasi</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Kartlarni rost baholang. Tizim keyingi uchrashuv vaqtini sizning javoblaringizga qarab o‘zi moslaydi.</p></div></aside>
      </div>
    </div>
    {deckDialog !== false && <DeckFormDialog deck={deckDialog} decks={decks} onClose={() => setDeckDialog(false)} onDone={() => setDeckDialog(false)} setNotice={setNotice} />}
    {cardDialog !== false && <CardFormDialog card={cardDialog} decks={decks} defaultDeckId={activeDeckId} onClose={() => setCardDialog(false)} onDone={() => setCardDialog(false)} setNotice={setNotice} />}
    {notice && <FlashNotice message={notice.message} tone={notice.tone} />}
  </DiaryShell>;
}

export default RepetitionPage;