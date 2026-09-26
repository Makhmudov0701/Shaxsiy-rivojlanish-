import { useMemo, useState } from 'react';
import { formatContentDeleteConfirmation, formatGoalDuration, getCurrentIntlLocale } from '@/lib/i18n';
import { useForm, useWatch } from 'react-hook-form';
import {
  CalendarRange,
  Check,
  Circle,
  Clock3,
  Dumbbell,
  Flag,
  FolderKanban,
  GraduationCap,
  Heart,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Form } from '@/components/ui/form';
import { FlashNotice } from '@/components/diary-ui';
import { ModulePageFrame, UserStoragePage } from '@/pages/local-module-pages';
import { useLocalModuleStorage } from '@/lib/local-module-storage';
import {
  EMPTY_GOALS,
  isPersonalGoalList,
  userStorageKey,
  type GoalCategory,
  type GoalHorizon,
  type GoalMetric,
  type GoalTask,
  type PersonalGoal,
} from '@/lib/local-life-data';

type GoalFormValues = {
  title: string;
  description: string;
  motivation: string;
  category: GoalCategory;
  horizon: GoalHorizon;
  targetDate: string;
  metric: GoalMetric;
  metricTarget: number;
  metricUnit: string;
};

const horizonLabels: Record<GoalHorizon, string> = {
  week: 'Haftalik',
  month: 'Oylik',
  'half-year': '6 oylik',
  year: 'Yillik',
  free: 'Erkin',
};
const goalHorizons: GoalHorizon[] = ['week', 'month', 'half-year', 'year', 'free'];
const periodFilters = ['all', ...goalHorizons] as const;
type PeriodFilter = (typeof periodFilters)[number];

const categoryOptions: {
  value: GoalCategory;
  label: string;
  icon: LucideIcon;
  selected: string;
  iconColor: string;
}[] = [
  {
    value: 'education',
    label: 'Ta’lim',
    icon: GraduationCap,
    selected: 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40',
    iconColor: 'text-sky-700 dark:text-sky-300',
  },
  {
    value: 'fitness',
    label: 'Jismoniy',
    icon: Dumbbell,
    selected: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'project',
    label: 'Loyiha',
    icon: FolderKanban,
    selected: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40',
    iconColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    value: 'personal',
    label: 'Shaxsiy',
    icon: Heart,
    selected: 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40',
    iconColor: 'text-violet-700 dark:text-violet-300',
  },
];

const metricOptions: {
  value: GoalMetric;
  label: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  { value: 'milestones', label: 'Qadamlar', detail: 'Qadamlar bajarilgani sari', icon: Check },
  { value: 'quantity', label: 'Miqdor', detail: 'Sahifa, km yoki boshqa birlik', icon: Target },
  { value: 'time', label: 'Sarflangan vaqt', detail: 'Daqiqalarni qo‘shib boring', icon: Clock3 },
  { value: 'percentage', label: 'Foiz', detail: '0 dan 100 gacha', icon: Circle },
];

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function targetDateFor(horizon: GoalHorizon, base = new Date()) {
  const date = new Date(base);
  if (horizon === 'week') date.setDate(date.getDate() + 7);
  if (horizon === 'month' || horizon === 'half-year' || horizon === 'year') {
    const months = horizon === 'month' ? 1 : horizon === 'half-year' ? 6 : 12;
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, lastDay));
  }
  return localDateValue(date);
}

