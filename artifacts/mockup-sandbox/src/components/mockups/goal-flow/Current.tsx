import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarRange, Check, Circle, Flag, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Form } from '@/components/ui/form';
import './_group.css';

type Horizon = 'month' | 'half-year' | 'year';
type GoalTask = { id: string; text: string; done: boolean };
type Goal = {
  id: string;
  title: string;
  description: string;
  horizon: Horizon;
  targetDate: string;
  tasks: GoalTask[];
  createdAt: string;
  updatedAt: string;
};
type FormValues = { title: string; description: string; horizon: Horizon; targetDate: string; firstSteps: string };

const labels: Record<Horizon, string> = { month: 'Oylik', 'half-year': '6 oylik', year: 'Yillik' };
const sampleGoals: Goal[] = [
  {
    id: 'sample-reading',
    title: 'Har kuni 20 daqiqa kitob o‘qish',
    description: 'Yangi bilimlarni odatga aylantirish.',
    horizon: 'month',
    targetDate: '2026-10-24',
    tasks: [
      { id: 'read-1', text: 'Keyingi kitobni tanlash', done: true },
      { id: 'read-2', text: 'Har kuni o‘qish uchun vaqt ajratish', done: true },
      { id: 'read-3', text: 'O‘qiganlarimdan qisqa qayd yozish', done: false },
    ],
    createdAt: '2026-09-20T09:00:00.000Z',
    updatedAt: '2026-09-24T09:00:00.000Z',
  },
  {
    id: 'sample-walk',
    title: 'Haftada uch marta sayr qilish',
    description: 'Ko‘proq harakat va ochiq havoda vaqt.',
    horizon: 'half-year',
    targetDate: '2027-03-24',
    tasks: [
      { id: 'walk-1', text: 'Qulay marshrut topish', done: true },
      { id: 'walk-2', text: 'Sayr jadvalini tuzish', done: false },
      { id: 'walk-3', text: 'Birinchi haftani yakunlash', done: false },
    ],
    createdAt: '2026-09-18T09:00:00.000Z',
    updatedAt: '2026-09-23T09:00:00.000Z',
  },
];

const emptyForm: FormValues = { title: '', description: '', horizon: 'month', targetDate: '', firstSteps: '' };

