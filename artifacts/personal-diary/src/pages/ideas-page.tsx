import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListDiaryEntriesQueryKey, getListTasksQueryKey, Mood, useCreateDiaryEntry, useCreateTask, type TaskInput } from '@workspace/api-client-react';
import { BookOpen, CheckSquare, Lightbulb, Pencil, Plus, Search, Tag, Target, Trash2, X } from 'lucide-react';
import { formatContentDeleteConfirmation, getCurrentIntlLocale, useI18n, type AppLanguage } from '@/lib/i18n';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { ModulePageFrame, UserStoragePage } from '@/pages/local-module-pages';
import { useLocalModuleStorage } from '@/lib/local-module-storage';
import {
  EMPTY_GOALS,
  EMPTY_IDEAS,
  isPersonalGoalList,
  isQuickIdeaList,
  userStorageKey,
  type PersonalGoal,
  type QuickIdea,
} from '@/lib/local-life-data';

type IdeaFormValues = { text: string; tags: string };
const emptyForm: IdeaFormValues = { text: '', tags: '' };
type IdeaDestination = 'task' | 'goal' | 'journal';

const conversionCopy: Record<AppLanguage, {
  section: string;
  task: string;
  goal: string;
  journal: string;
  pending: string;
  failed: string;
  success: Record<IdeaDestination, string>;
  taskTooLong: string;
  goalsUnavailable: string;
}> = {
  uz: {
    section: 'Rasmiy bo‘limga o‘tkazish',
    task: 'Topshiriq',
    goal: 'Maqsad',
    journal: 'Kundalik',
    pending: 'Saqlanmoqda…',
    failed: 'Fikrni o‘tkazib bo‘lmadi. U g‘oyalar qutingizda saqlanib qoldi.',
    success: { task: 'Topshiriq yaratildi.', goal: 'Maqsad yaratildi.', journal: 'Kundalik yozuvi yaratildi.' },
    taskTooLong: 'Bu fikr 1 000 belgidan uzun. To‘liq matnni saqlash uchun uni maqsad yoki kundalikka o‘tkazing.',
    goalsUnavailable: 'Maqsadlar brauzerda yuklanmadi. Ularni tekshirib, qayta urinib ko‘ring.',
  },
  en: {
    section: 'Move into a formal space',
    task: 'Task',
    goal: 'Goal',
    journal: 'Journal',
    pending: 'Saving…',
    failed: 'Could not convert this idea. It remains in your Inbox.',
    success: { task: 'Task created.', goal: 'Goal created.', journal: 'Journal entry created.' },
    taskTooLong: 'This idea is over 1,000 characters. Convert it to a goal or journal entry to keep the full text.',
    goalsUnavailable: 'Goals are not available in browser storage. Check them and try again.',
  },
  ru: {
    section: 'Перенести в основной раздел',
    task: 'Задача',
    goal: 'Цель',
    journal: 'Дневник',
    pending: 'Сохранение…',
    failed: 'Не удалось преобразовать заметку. Она осталась во входящих.',
    success: { task: 'Задача создана.', goal: 'Цель создана.', journal: 'Запись в дневнике создана.' },
    taskTooLong: 'В заметке больше 1 000 символов. Перенесите её в цель или дневник, чтобы сохранить весь текст.',
    goalsUnavailable: 'Цели недоступны в хранилище браузера. Проверьте данные и повторите попытку.',
  },
  ko: {
    section: '정식 항목으로 전환',
    task: '작업',
    goal: '목표',
    journal: '일기',
    pending: '저장 중…',
    failed: '아이디어를 전환하지 못했습니다. 받은 편지함에 그대로 남아 있습니다.',
    success: { task: '작업을 만들었습니다.', goal: '목표를 만들었습니다.', journal: '일기 항목을 만들었습니다.' },
    taskTooLong: '내용이 1,000자를 넘습니다. 전체 내용을 보존하려면 목표나 일기로 전환하세요.',
    goalsUnavailable: '브라우저 저장 공간에서 목표를 사용할 수 없습니다. 확인 후 다시 시도하세요.',
  },
};

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ideaTitle(text: string) {
  return text.split(/\r?\n/).map((line) => line.trim()).find(Boolean)?.slice(0, 160) ?? text.slice(0, 160);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return localDateKey(next);
}

