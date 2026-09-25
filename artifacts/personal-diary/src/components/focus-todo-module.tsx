import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  AudioLines,
  BarChart3,
  Bell,
  Building2,
  Check,
  Circle,
  CloudLightning,
  Clock3,
  CloudRain,
  Coffee,
  Edit3,
  Flame,
  FolderOpen,
  Headphones,
  ListChecks,
  Moon,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SkipForward,
  Trash2,
  Trees,
  Volume2,
  VolumeX,
  Waves,
  X,
} from 'lucide-react';
import { ambientSounds, useAmbientSound, type AmbientSound } from '@/components/ambient-sound';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type ReportRange = 'kun' | 'hafta' | 'oy';
type WorkspaceTab = 'timer' | 'tasks' | 'reports' | 'settings';

type FocusSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  notificationSound: boolean;
  strictMode: boolean;
};
type DurationSettingKey = 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes';

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
  settings: FocusSettings;
};

const DEFAULT_SETTINGS: FocusSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  notificationSound: true,
  strictMode: false,
};
const MAX_TIMER_MINUTES = 180;
const DURATION_PRESETS: Record<DurationSettingKey, number[]> = {
  focusMinutes: [25, 45, 60],
  shortBreakMinutes: [5, 10, 15],
  longBreakMinutes: [15, 30, 45],
};

const EMPTY_TIMER: TimerSnapshot = {
  mode: 'focus',
  remaining: DEFAULT_SETTINGS.focusMinutes * 60,
  running: false,
  endAt: null,
  activeTaskId: null,
  cycle: 0,
};

const EMPTY_WORKSPACE: WorkspaceData = {
  tasks: [],
  sessions: [],
  timer: EMPTY_TIMER,
  settings: DEFAULT_SETTINGS,
};

const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Diqqat vaqti',
  shortBreak: 'Qisqa tanaffus',
  longBreak: 'Uzoq tanaffus',
};

