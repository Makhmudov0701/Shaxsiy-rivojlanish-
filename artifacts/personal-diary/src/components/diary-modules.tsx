import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Check,
  CircleAlert,
  CirclePlus,
  Lock,
  LockKeyholeOpen,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { DiaryEntry } from '@workspace/api-client-react';
import { formatUzbekDate, parseDateValue } from '@/lib/date-utils';

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function entryDate(value: unknown) {
  if (typeof value === 'string') return parseDateValue(value.slice(0, 10));
  return parseDateValue(value);
}

function shiftDate(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function safeEntries(entries: DiaryEntry[] | undefined) {
  return Array.isArray(entries) ? entries : [];
}

function ModuleHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-[29px] leading-none tracking-[-0.035em] text-foreground">{title}</h2>
      </div>
      <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground sm:text-right">{description}</p>
    </div>
  );
}

function InlineMessage({ children, tone = 'error' }: { children: string; tone?: 'error' | 'notice' }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[12px] leading-relaxed ${tone === 'error' ? 'border-[#ecc6bd] bg-[#fff0ec] text-[#8f3f2d] dark:border-[#704038] dark:bg-[#3a2422] dark:text-[#f0b0a0]' : 'border-[#e1d4ac] bg-[#faf2dc] text-[#755b25] dark:border-[#66552f] dark:bg-[#332c21] dark:text-[#e3c984]'}`}>
      <CircleAlert size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function OnThisDayAndHeatmap({ entries, loading = false }: { entries: DiaryEntry[]; loading?: boolean }) {
  const items = safeEntries(entries);
  const today = useMemo(() => new Date(), []);
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const memories = useMemo(
    () =>
      items
        .map((entry) => ({ entry, date: entryDate(entry.entryDate) }))
        .filter(({ date }) => date && date.getMonth() === todayMonth && date.getDate() === todayDay && date.getFullYear() < today.getFullYear())
        .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)),
    [items, today, todayDay, todayMonth],
  );
  const activity = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((entry) => {
      const date = entryDate(entry.entryDate);
      if (!date) return;
      const key = localDateKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const start = shiftDate(today, -364);
    start.setDate(start.getDate() - start.getDay());
    const cells = Array.from({ length: 53 * 7 }, (_, index) => {
      const date = shiftDate(start, index);
      const count = counts.get(localDateKey(date)) ?? 0;
      return { date, count, future: date > today };
    });
    return { counts, cells };
  }, [items, today]);
  const maxActivity = Math.max(1, ...Array.from(activity.counts.values()));

  return (
    <section className="rounded-[26px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="module-on-this-day">
      <ModuleHeading
        eyebrow="Qaytib keladigan satrlar"
        title="Bugun, o‘tgan yillarda"
        description="Yozuvlaringiz orasidan bugungi sanaga mos keladigan eski fikrlar."
      />
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Xotiralar yuklanmoqda">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      ) : memories.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {memories.slice(0, 4).map(({ entry, date }) => (
            <article key={entry.id} className="rounded-2xl border border-[#e7dcc0] bg-[#faf4e4] p-4 dark:border-[#5e5137] dark:bg-[#332c21]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#92723b]">
                  {date ? formatUzbekDate(date, { year: 'numeric' }, 'Yil noma’lum') : 'Sana noma’lum'}
                </p>
                <CalendarDays size={14} className="text-[#b48b3d]" />
              </div>
              <h3 className="mt-2 line-clamp-1 font-serif text-[21px] leading-tight text-foreground">{entry.title || 'Nomsiz yozuv'}</h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{entry.content.replace(/\s+/g, ' ').trim() || 'Bu yozuvda hozircha matn yo‘q.'}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d5c8a9] bg-[#faf6ea] px-5 py-8 text-center dark:border-[#5d5037] dark:bg-[#2d281f]">
          <p className="font-serif text-[22px]">Bugun uchun eski sahifa yo‘q.</p>
          <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-muted-foreground">Balki kelasi yil shu kunda qaytib keladigan bir satr yozarsiz.</p>
        </div>
      )}

      <div className="mt-8 border-t border-border/70 pt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-muted-foreground">Yillik iz</p>
            <p className="mt-1 font-serif text-[22px]">Yozuvlar ritmi</p>
          </div>
          <p className="text-right text-[11px] text-muted-foreground">{items.length} ta yozuv</p>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[640px]">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5" style={{ gridTemplateColumns: 'repeat(53, minmax(10px, 1fr))' }}>
              {activity.cells.map(({ date, count, future }) => {
                const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxActivity) * 4));
                const colors = ['bg-[#eee8d5] dark:bg-[#413a2b]', 'bg-[#d9e8d9] dark:bg-[#3f5b4b]', 'bg-[#afd0b9] dark:bg-[#52745c]', 'bg-[#78a98c] dark:bg-[#679778]', 'bg-[#47796c] dark:bg-[#83b494]'];
                return (
                  <span
                    key={localDateKey(date)}
                    className={`aspect-square rounded-[3px] ${future ? 'bg-transparent' : colors[intensity]}`}
                    title={future ? '' : `${formatUzbekDate(date, { day: 'numeric', month: 'long', year: 'numeric' })}: ${count} ta yozuv`}
                    aria-label={future ? undefined : `${formatUzbekDate(date, { day: 'numeric', month: 'long', year: 'numeric' })}: ${count} ta yozuv`}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <span>Kamroq</span>
          <span className="size-2.5 rounded-[3px] bg-[#eee8d5] dark:bg-[#413a2b]" />
          <span className="size-2.5 rounded-[3px] bg-[#afd0b9] dark:bg-[#52745c]" />
          <span className="size-2.5 rounded-[3px] bg-[#47796c] dark:bg-[#83b494]" />
          <span>Ko‘proq</span>
        </div>
      </div>
    </section>
  );
}

type Habit = {
  id: string;
  name: string;
  category: string;
  completedDates: string[];
  createdAt: string;
};

function readHabits(storageKey: string): Habit[] {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Saqlangan odatlar shakli yaroqsiz.');
  return parsed.filter((habit): habit is Habit => {
    if (!habit || typeof habit !== 'object') return false;
    const candidate = habit as Partial<Habit>;
    return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.category === 'string' && Array.isArray(candidate.completedDates);
  });
}

function completionPercent(habit: Habit, today: Date) {
  const completed = new Set(habit.completedDates);
  let days = 0;
  for (let index = 0; index < 30; index += 1) if (completed.has(localDateKey(shiftDate(today, -index)))) days += 1;
  return Math.round((days / 30) * 100);
}

function habitStreak(habit: Habit, today: Date) {
  const completed = new Set(habit.completedDates);
  let offset = completed.has(localDateKey(today)) ? 0 : 1;
  if (!completed.has(localDateKey(shiftDate(today, -offset)))) return 0;
  let streak = 0;
  while (completed.has(localDateKey(shiftDate(today, -(offset + streak))))) streak += 1;
  return streak;
}

export function HabitTracker({ storageKey }: { storageKey: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(localDateKey(new Date()));
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const today = useMemo(() => new Date(), []);
  const recentDates = useMemo(() => Array.from({ length: 14 }, (_, index) => shiftDate(today, -13 + index)), [today]);

  useEffect(() => {
    setStatus('loading');
    setError('');
    try {
      if (!storageKey.trim()) throw new Error('Odatlar uchun saqlash kaliti berilmagan.');
      setHabits(readHabits(storageKey));
      setStatus('ready');
    } catch {
      setHabits([]);
      setError('Odatlarni o‘qib bo‘lmadi. Brauzer xotirasi cheklangan yoki ma’lumot buzilgan.');
      setStatus('error');
    }
  }, [storageKey]);

  useEffect(() => {
    if (status !== 'ready' || !storageKey.trim()) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(habits));
    } catch {
      setError('O‘zgarishlarni saqlab bo‘lmadi. Brauzer xotirasi to‘lib qolgan bo‘lishi mumkin.');
      setStatus('error');
    }
  }, [habits, status, storageKey]);

  const addHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Odat nomini kiriting.');
      return;
    }
    setHabits((current) => [...current, { id: crypto.randomUUID(), name: cleanName, category: category.trim() || 'Kundalik', completedDates: [], createdAt: new Date().toISOString() }]);
    setName('');
    setCategory('');
    setError('');
  };

  const toggleDate = (habitId: string, date: string) => {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== habitId) return habit;
        const dates = new Set(habit.completedDates);
        if (dates.has(date)) dates.delete(date);
        else dates.add(date);
        return { ...habit, completedDates: Array.from(dates).sort() };
      }),
    );
  };

  const removeHabit = (habit: Habit) => {
    if (!window.confirm(`“${habit.name}” odatini o‘chirishni xohlaysizmi?`)) return;
    setHabits((current) => current.filter((item) => item.id !== habit.id));
  };

  return (
    <section className="rounded-[26px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="module-habit-tracker">
      <ModuleHeading eyebrow="Mayin odatlar" title="Har kuni bir qadam" description="Kichik takrorlar vaqt o‘tishi bilan o‘zingizga qaytish yo‘liga aylanadi." />
      {status === 'loading' ? (
        <div className="space-y-3" aria-label="Odatlar yuklanmoqda">
          <div className="skeleton h-12 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      ) : status === 'error' ? (
        <div className="space-y-3">
          <InlineMessage>{error}</InlineMessage>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-[12px] font-medium hover:bg-muted">
            <RotateCcw size={14} /> Qayta urinib ko‘rish
          </button>
        </div>
      ) : (
        <>
          {error && <div className="mb-4"><InlineMessage>{error}</InlineMessage></div>}
          <form onSubmit={addHabit} className="grid gap-2 rounded-2xl border border-[#e5dac1] bg-[#faf6eb] p-3 dark:border-[#514832] dark:bg-[#2d281f] sm:grid-cols-[1.3fr_1fr_auto]">
            <label className="sr-only" htmlFor="habit-name">Odat nomi</label>
            <input id="habit-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan, tonggi sahifa" className="h-10 rounded-xl border border-border bg-card px-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" />
            <label className="sr-only" htmlFor="habit-category">Toifa</label>
            <input id="habit-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Toifa, masalan: Sog‘liq" className="h-10 rounded-xl border border-border bg-card px-3 text-[12px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" />
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
              <Plus size={15} /> Odat qo‘shish
            </button>
          </form>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Belgilash sanasi</p>
              <p className="mt-1 font-serif text-[20px]">{formatUzbekDate(selectedDate, { day: 'numeric', month: 'long' })}</p>
            </div>
            <input aria-label="Belgilash sanasini tanlang" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-9 rounded-xl border border-border bg-background px-2 text-[11px] text-foreground outline-none focus:border-[#b89c5c]" />
          </div>
          {habits.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#d5c8a9] bg-[#faf6ea] px-5 py-10 text-center dark:border-[#5d5037] dark:bg-[#2d281f]">
              <CirclePlus size={22} className="mx-auto text-[#b48b3d]" />
              <p className="mt-3 font-serif text-[22px]">Hali odat yo‘q.</p>
              <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-muted-foreground">Yuqoridagi maydondan sizga mehr bilan xizmat qiladigan bir odat boshlang.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {habits.map((habit) => {
                const percent = completionPercent(habit, today);
                const streak = habitStreak(habit, today);
                const completed = habit.completedDates.includes(selectedDate);
                return (
                  <article key={habit.id} className="rounded-2xl border border-card-border bg-background/45 p-4 transition-colors hover:border-[#cdbd91]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-serif text-[21px] leading-tight">{habit.name}</p>
                        <span className="mt-1 inline-block rounded-full bg-[#eee8d5] px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-[#756d5e] dark:bg-[#413a2b] dark:text-[#d4c49b]">{habit.category}</span>
                      </div>
                      <button type="button" onClick={() => removeHabit(habit)} className="rounded-lg p-2 text-muted-foreground/60 transition-colors hover:bg-[#fff0ec] hover:text-destructive" aria-label={`${habit.name} odatini o‘chirish`}><Trash2 size={15} /></button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
                      <span><strong className="font-mono text-foreground">{percent}%</strong> 30 kunlik natija</span>
                      <span><strong className="font-mono text-foreground">{streak}</strong> kunlik iz</span>
                      <button type="button" onClick={() => toggleDate(habit.id, selectedDate)} className={`ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors ${completed ? 'bg-[#dcebe4] text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]' : 'border border-border text-muted-foreground hover:bg-muted'}`}>
                        <Check size={14} /> {completed ? 'Bajarildi' : 'Bugun belgilash'}
                      </button>
                    </div>
                    <div className="mt-4 overflow-x-auto pb-1">
                      <div className="flex min-w-[400px] gap-1.5">
                        {recentDates.map((date) => {
                          const key = localDateKey(date);
                          const isComplete = habit.completedDates.includes(key);
                          const isSelected = key === selectedDate;
                          return (
                            <button key={key} type="button" onClick={() => toggleDate(habit.id, key)} className={`flex min-w-[25px] flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[9px] transition-colors ${isSelected ? 'ring-1 ring-[#b48b3d] ring-offset-1 ring-offset-background' : ''} ${isComplete ? 'bg-[#78a98c] text-[#183e30]' : 'bg-muted text-muted-foreground hover:bg-[#e5dcc4]'}`} aria-label={`${formatUzbekDate(date, { day: 'numeric', month: 'long' })}, ${isComplete ? 'bajarilgan' : 'bajarilmagan'}`}>
                              <span>{formatUzbekDate(date, { weekday: 'narrow' })}</span>
                              <span className="font-mono text-[10px]">{date.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

type EncryptedNote = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  iv: string;
  ciphertext: string;
};

type VaultStore = {
  salt: string;
  verifier: { iv: string; ciphertext: string };
  notes: EncryptedNote[];
};

type EncryptedValue = { iv: string; ciphertext: string };

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveVaultKey(code: string, salt: BufferSource) {
  const material = await window.crypto.subtle.importKey('raw', textEncoder.encode(code), 'PBKDF2', false, ['deriveKey']);
  return window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function encryptVaultText(key: CryptoKey, value: string): Promise<EncryptedValue> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(value));
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

async function decryptVaultText(key: CryptoKey, value: EncryptedValue) {
  const plaintext = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(value.iv) }, key, base64ToBytes(value.ciphertext));
  return textDecoder.decode(plaintext);
}

function readVault(storageKey: string): VaultStore | null {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') throw new Error('Maxfiy sandiq ma’lumoti yaroqsiz.');
  const candidate = parsed as Partial<VaultStore>;
  if (typeof candidate.salt !== 'string' || !candidate.verifier || typeof candidate.verifier.iv !== 'string' || typeof candidate.verifier.ciphertext !== 'string' || !Array.isArray(candidate.notes)) throw new Error('Maxfiy sandiq ma’lumoti yaroqsiz.');
  const notes = candidate.notes.filter((note): note is EncryptedNote => {
    if (!note || typeof note !== 'object') return false;
    const item = note as Partial<EncryptedNote>;
    return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string' && typeof item.iv === 'string' && typeof item.ciphertext === 'string';
  });
  return { salt: candidate.salt, verifier: candidate.verifier, notes };
}

export function PrivateVault({ storageKey }: { storageKey: string }) {
  const [vault, setVault] = useState<VaultStore | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteBusy, setNoteBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setKey(null);
    setVault(null);
    try {
      if (!storageKey.trim()) throw new Error('Maxfiy sandiq uchun saqlash kaliti berilmagan.');
      if (!window.crypto?.subtle) throw new Error('Bu brauzer xavfsiz shifrlashni qo‘llab-quvvatlamaydi.');
      setVault(readVault(storageKey));
    } catch {
      setError('Maxfiy sandiqni yuklab bo‘lmadi. Brauzer xotirasi yoki xavfsiz shifrlash imkonini tekshiring.');
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  const persistVault = (next: VaultStore) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setVault(next);
      setError('');
      return true;
    } catch {
      setError('Maxfiy sandiqni saqlab bo‘lmadi. Brauzer xotirasi to‘lib qolgan bo‘lishi mumkin.');
      return false;
    }
  };

  const setupVault = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length < 6) {
      setError('Xavfsizlik kodi kamida 6 belgidan iborat bo‘lsin.');
      return;
    }
    if (code !== confirmCode) {
      setError('Ikki kod bir-biriga mos kelmadi.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const vaultKey = await deriveVaultKey(code, salt);
      const verifier = await encryptVaultText(vaultKey, 'shaxsiy-kundalik-sandiq-tekshiruvi');
      const next: VaultStore = { salt: bytesToBase64(salt), verifier, notes: [] };
      if (persistVault(next)) {
        setKey(vaultKey);
        setCode('');
        setConfirmCode('');
      }
    } catch {
      setError('Maxfiy sandiqni yaratib bo‘lmadi. Qayta urinib ko‘ring.');
    } finally {
      setBusy(false);
    }
  };

  const unlockVault = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vault) return;
    setBusy(true);
    setError('');
    try {
      const vaultKey = await deriveVaultKey(code, base64ToBytes(vault.salt));
      const verifier = await decryptVaultText(vaultKey, vault.verifier);
      if (verifier !== 'shaxsiy-kundalik-sandiq-tekshiruvi') throw new Error('Kod noto‘g‘ri.');
      setKey(vaultKey);
      setCode('');
    } catch {
      setError('Xavfsizlik kodi noto‘g‘ri yoki sandiq ma’lumoti buzilgan.');
    } finally {
      setBusy(false);
    }
  };

  const lockVault = () => {
    setKey(null);
    setEditingId(null);
    setNoteTitle('');
    setNoteContent('');
    setError('');
  };

  const editNote = async (note: EncryptedNote) => {
    if (!key) return;
    setNoteBusy(true);
    setError('');
    try {
      const content = await decryptVaultText(key, note);
      setEditingId(note.id);
      setNoteTitle(note.title);
      setNoteContent(content);
    } catch {
      setError('Bu yozuvni ochib bo‘lmadi.');
    } finally {
      setNoteBusy(false);
    }
  };

  const saveNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!key || !vault) return;
    const title = noteTitle.trim();
    const content = noteContent.trim();
    if (!title || !content) {
      setError('Maxfiy yozuv uchun sarlavha va matn kiriting.');
      return;
    }
    setNoteBusy(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const encrypted = await encryptVaultText(key, content);
      const existing = editingId ? vault.notes.find((note) => note.id === editingId) : undefined;
      const note: EncryptedNote = { id: existing?.id ?? window.crypto.randomUUID(), title, createdAt: existing?.createdAt ?? now, updatedAt: now, ...encrypted };
      const notes = existing ? vault.notes.map((item) => item.id === note.id ? note : item) : [note, ...vault.notes];
      if (persistVault({ ...vault, notes })) {
        setEditingId(null);
        setNoteTitle('');
        setNoteContent('');
      }
    } catch {
      setError('Maxfiy yozuvni shifrlab saqlab bo‘lmadi.');
    } finally {
      setNoteBusy(false);
    }
  };

  const deleteNote = (note: EncryptedNote) => {
    if (!vault || !window.confirm(`“${note.title}” maxfiy yozuvini o‘chirishni xohlaysizmi?`)) return;
    persistVault({ ...vault, notes: vault.notes.filter((item) => item.id !== note.id) });
    if (editingId === note.id) {
      setEditingId(null);
      setNoteTitle('');
      setNoteContent('');
    }
  };

  return (
    <section className="rounded-[26px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="module-private-vault">
      <ModuleHeading eyebrow="Faqat siz uchun" title="Yopiq sahifa" description="Bu joydagi matnlar qurilmangizda shifrlanadi va faqat siz biladigan kod bilan ochiladi." />
      {loading ? (
        <div className="space-y-3" aria-label="Maxfiy sandiq yuklanmoqda">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-28 rounded-2xl" />
        </div>
      ) : error && !vault && !key ? (
        <div className="space-y-3">
          <InlineMessage>{error}</InlineMessage>
          <p className="text-[11px] leading-relaxed text-muted-foreground">Sahifani yangilab, yana urinib ko‘ring.</p>
        </div>
      ) : !vault ? (
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-[#e1d4ac] bg-[#faf2dc] p-5 dark:border-[#66552f] dark:bg-[#332c21]">
            <ShieldCheck size={22} className="text-[#9a742f]" />
            <h3 className="mt-4 font-serif text-[24px]">Avval kod yarating</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-[#75613a] dark:text-[#d6c18c]">Bu alohida kod kundalik hisobingizdan mustaqil ishlaydi.</p>
          </div>
          <form onSubmit={setupVault} className="space-y-3">
            {error && <InlineMessage>{error}</InlineMessage>}
            <label className="block text-[11px] font-medium text-muted-foreground" htmlFor="vault-new-code">Xavfsizlik kodi</label>
            <input id="vault-new-code" type="password" autoComplete="new-password" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Kamida 6 belgi" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" />
            <label className="block text-[11px] font-medium text-muted-foreground" htmlFor="vault-confirm-code">Kodni takrorlang</label>
            <input id="vault-confirm-code" type="password" autoComplete="new-password" value={confirmCode} onChange={(event) => setConfirmCode(event.target.value)} placeholder="Kodni yana kiriting" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" />
            <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
              <Lock size={15} /> {busy ? 'Yaratilmoqda…' : 'Sandiq yaratish'}
            </button>
            <p className="text-[10px] leading-relaxed text-muted-foreground">Diqqat: xavfsizlik kodi tiklanmaydi. Uni unutsangiz, maxfiy yozuvlarga kira olmaysiz.</p>
          </form>
        </div>
      ) : !key ? (
        <div className="mx-auto max-w-md">
          <div className="mb-5 rounded-2xl border border-[#e1d4ac] bg-[#faf2dc] p-5 text-center dark:border-[#66552f] dark:bg-[#332c21]">
            <Lock size={23} className="mx-auto text-[#9a742f]" />
            <h3 className="mt-3 font-serif text-[24px]">Sandiq qulflangan</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[#75613a] dark:text-[#d6c18c]">Yozuvlarni ko‘rish uchun xavfsizlik kodingizni kiriting.</p>
          </div>
          <form onSubmit={unlockVault} className="space-y-3">
            {error && <InlineMessage>{error}</InlineMessage>}
            <label className="block text-[11px] font-medium text-muted-foreground" htmlFor="vault-unlock-code">Xavfsizlik kodi</label>
            <input id="vault-unlock-code" type="password" autoComplete="current-password" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Kodingizni kiriting" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" />
            <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-60">
              <LockKeyholeOpen size={15} /> {busy ? 'Tekshirilmoqda…' : 'Ochish'}
            </button>
          </form>
          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">Kod tiklanmaydi. Uni xavfsiz joyda saqlang.</p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#c3ddcf] bg-[#edf6f0] p-4 text-[#35614f] dark:border-[#365b49] dark:bg-[#243a2f] dark:text-[#b5d9c4] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5"><ShieldCheck size={17} className="mt-0.5 shrink-0" /><p className="text-[12px] leading-relaxed">Sandiq ochiq. Matnlar shu qurilmada shifrlangan holda saqlanadi.</p></div>
            <button type="button" onClick={lockVault} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#a9ccb9] px-3 py-2 text-[11px] font-semibold hover:bg-[#dcebe4] dark:border-[#527b64] dark:hover:bg-[#2e4a3b]"><Lock size={14} /> Qulflash</button>
          </div>
          {error && <div className="mb-4"><InlineMessage>{error}</InlineMessage></div>}
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveNote} className="rounded-2xl border border-[#e5dac1] bg-[#faf6eb] p-4 dark:border-[#514832] dark:bg-[#2d281f]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{editingId ? 'Tahrirlash' : 'Yangi sahifa'}</p><h3 className="mt-1 font-serif text-[23px]">{editingId ? 'Maxfiy yozuvni tahrirlash' : 'Ichingizdagini yozing'}</h3></div>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setNoteTitle(''); setNoteContent(''); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Tahrirlashni bekor qilish"><X size={16} /></button>}
              </div>
              <label className="sr-only" htmlFor="private-note-title">Sarlavha</label>
              <input id="private-note-title" value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Sarlavha" className="mb-2 h-11 w-full rounded-xl border border-border bg-card px-3 font-serif text-[18px] outline-none focus:border-[#b89c5c]" />
              <label className="sr-only" htmlFor="private-note-content">Matn</label>
              <textarea id="private-note-content" value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="Bu sahifa faqat sizniki…" rows={7} className="w-full resize-y rounded-xl border border-border bg-card px-3 py-3 text-[13px] leading-relaxed outline-none focus:border-[#b89c5c]" />
              <button type="submit" disabled={noteBusy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-60">
                {editingId ? <Pencil size={14} /> : <Plus size={15} />} {noteBusy ? 'Shifrlanmoqda…' : editingId ? 'O‘zgarishni saqlash' : 'Maxfiy yozuvni saqlash'}
              </button>
            </form>
            <div>
              <div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Saqlangan sahifalar</p><p className="mt-1 font-serif text-[22px]">{vault.notes.length} ta yozuv</p></div><LockKeyholeOpen size={18} className="text-[#9a742f]" /></div>
              {vault.notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d5c8a9] bg-[#faf6ea] px-5 py-10 text-center dark:border-[#5d5037] dark:bg-[#2d281f]">
                  <p className="font-serif text-[22px]">Sandiq hozircha bo‘sh.</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Birinchi maxfiy sahifangizni chap tomondan boshlang.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vault.notes.map((note) => (
                    <article key={note.id} className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${editingId === note.id ? 'border-[#b89c5c] bg-[#faf2dc] dark:bg-[#332c21]' : 'border-card-border bg-background/45 hover:border-[#cdbd91]'}`}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eee8d5] text-[#8f6b2c] dark:bg-[#413a2b]"><Lock size={15} /></span>
                      <button type="button" onClick={() => editNote(note)} className="min-w-0 flex-1 text-left" disabled={noteBusy}>
                        <span className="block truncate font-serif text-[18px]">{note.title}</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">Yangilangan: {formatUzbekDate(note.updatedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </button>
                      <button type="button" onClick={() => deleteNote(note)} className="rounded-lg p-2 text-muted-foreground/60 hover:bg-[#fff0ec] hover:text-destructive" aria-label={`${note.title} yozuvini o‘chirish`}><Trash2 size={15} /></button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="mt-5 border-t border-border/70 pt-4 text-[10px] leading-relaxed text-muted-foreground">Muhim: bu kodni kundalik hisobingiz tiklay olmaydi. Kodni unutish maxfiy yozuvlarga kirishni butunlay yo‘qotadi.</p>
        </>
      )}
    </section>
  );
}