function parseTags(value: string) {
  const seen = new Set<string>();
  return value.split(/[,\n]/).map((tag) => tag.trim().replace(/^#+/, '').slice(0, 28)).filter((tag) => {
    const key = tag.toLocaleLowerCase(getCurrentIntlLocale());
    if (!tag || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function IdeasCanvas({ storageKey, userId }: { storageKey: string; userId: string }) {
  const store = useLocalModuleStorage(storageKey, EMPTY_IDEAS, isQuickIdeaList, 'G‘oyalar');
  const goalsStore = useLocalModuleStorage(userStorageKey('goals', userId), EMPTY_GOALS, isPersonalGoalList, 'Maqsadlar');
  const { language } = useI18n();
  const copy = conversionCopy[language];
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const createDiaryEntry = useCreateDiaryEntry();
  const form = useForm<IdeaFormValues>({ defaultValues: emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [formError, setFormError] = useState('');
  const [conversionError, setConversionError] = useState('');
  const [conversionNotice, setConversionNotice] = useState('');
  const [converting, setConverting] = useState<{ ideaId: string; destination: IdeaDestination } | null>(null);
  const visibleIdeas = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(getCurrentIntlLocale());
    return [...store.value]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((idea) => (!activeTag || idea.tags.includes(activeTag))
        && (!query || `${idea.text} ${idea.tags.join(' ')}`.toLocaleLowerCase(getCurrentIntlLocale()).includes(query)));
  }, [activeTag, search, store.value]);
  const tags = useMemo(() => [...new Set(store.value.flatMap((idea) => idea.tags))].sort((a, b) => a.localeCompare(b, 'uz')), [store.value]);

  const submit = form.handleSubmit((values) => {
    const text = values.text.trim();
    if (!text) {
      setFormError('Fikr matnini kiriting.');
      return;
    }
    const now = new Date().toISOString();
    const idea: QuickIdea = {
      id: editingId ?? crypto.randomUUID(),
      text,
      tags: parseTags(values.tags),
      createdAt: store.value.find((item) => item.id === editingId)?.createdAt ?? now,
      updatedAt: now,
    };
    const next = editingId
      ? store.value.map((item) => item.id === editingId ? idea : item)
      : [idea, ...store.value];
    if (store.save(next)) {
      form.reset(emptyForm);
      setEditingId(null);
      setFormError('');
    }
  });

  const editIdea = (idea: QuickIdea) => {
    setEditingId(idea.id);
    setFormError('');
    form.reset({ text: idea.text, tags: idea.tags.join(', ') });
    document.getElementById('idea-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteIdea = (idea: QuickIdea) => {
    if (!window.confirm(formatContentDeleteConfirmation(idea.text, 'idea'))) return;
    store.save(store.value.filter((item) => item.id !== idea.id));
    if (editingId === idea.id) {
      setEditingId(null);
      form.reset(emptyForm);
    }
  };

  const convertIdea = async (idea: QuickIdea, destination: IdeaDestination) => {
    if (store.status !== 'ready' || converting) return;
    setConversionError('');
    setConversionNotice('');
    setConverting({ ideaId: idea.id, destination });
    const title = ideaTitle(idea.text);
    const now = new Date();
    const timestamp = now.toISOString();

    try {
      if (destination === 'task') {
        if (idea.text.length > 1000) {
          setConversionError(copy.taskTooLong);
          return;
        }
        const task: TaskInput = {
          title,
          description: idea.text,
          category: 'this_week',
          dueDate: null,
          priority: 'normal',
          subtasks: [],
        };
        await createTask.mutateAsync({ data: task });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      } else if (destination === 'goal') {
        if (goalsStore.status !== 'ready') {
          setConversionError(copy.goalsUnavailable);
          return;
        }
        const goal: PersonalGoal = {
          id: `idea-${idea.id}`,
          title,
          description: `${idea.text}${idea.tags.length ? `\n\n${idea.tags.map((tag) => `#${tag}`).join(' ')}` : ''}`,
          horizon: 'month',
          targetDate: addDays(now, 30),
          tasks: [],
          category: 'personal',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const existingGoal = goalsStore.value.some((item) => item.id === goal.id);
        if (!existingGoal && !goalsStore.save([goal, ...goalsStore.value])) {
          setConversionError(copy.goalsUnavailable);
          return;
        }
      } else {
        await createDiaryEntry.mutateAsync({
          data: {
            title,
            content: idea.text,
            mood: Mood.thoughtful,
            folder: 'G‘oyalar',
            tags: idea.tags.slice(0, 8),
            favorite: false,
            entryDate: localDateKey(now),
          },
        });
        queryClient.invalidateQueries({ queryKey: getListDiaryEntriesQueryKey() });
      }

      if (!store.save(store.value.filter((item) => item.id !== idea.id))) {
        setConversionError(copy.failed);
        return;
      }
      setConversionNotice(copy.success[destination]);
    } catch {
      setConversionError(copy.failed);
    } finally {
      setConverting(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,.82fr)_minmax(0,1.18fr)]">
      <section id="idea-composer" className="h-fit rounded-[24px] border border-[#d8c795] bg-[#faf3df] p-5 shadow-sm dark:border-[#5e5037] dark:bg-[#302a20] sm:p-6" data-testid="idea-composer">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1e2b9] text-[#8f601a] dark:bg-[#463b29] dark:text-[#e3c984]"><Lightbulb size={18} /></span>
          <div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#9a6b23]">Tez yozib qo‘ying</p><h2 className="mt-1 font-serif text-[25px] leading-tight">{editingId ? 'Fikrni tahrirlash' : 'Yangi fikr'}</h2></div>
        </div>
        <Form {...form}>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="idea-text" className="text-[11px] font-medium">Fikr yoki qayd</label>
              <textarea id="idea-text" {...form.register('text')} rows={6} maxLength={3000} placeholder="Xayolingizdan o‘tgan narsani shu yerga qoldiring..." className="mt-2 w-full resize-y rounded-xl border border-border bg-card/80 px-3.5 py-3 text-[12px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-[#b89c5c]" data-testid="input-idea-text" />
            </div>
            <div>
              <label htmlFor="idea-tags" className="text-[11px] font-medium">Teglar</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3"><Tag size={14} className="shrink-0 text-muted-foreground" /><input id="idea-tags" {...form.register('tags')} maxLength={240} placeholder="ish, sayohat, loyiha" className="min-w-0 flex-1 bg-transparent py-3 text-[11px] outline-none placeholder:text-muted-foreground/55" data-testid="input-idea-tags" /></div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">Vergul bilan ajrating. Eng ko‘pi bilan 8 ta teg.</p>
            </div>
            {(formError || store.error) && <p className="text-[11px] text-destructive" role="alert" data-testid="status-idea-error">{formError || store.error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={store.status !== 'ready'} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-semibold text-primary-foreground transition-opacity disabled:opacity-50" data-testid="button-save-idea"><Plus size={14} />{editingId ? 'O‘zgarishni saqlash' : 'Fikrni saqlash'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setFormError(''); form.reset(emptyForm); }} className="grid size-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground" aria-label="Tahrirni bekor qilish" data-testid="button-cancel-idea-edit"><X size={16} /></button>}
            </div>
          </form>
        </Form>
        <p className="mt-4 border-t border-[#e2d4ad] pt-3 text-[10px] leading-relaxed text-muted-foreground dark:border-[#5a4d38]">Fikrlaringiz faqat shu hisob va brauzerda saqlanadi.</p>
      </section>

      <section className="min-w-0" aria-label="Saqlangan g‘oyalar">
        <div className="rounded-[24px] border border-card-border bg-card p-4 shadow-sm sm:p-5">
          <label htmlFor="idea-search" className="sr-only">G‘oyalardan qidirish</label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5"><Search size={15} className="text-muted-foreground" /><input id="idea-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Fikr yoki teg bo‘yicha qidiring..." className="min-w-0 flex-1 bg-transparent py-3 text-[11px] outline-none placeholder:text-muted-foreground/55" data-testid="input-idea-search" /><span className="font-mono text-[9px] text-muted-foreground">{store.value.length}</span></div>
          {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5"><button type="button" onClick={() => setActiveTag('')} className={`rounded-full px-2.5 py-1.5 text-[10px] ${activeTag ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`} data-testid="button-idea-tag-all">Barchasi</button>{tags.map((tag) => <button key={tag} type="button" onClick={() => setActiveTag(activeTag === tag ? '' : tag)} className={`rounded-full px-2.5 py-1.5 text-[10px] ${activeTag === tag ? 'bg-[#dcebe4] text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`button-idea-tag-${tag}`}>#{tag}</button>)}</div>}
        </div>
        {conversionError && <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[11px] text-destructive" role="alert" data-testid="status-idea-conversion-error">{conversionError}</p>}
        {conversionNotice && <p className="mt-3 rounded-xl border border-[#c3ddcf] bg-[#edf6f0] px-4 py-3 text-[11px] text-[#35614f]" role="status" data-testid="status-idea-conversion-success">{conversionNotice}</p>}
        {store.status === 'loading' ? <div className="mt-4 h-48 rounded-[22px] skeleton" aria-label="G‘oyalar yuklanmoqda" /> : store.status === 'error' ? <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-[12px]" role="alert">{store.error}</div> : visibleIdeas.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibleIdeas.map((idea) => (
              <article key={idea.id} className="group rounded-[22px] border border-card-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#c9b88a]" data-testid={`card-idea-${idea.id}`}>
                <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{idea.text}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">{idea.tags.map((tag) => <button key={tag} type="button" onClick={() => setActiveTag(tag)} className="rounded-full bg-[#eee8d5] px-2.5 py-1 text-[9px] text-[#756d5e] dark:bg-[#413a2b] dark:text-[#d2c6a9]" data-testid={`tag-idea-${idea.id}-${tag}`}>#{tag}</button>)}</div>
                <div className="mt-4 border-t border-border/70 pt-3">
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{copy.section}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void convertIdea(idea, 'task')} disabled={Boolean(converting) || store.status !== 'ready'} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-[10px] font-semibold transition-colors hover:bg-muted disabled:opacity-50" aria-label={`${copy.task}: ${ideaTitle(idea.text)}`} data-testid={`button-convert-idea-task-${idea.id}`}><CheckSquare size={13} />{converting?.ideaId === idea.id && converting.destination === 'task' ? copy.pending : copy.task}</button>
                    <button type="button" onClick={() => void convertIdea(idea, 'goal')} disabled={Boolean(converting) || store.status !== 'ready' || goalsStore.status !== 'ready'} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-[10px] font-semibold transition-colors hover:bg-muted disabled:opacity-50" aria-label={`${copy.goal}: ${ideaTitle(idea.text)}`} data-testid={`button-convert-idea-goal-${idea.id}`}><Target size={13} />{converting?.ideaId === idea.id && converting.destination === 'goal' ? copy.pending : copy.goal}</button>
                    <button type="button" onClick={() => void convertIdea(idea, 'journal')} disabled={Boolean(converting) || store.status !== 'ready'} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-[10px] font-semibold transition-colors hover:bg-muted disabled:opacity-50" aria-label={`${copy.journal}: ${ideaTitle(idea.text)}`} data-testid={`button-convert-idea-journal-${idea.id}`}><BookOpen size={13} />{converting?.ideaId === idea.id && converting.destination === 'journal' ? copy.pending : copy.journal}</button>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-3">
                  <span className="font-mono text-[9px] text-muted-foreground">{new Intl.DateTimeFormat(getCurrentIntlLocale(), { day: 'numeric', month: 'short' }).format(new Date(idea.updatedAt))}</span>
                  <div className="flex gap-1"><button type="button" onClick={() => editIdea(idea)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Fikrni tahrirlash" data-testid={`button-edit-idea-${idea.id}`}><Pencil size={14} /></button><button type="button" onClick={() => deleteIdea(idea)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Fikrni o‘chirish" data-testid={`button-delete-idea-${idea.id}`}><Trash2 size={14} /></button></div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-5 py-12 text-center dark:border-[#584c37] dark:bg-[#2b271f]">
            <Lightbulb size={22} className="mx-auto text-[#b48b3d]" /><h2 className="mt-3 font-serif text-[24px]">{store.value.length ? 'Mos fikr topilmadi.' : 'G‘oyalar uchun joy tayyor.'}</h2><p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">{store.value.length ? 'Qidiruv yoki teg tanlovini o‘zgartiring.' : 'Kichik fikr, reja yoki kutilmagan ilhomni yuqoridagi maydonga yozing.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export function IdeasPage() {
  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame eyebrow="Tez qaydlar" title="G‘oyalar qutisi" description="Kundalik yozuvni boshlash shart bo‘lmagan fikrlar, reja va ilhomlar uchun yengil joy." icon={<Lightbulb size={22} strokeWidth={1.7} />}>
          <IdeasCanvas key={userId} storageKey={userStorageKey('ideas', userId)} userId={userId} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}