import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CloudRain,
  Coffee,
  Edit3,
  FolderOpen,
  Trees,
  Headphones,
  ListPlus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Sprout,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
  X,
} from 'lucide-react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type SoundKind = 'rain' | 'cafe' | 'forest' | 'whiteNoise';
type ReportRange = 'kun' | 'hafta' | 'oy';

type FocusTask = {
  id: string;
  title: string;
  project: string;
  estimate: number;
  completedPomodoros: number;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
};

type FocusSession = {
  id: string;
  startedAt: number;
  durationMinutes: number;
  mode: TimerMode;
  taskId?: string;
  project: string;
};

type TimerSnapshot = {
  mode: TimerMode;
  remaining: number;
  running: boolean;
  endAt: number | null;
  activeTaskId: string | null;
  cycle: number;
};

type WorkspaceData = {
  tasks: FocusTask[];
  sessions: FocusSession[];
  timer: TimerSnapshot;
  sound: SoundKind | null;
};

const MODE_INFO: Record<TimerMode, { label: string; seconds: number; note: string; color: string }> = {
  focus: { label: 'Diqqat vaqti', seconds: 25 * 60, note: 'Bir ishga yumshoq, chuqur e’tibor.', color: '#a56c34' },
  shortBreak: { label: 'Qisqa tanaffus', seconds: 5 * 60, note: 'Ko‘zlaringizni va fikringizni bo‘shating.', color: '#47796c' },
  longBreak: { label: 'Uzoq tanaffus', seconds: 15 * 60, note: 'Bir necha davrdan so‘ng kengroq nafas.', color: '#706283' },
};

const SOUND_INFO: Record<SoundKind, { label: string; icon: ReactNode; description: string }> = {
  rain: { label: 'Yomg‘ir', icon: <CloudRain size={16} />, description: 'Deraza ortidagi mayin shovqin' },
  cafe: { label: 'Kafe', icon: <Coffee size={16} />, description: 'Uzoqdagi sokin suhbatlar' },
  forest: { label: 'O‘rmon', icon: <Trees size={16} />, description: 'Barglar orasidagi yengil shamol' },
  whiteNoise: { label: 'Oq shovqin', icon: <Waves size={16} />, description: 'Bir tekis, toza fon' },
};

const EMPTY_TIMER: TimerSnapshot = {
  mode: 'focus',
  remaining: MODE_INFO.focus.seconds,
  running: false,
  endAt: null,
  activeTaskId: null,
  cycle: 0,
};

