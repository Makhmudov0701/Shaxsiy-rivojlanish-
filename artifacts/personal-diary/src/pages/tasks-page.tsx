import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import type { Task, TaskCategory, TaskInput, TaskPriority, TaskSubtask, TaskUpdate } from '@workspace/api-client-react';
import { getListTasksQueryKey, useCreateTask, useDeleteTask, useListTasks, useUpdateTask } from '@workspace/api-client-react';
import { CalendarDays, Check, Circle, Clock3, ListTodo, Pencil, Plus, Timer, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { formatContentDeleteConfirmation, formatSubtaskCompletionAriaLabel, formatTaskPomodoroAriaLabel, getCurrentIntlLocale } from '@/lib/i18n';
import { DiaryShell } from '@/components/diary-ui';
import { Form } from '@/components/ui/form';
import { PomodoroTimer } from '@/components/pomodoro-timer';

type TaskFilter = 'all' | TaskCategory;

type TaskFormValues = {
  title: string;
  description: string;
  category: TaskCategory;
  dueDate: string;
  priority: TaskPriority;
  subtasks: TaskSubtask[];
};

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Topshiriq nomini kiriting.').max(160, 'Topshiriq nomi 160 belgidan oshmasin.'),
  description: z.string().max(1000, 'Izoh 1000 belgidan oshmasin.'),
  category: z.enum(['important', 'this_week', 'this_month', 'this_year', 'free_time']),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']),
  subtasks: z.array(z.object({
    id: z.string().min(1).max(80),
    title: z.string().trim().min(1).max(160),
    completed: z.boolean(),
  })).max(30),
});

const categories: Record<TaskCategory, { label: string; short: string; className: string; dot: string }> = {
  important: { label: 'Muhim', short: 'Muhim', className: 'task-category-important', dot: 'bg-[#d96b63]' },
  this_week: { label: 'Shu hafta', short: 'Hafta', className: 'task-category-week', dot: 'bg-[#d89b55]' },
  this_month: { label: 'Shu oy', short: 'Oy', className: 'task-category-month', dot: 'bg-[#6fa4c5]' },
  this_year: { label: 'Shu yil', short: 'Yil', className: 'task-category-year', dot: 'bg-[#9b79bb]' },
  free_time: { label: 'Bo‘sh vaqtda', short: 'Bo‘sh vaqt', className: 'task-category-free', dot: 'bg-[#6ea883]' },
};

const filters: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'Barchasi' },
  { value: 'important', label: 'Muhim' },
  { value: 'this_week', label: 'Shu hafta' },
  { value: 'this_month', label: 'Shu oy' },
  { value: 'this_year', label: 'Shu yil' },
  { value: 'free_time', label: 'Bo‘sh vaqtda' },
];

const emptyForm: TaskFormValues = { title: '', description: '', category: 'this_week', dueDate: '', priority: 'normal', subtasks: [] };
const priorities: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Past', className: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  normal: { label: 'O‘rtacha', className: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200' },
  high: { label: 'Yuqori', className: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200' },
};

function taskIsInCurrentPeriod(task: Task, filter: TaskFilter) {
  if (filter === 'all' || filter === task.category) return true;
  return false;
}

function formatDueDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(getCurrentIntlLocale(), { day: 'numeric', month: 'short' }).format(date);
}