function newGoalForm(): GoalFormValues {
  return {
    title: '',
    description: '',
    motivation: '',
    category: 'personal',
    horizon: 'month',
    targetDate: targetDateFor('month'),
    metric: 'milestones',
    metricTarget: 10,
    metricUnit: '',
  };
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function GoalsBoard({ storageKey }: { storageKey: string }) {
  const store = useLocalModuleStorage(storageKey, EMPTY_GOALS, isPersonalGoalList, 'Maqsadlar');
  const form = useForm<GoalFormValues>({ defaultValues: newGoalForm() });
  const selectedHorizon = useWatch({ control: form.control, name: 'horizon' }) ?? 'month';
  const selectedMetric = useWatch({ control: form.control, name: 'metric' }) ?? 'milestones';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [formTasks, setFormTasks] = useState<GoalTask[]>([]);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };
  const visibleGoals = useMemo(
    () => [...store.value]
      .filter((goal) => period === 'all' || goal.horizon === period)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [period, store.value],
  );
  const resetComposer = () => {
    setEditingId(null);
    setFormTasks([]);
    setFormError('');
    form.reset(newGoalForm());
  };

  const submit = form.handleSubmit((values) => {
    const title = values.title.trim();
    if (!title) {
      setFormError('Maqsad nomini kiriting.');
      return;
    }
    if (values.horizon === 'free' && !values.targetDate) {
      setFormError('Erkin muddat uchun tugash sanasini tanlang.');
      return;
    }
    if ((values.metric === 'quantity' || values.metric === 'time')
      && (!Number.isFinite(values.metricTarget) || values.metricTarget <= 0)) {
      setFormError('Maqsadli miqdor noldan katta bo‘lishi kerak.');
      return;
    }
    if (values.metric === 'time' && !Number.isInteger(values.metricTarget)) {
      setFormError('Vaqt maqsadini butun daqiqalarda kiriting.');
      return;
    }

    const now = new Date().toISOString();
    const current = store.value.find((goal) => goal.id === editingId);
    const metricTarget = values.metric === 'quantity' || values.metric === 'time'
      ? values.metricTarget
      : values.metric === 'percentage'
        ? 100
        : undefined;
    const metricCurrent = values.metric === 'milestones'
      ? undefined
      : current?.metric === values.metric
        ? current.metricCurrent ?? 0
        : 0;
    const tasks = formTasks
      .filter((task) => task.text.trim())
      .slice(0, 16)
      .map((task) => ({ ...task, text: task.text.trim() }));
    const goal: PersonalGoal = {
      id: current?.id ?? crypto.randomUUID(),
      title,
      description: values.description.trim(),
      motivation: values.motivation.trim(),
      category: values.category,
      horizon: values.horizon,
      targetDate: values.targetDate,
      metric: values.metric,
      metricTarget,
      metricCurrent,
      metricUnit: values.metric === 'quantity' ? values.metricUnit.trim() : '',
      tasks,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    const next = current
      ? store.value.map((item) => item.id === current.id ? goal : item)
      : [goal, ...store.value];
    if (store.save(next)) {
      resetComposer();
      showNotice(current ? 'Maqsad yangilandi.' : 'Yangi maqsad saqlandi.');
    }
  });

  const editGoal = (goal: PersonalGoal) => {
    const metric = goal.metric ?? 'milestones';
    setEditingId(goal.id);
    setFormError('');
    setFormTasks(goal.tasks.map((task) => ({ ...task })));
    form.reset({
      title: goal.title,
      description: goal.description,
      motivation: goal.motivation ?? '',
      category: goal.category ?? 'personal',
      horizon: goal.horizon,
      targetDate: goal.targetDate,
      metric,
      metricTarget: goal.metricTarget ?? (metric === 'time' ? 60 : metric === 'percentage' ? 100 : 10),
      metricUnit: goal.metricUnit ?? '',
    });
    document.getElementById('goal-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const deleteGoal = (goal: PersonalGoal) => {
    if (!window.confirm(formatContentDeleteConfirmation(goal.title, 'goal'))) return;
    if (store.save(store.value.filter((item) => item.id !== goal.id))) showNotice('Maqsad o‘chirildi.');
    if (editingId === goal.id) resetComposer();
  };

  const addTask = (goal: PersonalGoal) => {
    const text = (taskDrafts[goal.id] ?? '').trim();
    if (!text) return;
    const next = store.value.map((item) => item.id === goal.id
      ? { ...item, updatedAt: new Date().toISOString(), tasks: [...item.tasks, { id: crypto.randomUUID(), text, done: false }] }
      : item);
    if (store.save(next)) {
      setTaskDrafts((current) => ({ ...current, [goal.id]: '' }));
      showNotice('Yangi qadam qo‘shildi.');
    }
  };

  const toggleTask = (goalId: string, taskId: string) => {
    const saved = store.save(store.value.map((goal) => goal.id === goalId
      ? { ...goal, updatedAt: new Date().toISOString(), tasks: goal.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }
      : goal));
    if (saved) showNotice('Qadam yangilandi.');
  };

  const removeTask = (goalId: string, taskId: string) => {
    const saved = store.save(store.value.map((goal) => goal.id === goalId
      ? { ...goal, updatedAt: new Date().toISOString(), tasks: goal.tasks.filter((task) => task.id !== taskId) }
      : goal));
    if (saved) showNotice('Qadam olib tashlandi.');
  };

  const updateMetricCurrent = (goalId: string, metricCurrent: number) => {
    if (!Number.isFinite(metricCurrent)) return;
    const saved = store.save(store.value.map((goal) => goal.id === goalId
      ? {
        ...goal,
        updatedAt: new Date().toISOString(),
        metricCurrent: goal.metric === 'percentage' ? clampPercent(metricCurrent) : Math.max(0, metricCurrent),
      }
      : goal));
    if (saved) showNotice('Ko‘rsatkich yangilandi.');
  };

  const addTrackedAmount = (goal: PersonalGoal) => {
    const amount = Number(trackingDrafts[goal.id]);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (goal.metric === 'time' && !Number.isInteger(amount)) {
      showNotice('Vaqtni butun daqiqalarda kiriting.');
      return;
    }
    const next = store.value.map((item) => item.id === goal.id
      ? { ...item, updatedAt: new Date().toISOString(), metricCurrent: (item.metricCurrent ?? 0) + amount }
      : item);
    if (store.save(next)) {
      setTrackingDrafts((current) => ({ ...current, [goal.id]: '' }));
      showNotice(goal.metric === 'time' ? 'Sarflangan vaqt qo‘shildi.' : 'Miqdor yangilandi.');
    }
  };

  const metricProgress = (goal: PersonalGoal) => {
    const metric = goal.metric ?? 'milestones';
    if (metric === 'percentage') return clampPercent(goal.metricCurrent ?? 0);
    if (metric === 'quantity' || metric === 'time') {
      const target = goal.metricTarget ?? 1;
      return target > 0 ? clampPercent((goal.metricCurrent ?? 0) / target * 100) : 0;
    }
    const completed = goal.tasks.filter((task) => task.done).length;
    return goal.tasks.length ? Math.round(completed / goal.tasks.length * 100) : 0;
  };

  const chooseHorizon = (horizon: GoalHorizon) => {
    form.setValue('horizon', horizon, { shouldDirty: true });
    form.setValue('targetDate', horizon === 'free' ? '' : targetDateFor(horizon), { shouldDirty: true });
    setFormError('');
  };

  const chooseMetric = (metric: GoalMetric) => {
    if (form.getValues('metric') === metric) return;
    form.setValue('metric', metric, { shouldDirty: true });
    if (metric === 'time') form.setValue('metricTarget', 60);
    if (metric === 'quantity') form.setValue('metricTarget', 10);
    if (metric === 'percentage') form.setValue('metricTarget', 100);
    setFormError('');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(300px,.86fr)_minmax(0,1.14fr)]">
      <section id="goal-composer" className="h-fit rounded-[24px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid="goal-composer">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dcebe4] text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]"><Flag size={18} /></span>
          <div>
            <p className="text-[12px] font-semibold text-[#47796c]">Bir kichik qadamdan boshlang</p>
            <h2 className="mt-1 font-serif text-[25px] leading-tight">{editingId ? 'Maqsadni tahrirlash' : 'Yangi maqsad'}</h2>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={submit} className="mt-5 space-y-5">
            <div>
              <label htmlFor="goal-title" className="text-[13px] font-medium">Maqsadingiz</label>
              <input id="goal-title" {...form.register('title')} maxLength={100} placeholder="Masalan, kuniga 20 daqiqa kitob o‘qish" className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-[14px] outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" data-testid="input-goal-title" />
            </div>

            <fieldset>
              <legend className="text-[13px] font-medium">Toifa</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {categoryOptions.map(({ value, label, icon: CategoryIcon, selected, iconColor }) => {
                  const active = form.watch('category') === value;
                  return (
                    <button key={value} type="button" onClick={() => form.setValue('category', value, { shouldDirty: true })} aria-pressed={active} className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition-colors ${active ? selected : 'border-border bg-background hover:bg-muted'}`} data-testid={`button-goal-category-${value}`}>
                      <CategoryIcon size={17} className={iconColor} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[13px] font-medium">Muddat</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {goalHorizons.map((horizon) => (
                  <button key={horizon} type="button" onClick={() => chooseHorizon(horizon)} aria-pressed={selectedHorizon === horizon} className={`min-h-10 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors ${selectedHorizon === horizon ? 'border-[#35614f] bg-[#35614f] text-white dark:border-[#b5d9c4] dark:bg-[#b5d9c4] dark:text-[#20392d]' : 'border-border bg-background text-muted-foreground hover:border-[#8fb59b] hover:text-foreground'}`} data-testid={`button-goal-horizon-${horizon}`}>
                    {horizonLabels[horizon]}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="goal-date" className="text-[13px] font-medium">Tugash sanasi</label>
              <div className="relative mt-2">
                <CalendarRange size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input id="goal-date" type="date" required={selectedHorizon === 'free'} {...form.register('targetDate')} className="min-h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-[13px] outline-none focus:border-[#8fb59b]" data-testid="input-goal-date" />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {selectedHorizon === 'free' ? 'Erkin muddat uchun sanani kalendardan tanlang.' : 'Muddatni tanlaganingizda sana avtomatik belgilanadi; xohlasangiz o‘zgartiring.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="goal-description" className="text-[13px] font-medium">Qisqacha izoh <span className="text-muted-foreground">(ixtiyoriy)</span></label>
                <textarea id="goal-description" {...form.register('description')} rows={3} maxLength={600} placeholder="Maqsad haqida qisqacha..." className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" data-testid="input-goal-description" />
              </div>
              <div>
                <label htmlFor="goal-motivation" className="text-[13px] font-medium">Motivatsiya <span className="text-muted-foreground">(ixtiyoriy)</span></label>
                <textarea id="goal-motivation" {...form.register('motivation')} rows={3} maxLength={600} placeholder="Nega bu maqsad siz uchun muhim?" className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" data-testid="input-goal-motivation" />
              </div>
            </div>

            <fieldset>
              <legend className="text-[13px] font-medium">Bajarilishni qanday o‘lchaysiz?</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {metricOptions.map(({ value, label, detail, icon: MetricIcon }) => {
                  const active = selectedMetric === value;
                  return (
                    <button key={value} type="button" onClick={() => chooseMetric(value)} aria-pressed={active} className={`min-h-[68px] rounded-xl border px-3 py-2.5 text-left transition-colors ${active ? 'border-[#6e9a7c] bg-[#edf4ee] dark:border-[#6e9a7c] dark:bg-[#24392c]' : 'border-border bg-background hover:bg-muted'}`} data-testid={`button-goal-metric-${value}`}>
                      <span className="flex items-center gap-2 text-[12px] font-semibold"><MetricIcon size={15} className={active ? 'text-[#35614f] dark:text-[#b5d9c4]' : 'text-muted-foreground'} />{label}</span>
                      <span className="mt-1 block pl-[23px] text-[10px] leading-snug text-muted-foreground">{detail}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {(selectedMetric === 'quantity' || selectedMetric === 'time') && (
              <div className="grid gap-3 rounded-2xl bg-muted/60 p-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="goal-metric-target" className="text-[12px] font-medium">
                    {selectedMetric === 'time' ? 'Kerakli vaqt (daq.)' : 'Maqsadli miqdor'}
                  </label>
                  <input id="goal-metric-target" type="number" min="1" step={selectedMetric === 'time' ? 1 : 'any'} {...form.register('metricTarget', { valueAsNumber: true })} className="mt-1.5 min-h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-[#8fb59b]" data-testid="input-goal-metric-target" />
                </div>
                {selectedMetric === 'quantity' ? (
                  <div>
                    <label htmlFor="goal-metric-unit" className="text-[12px] font-medium">Birlik (ixtiyoriy)</label>
                    <input id="goal-metric-unit" {...form.register('metricUnit')} maxLength={24} placeholder="sahifa, km..." className="mt-1.5 min-h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" data-testid="input-goal-metric-unit" />
                  </div>
                ) : (
                  <p className="self-end pb-2 text-[11px] leading-relaxed text-muted-foreground">Maqsadga erishgan vaqtingizda kartada daqiqalarni qo‘shib boring.</p>
                )}
              </div>
            )}
            {selectedMetric === 'percentage' && <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">Maqsad kartasidagi slayder yordamida bajarilish foizini istalgan payt yangilang.</p>}

            <fieldset>
              <legend className="text-[13px] font-medium">Qadamlar <span className="text-muted-foreground">(ixtiyoriy)</span></legend>
              <div className="mt-2 space-y-2">
                {formTasks.map((task, index) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => setFormTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} aria-label={task.done ? 'Qadamni bajarilmagan deb belgilash' : 'Qadamni bajarildi deb belgilash'} aria-pressed={task.done} className={`grid size-10 shrink-0 place-items-center rounded-xl border ${task.done ? 'border-[#6e9a7c] bg-[#6e9a7c] text-white' : 'border-border bg-background text-muted-foreground'}`} data-testid={`button-edit-goal-task-${task.id}`}>
                      {task.done ? <Check size={16} /> : <Circle size={15} />}
                    </button>
                    <input value={task.text} onChange={(event) => setFormTasks((current) => current.map((item) => item.id === task.id ? { ...item, text: event.target.value } : item))} maxLength={140} placeholder={`Qadam ${index + 1}`} className="min-h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-[12px] outline-none placeholder:text-muted-foreground/60 focus:border-[#8fb59b]" aria-label={`Qadam ${index + 1}`} data-testid={`input-edit-goal-task-${task.id}`} />
                    <button type="button" onClick={() => setFormTasks((current) => current.filter((item) => item.id !== task.id))} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Qadamni o‘chirish" data-testid={`button-remove-goal-task-${task.id}`}><X size={16} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormTasks((current) => current.length >= 16 ? current : [...current, { id: crypto.randomUUID(), text: '', done: false }])} disabled={formTasks.length >= 16} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-dashed border-border px-3 text-[12px] font-semibold text-muted-foreground hover:border-[#8fb59b] hover:text-foreground disabled:opacity-50" data-testid="button-add-goal-milestone">
                  <Plus size={15} /> Qadam qo‘shish
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Bajarilgan qadamlar tanlangan o‘lchov “Qadamlar” bo‘lsa, foizni avtomatik hisoblaydi.</p>
            </fieldset>

            {(formError || store.error) && <p className="text-[13px] text-destructive" role="alert" data-testid="status-goal-error">{formError || store.error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={store.status !== 'ready'} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground disabled:opacity-50" data-testid="button-save-goal">
                <Check size={17} />{editingId ? 'Saqlash' : 'Maqsadni qo‘shish'}
              </button>
              {editingId && <button type="button" onClick={resetComposer} className="grid size-11 place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground" aria-label="Tahrirni bekor qilish" data-testid="button-cancel-goal-edit"><X size={16} /></button>}
            </div>
          </form>
        </Form>
        <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">Maqsadlar va qadamlar shu brauzerda saqlanadi.</p>
      </section>

      <section className="min-w-0" aria-label="Maqsadlar ro‘yxati">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-card-border bg-card p-3" role="tablist" aria-label="Maqsad muddatlari">
          {periodFilters.map((value) => <button key={value} type="button" role="tab" aria-selected={period === value} onClick={() => setPeriod(value)} className={`min-h-10 rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors ${period === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`tab-goal-${value}`}>{value === 'all' ? 'Barchasi' : horizonLabels[value]}</button>)}
        </div>
        {store.status === 'loading' ? <div className="mt-4 h-48 rounded-[22px] skeleton" aria-label="Maqsadlar yuklanmoqda" /> : store.status === 'error' ? <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-[12px]" role="alert">{store.error}</div> : visibleGoals.length ? (
          <div className="mt-4 space-y-4">
            {visibleGoals.map((goal) => {
              const completed = goal.tasks.filter((task) => task.done).length;
              const metric = goal.metric ?? 'milestones';
              const progress = metricProgress(goal);
              const category = categoryOptions.find((item) => item.value === (goal.category ?? 'personal')) ?? categoryOptions[3];
              const CategoryIcon = category.icon;
              const currentValue = goal.metricCurrent ?? 0;
              const targetValue = goal.metricTarget ?? 1;
              return (
                <article key={goal.id} className="rounded-[22px] border border-card-border bg-card p-5 shadow-sm sm:p-6" data-testid={`card-goal-${goal.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${category.selected}`} data-testid={`badge-goal-category-${goal.id}`}>
                          <CategoryIcon size={13} className={category.iconColor} />{category.label}
                        </span>
                        <span className="rounded-full bg-[#dcebe4] px-2.5 py-1 text-[9px] font-semibold text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]">{horizonLabels[goal.horizon]}</span>
                        {goal.targetDate && <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground"><CalendarRange size={12} />{new Intl.DateTimeFormat(getCurrentIntlLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${goal.targetDate}T12:00:00`))}</span>}
                      </div>
                      <h3 className="mt-3 break-words font-serif text-[25px] leading-tight">{goal.title}</h3>
                      {goal.description && <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{goal.description}</p>}
                      {goal.motivation && <p className="mt-2 border-l-2 border-[#8fb59b] pl-3 text-[12px] italic leading-relaxed text-muted-foreground" data-testid={`text-goal-motivation-${goal.id}`}>{goal.motivation}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => editGoal(goal)} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Maqsadni tahrirlash" data-testid={`button-edit-goal-${goal.id}`}><Pencil size={17} /></button>
                      <button type="button" onClick={() => deleteGoal(goal)} className="grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Maqsadni o‘chirish" data-testid={`button-delete-goal-${goal.id}`}><Trash2 size={17} /></button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="font-medium text-muted-foreground">{metric === 'milestones' ? 'Qadamlar bajarilishi' : metric === 'quantity' ? 'Miqdor bo‘yicha' : metric === 'time' ? 'Sarflangan vaqt' : 'Bajarilish foizi'}</span>
                      <span className="font-semibold text-[#35614f] dark:text-[#b5d9c4]" data-testid={`text-goal-progress-${goal.id}`}>
                        {metric === 'milestones' ? `${progress}% · ${completed}/${goal.tasks.length}` : metric === 'quantity' ? `${currentValue} / ${targetValue} ${goal.metricUnit ?? ''}` : metric === 'time' ? `${formatGoalDuration(currentValue)} / ${formatGoalDuration(targetValue)}` : `${progress}%`}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${goal.title} bajarilishi`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                      <div className="h-full rounded-full bg-[#6e9a7c] transition-[width]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {(metric === 'quantity' || metric === 'time') && (
                    <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl bg-muted/60 p-3">
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`goal-tracking-${goal.id}`} className="text-[11px] font-medium text-muted-foreground">{metric === 'time' ? 'Qo‘shiladigan daqiqa' : `Qo‘shiladigan miqdor${goal.metricUnit ? ` (${goal.metricUnit})` : ''}`}</label>
                        <input id={`goal-tracking-${goal.id}`} type="number" min="0.1" step={metric === 'time' ? 1 : 'any'} value={trackingDrafts[goal.id] ?? ''} onChange={(event) => setTrackingDrafts((current) => ({ ...current, [goal.id]: event.target.value }))} placeholder={metric === 'time' ? '15' : '1'} className="mt-1.5 min-h-10 w-full rounded-lg border border-border bg-background px-3 text-[12px] outline-none placeholder:text-muted-foreground/60 focus:border-[#8fb59b]" data-testid={`input-goal-tracking-${goal.id}`} />
                      </div>
                      <button type="button" onClick={() => addTrackedAmount(goal)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#dcebe4] px-3 text-[11px] font-semibold text-[#35614f] hover:bg-[#c5decf] dark:bg-[#294538] dark:text-[#b5d9c4]" data-testid={`button-add-goal-tracking-${goal.id}`}><Plus size={14} />{metric === 'time' ? 'Vaqt qo‘shish' : 'Qo‘shish'}</button>
                    </div>
                  )}
                  {metric === 'percentage' && (
                    <div className="mt-4 rounded-xl bg-muted/60 px-3 py-3">
                      <div className="mb-2 flex items-center justify-between text-[11px]">
                        <label htmlFor={`goal-percentage-${goal.id}`} className="font-medium text-muted-foreground">Foizni yangilang</label>
                        <span className="font-semibold text-[#35614f] dark:text-[#b5d9c4]">{progress}%</span>
                      </div>
                      <input id={`goal-percentage-${goal.id}`} type="range" min="0" max="100" step="1" value={progress} onChange={(event) => updateMetricCurrent(goal.id, Number(event.target.value))} className="w-full accent-[#6e9a7c]" aria-label={`${goal.title} bajarilish foizi`} data-testid={`input-goal-percentage-${goal.id}`} />
                    </div>
                  )}

                  <div className="mt-5 border-t border-border/70 pt-4">
                    <p className="mb-2 text-[13px] font-semibold text-muted-foreground">Qadamlar · {completed}/{goal.tasks.length}</p>
                    {goal.tasks.length ? <ul className="space-y-1.5">{goal.tasks.map((task) => <li key={task.id} className="flex items-start gap-2 rounded-lg py-1">
                      <button type="button" onClick={() => toggleTask(goal.id, task.id)} className={`grid size-10 shrink-0 place-items-center rounded-xl border ${task.done ? 'border-[#6e9a7c] bg-[#6e9a7c] text-white' : 'border-border text-transparent hover:border-[#6e9a7c]'}`} aria-label={task.done ? 'Qadamni bajarilmagan deb belgilash' : 'Qadamni bajarildi deb belgilash'} aria-pressed={task.done} data-testid={`button-toggle-goal-task-${task.id}`}>{task.done ? <Check size={17} /> : <Circle size={15} />}</button>
                      <span className={`min-w-0 flex-1 py-2 text-[13px] leading-relaxed ${task.done ? 'text-muted-foreground line-through' : ''}`}>{task.text}</span>
                      <button type="button" onClick={() => removeTask(goal.id, task.id)} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground/60 hover:text-destructive" aria-label="Qadamni o‘chirish" data-testid={`button-delete-goal-task-${task.id}`}><X size={17} /></button>
                    </li>)}</ul> : <p className="text-[13px] text-muted-foreground">Hozircha qadam qo‘shilmagan.</p>}
                    <div className="mt-3 flex gap-2">
                      <input value={taskDrafts[goal.id] ?? ''} onChange={(event) => setTaskDrafts((current) => ({ ...current, [goal.id]: event.target.value }))} maxLength={140} placeholder="Keyingi qadamni yozing..." className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/65 focus:border-[#8fb59b]" aria-label="Yangi qadam" data-testid={`input-goal-task-${goal.id}`} />
                      <button type="button" onClick={() => addTask(goal)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#dcebe4] text-[#35614f] hover:bg-[#c5decf] dark:bg-[#294538] dark:text-[#b5d9c4]" aria-label="Qadam qo‘shish" data-testid={`button-add-goal-task-${goal.id}`}><Plus size={18} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-[#cfc3a5] bg-[#f7f0df] px-5 py-12 text-center dark:border-[#584c37] dark:bg-[#2b271f]">
            <Flag size={22} className="mx-auto text-[#6e9a7c]" />
            <h2 className="mt-3 font-serif text-[24px]">{store.value.length ? 'Bu muddatda maqsad yo‘q.' : 'Katta niyatni kichik qadamga bo‘ling.'}</h2>
            <p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">{store.value.length ? 'Boshqa muddatni tanlang yoki yangi maqsad kiriting.' : 'Toifa va muddatni tanlang, so‘ng maqsadni kichik qadamlarga ajrating.'}</p>
          </div>
        )}
        {store.error && store.status === 'ready' && <p className="mt-3 text-[11px] text-destructive" role="alert" data-testid="status-goals-storage-error">{store.error}</p>}
      </section>
      {notice && <FlashNotice message={notice} />}
    </div>
  );
}

export function GoalsPage() {
  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame eyebrow="Kichik qadamlar" title="Maqsadlar" description="Bir maqsad tanlang, so‘ng uni kichik qadamlarga ajrating." icon={<Flag size={22} strokeWidth={1.7} />}>
          <GoalsBoard key={userId} storageKey={userStorageKey('goals', userId)} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}