const EMPTY_WORKSPACE: WorkspaceData = { tasks: [], sessions: [], timer: EMPTY_TIMER, sound: null };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function readableDay(timestamp: number) {
  return new Intl.DateTimeFormat('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(timestamp));
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeWorkspace(value: unknown): WorkspaceData {
  if (!isObject(value)) return EMPTY_WORKSPACE;
  const tasks = Array.isArray(value.tasks) ? value.tasks.filter(isObject).map((task) => ({
    id: String(task.id ?? makeId('vazifa')),
    title: String(task.title ?? 'Nomsiz vazifa'),
    project: String(task.project ?? 'Shaxsiy'),
    estimate: Math.max(1, Number(task.estimate) || 1),
    completedPomodoros: Math.max(0, Number(task.completedPomodoros) || 0),
    completed: Boolean(task.completed),
    createdAt: Number(task.createdAt) || Date.now(),
    completedAt: Number(task.completedAt) || undefined,
  })) : [];
  const sessions = Array.isArray(value.sessions) ? value.sessions.filter(isObject).map((session): FocusSession => {
    const mode: TimerMode = session.mode === 'shortBreak' || session.mode === 'longBreak' ? session.mode : 'focus';
    return {
      id: String(session.id ?? makeId('sessiya')),
      startedAt: Number(session.startedAt) || Date.now(),
      durationMinutes: Math.max(1, Number(session.durationMinutes) || 25),
      mode,
      taskId: typeof session.taskId === 'string' ? session.taskId : undefined,
      project: String(session.project ?? 'Shaxsiy'),
    };
  }) : [];
  const rawTimer = isObject(value.timer) ? value.timer : {};
  const mode: TimerMode = rawTimer.mode === 'shortBreak' || rawTimer.mode === 'longBreak' ? rawTimer.mode : 'focus';
  const snapshot: TimerSnapshot = {
    mode,
    remaining: Math.max(0, Number(rawTimer.remaining) || MODE_INFO[mode].seconds),
    running: Boolean(rawTimer.running) && Number(rawTimer.endAt) > Date.now(),
    endAt: Number(rawTimer.endAt) > Date.now() ? Number(rawTimer.endAt) : null,
    activeTaskId: typeof rawTimer.activeTaskId === 'string' ? rawTimer.activeTaskId : null,
    cycle: Math.max(0, Number(rawTimer.cycle) || 0),
  };
  if (snapshot.running && snapshot.endAt) snapshot.remaining = Math.max(0, Math.ceil((snapshot.endAt - Date.now()) / 1000));
  return {
    tasks,
    sessions,
    timer: snapshot,
    sound: value.sound === 'rain' || value.sound === 'cafe' || value.sound === 'forest' || value.sound === 'whiteNoise' ? value.sound : null,
  };
}

function getPeriodStart(range: ReportRange) {
  const date = new Date();
  if (range === 'oy') return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  if (range === 'hafta') return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 6).getTime();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function progressForTask(task: FocusTask) {
  return Math.min(100, Math.round((task.completedPomodoros / Math.max(1, task.estimate)) * 100));
}

function AmbientSoundStudio({
  selected,
  onSelect,
}: {
  selected: SoundKind | null;
  onSelect: (sound: SoundKind | null) => void;
}) {
  const audioRef = useRef<{ context: AudioContext; source: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const [volume, setVolume] = useState(0.22);
  const [audioError, setAudioError] = useState('');

  const stop = () => {
    if (audioRef.current) {
      try {
        audioRef.current.source.stop();
        void audioRef.current.context.close();
      } catch {
        // AudioContext may already be closed by the browser.
      }
      audioRef.current = null;
    }
  };

  const start = (kind: SoundKind) => {
    stop();
    try {
      const AudioContextConstructor = window.AudioContext
        ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('audio');
      const context = new AudioContextConstructor();
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) {
        const noise = Math.random() * 2 - 1;
        channel[index] = kind === 'whiteNoise' ? noise * 0.45 : noise * (kind === 'rain' ? 0.22 : kind === 'cafe' ? 0.1 : 0.07);
      }
      const source = context.createBufferSource();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      source.buffer = buffer;
      source.loop = true;
      filter.type = kind === 'rain' ? 'bandpass' : kind === 'forest' ? 'lowpass' : 'lowpass';
      filter.frequency.value = kind === 'rain' ? 1800 : kind === 'cafe' ? 900 : kind === 'forest' ? 620 : 4200;
      gain.gain.value = volume;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      source.start();
      audioRef.current = { context, source, gain };
      void context.resume();
      setAudioError('');
    } catch {
      setAudioError('Ovoz bu brauzerda ishga tushmadi.');
      onSelect(null);
    }
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.gain.gain.value = volume;
  }, [volume]);

  useEffect(() => () => stop(), []);

  const choose = (kind: SoundKind) => {
    if (selected === kind) {
      stop();
      onSelect(null);
      return;
    }
    start(kind);
    onSelect(kind);
  };

  return (
    <section className="rounded-[26px] border border-[#d9d4c2] bg-[#f7f6ee] p-5 shadow-sm dark:border-[#4c4a3f] dark:bg-[#292b26]" data-testid="ambient-sounds">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Sokin fon</p>
          <h2 className="mt-1 font-serif text-[25px] leading-none">Ovozli makon</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Diqqatni ushlab turadigan tabiiy tovushni tanlang.</p>
        </div>
        <span className={`grid size-9 place-items-center rounded-xl ${selected ? 'bg-[#dcebe4] text-[#47796c]' : 'bg-[#e9e4d4] text-[#887d6b]'}`}><Headphones size={17} /></span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {(Object.keys(SOUND_INFO) as SoundKind[]).map((kind) => (
          <button
            type="button"
            key={kind}
            onClick={() => choose(kind)}
            aria-pressed={selected === kind}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all ${selected === kind ? 'border-[#87ac99] bg-[#e0eee7] text-[#315d4e] shadow-sm dark:border-[#527a67] dark:bg-[#263e34] dark:text-[#c5e4d2]' : 'border-transparent bg-[#eeece2] text-muted-foreground hover:border-[#c8c1aa] hover:text-foreground dark:bg-[#34362f]'}`}
            data-testid={`button-sound-${kind}`}
          >
            {SOUND_INFO[kind].icon}
            <span className="min-w-0"><span className="block font-semibold">{SOUND_INFO[kind].label}</span><span className="mt-0.5 block truncate text-[9px] opacity-70">{SOUND_INFO[kind].description}</span></span>
          </button>
        ))}
      </div>
      <label className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground">
        <VolumeX size={13} />
        <input type="range" min="0" max="0.6" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="h-1 w-full accent-[#47796c]" aria-label="Ovoz balandligi" />
        <Volume2 size={13} />
      </label>
      {audioError && <p className="mt-3 text-[10px] text-destructive" role="status">{audioError}</p>}
    </section>
  );
}

function FocusTimer({
  timer,
  tasks,
  onTimerChange,
  onSession,
}: {
  timer: TimerSnapshot;
  tasks: FocusTask[];
  onTimerChange: (next: TimerSnapshot) => void;
  onSession: (mode: TimerMode, taskId: string | null, minutes: number) => void;
}) {
  const [notice, setNotice] = useState('');
  const modeInfo = MODE_INFO[timer.mode];
  const remaining = timer.running && timer.endAt ? Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)) : timer.remaining;
  const progress = Math.min(1, Math.max(0, 1 - remaining / modeInfo.seconds));
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const activeTask = tasks.find((task) => task.id === timer.activeTaskId);

  useEffect(() => {
    if (!timer.running || !timer.endAt) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.ceil((timer.endAt as number - Date.now()) / 1000));
      if (left > 0) {
        onTimerChange({ ...timer, remaining: left });
        return;
      }
      const completedMode = timer.mode;
      if (completedMode === 'focus') onSession('focus', timer.activeTaskId, 25);
      const nextCycle = completedMode === 'focus' ? timer.cycle + 1 : timer.cycle;
      const nextMode: TimerMode = completedMode === 'focus' ? (nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak') : 'focus';
      onTimerChange({
        mode: nextMode,
        remaining: MODE_INFO[nextMode].seconds,
        running: false,
        endAt: null,
        activeTaskId: timer.activeTaskId,
        cycle: nextCycle,
      });
      setNotice(completedMode === 'focus' ? 'Diqqat davri tugadi. Endi tanaffus vaqti.' : 'Tanaffus tugadi. Yana bir davrga tayyormisiz?');
      window.setTimeout(() => setNotice(''), 4500);
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timer, onSession, onTimerChange]);

  const startOrPause = () => {
    if (timer.running && timer.endAt) {
      const left = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      onTimerChange({ ...timer, remaining: left, running: false, endAt: null });
      return;
    }
    if (timer.remaining <= 0) return;
    onTimerChange({ ...timer, running: true, endAt: Date.now() + timer.remaining * 1000 });
    setNotice('');
  };

  const reset = () => {
    onTimerChange({ ...timer, remaining: modeInfo.seconds, running: false, endAt: null });
    setNotice('');
  };

  const skip = () => {
    const nextCycle = timer.mode === 'focus' ? timer.cycle + 1 : timer.cycle;
    const nextMode: TimerMode = timer.mode === 'focus' ? (nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak') : 'focus';
    onTimerChange({ ...timer, mode: nextMode, remaining: MODE_INFO[nextMode].seconds, running: false, endAt: null, cycle: nextCycle });
    setNotice('Keyingi davr tayyor.');
  };

  const selectMode = (mode: TimerMode) => {
    if (timer.running) return;
    onTimerChange({ ...timer, mode, remaining: MODE_INFO[mode].seconds, endAt: null });
    setNotice('');
  };

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[#d8c795] bg-[#faf3df] p-5 shadow-sm dark:border-[#5e5037] dark:bg-[#302a20] sm:p-7" data-testid="focus-timer">
      <div className="absolute -right-24 -top-28 size-72 rounded-full border-[38px] border-[#f0e3bd]/80 dark:border-[#443924]" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Bugungi ritm</p>
          <h2 className="mt-2 font-serif text-[32px] leading-[.95] tracking-[-.035em]">Bir davr. Bir nafas.</h2>
          <p className="mt-2 max-w-xs text-[11px] leading-relaxed text-[#75664b] dark:text-[#d4c49b]">{modeInfo.note}</p>
        </div>
        <div className="rounded-full border border-[#d8c795] bg-[#fff9e9]/70 px-3 py-1.5 font-mono text-[10px] text-[#8e6d34] dark:border-[#665837] dark:bg-[#3d3425] dark:text-[#dcc78d]">
          {timer.cycle} davr yakunlangan
        </div>
      </div>
      <div className="relative mt-5 flex flex-col items-center">
        <div className="relative size-[250px] sm:size-[280px]">
          <svg viewBox="0 0 260 260" className="-rotate-90 size-full" aria-hidden="true">
            <circle cx="130" cy="130" r={radius} fill="none" stroke="#eadfbe" strokeWidth="10" />
            <circle cx="130" cy="130" r={radius} fill="none" stroke={modeInfo.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="transition-[stroke-dashoffset] duration-300" />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em]" style={{ color: modeInfo.color }}>{modeInfo.label}</p>
              <p className="mt-2 font-mono text-[47px] leading-none tracking-[-.08em] text-[#493c2b] dark:text-[#f1e4c3]" data-testid="text-timer">{formatClock(remaining)}</p>
              <p className="mt-3 max-w-[150px] truncate text-[11px] text-[#88775b] dark:text-[#cdbf9c]">{activeTask ? activeTask.title : 'Vazifa tanlanmagan'}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Taymer rejimlari">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((mode) => (
            <button key={mode} type="button" role="tab" aria-selected={timer.mode === mode} disabled={timer.running} onClick={() => selectMode(mode)} className={`rounded-full px-3 py-1.5 text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${timer.mode === mode ? 'bg-[#493c2b] text-[#fff8e6] dark:bg-[#ead49c] dark:text-[#332b1e]' : 'text-[#89795d] hover:bg-[#eee2c3] dark:text-[#cfc09c] dark:hover:bg-[#433925]'}`} data-testid={`button-timer-mode-${mode}`}>
              {MODE_INFO[mode].label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={startOrPause} className="inline-flex items-center gap-2 rounded-xl bg-[#493c2b] px-5 py-3 text-[12px] font-semibold text-[#fff8e6] shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-[#e6cf94] dark:text-[#352c20]" data-testid="button-timer-start-pause">
          {timer.running ? <Pause size={15} /> : <Play size={15} />} {timer.running ? 'Pauza' : 'Boshlash'}
        </button>
        <button type="button" onClick={skip} className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a] transition-colors hover:bg-[#f4e8c9] dark:border-[#665837] dark:bg-[#3a3023] dark:text-[#ead9aa]" data-testid="button-timer-skip"><SkipForward size={14} /> O‘tkazish</button>
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a] transition-colors hover:bg-[#f4e8c9] dark:border-[#665837] dark:bg-[#3a3023] dark:text-[#ead9aa]" data-testid="button-timer-reset"><RotateCcw size={14} /> Qayta</button>
      </div>
      <div className="relative mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-[#e1d4ae] pt-4 dark:border-[#5a4d38]">
        <label className="flex items-center gap-2 text-[10px] text-[#89775a] dark:text-[#cfc09d]">
          <span>Hozirgi vazifa</span>
          <select value={timer.activeTaskId ?? ''} onChange={(event) => onTimerChange({ ...timer, activeTaskId: event.target.value || null })} disabled={timer.running} className="max-w-[190px] rounded-lg border border-[#d8c795] bg-[#fff9e9] px-2 py-1.5 text-[10px] text-[#4e422f] outline-none focus:ring-2 focus:ring-[#a56c34]/30 dark:border-[#665837] dark:bg-[#3b3224] dark:text-[#f0dfb5]" data-testid="select-timer-task">
            <option value="">Vazifani tanlang</option>
            {tasks.filter((task) => !task.completed).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </label>
      </div>
      <p className="relative mt-3 min-h-4 text-center text-[10px] text-[#876f41] dark:text-[#d6c18c]" aria-live="polite">{notice || (timer.running ? 'Vaqt ketmoqda. Yozishda davom eting.' : 'Taymer boshlashga tayyor.')}</p>
    </section>
  );
}

function TaskRow({
  task,
  active,
  onToggle,
  onDelete,
  onSelect,
  onEdit,
}: {
  task: FocusTask;
  active: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onEdit: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const save = () => {
    if (draft.trim()) onEdit(draft.trim());
    setEditing(false);
  };
  return (
    <div className={`group rounded-2xl border p-3 transition-all ${task.completed ? 'border-[#dce5dc] bg-[#f4f8f3] dark:border-[#3b4b3d] dark:bg-[#273329]' : active ? 'border-[#c5aa70] bg-[#fff9e9] shadow-sm dark:border-[#76603b] dark:bg-[#3b3224]' : 'border-[#e3e0d4] bg-card hover:border-[#c9bea5] dark:border-[#45473e]'}`} data-testid={`task-row-${task.id}`}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={onToggle} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-all ${task.completed ? 'border-[#47796c] bg-[#47796c] text-white' : 'border-[#b8af99] text-transparent hover:border-[#47796c]'}`} aria-label={task.completed ? 'Vazifani qayta ochish' : 'Vazifani bajarilgan deb belgilash'} data-testid={`button-task-complete-${task.id}`}>
          <Check size={12} strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') save(); if (event.key === 'Escape') setEditing(false); }} onBlur={save} className="w-full rounded-md border border-[#cdbb91] bg-transparent px-1 py-0.5 text-[13px] outline-none" aria-label="Vazifa nomi" />
          ) : (
            <button type="button" onClick={onSelect} className={`block max-w-full truncate text-left text-[13px] font-medium ${task.completed ? 'text-[#708277] line-through' : 'text-foreground'}`} title="Taymer uchun tanlash">{task.title}</button>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ede9dc] px-2 py-1 dark:bg-[#3b3b32]"><FolderOpen size={10} /> {task.project}</span>
            <span>{task.completedPomodoros}/{task.estimate} davr</span>
            <span className="h-1 w-16 overflow-hidden rounded-full bg-[#e4e1d7] dark:bg-[#45463c]"><span className="block h-full rounded-full bg-[#91b09f]" style={{ width: `${progressForTask(task)}%` }} /></span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button type="button" onClick={() => { setDraft(task.title); setEditing(true); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Vazifani tahrirlash" title="Tahrirlash"><Edit3 size={13} /></button>
          <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-[#fae7e1] hover:text-destructive" aria-label="Vazifani o‘chirish" title="O‘chirish"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function FocusReports({ sessions, tasks }: { sessions: FocusSession[]; tasks: FocusTask[] }) {
  const [range, setRange] = useState<ReportRange>('hafta');
  const start = getPeriodStart(range);
  const reportSessions = sessions.filter((session) => session.mode === 'focus' && session.startedAt >= start);
  const minutes = reportSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const todayMinutes = sessions.filter((session) => session.mode === 'focus' && dayKey(session.startedAt) === dayKey(Date.now())).reduce((sum, session) => sum + session.durationMinutes, 0);
  const projectData = useMemo(() => {
    const totals = new Map<string, number>();
    reportSessions.forEach((session) => totals.set(session.project || 'Shaxsiy', (totals.get(session.project || 'Shaxsiy') ?? 0) + session.durationMinutes));
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [reportSessions]);
  const maxProject = Math.max(1, ...projectData.map(([, value]) => value));
  const maxDaily = Math.max(25, ...Array.from({ length: 7 }, (_, index) => {
    const timestamp = Date.now() - (6 - index) * 86400000;
    return sessions.filter((session) => session.mode === 'focus' && dayKey(session.startedAt) === dayKey(timestamp)).reduce((sum, session) => sum + session.durationMinutes, 0);
  }));
  const days = Array.from({ length: 7 }, (_, index) => Date.now() - (6 - index) * 86400000);
  return (
    <section className="rounded-[26px] border border-[#ddd9ca] bg-card p-5 shadow-sm sm:p-6" data-testid="focus-reports">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Sokin hisob</p>
          <h2 className="mt-1 font-serif text-[27px] leading-none">Fokus hisobotlari</h2>
        </div>
        <div className="flex rounded-xl bg-muted p-1" role="tablist" aria-label="Hisobot davri">
          {([['kun', 'Bugun'], ['hafta', '7 kun'], ['oy', 'Oy']] as [ReportRange, string][]).map(([item, label]) => (
            <button key={item} type="button" role="tab" aria-selected={range === item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-1.5 text-[10px] transition-colors ${range === item ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`button-report-${item}`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl bg-[#f5f1e5] p-4 dark:bg-[#30322c]">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-[10px] text-muted-foreground">Tanlangan davr</p><p className="mt-1 font-mono text-[32px] leading-none text-[#47796c]">{Math.floor(minutes / 60)}<span className="ml-1 text-[14px]">soat</span> {minutes % 60}<span className="ml-1 text-[14px]">daq</span></p></div>
            <BarChart3 size={20} className="text-[#a56c34]" />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{reportSessions.length ? `${reportSessions.length} ta diqqat davri yozildi.` : 'Bu davr uchun hali sessiya yo‘q.'}</p>
          <div className="mt-4 border-t border-[#ddd5bf] pt-3 text-[10px] text-muted-foreground dark:border-[#4b4d43]">Bugun: <strong className="text-foreground">{todayMinutes} daqiqa</strong></div>
        </div>
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Kunlar bo‘yicha</p>
          <div className="flex h-[116px] items-end gap-2">
            {days.map((timestamp) => {
              const value = sessions.filter((session) => session.mode === 'focus' && dayKey(session.startedAt) === dayKey(timestamp)).reduce((sum, session) => sum + session.durationMinutes, 0);
              return <div key={dayKey(timestamp)} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="font-mono text-[9px] text-muted-foreground">{value || ''}</span><div className="flex h-[76px] w-full items-end rounded-lg bg-[#f0eee5] dark:bg-[#34372f]"><div className="w-full rounded-lg bg-[#83a998] transition-[height]" style={{ height: `${Math.max(value ? 8 : 3, (value / maxDaily) * 100)}%` }} /></div><span className="text-[9px] text-muted-foreground">{new Intl.DateTimeFormat('uz-UZ', { weekday: 'short' }).format(new Date(timestamp)).slice(0, 2)}</span></div>;
            })}
          </div>
        </div>
      </div>
      <div className="mt-6 border-t border-border/70 pt-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Loyihalar taqsimoti</p>
        {projectData.length ? <div className="space-y-3">{projectData.map(([project, value], index) => <div key={project} className="grid grid-cols-[minmax(90px,.5fr)_1fr_42px] items-center gap-3 text-[11px]"><span className="truncate">{project}</span><span className="h-2 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${index % 2 ? 'bg-[#b88b68]' : 'bg-[#6e9b87]'}`} style={{ width: `${(value / maxProject) * 100}%` }} /></span><span className="font-mono text-[9px] text-muted-foreground">{value} daq</span></div>)}</div> : <p className="rounded-xl bg-muted px-3 py-4 text-[11px] text-muted-foreground">Sessiyalar yozilgach, loyihalar shu yerda ko‘rinadi.</p>}
      </div>
      <div className="mt-6 border-t border-border/70 pt-5">
        <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Sessiya kalendari</p><span className="text-[9px] text-muted-foreground">So‘nggi 12 hafta</span></div>
        <div className="mt-3 grid grid-cols-12 gap-1.5">
          {Array.from({ length: 84 }, (_, index) => {
            const timestamp = Date.now() - (83 - index) * 86400000;
            const value = sessions.filter((session) => session.mode === 'focus' && dayKey(session.startedAt) === dayKey(timestamp)).length;
            return <span key={dayKey(timestamp)} title={`${readableDay(timestamp)}: ${value} sessiya`} className={`aspect-square rounded-[3px] ${value >= 3 ? 'bg-[#47796c]' : value === 2 ? 'bg-[#82a995]' : value === 1 ? 'bg-[#bed2c4]' : 'bg-[#ecebe4] dark:bg-[#3a3d36]'}`} />;
          })}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground"><span>kam</span><span className="size-2.5 rounded-[3px] bg-[#ecebe4] dark:bg-[#3a3d36]" /><span className="size-2.5 rounded-[3px] bg-[#bed2c4]" /><span className="size-2.5 rounded-[3px] bg-[#82a995]" /><span className="size-2.5 rounded-[3px] bg-[#47796c]" /><span>ko‘p</span></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5ef] px-2.5 py-1.5 text-[#47796c]"><CheckCircle2 size={12} /> {tasks.filter((task) => task.completed).length} ta bajarilgan vazifa</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5eee2] px-2.5 py-1.5 text-[#8d7047]"><Circle size={11} /> {tasks.filter((task) => !task.completed).length} ta ochiq vazifa</span>
      </div>
    </section>
  );
}

export function FocusTodoWorkspace({ storageKey }: { storageKey: string }) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [filter, setFilter] = useState('Hammasi');
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('Shaxsiy');
  const [newEstimate, setNewEstimate] = useState('2');
  const [taskPanel, setTaskPanel] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setWorkspace(safeWorkspace(JSON.parse(raw)));
    } catch {
      setStorageError('Saqlangan ma’lumotlar o‘qilmadi. Yangi ma’lumotlar shu oynada davom etadi.');
    } finally {
      setReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(workspace));
      setStorageError('');
    } catch {
      setStorageError('Brauzer xotirasi to‘ldi. Ma’lumotlarni eksport qilish yoki eski vazifalarni o‘chirishni sinab ko‘ring.');
    }
  }, [workspace, storageKey, ready]);

  const tasks = workspace.tasks;
  const projects = useMemo(() => ['Hammasi', ...Array.from(new Set(tasks.map((task) => task.project).filter(Boolean)))], [tasks]);
  const visibleTasks = tasks.filter((task) => (filter === 'Hammasi' || task.project === filter) && (showCompleted || !task.completed)).sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt);
  const activeTask = tasks.find((task) => task.id === workspace.timer.activeTaskId);
  const openCount = tasks.filter((task) => !task.completed).length;
  const todayFocus = workspace.sessions.filter((session) => session.mode === 'focus' && dayKey(session.startedAt) === dayKey(Date.now())).reduce((sum, session) => sum + session.durationMinutes, 0);
  const estimatedPomodoros = tasks.reduce((sum, task) => sum + task.estimate, 0);
  const completedPomodoros = tasks.reduce((sum, task) => sum + task.completedPomodoros, 0);

  const updateTimer = (timer: TimerSnapshot) => setWorkspace((current) => ({ ...current, timer }));
  const addSession = (mode: TimerMode, taskId: string | null, minutes: number) => {
    if (mode !== 'focus') return;
    setWorkspace((current) => ({
      ...current,
      sessions: [...current.sessions, { id: makeId('sessiya'), startedAt: Date.now() - minutes * 60000, durationMinutes: minutes, mode, taskId: taskId ?? undefined, project: current.tasks.find((task) => task.id === taskId)?.project ?? 'Shaxsiy' }],
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, completedPomodoros: task.completedPomodoros + 1 } : task),
    }));
  };

  const submitTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const task: FocusTask = { id: makeId('vazifa'), title, project: newProject.trim() || 'Shaxsiy', estimate: Math.max(1, Number(newEstimate) || 1), completedPomodoros: 0, completed: false, createdAt: Date.now() };
    setWorkspace((current) => ({ ...current, tasks: [task, ...current.tasks] }));
    setNewTitle('');
    setNewProject('Shaxsiy');
    setNewEstimate('2');
  };

  const toggleTask = (id: string) => setWorkspace((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed, completedAt: !task.completed ? Date.now() : undefined } : task), timer: current.timer.activeTaskId === id && !current.tasks.find((task) => task.id === id)?.completed ? { ...current.timer, activeTaskId: null } : current.timer }));
  const deleteTask = (id: string) => setWorkspace((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id), timer: current.timer.activeTaskId === id ? { ...current.timer, activeTaskId: null } : current.timer }));
  const renameTask = (id: string, title: string) => setWorkspace((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, title } : task) }));
  const selectTask = (id: string) => updateTimer({ ...workspace.timer, activeTaskId: id });

  if (!ready) {
    return <div className="space-y-5" aria-busy="true"><div className="skeleton h-10 w-64 rounded-2xl" /><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="skeleton h-[520px] rounded-[30px]" /><div className="skeleton h-[520px] rounded-[26px]" /></div></div>;
  }

  return (
    <div className="space-y-7">
      {storageError && <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e7c4b8] bg-[#fff1ec] px-4 py-3 text-[11px] text-[#8f493b]" role="alert"><span>{storageError}</span><button type="button" onClick={() => setStorageError('')} aria-label="Xabarni yopish"><X size={14} /></button></div>}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#9a6b23]">Fokus kundaligi</p>
          <h1 className="mt-2 font-serif text-[clamp(2.8rem,6vw,5.3rem)] leading-[.88] tracking-[-.055em]">Bugun nimaga<br /><em className="text-[#47796c]">joy</em> ochasiz?</h1>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#ddd6c5] overflow-hidden rounded-2xl border border-[#d8d3c2] bg-card shadow-sm dark:divide-[#45463c]">
          <div className="px-3 py-2.5"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Bugun</span><strong className="mt-1 block font-serif text-[19px] leading-none">{todayFocus} <span className="text-[10px] font-normal">daq</span></strong></div>
          <div className="px-3 py-2.5"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Reja</span><strong className="mt-1 block font-serif text-[19px] leading-none">{estimatedPomodoros} <span className="text-[10px] font-normal">davr</span></strong></div>
          <div className="px-3 py-2.5"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Bajarildi</span><strong className="mt-1 block font-serif text-[19px] leading-none text-[#47796c]">{completedPomodoros} <span className="text-[10px] font-normal text-foreground">davr</span></strong></div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <FocusTimer timer={workspace.timer} tasks={tasks} onTimerChange={updateTimer} onSession={addSession} />
        <section className="rounded-[26px] border border-[#ddd9ca] bg-card p-5 shadow-sm sm:p-6" data-testid="task-workspace">
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Ishlar daftarim</p><h2 className="mt-1 font-serif text-[28px] leading-none">Vazifalar<span className="text-[#a56c34]">.</span></h2><p className="mt-2 text-[11px] text-muted-foreground">{openCount} ta vazifa ochiq</p></div>
            <button type="button" onClick={() => setTaskPanel((value) => !value)} className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground hover:text-foreground" aria-expanded={taskPanel} aria-controls="task-panel" title="Vazifalar panelini ochish"><ListPlus size={16} /></button>
          </div>
          {taskPanel && <div id="task-panel">
            <form onSubmit={submitTask} className="mt-5 rounded-2xl bg-[#f5f3ea] p-3 dark:bg-[#30322c]" data-testid="form-add-task">
              <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Yangi vazifa nomi..." className="w-full bg-transparent px-1 py-2 text-[13px] outline-none placeholder:text-muted-foreground/70" aria-label="Yangi vazifa nomi" />
              <div className="mt-2 flex flex-wrap gap-2">
                <input value={newProject} onChange={(event) => setNewProject(event.target.value)} placeholder="Loyiha yoki papka" className="min-w-0 flex-1 rounded-lg border border-[#dcd8ca] bg-card px-2.5 py-2 text-[10px] outline-none focus:border-[#9bb7a7] dark:border-[#484a41]" aria-label="Loyiha nomi" />
                <select value={newEstimate} onChange={(event) => setNewEstimate(event.target.value)} className="rounded-lg border border-[#dcd8ca] bg-card px-2 py-2 text-[10px] outline-none dark:border-[#484a41]" aria-label="Pomodoro taxmini"><option value="1">1 davr · 25 daq</option><option value="2">2 davr · 50 daq</option><option value="3">3 davr · 75 daq</option><option value="4">4 davr · 100 daq</option><option value="8">8 davr · 200 daq</option></select>
                <button type="submit" disabled={!newTitle.trim()} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[10px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-add-task"><Plus size={13} /> Qo‘shish</button>
              </div>
            </form>
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Loyiha filtrlari">
              {projects.map((project) => <button key={project} type="button" role="tab" aria-selected={filter === project} onClick={() => setFilter(project)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] transition-colors ${filter === project ? 'bg-[#47796c] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{project}</button>)}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground"><span>{activeTask ? `Taymerda: ${activeTask.title}` : 'Taymer uchun vazifani tanlang'}</span><button type="button" onClick={() => setShowCompleted((value) => !value)} className="font-semibold text-[#47796c]">{showCompleted ? 'Bajarilganlarni yashirish' : 'Bajarilganlarni ko‘rsatish'}</button></div>
            <div className="mt-3 max-h-[338px] space-y-2 overflow-y-auto pr-1">{visibleTasks.length ? visibleTasks.map((task) => <TaskRow key={task.id} task={task} active={task.id === workspace.timer.activeTaskId} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} onSelect={() => selectTask(task.id)} onEdit={(title) => renameTask(task.id, title)} />) : <div className="rounded-2xl border border-dashed border-[#d8d1bd] px-4 py-10 text-center dark:border-[#514e40]"><Circle size={20} className="mx-auto text-[#b7ae98]" /><p className="mt-3 font-serif text-[20px]">Bu yer hali ochiq.</p><p className="mt-1 text-[11px] text-muted-foreground">Birinchi vazifangizni yozib, kuningizga shakl bering.</p></div>}</div>
          </div>}
        </section>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <FocusReports sessions={workspace.sessions} tasks={tasks} />
        <AmbientSoundStudio selected={workspace.sound} onSelect={(sound) => setWorkspace((current) => ({ ...current, sound }))} />
      </div>
      <div className="flex items-center justify-center gap-2 pb-3 text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full bg-[#a56c34]" /> Barcha ma’lumotlar faqat ushbu brauzerda saqlanadi <span className="size-1.5 rounded-full bg-[#47796c]" /></div>
    </div>
  );
}