function TaskForm({
  editingTask,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  editingTask: Task | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  isPending: boolean;
  error: string;
}) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: editingTask
      ? { title: editingTask.title, description: editingTask.description ?? '', category: editingTask.category, dueDate: editingTask.dueDate ?? '', priority: editingTask.priority, subtasks: editingTask.subtasks }
      : emptyForm,
  });
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const subtasks = form.watch('subtasks') ?? [];
  const addSubtask = () => {
    const title = subtaskDraft.trim();
    if (!title || subtasks.length >= 30) return;
    form.setValue('subtasks', [...subtasks, { id: crypto.randomUUID(), title, completed: false }], { shouldDirty: true });
    setSubtaskDraft('');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-task">
        <div>
          <label htmlFor="task-title" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Nomi</label>
          <input id="task-title" {...form.register('title')} maxLength={160} autoFocus placeholder="Masalan, hisob-kitoblarni ko‘rib chiqish" className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background px-4 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[#b89c5c] focus:ring-2 focus:ring-[#b89c5c]/20" data-testid="input-task-title" />
          {form.formState.errors.title && <p className="mt-1.5 text-[12px] text-destructive" role="alert" data-testid="status-task-title-error">{form.formState.errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="task-description" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Izoh <span className="font-normal normal-case tracking-normal">(ixtiyoriy)</span></label>
          <textarea id="task-description" {...form.register('description')} maxLength={1000} rows={3} placeholder="Topshiriq haqida qisqacha..." className="mt-2 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-[13px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-[#b89c5c] focus:ring-2 focus:ring-[#b89c5c]/20" data-testid="input-task-description" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="task-category" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Toifa</label>
            <select id="task-category" {...form.register('category')} className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-[#b89c5c] focus:ring-2 focus:ring-[#b89c5c]/20" data-testid="select-task-category">
              {Object.entries(categories).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="task-due-date" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Muddat <span className="font-normal normal-case tracking-normal">(ixtiyoriy)</span></label>
            <input id="task-due-date" type="date" {...form.register('dueDate')} className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-[#b89c5c] focus:ring-2 focus:ring-[#b89c5c]/20" data-testid="input-task-due-date" />
          </div>
          <div>
            <label htmlFor="task-priority" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Ustuvorlik</label>
            <select id="task-priority" {...form.register('priority')} className="mt-2 min-h-12 w-full rounded-2xl border border-input bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c] focus:ring-2 focus:ring-[#b89c5c]/20" data-testid="select-task-priority">{Object.entries(priorities).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select>
          </div>
        </div>
        <div className="rounded-2xl border border-border/80 bg-background/60 p-3.5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-semibold">Qadamlar ro‘yxati</p><p className="mt-1 text-[11px] text-muted-foreground">{subtasks.length}/30 kichik vazifa</p></div><Check size={16} className="text-[#6ea883]" /></div>
          {subtasks.length > 0 && <ul className="mt-3 space-y-2">{subtasks.map((subtask, index) => <li key={subtask.id} className="flex items-center gap-2"><input type="checkbox" checked={subtask.completed} onChange={(event) => form.setValue('subtasks', subtasks.map((item, itemIndex) => itemIndex === index ? { ...item, completed: event.target.checked } : item), { shouldDirty: true })} aria-label={formatSubtaskCompletionAriaLabel(subtask.title)} className="size-4 accent-[#47796c]" /><input value={subtask.title} onChange={(event) => form.setValue('subtasks', subtasks.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item), { shouldDirty: true })} maxLength={160} className="min-h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-[12px]" aria-label={`Qadam ${index + 1}`} data-testid={`input-task-subtask-${index}`} /><button type="button" onClick={() => form.setValue('subtasks', subtasks.filter((_, itemIndex) => itemIndex !== index), { shouldDirty: true })} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Qadamni o‘chirish"><X size={15} /></button></li>)}</ul>}
          <div className="mt-3 flex gap-2"><input value={subtaskDraft} onChange={(event) => setSubtaskDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSubtask(); } }} maxLength={160} placeholder="Kichik qadam qo‘shing..." disabled={subtasks.length >= 30} className="min-h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-[12px] disabled:opacity-50" aria-label="Yangi kichik vazifa" data-testid="input-new-task-subtask" /><button type="button" onClick={addSubtask} disabled={!subtaskDraft.trim() || subtasks.length >= 30} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-muted px-3 text-[11px] font-semibold hover:bg-muted/70 disabled:opacity-45" data-testid="button-add-task-subtask"><Plus size={14} /> Qo‘shish</button></div>
        </div>
        {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive" role="alert" data-testid="status-task-mutation-error">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={isPending} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-save-task">
            {isPending ? <span className="size-4 animate-pulse rounded-full bg-current/50" /> : <Check size={17} />}
            {editingTask ? 'Saqlash' : 'Topshiriqni qo‘shish'}
          </button>
          <button type="button" onClick={onClose} disabled={isPending} className="grid size-12 place-items-center rounded-2xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50" aria-label="Bekor qilish" data-testid="button-cancel-task"><X size={17} /></button>
        </div>
      </form>
    </Form>
  );
}

export function TasksPage() {
  const queryClient = useQueryClient();
  const tasksQuery = useListTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [toggleError, setToggleError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [pomodoroTask, setPomodoroTask] = useState('');

  const tasks = tasksQuery.data ?? [];
  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => taskIsInCurrentPeriod(task, filter));
    return [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const priorityOrder: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [filter, tasks]);

  const completedCount = visibleTasks.filter((task) => task.completed).length;
  const mutationPending = createTask.isPending || updateTask.isPending;

  const closeComposer = () => {
    setComposerOpen(false);
    setEditingTask(null);
    setFormError('');
  };

  const openCreate = () => {
    setEditingTask(null);
    setFormError('');
    setComposerOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormError('');
    setComposerOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });

  const submitTask = (values: TaskFormValues) => {
    setFormError('');
    const payload = {
      title: values.title.trim(),
      category: values.category,
      description: values.description.trim() || null,
      dueDate: values.dueDate || null,
      priority: values.priority,
      subtasks: values.subtasks.map((subtask) => ({ ...subtask, title: subtask.title.trim() })),
    };
    if (editingTask) {
      const data: TaskUpdate = payload;
      updateTask.mutate({ id: editingTask.id, data }, {
        onSuccess: () => { invalidate(); closeComposer(); },
        onError: () => setFormError('Topshiriqni saqlashda xatolik yuz berdi. Qayta urinib ko‘ring.'),
      });
    } else {
      const data: TaskInput = payload;
      createTask.mutate({ data }, {
        onSuccess: () => { invalidate(); closeComposer(); },
        onError: () => setFormError('Topshiriqni qo‘shishda xatolik yuz berdi. Qayta urinib ko‘ring.'),
      });
    }
  };

  const toggleTask = (task: Task) => {
    setToggleError('');
    updateTask.mutate({ id: task.id, data: { completed: !task.completed } }, {
      onSuccess: invalidate,
      onError: () => setToggleError('Topshiriq holatini saqlab bo‘lmadi. Qayta urinib ko‘ring.'),
    });
  };

  const toggleSubtask = (task: Task, subtaskId: string) => {
    setToggleError('');
    updateTask.mutate({ id: task.id, data: { subtasks: task.subtasks.map((subtask) => subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask) } }, {
      onSuccess: invalidate,
      onError: () => setToggleError('Kichik vazifa holatini saqlab bo‘lmadi. Qayta urinib ko‘ring.'),
    });
  };

  const handOffToPomodoro = (task: Task) => {
    setPomodoroTask(task.title);
    window.setTimeout(() => document.getElementById('pomodoro-timer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const removeTask = (task: Task) => {
    if (!window.confirm(formatContentDeleteConfirmation(task.title, 'task'))) return;
    setDeleteError('');
    setPendingDeleteId(task.id);
    deleteTask.mutate({ id: task.id }, {
      onSuccess: () => { setPendingDeleteId(null); invalidate(); },
      onError: () => { setPendingDeleteId(null); setDeleteError('Topshiriqni o‘chirishda xatolik yuz berdi.'); },
    });
  };

  return (
    <DiaryShell>
      <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
        <PomodoroTimer taskName={pomodoroTask} onClearTask={() => setPomodoroTask('')} />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b89c5c]"><span className="size-1.5 rounded-full bg-[#b89c5c]" /> Shaxsiy reja</div>
            <h1 className="mt-3 font-serif text-[clamp(2.65rem,6vw,4.7rem)] leading-[.92] tracking-[-.055em]">Topshiriqlar<span className="text-[#b89c5c]">.</span></h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">Kundalik rejalarni bir joyga jamlang. Muhim ishlar ham, bo‘sh vaqtdagi kichik niyatlar ham shu yerda.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="button-create-task"><Plus size={18} /> Yangi topshiriq</button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-card-border bg-card px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Joriy ko‘rinish</p><p className="mt-2 font-mono text-2xl text-foreground" data-testid="text-task-progress">{completedCount}<span className="text-muted-foreground">/{visibleTasks.length}</span></p><p className="mt-1 text-[11px] text-muted-foreground">bajarilgan topshiriq</p></div>
          <div className="rounded-[22px] border border-card-border bg-card px-5 py-4 sm:col-span-2"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sokin ritm</p><span className="font-mono text-[11px] text-muted-foreground">{visibleTasks.length ? Math.round((completedCount / visibleTasks.length) * 100) : 0}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#6ea883] transition-[width] duration-500" style={{ width: `${visibleTasks.length ? (completedCount / visibleTasks.length) * 100 : 0}%` }} /></div><p className="mt-2 text-[11px] text-muted-foreground">Bugungi rejalaringizga bosim emas, aniqlik qo‘shing.</p></div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 rounded-[22px] border border-card-border bg-card p-2" role="tablist" aria-label="Topshiriqlar filtri">
          {filters.map((item) => <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} onClick={() => setFilter(item.value)} className={`min-h-10 rounded-xl px-3.5 text-[12px] font-semibold transition-colors ${filter === item.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} data-testid={`tab-task-filter-${item.value}`}>{item.label}</button>)}
        </div>

        {deleteError && <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12px] text-destructive" role="alert" data-testid="status-task-delete-error">{deleteError}</p>}
        {toggleError && <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12px] text-destructive" role="alert" data-testid="status-task-toggle-error">{toggleError}</p>}
        {tasksQuery.isLoading ? (
          <div className="mt-5 grid gap-3" aria-label="Topshiriqlar yuklanmoqda" data-testid="status-tasks-loading">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-28 rounded-[22px]" />)}</div>
        ) : tasksQuery.isError ? (
          <div className="mt-5 rounded-[24px] border border-destructive/30 bg-destructive/10 px-6 py-12 text-center" role="alert" data-testid="status-tasks-error"><ListTodo size={23} className="mx-auto text-destructive" /><h2 className="mt-3 font-serif text-2xl">Topshiriqlarni yuklab bo‘lmadi.</h2><p className="mt-2 text-[12px] text-muted-foreground">Aloqani tekshirib, qayta urinib ko‘ring.</p><button type="button" onClick={() => tasksQuery.refetch()} className="mt-5 rounded-xl border border-border bg-card px-4 py-2.5 text-[12px] font-semibold hover:bg-muted" data-testid="button-retry-tasks">Qayta urinish</button></div>
        ) : visibleTasks.length ? (
          <div className="mt-5 space-y-3" aria-label="Topshiriqlar ro‘yxati">
            {visibleTasks.map((task) => {
              const meta = categories[task.category];
              return (
                <article key={task.id} className={`group relative overflow-hidden rounded-[22px] border border-card-border bg-card px-4 py-4 shadow-sm transition-all duration-300 hover:border-[#b89c5c]/50 hover:shadow-md sm:px-5 ${task.completed ? 'opacity-70' : ''}`} data-testid={`card-task-${task.id}`}>
                  <span className={`absolute inset-y-0 left-0 w-1 ${meta.dot}`} />
                  <div className="flex items-start gap-3 pl-1">
                    <button type="button" onClick={() => toggleTask(task)} disabled={updateTask.isPending} className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-all duration-300 ${task.completed ? 'border-[#6ea883] bg-[#6ea883] text-[#17221c]' : 'border-border text-transparent hover:border-[#6ea883]'}`} aria-label={task.completed ? 'Bajarilmagan deb belgilash' : 'Bajarildi deb belgilash'} aria-pressed={task.completed} data-testid={`button-toggle-task-${task.id}`}>{task.completed ? <Check size={15} strokeWidth={2.5} /> : <Circle size={13} />}</button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${priorities[task.priority].className}`}>{priorities[task.priority].label}</span>{task.dueDate && <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarDays size={12} />{formatDueDate(task.dueDate)}</span>}</div>
                      <h2 className={`mt-2 break-words text-[15px] font-semibold leading-snug transition-all duration-300 ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`} data-testid={`text-task-title-${task.id}`}>{task.title}</h2>
                      {task.description && <p className={`mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground ${task.completed ? 'line-through' : ''}`}>{task.description}</p>}
                       {task.subtasks.length > 0 && <div className="mt-3" data-testid={`task-subtasks-${task.id}`}><p className="mb-1 text-[10px] font-semibold text-muted-foreground">{task.subtasks.filter((subtask) => subtask.completed).length}/{task.subtasks.length} qadam bajarildi</p><ul className="space-y-1">{task.subtasks.map((subtask) => <li key={subtask.id} className="flex items-center gap-2"><input type="checkbox" checked={subtask.completed} disabled={updateTask.isPending} onChange={() => toggleSubtask(task, subtask.id)} aria-label={formatSubtaskCompletionAriaLabel(subtask.title)} className="size-4 accent-[#47796c] disabled:opacity-50" /><span className={`min-w-0 break-words text-[11px] ${subtask.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{subtask.title}</span></li>)}</ul></div>}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" onClick={() => handOffToPomodoro(task)} className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-[#dcebe4] hover:text-[#35614f]" aria-label={formatTaskPomodoroAriaLabel(task.title)} title="Pomodoro taymeri" data-testid={`button-task-pomodoro-${task.id}`}><Timer size={15} /></button>
                      <button type="button" onClick={() => openEdit(task)} disabled={updateTask.isPending || deleteTask.isPending} className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label="Topshiriqni tahrirlash" data-testid={`button-edit-task-${task.id}`}><Pencil size={15} /></button>
                      <button type="button" onClick={() => removeTask(task)} disabled={deleteTask.isPending} className="grid size-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" aria-label="Topshiriqni o‘chirish" data-testid={`button-delete-task-${task.id}`}>{pendingDeleteId === task.id ? <span className="size-3 animate-pulse rounded-full bg-current" /> : <Trash2 size={15} />}</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-border bg-card/50 px-6 py-16 text-center" data-testid="status-tasks-empty"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground"><Clock3 size={24} strokeWidth={1.5} /></span><h2 className="mt-5 font-serif text-[28px]">{tasks.length ? 'Bu filtrda topshiriq yo‘q.' : 'Rejalaringiz uchun joy tayyor.'}</h2><p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-muted-foreground">{tasks.length ? 'Boshqa filtrni tanlang yoki yangi topshiriq qo‘shing.' : 'Birinchi topshirig‘ingizni yozing — keyin uni bajarish ancha yengil bo‘ladi.'}</p><button type="button" onClick={openCreate} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-[12px] font-semibold text-primary-foreground" data-testid="button-empty-create-task"><Plus size={16} /> Yangi topshiriq</button></div>
        )}
      </div>

      {composerOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#08070d]/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="task-form-title" data-testid="dialog-task-form">
        <div className="max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[28px] border border-border bg-card p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b89c5c]">{editingTask ? 'Tahrirlash' : 'Yangi reja'}</p><h2 id="task-form-title" className="mt-1 font-serif text-[30px] leading-none">{editingTask ? 'Topshiriqni tahrirlash' : 'Yangi topshiriq'}</h2><p className="mt-2 text-[12px] text-muted-foreground">Fikrni aniq yozing, qolganini keyin hal qilasiz.</p></div><button type="button" onClick={closeComposer} disabled={mutationPending} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Oynani yopish" data-testid="button-close-task-form"><X size={18} /></button></div>
          <TaskForm key={editingTask?.id ?? 'new'} editingTask={editingTask} onClose={closeComposer} onSubmit={submitTask} isPending={mutationPending} error={formError} />
        </div>
      </div>}
    </DiaryShell>
  );
}

export default TasksPage;