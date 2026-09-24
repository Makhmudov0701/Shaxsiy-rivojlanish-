import { useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import { useForm } from 'react-hook-form';
import { CalendarRange, Check, Circle, Flag, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { ModulePageFrame, UserStoragePage } from '@/pages/local-module-pages';
import { useLocalModuleStorage } from '@/lib/local-module-storage';
import { EMPTY_GOALS, isPersonalGoalList, userStorageKey, type GoalHorizon, type GoalTask, type PersonalGoal } from '@/lib/local-life-data';

type GoalFormValues = {
  title: string;
  description: string;
  horizon: GoalHorizon;
  targetDate: string;
  firstSteps: string;
};

const emptyGoalForm: GoalFormValues = { title: '', description: '', horizon: 'month', targetDate: '', firstSteps: '' };
const horizonLabels: Record<GoalHorizon, string> = { month: 'Oylik', 'half-year': '6 oylik', year: 'Yillik' };
const goalHorizons: GoalHorizon[] = ['month', 'half-year', 'year'];
const periodFilters = ['all', 'month', 'half-year', 'year'] as const;
type PeriodFilter = (typeof periodFilters)[number];

function GoalsBoard({ storageKey }: { storageKey: string }) {
  const store = useLocalModuleStorage(storageKey, EMPTY_GOALS, isPersonalGoalList, 'Maqsadlar');
  const form = useForm<GoalFormValues>({ defaultValues: emptyGoalForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const visibleGoals = useMemo(() => [...store.value]
    .filter((goal) => period === 'all' || goal.horizon === period)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [period, store.value]);

  const submit = form.handleSubmit((values) => {
    const title = values.title.trim();
    if (!title) {
      setFormError('Maqsad nomini kiriting.');
      return;
    }
    const now = new Date().toISOString();
    const current = store.value.find((goal) => goal.id === editingId);
    const tasks: GoalTask[] = current?.tasks ?? values.firstSteps.split('\n').map((text) => text.trim()).filter(Boolean).slice(0, 16).map((text) => ({ id: crypto.randomUUID(), text, done: false }));
    const goal: PersonalGoal = {
      id: current?.id ?? crypto.randomUUID(),
      title,
      description: values.description.trim(),
      horizon: values.horizon,
      targetDate: values.targetDate,
      tasks,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    const next = current ? store.value.map((item) => item.id === current.id ? goal : item) : [goal, ...store.value];
    if (store.save(next)) {
      setEditingId(null);
      setFormError('');
      form.reset(emptyGoalForm);
    }
  });

  const editGoal = (goal: PersonalGoal) => {
    setEditingId(goal.id);
    setFormError('');
    form.reset({ title: goal.title, description: goal.description, horizon: goal.horizon, targetDate: goal.targetDate, firstSteps: '' });
    document.getElementById('goal-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteGoal = (goal: PersonalGoal) => {
    if (!window.confirm(`“${goal.title}” maqsadini o‘chirishni xohlaysizmi?`)) return;
    store.save(store.value.filter((item) => item.id !== goal.id));
    if (editingId === goal.id) {
      setEditingId(null);
      form.reset(emptyGoalForm);
    }
  };

  const addTask = (goal: PersonalGoal) => {
    const text = (taskDrafts[goal.id] ?? '').trim();
    if (!text) return;
    const next = store.value.map((item) => item.id === goal.id
      ? { ...item, updatedAt: new Date().toISOString(), tasks: [...item.tasks, { id: crypto.randomUUID(), text, done: false }] }
      : item);
    if (store.save(next)) setTaskDrafts((current) => ({ ...current, [goal.id]: '' }));
  };

  const toggleTask = (goalId: string, taskId: string) => {
    store.save(store.value.map((goal) => goal.id === goalId
      ? { ...goal, updatedAt: new Date().toISOString(), tasks: goal.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
      : goal));
  };

  const removeTask = (goalId: string, taskId: string) => {
    store.save(store.value.map((goal) => goal.id === goalId
      ? { ...goal, updatedAt: new Date().toISOString(), tasks: goal.tasks.filter((task) => task.id !== taskId) }
      : goal));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,.82fr)_minmax(0,1.18fr)]">
      <section id="goal-composer" className="h-fit rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid="goal-composer">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dcebe4] text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]"><Flag size={18} /></span>
          <div><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#47796c]">Oldinga qarab</p><h2 className="mt-1 font-serif text-[25px] leading-tight">{editingId ? 'Maqsadni tahrirlash' : 'Yangi maqsad'}</h2></div>
        </div>
        <Form {...form}>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div><label htmlFor="goal-title" className="text-[11px] font-medium">Maqsad nomi</label><input id="goal-title" {...form.register('title')} maxLength={100} placeholder="Masalan, har kuni 20 daqiqa o‘qish" className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-[12px] outline-none placeholder:text-muted-foreground/55 focus:border-[#8fb59b]" data-testid="input-goal-title" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="goal-horizon" className="text-[11px] font-medium">Muddat</label><select id="goal-horizon" {...form.register('horizon')} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-[11px] outline-none focus:border-[#8fb59b]" data-testid="select-goal-horizon">{goalHorizons.map((value) => <option key={value} value={value}>{horizonLabels[value]}</option>)}</select></div>
              <div><label htmlFor="goal-date" className="text-[11px] font-medium">Nishon sana</label><input id="goal-date" type="date" {...form.register('targetDate')} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-[11px] outline-none focus:border-[#8fb59b]" data-testid="input-goal-date" /></div>
            </div>
            <div><label htmlFor="goal-description" className="text-[11px] font-medium">Qisqa izoh</label><textarea id="goal-description" {...form.register('description')} rows={3} maxLength={600} placeholder="Nega bu maqsad siz uchun muhim?" className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[11px] leading-relaxed outline-none placeholder:text-muted-foreground/55 focus:border-[#8fb59b]" data-testid="input-goal-description" /></div>
            {!editingId && <div><label htmlFor="goal-first-steps" className="text-[11px] font-medium">Birinchi qadamlar</label><textarea id="goal-first-steps" {...form.register('firstSteps')} rows={3} maxLength={1200} placeholder={'Har bir qadamni alohida qatorda yozing:\nKitob tanlash\nO‘qish vaqtini belgilash'} className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[11px] leading-relaxed outline-none placeholder:text-muted-foreground/55 focus:border-[#8fb59b]" data-testid="input-goal-first-steps" /><p className="mt-1.5 text-[10px] text-muted-foreground">Har bir qatordan alohida belgilash ro‘yxati yaratiladi.</p></div>}
            {(formError || store.error) && <p className="text-[11px] text-destructive" role="alert" data-testid="status-goal-error">{formError || store.error}</p>}
            <div className="flex gap-2"><button type="submit" disabled={store.status !== 'ready'} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[11px] font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-save-goal"><Check size={14} />{editingId ? 'O‘zgarishni saqlash' : 'Maqsadni qo‘shish'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setFormError(''); form.reset(emptyGoalForm); }} className="grid size-11 place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground" aria-label="Tahrirni bekor qilish" data-testid="button-cancel-goal-edit"><X size={16} /></button>}</div>
          </form>
        </Form>
        <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">Maqsadlar va qadamlar shu brauzerda saqlanadi.</p>
      </section>

      <section className="min-w-0" aria-label="Maqsadlar ro‘yxati">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-card-border bg-card p-3" role="tablist" aria-label="Maqsad muddatlari">
          {periodFilters.map((value) => <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => setPeriod(value)} className={`rounded-xl px-3 py-2 text-[10px] font-semibold transition-colors ${period === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`tab-goal-${value}`}>{value === 'all' ? 'Barcha maqsadlar' : horizonLabels[value]}</button>)}
        </div>
        {store.status === 'loading' ? <div className="mt-4 h-48 rounded-[22px] skeleton" aria-label="Maqsadlar yuklanmoqda" /> : store.status === 'error' ? <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-[12px]" role="alert">{store.error}</div> : visibleGoals.length ? (
          <div className="mt-4 space-y-4">
            {visibleGoals.map((goal) => {
              const completed = goal.tasks.filter((task) => task.done).length;
              const progress = goal.tasks.length ? Math.round(completed / goal.tasks.length * 100) : 0;
              return (
                <article key={goal.id} className="rounded-[22px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid={`card-goal-${goal.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#dcebe4] px-2.5 py-1 text-[9px] font-semibold text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]">{horizonLabels[goal.horizon]}</span>{goal.targetDate && <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground"><CalendarRange size={12} />{new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${goal.targetDate}T12:00:00`))}</span>}</div><h3 className="mt-3 break-words font-serif text-[25px] leading-tight">{goal.title}</h3>{goal.description && <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{goal.description}</p>}</div>
                    <div className="flex gap-1"><button type="button" onClick={() => editGoal(goal)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Maqsadni tahrirlash" data-testid={`button-edit-goal-${goal.id}`}><Pencil size={14} /></button><button type="button" onClick={() => deleteGoal(goal)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Maqsadni o‘chirish" data-testid={`button-delete-goal-${goal.id}`}><Trash2 size={14} /></button></div>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[10px]"><span className="font-mono uppercase tracking-[.1em] text-muted-foreground">Bajarilish</span><span className="font-mono font-semibold text-[#35614f]" data-testid={`text-goal-progress-${goal.id}`}>{progress}%</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${goal.title} bajarilishi`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-[#6e9a7c] transition-[width]" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <div className="mt-5 border-t border-border/70 pt-4">
                    <p className="mb-2 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Qadamlar · {completed}/{goal.tasks.length}</p>
                    {goal.tasks.length ? <ul className="space-y-1.5">{goal.tasks.map((task) => <li key={task.id} className="flex items-start gap-2 rounded-lg py-1"><button type="button" onClick={() => toggleTask(goal.id, task.id)} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${task.done ? 'border-[#6e9a7c] bg-[#6e9a7c] text-white' : 'border-border text-transparent hover:border-[#6e9a7c]'}`} aria-label={task.done ? 'Qadamni bajarilmagan deb belgilash' : 'Qadamni bajarildi deb belgilash'} aria-pressed={task.done} data-testid={`button-toggle-goal-task-${task.id}`}>{task.done ? <Check size={12} /> : <Circle size={11} />}</button><span className={`min-w-0 flex-1 text-[11px] leading-relaxed ${task.done ? 'text-muted-foreground line-through' : ''}`}>{task.text}</span><button type="button" onClick={() => removeTask(goal.id, task.id)} className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground/60 hover:text-destructive" aria-label="Qadamni o‘chirish" data-testid={`button-delete-goal-task-${task.id}`}><X size={13} /></button></li>)}</ul> : <p className="text-[10px] text-muted-foreground">Hozircha qadam qo‘shilmagan.</p>}
                    <div className="mt-3 flex gap-2"><input value={taskDrafts[goal.id] ?? ''} onChange={(event) => setTaskDrafts((current) => ({ ...current, [goal.id]: event.target.value }))} maxLength={140} placeholder="Keyingi kichik qadam..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[10px] outline-none placeholder:text-muted-foreground/55 focus:border-[#8fb59b]" aria-label="Yangi qadam" data-testid={`input-goal-task-${goal.id}`} /><button type="button" onClick={() => addTask(goal)} className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#dcebe4] text-[#35614f] hover:bg-[#c5decf] dark:bg-[#294538] dark:text-[#b5d9c4]" aria-label="Qadam qo‘shish" data-testid={`button-add-goal-task-${goal.id}`}><Plus size={15} /></button></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-5 py-12 text-center dark:border-[#584c37] dark:bg-[#2b271f]"><Flag size={22} className="mx-auto text-[#6e9a7c]" /><h2 className="mt-3 font-serif text-[24px]">{store.value.length ? 'Bu muddatda maqsad yo‘q.' : 'Katta niyatni kichik qadamga bo‘ling.'}</h2><p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">{store.value.length ? 'Boshqa muddatni tanlang yoki yangi maqsad kiriting.' : 'Maqsad uchun muddat belgilang, keyin bajariladigan qadamlarni qo‘shing.'}</p></div>
        )}
        {store.error && store.status === 'ready' && <p className="mt-3 text-[11px] text-destructive" role="alert" data-testid="status-goals-storage-error">{store.error}</p>}
      </section>
    </div>
  );
}

export function GoalsPage() {
  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame eyebrow="Uzoq muddatli niyatlar" title="Maqsadlar paneli" description="Oylik, olti oylik va yillik maqsadlarni aniq qadamlar bilan kuzatib boring." icon={<Flag size={22} strokeWidth={1.7} />}>
          <GoalsBoard key={userId} storageKey={userStorageKey('goals', userId)} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}