export function Current() {
  const form = useForm<FormValues>({ defaultValues: emptyForm });
  const [goals, setGoals] = useState(sampleGoals);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'all' | Horizon>('all');
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const visibleGoals = useMemo(() => goals.filter((goal) => period === 'all' || goal.horizon === period), [goals, period]);
  const reset = () => {
    setEditingId(null);
    form.reset(emptyForm);
  };
  const submit = form.handleSubmit((values) => {
    const title = values.title.trim();
    if (!title) return;
    const current = goals.find((goal) => goal.id === editingId);
    const now = new Date().toISOString();
    const tasks = current?.tasks ?? values.firstSteps.split('\n').map((text) => text.trim()).filter(Boolean).slice(0, 16).map((text) => ({ id: crypto.randomUUID(), text, done: false }));
    const next: Goal = {
      id: current?.id ?? crypto.randomUUID(),
      title,
      description: values.description.trim(),
      horizon: values.horizon,
      targetDate: values.targetDate,
      tasks,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    setGoals(current ? goals.map((goal) => goal.id === current.id ? next : goal) : [next, ...goals]);
    reset();
  });
  const editGoal = (goal: Goal) => {
    setEditingId(goal.id);
    form.reset({ title: goal.title, description: goal.description, horizon: goal.horizon, targetDate: goal.targetDate, firstSteps: '' });
    document.getElementById('goal-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const toggleTask = (goalId: string, taskId: string) => setGoals((current) => current.map((goal) => goal.id === goalId
    ? { ...goal, tasks: goal.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
    : goal));
  const addTask = (goal: Goal) => {
    const text = (taskDrafts[goal.id] ?? '').trim();
    if (!text) return;
    setGoals((current) => current.map((item) => item.id === goal.id
      ? { ...item, tasks: [...item.tasks, { id: crypto.randomUUID(), text, done: false }] }
      : item));
    setTaskDrafts((current) => ({ ...current, [goal.id]: '' }));
  };

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-6">
      <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[minmax(280px,.82fr)_minmax(0,1.18fr)]">
        <section id="goal-composer" className="h-fit rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dcebe4] text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]"><Flag size={18} /></span>
            <div><p className="text-[12px] font-semibold text-[#47796c]">Bir kichik qadamdan boshlang</p><h2 className="mt-1 font-serif text-[25px] leading-tight">{editingId ? 'Maqsadni tahrirlash' : 'Yangi maqsad'}</h2></div>
          </div>
          <Form {...form}>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div><label htmlFor="goal-title" className="text-[13px] font-medium">Maqsadingiz</label><input id="goal-title" {...form.register('title')} maxLength={100} placeholder="Masalan, kuniga 20 daqiqa kitob o‘qish" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-[14px] outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor="goal-horizon" className="text-[13px] font-medium">Muddat</label><select id="goal-horizon" {...form.register('horizon')} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#8fb59b]">{(['month', 'half-year', 'year'] as const).map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></div>
                <div><label htmlFor="goal-date" className="text-[13px] font-medium">Tugash sanasi (ixtiyoriy)</label><input id="goal-date" type="date" {...form.register('targetDate')} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#8fb59b]" /></div>
              </div>
              <div><label htmlFor="goal-description" className="text-[13px] font-medium">Nega bu maqsad siz uchun muhim?</label><textarea id="goal-description" {...form.register('description')} rows={3} maxLength={600} placeholder="Bir jumla bilan yozib qo‘ying..." className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" /></div>
              {!editingId && <div><label htmlFor="goal-first-steps" className="text-[13px] font-medium">Birinchi qadamlar</label><textarea id="goal-first-steps" {...form.register('firstSteps')} rows={3} maxLength={1200} placeholder={'Har bir qadamni yangi qatordan yozing:\nKitob tanlash\nO‘qish vaqtini belgilash'} className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" /><p className="mt-1.5 text-[12px] text-muted-foreground">Har bir yangi qator alohida qadam bo‘ladi.</p></div>}
              <div className="flex gap-2"><button type="submit" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground"><Check size={17} />{editingId ? 'Saqlash' : 'Maqsadni qo‘shish'}</button>{editingId && <button type="button" onClick={reset} className="grid size-11 place-items-center rounded-xl border border-border bg-background text-muted-foreground" aria-label="Tahrirni bekor qilish"><X size={16} /></button>}</div>
            </form>
          </Form>
          <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">Maqsadlar va qadamlar shu brauzerda saqlanadi.</p>
        </section>
        <section className="min-w-0" aria-label="Maqsadlar ro‘yxati">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-card-border bg-card p-3" role="tablist" aria-label="Maqsad muddatlari">
            {(['all', 'month', 'half-year', 'year'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => setPeriod(value)} className={`min-h-11 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors ${period === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{value === 'all' ? 'Barchasi' : labels[value]}</button>)}
          </div>
          {visibleGoals.length ? <div className="mt-4 space-y-4">{visibleGoals.map((goal) => {
            const completed = goal.tasks.filter((task) => task.done).length;
            const progress = goal.tasks.length ? Math.round(completed / goal.tasks.length * 100) : 0;
            return <article key={goal.id} className="rounded-[22px] border border-card-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#dcebe4] px-2.5 py-1 text-[9px] font-semibold text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]">{labels[goal.horizon]}</span>{goal.targetDate && <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground"><CalendarRange size={12} />{new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${goal.targetDate}T12:00:00`))}</span>}</div><h3 className="mt-3 break-words font-serif text-[25px] leading-tight">{goal.title}</h3>{goal.description && <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{goal.description}</p>}</div>
                <div className="flex gap-1"><button type="button" onClick={() => editGoal(goal)} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Maqsadni tahrirlash"><Pencil size={17} /></button><button type="button" onClick={() => setGoals((current) => current.filter((item) => item.id !== goal.id))} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Maqsadni o‘chirish"><Trash2 size={17} /></button></div>
              </div>
              <div className="mt-5"><div className="flex items-center justify-between text-[13px]"><span className="font-medium text-muted-foreground">Bajarilish</span><span className="font-semibold text-[#35614f]">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${goal.title} bajarilishi`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-[#6e9a7c] transition-[width]" style={{ width: `${progress}%` }} /></div></div>
              <div className="mt-5 border-t border-border/70 pt-4">
                <p className="mb-2 text-[13px] font-semibold text-muted-foreground">Qadamlar · {completed}/{goal.tasks.length}</p>
                {goal.tasks.length ? <ul className="space-y-1.5">{goal.tasks.map((task) => <li key={task.id} className="flex items-start gap-2 rounded-lg py-1"><button type="button" onClick={() => toggleTask(goal.id, task.id)} className={`grid size-10 shrink-0 place-items-center rounded-xl border ${task.done ? 'border-[#6e9a7c] bg-[#6e9a7c] text-white' : 'border-border text-transparent hover:border-[#6e9a7c]'}`} aria-label={task.done ? 'Qadamni bajarilmagan deb belgilash' : 'Qadamni bajarildi deb belgilash'} aria-pressed={task.done}>{task.done ? <Check size={17} /> : <Circle size={15} />}</button><span className={`min-w-0 flex-1 py-2 text-[13px] leading-relaxed ${task.done ? 'text-muted-foreground line-through' : ''}`}>{task.text}</span><button type="button" onClick={() => setGoals((current) => current.map((item) => item.id === goal.id ? { ...item, tasks: item.tasks.filter((step) => step.id !== task.id) } : item))} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground/60 hover:text-destructive" aria-label="Qadamni o‘chirish"><X size={17} /></button></li>)}</ul> : <p className="text-[13px] text-muted-foreground">Hozircha qadam qo‘shilmagan.</p>}
                <div className="mt-3 flex gap-2"><input value={taskDrafts[goal.id] ?? ''} onChange={(event) => setTaskDrafts((current) => ({ ...current, [goal.id]: event.target.value }))} maxLength={140} placeholder="Keyingi qadamni yozing..." className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" aria-label="Yangi qadam" /><button type="button" onClick={() => addTask(goal)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#dcebe4] text-[#35614f] hover:bg-[#c5decf] dark:bg-[#294538] dark:text-[#b5d9c4]" aria-label="Qadam qo‘shish"><Plus size={18} /></button></div>
              </div>
            </article>;
          })}</div> : <div className="mt-4 rounded-[22px] border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-5 py-12 text-center dark:border-[#584c37] dark:bg-[#2b271f]"><Flag size={22} className="mx-auto text-[#6e9a7c]" /><h2 className="mt-3 font-serif text-[24px]">Katta niyatni kichik qadamga bo‘ling.</h2><p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">Maqsad uchun muddat belgilang, keyin bajariladigan qadamlarni qo‘shing.</p></div>}
        </section>
      </div>
    </main>
  );
}