const MODE_COLORS: Record<TimerMode, string> = {
  focus: '#9b6543',
  shortBreak: '#47796c',
  longBreak: '#706283',
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function readableDay(timestamp: number) {
  return new Intl.DateTimeFormat('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(timestamp));
}

function readableTime(timestamp: number) {
  return new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function secondsForMode(mode: TimerMode, settings: FocusSettings) {
  const minutes = mode === 'focus' ? settings.focusMinutes : mode === 'shortBreak' ? settings.shortBreakMinutes : settings.longBreakMinutes;
  return Math.min(MAX_TIMER_MINUTES, Math.max(1, Math.trunc(minutes))) * 60;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeDuration(value: unknown, fallback: number) {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_TIMER_MINUTES, Math.max(1, Math.trunc(parsed)));
}

function parseDurationInput(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return Math.min(MAX_TIMER_MINUTES, parsed);
}

function safeWorkspace(value: unknown): WorkspaceData {
  if (!isObject(value)) return EMPTY_WORKSPACE;
  const rawSettings = isObject(value.settings) ? value.settings : {};
  const settings: FocusSettings = {
    focusMinutes: safeDuration(rawSettings.focusMinutes, DEFAULT_SETTINGS.focusMinutes),
    shortBreakMinutes: safeDuration(rawSettings.shortBreakMinutes, DEFAULT_SETTINGS.shortBreakMinutes),
    longBreakMinutes: safeDuration(rawSettings.longBreakMinutes, DEFAULT_SETTINGS.longBreakMinutes),
    notificationSound: rawSettings.notificationSound !== false,
    strictMode: Boolean(rawSettings.strictMode),
  };
  const tasks = Array.isArray(value.tasks)
    ? value.tasks.filter(isObject).map((task) => ({
      id: String(task.id ?? makeId('vazifa')),
      title: String(task.title ?? 'Nomsiz vazifa'),
      project: String(task.project ?? 'Shaxsiy'),
      estimate: Math.max(1, Number(task.estimate) || 1),
      completedPomodoros: Math.max(0, Number(task.completedPomodoros) || 0),
      completed: Boolean(task.completed),
      createdAt: Number(task.createdAt) || Date.now(),
      completedAt: Number(task.completedAt) || undefined,
    }))
    : [];
  const sessions = Array.isArray(value.sessions)
    ? value.sessions.filter(isObject).map((session): FocusSession => {
      const mode: TimerMode = session.mode === 'shortBreak' || session.mode === 'longBreak' ? session.mode : 'focus';
      return {
        id: String(session.id ?? makeId('sessiya')),
        startedAt: Number(session.startedAt) || Date.now(),
        durationMinutes: Math.max(1, Number(session.durationMinutes) || settings.focusMinutes),
        mode,
        taskId: typeof session.taskId === 'string' ? session.taskId : undefined,
        project: String(session.project ?? 'Shaxsiy'),
      };
    })
    : [];
  const rawTimer = isObject(value.timer) ? value.timer : {};
  const mode: TimerMode = rawTimer.mode === 'shortBreak' || rawTimer.mode === 'longBreak' ? rawTimer.mode : 'focus';
  const endAt = Number(rawTimer.endAt);
  const running = Boolean(rawTimer.running) && endAt > Date.now();
  const timer: TimerSnapshot = {
    mode,
    remaining: running ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : Math.max(0, Number(rawTimer.remaining) || secondsForMode(mode, settings)),
    running,
    endAt: running ? endAt : null,
    activeTaskId: typeof rawTimer.activeTaskId === 'string' ? rawTimer.activeTaskId : null,
    cycle: Math.max(0, Number(rawTimer.cycle) || 0),
  };
  return {
    tasks,
    sessions,
    timer,
    settings,
  };
}

function progressForTask(task: FocusTask) {
  return Math.min(100, Math.round((task.completedPomodoros / Math.max(1, task.estimate)) * 100));
}

function getPeriodStart(range: ReportRange) {
  const date = new Date();
  if (range === 'oy') return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  if (range === 'hafta') return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 6).getTime();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function playNotification() {
  try {
    const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return;
    const context = new Constructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
    window.setTimeout(() => void context.close(), 600);
  } catch {
    // Brauzer ovozni bloklashi mumkin; taymer baribir davom etadi.
  }
}

const SOUND_ICONS: Record<AmbientSound, ReactNode> = {
  rain: <CloudRain size={16} />,
  storm: <CloudLightning size={16} />,
  forest: <Trees size={16} />,
  'forest-night': <Moon size={16} />,
  cafe: <Coffee size={16} />,
  'white-noise': <AudioLines size={16} />,
  ocean: <Waves size={16} />,
  fireplace: <Flame size={16} />,
  'night-city': <Building2 size={16} />,
  'lofi-piano': <Music2 size={16} />,
  library: <Building2 size={16} />,
  train: <Clock3 size={16} />,
  'rain-tent': <CloudRain size={16} />,
  'space-rumble': <AudioLines size={16} />,
  waterfall: <Waves size={16} />,
  'lofi-beats': <Music2 size={16} />,
};

function AmbientSoundStudio() {
  const { primary, mix, setSelected, setVolume, setNoiseColor, play, toggle } = useAmbientSound();
  const primaryOption = ambientSounds.find((sound) => sound.value === primary.selected);
  const mixOption = ambientSounds.find((sound) => sound.value === mix.selected);
  const noiseOptions = [
    { value: 'white' as const, label: 'Oq' },
    { value: 'pink' as const, label: 'Pushti' },
    { value: 'brown' as const, label: 'Jigarrang' },
  ];

  const choose = (kind: AmbientSound) => {
    if (primary.selected === kind && primary.playing) {
      void toggle('primary');
      return;
    }
    void play('primary', kind);
  };

  const sourceDetails = (option: typeof primaryOption, testId: string) => option?.sourceUrl && (
    <p className="text-[9px] leading-relaxed text-muted-foreground">
      <a href={option.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2" data-testid={testId}>
        Manba: {option.attribution ?? 'Mixkit'}
      </a>
      {option.licenseUrl && <> · <a href={option.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2" data-testid={`${testId}-license`}>litsenziya</a></>}
    </p>
  );

  return (
    <section className="border-t border-[#ddd6c5] pt-5 dark:border-[#41453d]" data-testid="ambient-sounds">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Sokin fon</p>
          <h2 className="mt-1 font-serif text-[26px] leading-none">Ovozli makon</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">16 ta muhitdan tanlang yoki ikki tovushni alohida boshqaring.</p>
        </div>
        <span className={`grid size-9 place-items-center rounded-xl ${primary.playing || mix.playing ? 'bg-[#dcebe4] text-[#47796c]' : 'bg-[#e9e4d4] text-[#887d6b]'}`}><Headphones size={17} /></span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f5f3ea] p-2.5 dark:bg-[#30322c]">
        <button
          type="button"
          onClick={() => { void toggle('primary'); }}
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#47796c] text-white transition-transform hover:scale-105"
          aria-label={primary.playing ? 'Asosiy fon tovushini to‘xtatish' : 'Asosiy fon tovushini boshlash'}
          aria-pressed={primary.playing}
          data-testid="button-ambient-studio-toggle"
        >
          {primary.playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <div className="min-w-0 flex-1 text-[10px] text-muted-foreground" role="status" aria-live="polite" data-testid="status-ambient-studio">
          {primary.playing ? <>Asosiy: <span className="font-semibold text-foreground">{primaryOption?.label}</span></> : 'Asosiy tovush pauzada'}
          {mix.playing && <span className="ml-2 text-[#47796c] dark:text-[#b9d7c4]">+ {mixOption?.label}</span>}
        </div>
        {(primary.playing || mix.playing) && <span className="size-2 animate-pulse rounded-full bg-[#47796c]" aria-label="Faol" />}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
        {ambientSounds.map((sound) => {
          const active = primary.selected === sound.value && primary.playing;
          const chosen = primary.selected === sound.value;
          const mixChosen = mix.selected === sound.value;
          return (
            <button
              type="button"
              key={sound.value}
              onClick={() => choose(sound.value)}
              aria-pressed={active}
              aria-label={`${active ? 'To‘xtatish' : 'Boshlash'}: ${sound.label} · asosiy qatlam`}
              className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-[11px] transition-colors ${active ? 'border-[#87ac99] bg-[#e0eee7] text-[#315d4e] shadow-sm dark:border-[#527a67] dark:bg-[#263e34] dark:text-[#c5e4d2]' : chosen ? 'border-[#c8c1aa] bg-[#f2efe5] text-foreground dark:bg-[#3b3d35]' : mixChosen ? 'border-[#d4b98c] bg-[#f1eadb] text-foreground dark:border-[#766447] dark:bg-[#3b372c]' : 'border-transparent bg-[#eeece2] text-muted-foreground hover:border-[#c8c1aa] hover:text-foreground dark:bg-[#34362f]'}`}
              data-testid={`button-sound-${sound.value}`}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${active ? 'bg-white/70 dark:bg-black/15' : 'bg-white/60 dark:bg-black/10'}`}>{SOUND_ICONS[sound.value]}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{sound.label}</span>
                <span className="mt-0.5 block truncate text-[9px] opacity-70">{sound.description}</span>
              </span>
              <span className="shrink-0 opacity-70">{mixChosen && !chosen ? <span className="text-[8px]">2-q</span> : active ? <Pause size={12} /> : <Play size={12} />}</span>
            </button>
          );
        })}
      </div>

      {primary.selected === 'white-noise' && (
        <div className="mt-3 rounded-xl bg-[#f5f3ea] p-3 dark:bg-[#30322c]" aria-label="Shovqin rangi">
          <p className="mb-2 text-[9px] font-medium text-muted-foreground">Shovqin rangi</p>
          <div className="grid grid-cols-3 gap-1.5">
            {noiseOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setNoiseColor('primary', option.value)}
                aria-pressed={primary.noiseColor === option.value}
                className={`rounded-lg px-2 py-1.5 text-[9px] transition-colors ${primary.noiseColor === option.value ? 'bg-[#47796c] font-semibold text-white' : 'bg-white/70 text-muted-foreground hover:text-foreground dark:bg-black/15'}`}
                data-testid={`button-noise-color-primary-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground">
        <VolumeX size={13} />
        <input type="range" min={0} max={100} value={primary.volume} onChange={(event) => setVolume('primary', Number(event.target.value))} className="h-1 w-full accent-[#47796c]" aria-label="Asosiy ovoz balandligi" data-testid="input-ambient-volume-primary-studio" />
        <Volume2 size={13} />
        <span className="w-8 text-right font-mono">{primary.volume}%</span>
      </label>

      <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">Qayta ijroda qisqa ustma-ust o‘tish ishlaydi. {primary.selected === 'white-noise' ? 'Shovqin brauzerda yaratiladi.' : primaryOption?.duration && ` · ${primaryOption.duration}`}</p>
      {sourceDetails(primaryOption, 'link-ambient-source-primary-studio')}
      {primary.error && <p className="mt-3 text-[10px] text-destructive" role="alert" data-testid="status-audio-error">{primary.error}</p>}

      <div className="mt-4 rounded-xl border border-[#ddd6c5] bg-[#f8f6ec] p-3 dark:border-[#41453d] dark:bg-[#2a2d26]" data-testid="ambient-mix-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold">Ikkinchi qatlam</p>
            <p className="mt-0.5 text-[9px] text-muted-foreground">Mustaqil ovoz darajasi bilan birga ijro eting.</p>
          </div>
          {mix.selected && <button type="button" onClick={() => { void toggle('mix'); }} className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#47796c] text-white" aria-label={mix.playing ? 'Ikkinchi tovushni to‘xtatish' : 'Ikkinchi tovushni boshlash'} aria-pressed={mix.playing} data-testid="button-ambient-mix-studio-toggle">{mix.playing ? <Pause size={13} /> : <Play size={13} />}</button>}
        </div>
        <label className="mt-3 block text-[9px] text-muted-foreground" htmlFor="ambient-mix-select-studio">Aralashtirish uchun tovush</label>
        <select id="ambient-mix-select-studio" value={mix.selected ?? ''} onChange={(event) => setSelected('mix', event.target.value ? event.target.value as AmbientSound : null)} className="mt-1 w-full rounded-lg border border-[#ddd6c5] bg-white px-2.5 py-2 text-[10px] text-foreground outline-none focus:ring-2 focus:ring-[#87ac99] dark:border-[#41453d] dark:bg-[#22251f]" data-testid="select-ambient-mix-studio">
          <option value="">Tovush tanlang</option>
          {ambientSounds.map((sound) => <option key={sound.value} value={sound.value}>{sound.label}</option>)}
        </select>
        {mix.selected && (
          <>
            {mix.selected === 'white-noise' && (
              <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Ikkinchi qatlam shovqin rangi">
                {noiseOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setNoiseColor('mix', option.value)}
                    aria-pressed={mix.noiseColor === option.value}
                    className={`rounded-lg px-2 py-1.5 text-[9px] transition-colors ${mix.noiseColor === option.value ? 'bg-[#47796c] font-semibold text-white' : 'bg-white/70 text-muted-foreground hover:text-foreground dark:bg-black/15'}`}
                    data-testid={`button-noise-color-mix-${option.value}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <label className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
              <VolumeX size={13} />
              <input type="range" min={0} max={100} value={mix.volume} onChange={(event) => setVolume('mix', Number(event.target.value))} className="h-1 w-full accent-[#47796c]" aria-label="Ikkinchi qatlam ovoz balandligi" data-testid="input-ambient-mix-volume-studio" />
              <Volume2 size={13} />
              <span className="w-8 text-right font-mono">{mix.volume}%</span>
            </label>
            {sourceDetails(mixOption, 'link-ambient-source-mix-studio')}
            {mix.error && <p className="mt-2 text-[10px] text-destructive" role="alert" data-testid="status-audio-mix-error">{mix.error}</p>}
          </>
        )}
      </div>
    </section>
  );
}

function FocusTimer({
  timer,
  tasks,
  settings,
  onTimerChange,
  onSession,
}: {
  timer: TimerSnapshot;
  tasks: FocusTask[];
  settings: FocusSettings;
  onTimerChange: (next: TimerSnapshot) => void;
  onSession: (mode: TimerMode, taskId: string | null, minutes: number) => void;
}) {
  const [notice, setNotice] = useState('');
  const timerRef = useRef(timer);
  const changeRef = useRef(onTimerChange);
  const sessionRef = useRef(onSession);
  const completionRef = useRef('');
  timerRef.current = timer;
  changeRef.current = onTimerChange;
  sessionRef.current = onSession;

  const modeInfo = { label: MODE_LABELS[timer.mode], seconds: secondsForMode(timer.mode, settings), color: MODE_COLORS[timer.mode] };
  const remaining = timer.running && timer.endAt ? Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)) : timer.remaining;
  const progress = Math.min(1, Math.max(0, 1 - remaining / modeInfo.seconds));
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const activeTask = tasks.find((task) => task.id === timer.activeTaskId);

  useEffect(() => {
    if (!timer.running || !timer.endAt) return undefined;
    const endAt = timer.endAt;
    const completionKey = `${timer.mode}-${endAt}`;
    const tick = () => {
      const current = timerRef.current;
      if (!current.running || current.endAt !== endAt) return;
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (left > 0) {
        if (current.remaining !== left) changeRef.current({ ...current, remaining: left });
        return;
      }
      if (completionRef.current === completionKey) return;
      completionRef.current = completionKey;
      const completedMode = current.mode;
      const nextCycle = completedMode === 'focus' ? current.cycle + 1 : current.cycle;
      const nextMode: TimerMode = completedMode === 'focus' ? (nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak') : 'focus';
      if (completedMode === 'focus') sessionRef.current('focus', current.activeTaskId, settings.focusMinutes);
      if (settings.notificationSound) playNotification();
      changeRef.current({ mode: nextMode, remaining: secondsForMode(nextMode, settings), running: false, endAt: null, activeTaskId: current.activeTaskId, cycle: nextCycle });
      setNotice(completedMode === 'focus' ? 'Diqqat davri tugadi. Endi tanaffus vaqti.' : 'Tanaffus tugadi. Yana bir davrga tayyormisiz?');
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timer.running, timer.endAt, timer.mode, settings]);

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
    onTimerChange({ ...timer, remaining: secondsForMode(timer.mode, settings), running: false, endAt: null });
    setNotice('');
  };

  const skip = () => {
    if (settings.strictMode && timer.mode === 'focus') {
      setNotice('Qat’iy rejimda diqqat davrini o‘tkazib yuborib bo‘lmaydi.');
      return;
    }
    const nextCycle = timer.mode === 'focus' ? timer.cycle + 1 : timer.cycle;
    const nextMode: TimerMode = timer.mode === 'focus' ? (nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak') : 'focus';
    onTimerChange({ ...timer, mode: nextMode, remaining: secondsForMode(nextMode, settings), running: false, endAt: null, cycle: nextCycle });
    setNotice('Keyingi davr tayyor.');
  };

  const selectMode = (mode: TimerMode) => {
    if (timer.running) return;
    onTimerChange({ ...timer, mode, remaining: secondsForMode(mode, settings), endAt: null });
    setNotice('');
  };

  return (
    <section className="flex min-h-[min(700px,calc(100dvh-15rem))] flex-col items-center justify-center px-0 py-4 sm:py-8" data-testid="focus-timer">
      <div className="flex w-full items-center justify-between gap-4 px-1">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Hozirgi davr</p>
          <p className="mt-1 text-[12px] font-semibold text-[#493c2b] dark:text-[#f1e4c3]">{modeInfo.label}</p>
        </div>
        <div className="font-mono text-[10px] text-[#8e6d34] dark:text-[#dcc78d]" data-testid="text-cycle-count">{timer.cycle} davr yakunlangan</div>
      </div>
      <div className="mt-5 flex flex-col items-center">
        <div className="relative size-[300px] sm:size-[360px] lg:size-[390px]">
          <svg viewBox="0 0 260 260" className="-rotate-90 size-full" aria-hidden="true">
            <circle cx="130" cy="130" r={radius} fill="none" stroke="#ddd6c5" strokeWidth="7" className="dark:stroke-[#41453d]" />
            <circle cx="130" cy="130" r={radius} fill="none" stroke={modeInfo.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="transition-[stroke-dashoffset] duration-300" />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em]" style={{ color: modeInfo.color }}>{modeInfo.label}</p>
              <p className="mt-2 font-mono text-[clamp(2.8rem,8vw,4rem)] leading-none tracking-[-.08em] text-[#493c2b] dark:text-[#f1e4c3]" data-testid="text-timer">{formatClock(remaining)}</p>
              <p className="mt-3 max-w-[180px] truncate text-[11px] text-[#88775b] dark:text-[#cdbf9c]" data-testid="text-active-task">{activeTask ? activeTask.title : 'Vazifa tanlanmagan'}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Taymer rejimlari">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((mode) => (
            <button key={mode} type="button" role="tab" aria-selected={timer.mode === mode} disabled={timer.running} onClick={() => selectMode(mode)} className={`rounded-full px-3 py-1.5 text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${timer.mode === mode ? 'bg-[#493c2b] text-[#fff8e6] dark:bg-[#ead49c] dark:text-[#332b1e]' : 'text-[#89795d] hover:bg-[#eee2c3] dark:text-[#cfc09c] dark:hover:bg-[#433925]'}`} data-testid={`button-timer-mode-${mode}`}>{MODE_LABELS[mode]}</button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={startOrPause} className="inline-flex items-center gap-2 rounded-xl bg-[#493c2b] px-6 py-3 text-[12px] font-semibold text-[#fff8e6] shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-[#e6cf94] dark:text-[#352c20]" data-testid="button-timer-start-pause">
          {timer.running ? <Pause size={15} /> : <Play size={15} />} {timer.running ? 'Pauza' : 'Boshlash'}
        </button>
        <button type="button" onClick={skip} disabled={settings.strictMode && timer.mode === 'focus'} className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a] transition-colors hover:bg-[#f4e8c9] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#665837] dark:bg-[#3a3023] dark:text-[#ead9aa]" data-testid="button-timer-skip" title={settings.strictMode && timer.mode === 'focus' ? 'Qat’iy rejimda diqqat davrini o‘tkazib yuborib bo‘lmaydi' : 'Keyingi davrga o‘tish'}><SkipForward size={14} /> O‘tkazish</button>
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 px-3.5 py-3 text-[11px] font-semibold text-[#67563a] transition-colors hover:bg-[#f4e8c9] dark:border-[#665837] dark:bg-[#3a3023] dark:text-[#ead9aa]" data-testid="button-timer-reset"><RotateCcw size={14} /> Qayta</button>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-[#e1d4ae] pt-4 dark:border-[#5a4d38]">
        <label className="flex items-center gap-2 text-[10px] text-[#89775a] dark:text-[#cfc09d]">
          <span>Hozirgi vazifa</span>
          <select value={timer.activeTaskId ?? ''} onChange={(event) => onTimerChange({ ...timer, activeTaskId: event.target.value || null })} disabled={timer.running} className="max-w-[220px] rounded-lg border border-[#d8c795] bg-[#fff9e9] px-2 py-1.5 text-[10px] text-[#4e422f] outline-none focus:ring-2 focus:ring-[#a56c34]/30 disabled:opacity-60 dark:border-[#665837] dark:bg-[#3b3224] dark:text-[#f0dfb5]" data-testid="select-timer-task">
            <option value="">Vazifani tanlang</option>
            {tasks.filter((task) => !task.completed).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 min-h-4 text-center text-[10px] text-[#876f41] dark:text-[#d6c18c]" aria-live="polite" data-testid="status-timer">{notice || (settings.strictMode && timer.mode === 'focus' ? 'Qat’iy rejim faol: diqqat davri tugamaguncha o‘tkazib bo‘lmaydi.' : timer.running ? 'Vaqt ketmoqda. Yozishda davom eting.' : 'Taymer boshlashga tayyor.')}</p>
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
    <div className={`group rounded-2xl border p-3 transition-colors ${task.completed ? 'border-[#dce5dc] bg-[#f4f8f3] dark:border-[#3b4b3d] dark:bg-[#273329]' : active ? 'border-[#c5aa70] bg-[#fff9e9] shadow-sm dark:border-[#76603b] dark:bg-[#3b3224]' : 'border-[#e3e0d4] bg-card hover:border-[#c9bea5] dark:border-[#45473e]'}`} data-testid={`task-row-${task.id}`}>
      <div className="flex items-start gap-3">
        <button type="button" onClick={onToggle} className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${task.completed ? 'border-[#47796c] bg-[#47796c] text-white' : 'border-[#b8af99] text-transparent hover:border-[#47796c]'}`} aria-label={task.completed ? 'Vazifani qayta ochish' : 'Vazifani bajarilgan deb belgilash'} data-testid={`button-task-complete-${task.id}`}><Check size={12} strokeWidth={3} /></button>
        <div className="min-w-0 flex-1">
          {editing ? <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') save(); if (event.key === 'Escape') setEditing(false); }} onBlur={save} className="w-full rounded-md border border-[#cdbb91] bg-transparent px-1 py-0.5 text-[13px] outline-none" aria-label="Vazifa nomi" data-testid={`input-task-edit-${task.id}`} /> : <button type="button" onClick={onSelect} className={`block max-w-full truncate text-left text-[13px] font-medium ${task.completed ? 'text-[#708277] line-through' : 'text-foreground'}`} title="Taymer uchun tanlash" data-testid={`button-task-select-${task.id}`}>{task.title}</button>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ede9dc] px-2 py-1 dark:bg-[#3b3b32]"><FolderOpen size={10} /> {task.project}</span>
            <span data-testid={`text-task-progress-${task.id}`}>{task.completedPomodoros}/{task.estimate} davr</span>
            <span className="h-1 w-16 overflow-hidden rounded-full bg-[#e4e1d7] dark:bg-[#45463c]"><span className="block h-full rounded-full bg-[#91b09f]" style={{ width: `${progressForTask(task)}%` }} /></span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button type="button" onClick={() => { setDraft(task.title); setEditing(true); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Vazifani tahrirlash" title="Tahrirlash" data-testid={`button-task-edit-${task.id}`}><Edit3 size={13} /></button>
          <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-[#fae7e1] hover:text-destructive" aria-label="Vazifani o‘chirish" title="O‘chirish" data-testid={`button-task-delete-${task.id}`}><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function FocusReports({ sessions, tasks }: { sessions: FocusSession[]; tasks: FocusTask[] }) {
  const [range, setRange] = useState<ReportRange>('hafta');
  const start = getPeriodStart(range);
  const focusSessions = sessions.filter((session) => session.mode === 'focus');
  const reportSessions = focusSessions.filter((session) => session.startedAt >= start);
  const minutes = reportSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const todayMinutes = focusSessions.filter((session) => dayKey(session.startedAt) === dayKey(Date.now())).reduce((sum, session) => sum + session.durationMinutes, 0);
  const projectData = useMemo(() => {
    const totals = new Map<string, number>();
    reportSessions.forEach((session) => totals.set(session.project || 'Shaxsiy', (totals.get(session.project || 'Shaxsiy') ?? 0) + session.durationMinutes));
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [reportSessions]);
  const days = Array.from({ length: 7 }, (_, index) => Date.now() - (6 - index) * 86400000);
  const dailyValues = days.map((timestamp) => focusSessions.filter((session) => dayKey(session.startedAt) === dayKey(timestamp)).reduce((sum, session) => sum + session.durationMinutes, 0));
  const maxDaily = Math.max(25, ...dailyValues);
  const maxProject = Math.max(1, ...projectData.map(([, value]) => value));
  const logs = [...reportSessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 12);
  return (
    <section className="space-y-5" data-testid="focus-reports">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Sokin hisob</p><h2 className="mt-1 font-serif text-[clamp(2rem,4vw,3.1rem)] leading-none">Fokus hisobotlari</h2><p className="mt-2 max-w-xl text-[11px] leading-relaxed text-muted-foreground">Diqqat vaqtingizni kuzating, qaysi ishlar kuningizni to‘ldirayotganini ko‘ring.</p></div>
        <div className="flex rounded-xl bg-muted p-1" role="tablist" aria-label="Hisobot davri">
          {([['kun', 'Bugun'], ['hafta', '7 kun'], ['oy', 'Oy']] as [ReportRange, string][]).map(([item, label]) => <button key={item} type="button" role="tab" aria-selected={range === item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-1.5 text-[10px] transition-colors ${range === item ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`button-report-${item}`}>{label}</button>)}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#e6efe8] p-5 dark:bg-[#283c32]" data-testid="metric-focus-time"><p className="text-[10px] text-[#527463] dark:text-[#b8d6c3]">Tanlangan davr</p><p className="mt-2 font-mono text-[30px] leading-none text-[#315d4e] dark:text-[#d1ebd9]">{Math.floor(minutes / 60)}<span className="ml-1 text-[13px]">soat</span> {minutes % 60}<span className="ml-1 text-[13px]">daq</span></p><p className="mt-4 text-[10px] text-[#527463] dark:text-[#b8d6c3]">{reportSessions.length} ta diqqat sessiyasi</p></div>
        <div className="rounded-2xl bg-[#f5eee2] p-5" data-testid="metric-today"><p className="text-[10px] text-[#8d7047]">Bugungi diqqat</p><p className="mt-2 font-mono text-[30px] leading-none text-[#80583a]">{todayMinutes}<span className="ml-1 text-[13px]">daqiqa</span></p><p className="mt-4 text-[10px] text-[#8d7047]">Yozilgan vaqt</p></div>
        <div className="rounded-2xl bg-[#eeebf3] p-5 dark:bg-[#34303d]" data-testid="metric-completed-tasks"><p className="text-[10px] text-[#706283] dark:text-[#cfc3dd]">Vazifalar holati</p><p className="mt-2 font-mono text-[30px] leading-none text-[#5b4c6f] dark:text-[#e2d8eb]">{tasks.filter((task) => task.completed).length}<span className="ml-1 text-[13px]">bajarildi</span></p><p className="mt-4 text-[10px] text-[#706283] dark:text-[#cfc3dd]">{tasks.filter((task) => !task.completed).length} ta ochiq vazifa</p></div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-5"><div className="flex items-center gap-2"><BarChart3 size={16} className="text-[#47796c]" /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Kunlik diqqat</p></div><div className="mt-5 flex h-[165px] items-end gap-2">{days.map((timestamp, index) => <div key={dayKey(timestamp)} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="font-mono text-[9px] text-muted-foreground">{dailyValues[index] || ''}</span><div className="flex h-[112px] w-full items-end rounded-lg bg-[#f0eee5] dark:bg-[#34372f]"><div className="w-full rounded-lg bg-[#83a998] transition-[height]" style={{ height: `${Math.max(dailyValues[index] ? 8 : 3, (dailyValues[index] / maxDaily) * 100)}%` }} /></div><span className="text-[9px] text-muted-foreground">{new Intl.DateTimeFormat('uz-UZ', { weekday: 'short' }).format(new Date(timestamp)).slice(0, 2)}</span></div>)}</div></div>
        <div className="rounded-2xl border border-border/70 bg-card p-5"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Loyihalar taqsimoti</p><div className="mt-5 space-y-4">{projectData.length ? projectData.map(([project, value], index) => <div key={project} className="grid grid-cols-[minmax(80px,.6fr)_1fr_44px] items-center gap-3 text-[11px]"><span className="truncate">{project}</span><span className="h-2 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${index % 2 ? 'bg-[#b88b68]' : 'bg-[#6e9b87]'}`} style={{ width: `${(value / maxProject) * 100}%` }} /></span><span className="font-mono text-[9px] text-muted-foreground">{value} daq</span></div>) : <p className="rounded-xl bg-muted px-3 py-5 text-[11px] text-muted-foreground">Sessiyalar yozilgach, loyihalar shu yerda ko‘rinadi.</p>}</div></div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-5"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Sessiya issiqlik xaritasi</p><span className="text-[9px] text-muted-foreground">So‘nggi 12 hafta</span></div><div className="mt-4 grid grid-cols-12 gap-1.5">{Array.from({ length: 84 }, (_, index) => { const timestamp = Date.now() - (83 - index) * 86400000; const value = focusSessions.filter((session) => dayKey(session.startedAt) === dayKey(timestamp)).length; return <span key={`${dayKey(timestamp)}-${index}`} title={`${readableDay(timestamp)}: ${value} sessiya`} className={`aspect-square rounded-[3px] ${value >= 3 ? 'bg-[#47796c]' : value === 2 ? 'bg-[#82a995]' : value === 1 ? 'bg-[#bed2c4]' : 'bg-[#ecebe4] dark:bg-[#3a3d36]'}`} data-testid={`heatmap-cell-${index}`} />; })}</div><div className="mt-3 flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground"><span>kam</span><span className="size-2.5 rounded-[3px] bg-[#ecebe4] dark:bg-[#3a3d36]" /><span className="size-2.5 rounded-[3px] bg-[#bed2c4]" /><span className="size-2.5 rounded-[3px] bg-[#82a995]" /><span className="size-2.5 rounded-[3px] bg-[#47796c]" /><span>ko‘p</span></div></div>
        <div className="rounded-2xl border border-border/70 bg-card p-5"><div className="flex items-center gap-2"><Clock3 size={15} className="text-[#9b6543]" /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Bajarilgan sessiyalar</p></div><div className="mt-4 space-y-2">{logs.length ? logs.map((session) => <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-[10px]" data-testid={`session-log-${session.id}`}><div className="min-w-0"><p className="truncate font-medium">{session.project}</p><p className="mt-1 text-muted-foreground">{readableDay(session.startedAt)} · {readableTime(session.startedAt)}</p></div><span className="shrink-0 font-mono text-[#47796c]">{session.durationMinutes} daq</span></div>) : <p className="rounded-xl bg-muted px-3 py-5 text-[11px] text-muted-foreground">Birinchi sessiyangiz tugagach, jurnal shu yerda paydo bo‘ladi.</p>}</div></div>
      </div>
    </section>
  );
}

function SettingsPanel({ settings, timer, onSettingsChange, onTimerChange }: { settings: FocusSettings; timer: TimerSnapshot; onSettingsChange: (settings: FocusSettings) => void; onTimerChange: (timer: TimerSnapshot) => void }) {
  const [drafts, setDrafts] = useState<Record<DurationSettingKey, string>>(() => ({
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
  }));

  useEffect(() => {
    setDrafts({
      focusMinutes: String(settings.focusMinutes),
      shortBreakMinutes: String(settings.shortBreakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
    });
  }, [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

  const applyDuration = (key: DurationSettingKey, minutes: number) => {
    const safeMinutes = Math.min(MAX_TIMER_MINUTES, Math.max(1, Math.trunc(minutes)));
    const nextSettings = { ...settings, [key]: safeMinutes };
    onSettingsChange(nextSettings);

    const activeDurationKey: DurationSettingKey = timer.mode === 'focus'
      ? 'focusMinutes'
      : timer.mode === 'shortBreak'
        ? 'shortBreakMinutes'
        : 'longBreakMinutes';
    if (key !== activeDurationKey) return;

    const nextRemaining = secondsForMode(timer.mode, nextSettings);
    onTimerChange({
      ...timer,
      remaining: nextRemaining,
      endAt: timer.running ? Date.now() + nextRemaining * 1000 : null,
    });
  };

  const updateDurationDraft = (key: DurationSettingKey, value: string) => {
    const minutes = parseDurationInput(value);
    if (minutes === null) {
      setDrafts((current) => ({ ...current, [key]: value }));
      return;
    }
    setDrafts((current) => ({ ...current, [key]: Number(value) > MAX_TIMER_MINUTES ? String(MAX_TIMER_MINUTES) : value }));
    applyDuration(key, minutes);
  };

  const finishDurationEdit = (key: DurationSettingKey) => {
    const minutes = parseDurationInput(drafts[key]);
    setDrafts((current) => ({ ...current, [key]: String(minutes ?? settings[key]) }));
  };

  const durationFields: Array<{ key: DurationSettingKey; label: string }> = [
    { key: 'focusMinutes', label: 'Diqqat' },
    { key: 'shortBreakMinutes', label: 'Qisqa tanaffus' },
    { key: 'longBreakMinutes', label: 'Uzoq tanaffus' },
  ];

  return (
    <section className="space-y-5" data-testid="timer-settings">
      <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Shaxsiy ritm</p><h2 className="mt-1 font-serif text-[clamp(2rem,4vw,3.1rem)] leading-none">Taymer sozlamalari</h2><p className="mt-2 max-w-xl text-[11px] leading-relaxed text-muted-foreground">Davrlarni o‘zingizga moslang. O‘zgarishlar shu brauzerdagi shaxsiy ish maydonida saqlanadi.</p></div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2"><Settings2 size={16} className="text-[#9b6543]" /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Davr davomiyligi</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {durationFields.map(({ key, label }) => {
              const invalid = parseDurationInput(drafts[key]) === null;
              return (
                <div key={key} className="rounded-xl bg-[#f5f1e5] p-4 dark:bg-[#30322c]">
                  <label htmlFor={`input-${key}`} className="block text-[10px] font-semibold">{label}</label>
                  <span className="mt-3 flex items-center gap-2">
                    <input
                      id={`input-${key}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_TIMER_MINUTES}
                      step={1}
                      value={drafts[key]}
                      onChange={(event) => updateDurationDraft(key, event.target.value)}
                      onBlur={() => finishDurationEdit(key)}
                      aria-label={`${label} davomiyligi`}
                      aria-invalid={invalid}
                      className="w-full rounded-lg border border-[#d8d1bd] bg-card px-3 py-2 font-mono text-[16px] outline-none focus:ring-2 focus:ring-[#47796c]/25 dark:border-[#4b4d43]"
                      data-testid={`input-${key}`}
                    />
                    <span className="text-[10px] text-muted-foreground">daqiqa</span>
                  </span>
                  <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={`${label} uchun tez tanlovlar`}>
                    {DURATION_PRESETS[key].map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => {
                          setDrafts((current) => ({ ...current, [key]: String(minutes) }));
                          applyDuration(key, minutes);
                        }}
                        aria-pressed={settings[key] === minutes}
                        className={`rounded-full px-2.5 py-1 text-[9px] font-medium transition-colors ${settings[key] === minutes ? 'bg-[#47796c] text-white' : 'bg-white/75 text-muted-foreground hover:text-foreground dark:bg-black/15'}`}
                        data-testid={`button-duration-preset-${key}-${minutes}`}
                      >
                        {minutes} daq
                      </button>
                    ))}
                  </div>
                  {invalid && <p className="mt-2 text-[9px] text-destructive" role="status" aria-live="polite" data-testid={`error-${key}`}>1–180 oralig‘ida butun daqiqa kiriting.</p>}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground">1–180 daqiqa. Qiymatlar darhol saqlanadi; tanlangan davr bo‘lsa, taymer ham yangilanadi.</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Bell size={16} className="text-[#9b6543]" /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Bildirishnoma ovozi</p></div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Sessiya tugaganda brauzer ichidagi qisqa ovoz yangraydi.</p></div><button type="button" role="switch" aria-checked={settings.notificationSound} onClick={() => onSettingsChange({ ...settings, notificationSound: !settings.notificationSound })} className={`relative h-6 w-11 rounded-full transition-colors ${settings.notificationSound ? 'bg-[#47796c]' : 'bg-muted'}`} data-testid="switch-notification-sound"><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${settings.notificationSound ? 'left-6' : 'left-1'}`} /></button></div><button type="button" onClick={playNotification} disabled={!settings.notificationSound} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-test-notification"><Volume2 size={13} /> Ovozini sinash</button></div>
          <div className={`rounded-2xl border p-5 ${settings.strictMode ? 'border-[#c8aa71] bg-[#fff8e7]' : 'border-border/70 bg-card'}`}><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><ShieldCheck size={16} className={settings.strictMode ? 'text-[#9b6543]' : 'text-muted-foreground'} /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Qat’iy rejim</p></div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Faol bo‘lsa, diqqat davri tugamaguncha uni o‘tkazib yuborish tugmasi ishlamaydi.</p></div><button type="button" role="switch" aria-checked={settings.strictMode} onClick={() => onSettingsChange({ ...settings, strictMode: !settings.strictMode })} className={`relative h-6 w-11 rounded-full transition-colors ${settings.strictMode ? 'bg-[#9b6543]' : 'bg-muted'}`} data-testid="switch-strict-mode"><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${settings.strictMode ? 'left-6' : 'left-1'}`} /></button></div>{settings.strictMode && <p className="mt-4 rounded-xl bg-[#f3e3bd] px-3 py-2 text-[10px] font-medium text-[#745a2f]" role="status" data-testid="status-strict-mode">Qat’iy rejim yoqilgan: diqqat paytida o‘tkazish yopiq, qayta boshlash va pauza esa mavjud.</p>}</div>
        </div>
      </div>
    </section>
  );
}

export function FocusTodoWorkspace({ storageKey }: { storageKey: string }) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('timer');
  const [filter, setFilter] = useState('Hammasi');
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('Shaxsiy');
  const [newEstimate, setNewEstimate] = useState('2');

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
      setStorageError('Brauzer xotirasi to‘ldi. Eski vazifalarni o‘chirishni sinab ko‘ring.');
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
  const deleteTask = (id: string) => {
    if (!window.confirm('Bu vazifani o‘chirishni xohlaysizmi?')) return;
    setWorkspace((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id), timer: current.timer.activeTaskId === id ? { ...current.timer, activeTaskId: null } : current.timer }));
  };
  const renameTask = (id: string, title: string) => setWorkspace((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, title } : task) }));
  const selectTask = (id: string) => updateTimer({ ...workspace.timer, activeTaskId: id });

  if (!ready) return <div className="min-h-[60vh] space-y-5 p-5" aria-busy="true"><div className="skeleton h-12 w-64 rounded-2xl" /><div className="skeleton h-[560px] rounded-[28px]" /></div>;

  const tabs: { id: WorkspaceTab; label: string; icon: ReactNode }[] = [
    { id: 'timer', label: 'Taymer', icon: <Clock3 size={15} /> },
    { id: 'tasks', label: 'Vazifalar', icon: <ListChecks size={15} /> },
    { id: 'reports', label: 'Hisobot va Statistika', icon: <BarChart3 size={15} /> },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings2 size={15} /> },
  ];

  return (
    <div className="min-h-full w-full bg-[#f2efe5] text-[#302c35] dark:bg-[#1d211e] dark:text-[#f3eddf]" data-testid="focus-workspace">
      <div className="border-b border-[#d8d1bd] bg-[#f8f6ec]/95 px-5 py-4 backdrop-blur-sm dark:border-[#41453d] dark:bg-[#242821]/95 sm:px-8 lg:px-12">
        {storageError && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#e7c4b8] bg-[#fff1ec] px-4 py-3 text-[11px] text-[#8f493b]" role="alert" data-testid="status-storage-error"><span>{storageError}</span><button type="button" onClick={() => setStorageError('')} aria-label="Xabarni yopish" data-testid="button-close-storage-error"><X size={14} /></button></div>}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#9a6b23]">Fokus kundaligi</p><h1 className="mt-1 font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-[-.045em]">Fokus maydoni<span className="text-[#47796c]">.</span></h1></div>
          <div className="flex items-center divide-x divide-[#ddd6c5] dark:divide-[#45463c]" data-testid="focus-summary"><div className="px-3 first:pl-0 sm:px-4"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Bugun</span><strong className="mt-1 block font-serif text-[17px] leading-none">{todayFocus} <span className="text-[10px] font-normal">daq</span></strong></div><div className="px-3 sm:px-4"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Reja</span><strong className="mt-1 block font-serif text-[17px] leading-none">{estimatedPomodoros} <span className="text-[10px] font-normal">davr</span></strong></div><div className="px-3 last:pr-0 sm:px-4"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Bajarildi</span><strong className="mt-1 block font-serif text-[17px] leading-none text-[#47796c]">{completedPomodoros} <span className="text-[10px] font-normal text-foreground">davr</span></strong></div></div>
        </div>
        <nav className="sticky top-[57px] z-20 -mx-5 mt-4 flex gap-1 overflow-x-auto border-t border-[#e2dccb] bg-[#f8f6ec]/95 pt-2 backdrop-blur-sm dark:border-[#41453d] dark:bg-[#242821]/95 sm:-mx-8 sm:px-3 lg:-mx-12 lg:px-7 md:top-0" aria-label="Fokus bo‘limlari" role="tablist" data-testid="focus-tabs">
          {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-[11px] font-semibold transition-colors ${activeTab === tab.id ? 'text-[#47796c] dark:text-[#b9d7c4]' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`tab-${tab.id}`}>{tab.icon}{tab.label}{activeTab === tab.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#47796c]" />}</button>)}
        </nav>
      </div>
      <main className="px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <div key={activeTab} className="diary-rise">
          {activeTab === 'timer' && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]"><FocusTimer timer={workspace.timer} tasks={tasks} settings={workspace.settings} onTimerChange={updateTimer} onSession={addSession} /><div className="space-y-5"><section className="rounded-[24px] border border-[#d8d1bd] bg-card p-5 shadow-sm" data-testid="timer-task-preview"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Keyingi qadam</p><h2 className="mt-1 font-serif text-[26px] leading-none">Bugungi vazifa</h2></div><span className="grid size-9 place-items-center rounded-xl bg-[#e2eee7] text-[#47796c]"><ListChecks size={16} /></span></div><div className="mt-5 rounded-2xl bg-[#f5f3ea] p-4 dark:bg-[#30322c]">{activeTask ? <><p className="text-[13px] font-semibold">{activeTask.title}</p><p className="mt-2 text-[10px] text-muted-foreground">{activeTask.project} · {activeTask.completedPomodoros}/{activeTask.estimate} davr</p><button type="button" onClick={() => setActiveTab('tasks')} className="mt-4 text-[10px] font-semibold text-[#47796c] hover:underline" data-testid="button-open-tasks">Vazifalar ro‘yxatini ochish</button></> : <><p className="text-[13px] font-semibold">Taymer uchun vazifa tanlang</p><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Vazifalar bo‘limidan ish tanlasangiz, sessiya loyihaga biriktiriladi.</p><button type="button" onClick={() => setActiveTab('tasks')} className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#47796c] hover:underline" data-testid="button-choose-task"><Plus size={13} /> Vazifa qo‘shish</button></>}</div></section><AmbientSoundStudio /></div></div>}
          {activeTab === 'tasks' && <section className="space-y-5" data-testid="task-workspace"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Ishlar daftarim</p><h2 className="mt-1 font-serif text-[clamp(2rem,4vw,3.1rem)] leading-none">Vazifalar<span className="text-[#a56c34]">.</span></h2><p className="mt-2 text-[11px] text-muted-foreground">{openCount} ta vazifa ochiq · {tasks.length} ta jami</p></div><div className="rounded-2xl bg-[#e6efe8] px-4 py-3 text-right dark:bg-[#283c32]"><p className="text-[9px] text-[#527463] dark:text-[#b8d6c3]">Pomodoro hisoboti</p><p className="mt-1 font-mono text-[17px] text-[#315d4e] dark:text-[#d1ebd9]">{completedPomodoros}/{estimatedPomodoros} <span className="text-[10px]">davr</span></p></div></div><div className="grid gap-5 xl:grid-cols-[minmax(300px,.7fr)_minmax(0,1.3fr)]"><form onSubmit={submitTask} className="h-fit rounded-2xl border border-border/70 bg-card p-4 shadow-sm" data-testid="form-add-task"><div className="flex items-center gap-2"><Plus size={15} className="text-[#47796c]" /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Yangi vazifa</p></div><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Vazifa nomi..." className="mt-4 w-full rounded-xl border border-[#d8d1bd] bg-[#f8f6ec] px-3 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#47796c]/25 dark:border-[#4b4d43] dark:bg-[#30322c]" aria-label="Yangi vazifa nomi" data-testid="input-new-task-title" /><div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><input value={newProject} onChange={(event) => setNewProject(event.target.value)} placeholder="Loyiha nomi" className="min-w-0 rounded-xl border border-[#d8d1bd] bg-[#f8f6ec] px-3 py-2.5 text-[11px] outline-none focus:ring-2 focus:ring-[#47796c]/25 dark:border-[#4b4d43] dark:bg-[#30322c]" aria-label="Loyiha nomi" data-testid="input-new-task-project" /><select value={newEstimate} onChange={(event) => setNewEstimate(event.target.value)} className="rounded-xl border border-[#d8d1bd] bg-[#f8f6ec] px-3 py-2.5 text-[11px] outline-none dark:border-[#4b4d43] dark:bg-[#30322c]" aria-label="Pomodoro taxmini" data-testid="select-new-task-estimate"><option value="1">1 davr · 25 daq</option><option value="2">2 davr · 50 daq</option><option value="3">3 davr · 75 daq</option><option value="4">4 davr · 100 daq</option><option value="8">8 davr · 200 daq</option></select></div><button type="submit" disabled={!newTitle.trim()} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-3 text-[11px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-add-task"><Plus size={14} /> Qo‘shish</button></form><div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Loyiha filtrlari">{projects.map((project) => <button key={project} type="button" role="tab" aria-selected={filter === project} onClick={() => setFilter(project)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] transition-colors ${filter === project ? 'bg-[#47796c] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`filter-project-${project}`}>{project}</button>)}</div><div className="mt-4 flex items-center justify-between gap-3 border-b border-border/70 pb-3 text-[10px] text-muted-foreground"><span>{activeTask ? `Taymerda: ${activeTask.title}` : 'Taymer uchun vazifani tanlang'}</span><button type="button" onClick={() => setShowCompleted((value) => !value)} className="shrink-0 font-semibold text-[#47796c]" data-testid="button-toggle-completed">{showCompleted ? 'Bajarilganlarni yashirish' : 'Bajarilganlarni ko‘rsatish'}</button></div><div className="mt-4 space-y-5">{visibleTasks.length ? Array.from(new Set(visibleTasks.map((task) => task.project))).map((project) => <div key={project}><div className="mb-2 flex items-center justify-between"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground"><FolderOpen size={12} /> {project}</p><span className="text-[9px] text-muted-foreground">{visibleTasks.filter((task) => task.project === project).reduce((sum, task) => sum + task.completedPomodoros, 0)}/{visibleTasks.filter((task) => task.project === project).reduce((sum, task) => sum + task.estimate, 0)} davr</span></div><div className="space-y-2">{visibleTasks.filter((task) => task.project === project).map((task) => <TaskRow key={task.id} task={task} active={task.id === workspace.timer.activeTaskId} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} onSelect={() => selectTask(task.id)} onEdit={(title) => renameTask(task.id, title)} />)}</div></div>) : <div className="rounded-2xl border border-dashed border-[#d8d1bd] px-4 py-14 text-center dark:border-[#514e40]"><Circle size={20} className="mx-auto text-[#b7ae98]" /><p className="mt-3 font-serif text-[22px]">Bu yer hali ochiq.</p><p className="mt-1 text-[11px] text-muted-foreground">Birinchi vazifangizni yozib, kuningizga shakl bering.</p></div>}</div></div></div></section>}
          {activeTab === 'reports' && <FocusReports sessions={workspace.sessions} tasks={tasks} />}
          {activeTab === 'settings' && <SettingsPanel settings={workspace.settings} timer={workspace.timer} onSettingsChange={(settings) => setWorkspace((current) => ({ ...current, settings }))} onTimerChange={updateTimer} />}
        </div>
      </main>
      <footer className="flex items-center justify-center gap-2 border-t border-[#ddd6c5] px-5 py-5 text-[10px] text-muted-foreground dark:border-[#41453d]"><span className="size-1.5 rounded-full bg-[#a56c34]" /> Barcha ma’lumotlar faqat ushbu brauzerda saqlanadi <span className="size-1.5 rounded-full bg-[#47796c]" /></footer>
    </div>
  );
}