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
import { getAmbientAudioCopy, getAmbientSoundName } from '@/lib/ambient-audio-copy';
import { FocusReports } from '@/components/focus-reports';
import { formatContentDeleteConfirmation, formatTimerDurationAriaLabel, formatTimerDurationFieldLabel, formatTimerPresetsGroupLabel, useI18n } from '@/lib/i18n';
import {
  DEFAULT_POMODORO_SOUND_PRESET,
  DEFAULT_POMODORO_SOUND_VOLUME,
  disposePomodoroNotificationAudio,
  isPomodoroSoundPreset,
  playPomodoroNotification,
  POMODORO_SOUND_PRESETS,
  preparePomodoroNotificationAudio,
  safePomodoroSoundVolume,
  type PomodoroSoundPreset,
} from '@/lib/pomodoro-notification-sound';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type WorkspaceTab = 'timer' | 'tasks' | 'reports' | 'settings';

type FocusSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  notificationSound: boolean;
  notificationPreset: PomodoroSoundPreset;
  notificationVolume: number;
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
  durationMinutes: number;
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
  notificationPreset: DEFAULT_POMODORO_SOUND_PRESET,
  notificationVolume: DEFAULT_POMODORO_SOUND_VOLUME,
  strictMode: false,
};
const MAX_TIMER_MINUTES = 180;
const FOCUS_SETTINGS_COPY = {
  uz: {
    kicker: 'Shaxsiy ritm',
    title: 'Taymer sozlamalari',
    description: 'Davrlarni o‘zingizga moslang. O‘zgarishlar shu brauzerdagi shaxsiy ish maydonida saqlanadi.',
    durationTitle: 'Davr davomiyligi',
    focus: 'Diqqat',
    shortBreak: 'Qisqa tanaffus',
    longBreak: 'Uzoq tanaffus',
    minute: 'daqiqa',
    presetMinute: 'daq',
    durationError: '1–180 oralig‘ida butun daqiqa kiriting.',
    durationHelp: '1–180 daqiqa. Qiymatlar darhol saqlanadi; tanlangan davr bo‘lsa, taymer ham yangilanadi.',
    audioTitle: 'Bildirishnoma ovozi',
    audioDescription: 'Sessiya tugaganda tanlangan ovoz va balandlikda signal yangraydi.',
    audioStyle: 'Bildirishnoma ovozi uslubi',
    audioToggle: 'Bildirishnoma ovozini yoqish',
    volume: 'Ovoz balandligi',
    preview: 'Ovozini sinash',
    previewSuccess: 'Sinov ovozi ijro etildi.',
    previewSilent: 'Balandlik 0% — ovozni eshitish uchun balandlikni oshiring.',
    audioUnavailable: 'Bu brauzerda ovoz ijrosi qo‘llab-quvvatlanmaydi.',
    strictTitle: 'Qat’iy rejim',
    strictDescription: 'Faol bo‘lsa, diqqat davri tugamaguncha uni o‘tkazib yuborish tugmasi ishlamaydi.',
    strictEnabled: 'Qat’iy rejim yoqilgan: diqqat paytida o‘tkazish yopiq, qayta boshlash va pauza esa mavjud.',
  },
  en: {
    kicker: 'Personal rhythm',
    title: 'Timer settings',
    description: 'Adjust each interval to fit your routine. Changes are saved in this browser workspace.',
    durationTitle: 'Interval duration',
    focus: 'Focus',
    shortBreak: 'Short break',
    longBreak: 'Long break',
    minute: 'minutes',
    presetMinute: 'min',
    durationError: 'Enter a whole number from 1 to 180 minutes.',
    durationHelp: '1–180 minutes. Changes save immediately and update the selected timer.',
    audioTitle: 'Notification sound',
    audioDescription: 'A sound plays at the selected tone and volume when a session ends.',
    audioStyle: 'Notification sound style',
    audioToggle: 'Enable notification sound',
    volume: 'Volume',
    preview: 'Test sound',
    previewSuccess: 'Sound preview played.',
    previewSilent: 'Volume is 0% — raise it to hear the preview.',
    audioUnavailable: 'Audio playback is not supported in this browser.',
    strictTitle: 'Strict mode',
    strictDescription: 'When enabled, you cannot skip a focus interval before it ends.',
    strictEnabled: 'Strict mode is on: skipping is disabled during focus, but reset and pause remain available.',
  },
  ru: {
    kicker: 'Личный ритм',
    title: 'Настройки таймера',
    description: 'Настройте интервалы под свой ритм. Изменения сохраняются в рабочей области этого браузера.',
    durationTitle: 'Длительность интервала',
    focus: 'Фокус',
    shortBreak: 'Короткий перерыв',
    longBreak: 'Длинный перерыв',
    minute: 'минут',
    presetMinute: 'мин',
    durationError: 'Введите целое число от 1 до 180 минут.',
    durationHelp: '1–180 минут. Изменения сохраняются сразу и обновляют выбранный таймер.',
    audioTitle: 'Звук уведомления',
    audioDescription: 'При завершении сессии прозвучит выбранный сигнал с заданной громкостью.',
    audioStyle: 'Стиль звука уведомления',
    audioToggle: 'Включить звук уведомления',
    volume: 'Громкость',
    preview: 'Проверить звук',
    previewSuccess: 'Проверочный звук воспроизведён.',
    previewSilent: 'Громкость 0% — увеличьте её, чтобы услышать звук.',
    audioUnavailable: 'Этот браузер не поддерживает воспроизведение звука.',
    strictTitle: 'Строгий режим',
    strictDescription: 'В этом режиме нельзя пропустить интервал фокусировки до его завершения.',
    strictEnabled: 'Строгий режим включён: пропуск во время фокусировки отключён, сброс и пауза доступны.',
  },
  ko: {
    kicker: '나만의 리듬',
    title: '타이머 설정',
    description: '원하는 흐름에 맞게 간격을 조정하세요. 변경 사항은 이 브라우저 작업 공간에 저장됩니다.',
    durationTitle: '구간 길이',
    focus: '집중',
    shortBreak: '짧은 휴식',
    longBreak: '긴 휴식',
    minute: '분',
    presetMinute: '분',
    durationError: '1분에서 180분 사이의 정수를 입력하세요.',
    durationHelp: '1–180분. 변경 사항은 즉시 저장되며 선택한 타이머에도 적용됩니다.',
    audioTitle: '알림 소리',
    audioDescription: '세션이 끝나면 선택한 소리와 음량으로 알림이 울립니다.',
    audioStyle: '알림 소리 스타일',
    audioToggle: '알림 소리 켜기',
    volume: '음량',
    preview: '소리 테스트',
    previewSuccess: '미리 듣기를 재생했습니다.',
    previewSilent: '음량이 0%입니다. 소리를 들으려면 음량을 높이세요.',
    audioUnavailable: '이 브라우저에서는 오디오를 재생할 수 없습니다.',
    strictTitle: '엄격 모드',
    strictDescription: '켜면 집중 구간이 끝나기 전에 건너뛸 수 없습니다.',
    strictEnabled: '엄격 모드가 켜졌습니다. 집중 중 건너뛰기는 비활성화되지만 재설정과 일시정지는 가능합니다.',
  },
} as const;

const FOCUS_SOUND_PRESET_LABELS = {
  uz: {
    'zen-bowl': 'Zen gongi',
    'digital-chime': 'Raqamli qo‘ng‘iroq',
    'bell-trio': 'Uch qo‘ng‘iroq',
    'marimba-strum': 'Marimba ohangi',
    'soft-flute': 'Mayin nay',
  },
  en: {
    'zen-bowl': 'Zen Gong',
    'digital-chime': 'Digital Chime',
    'bell-trio': 'Bell Trio',
    'marimba-strum': 'Marimba Melodic Strum',
    'soft-flute': 'Soft Flute',
  },
  ru: {
    'zen-bowl': 'Дзен-гонг',
    'digital-chime': 'Цифровой звон',
    'bell-trio': 'Тройной колокольчик',
    'marimba-strum': 'Мелодия маримбы',
    'soft-flute': 'Мягкая флейта',
  },
  ko: {
    'zen-bowl': '젠 공',
    'digital-chime': '디지털 차임',
    'bell-trio': '세 번 울리는 종',
    'marimba-strum': '마림바 선율',
    'soft-flute': '부드러운 플루트',
  },
} as const;
const DURATION_PRESETS: Record<DurationSettingKey, number[]> = {
  focusMinutes: [25, 45, 60],
  shortBreakMinutes: [5, 10, 15],
  longBreakMinutes: [15, 30, 45],
};

const EMPTY_TIMER: TimerSnapshot = {
  mode: 'focus',
  durationMinutes: DEFAULT_SETTINGS.focusMinutes,
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
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_TIMER_MINUTES) return null;
  return parsed;
}

function safeWorkspace(value: unknown): WorkspaceData {
  if (!isObject(value)) return EMPTY_WORKSPACE;
  const rawSettings = isObject(value.settings) ? value.settings : {};
  const settings: FocusSettings = {
    focusMinutes: safeDuration(rawSettings.focusMinutes, DEFAULT_SETTINGS.focusMinutes),
    shortBreakMinutes: safeDuration(rawSettings.shortBreakMinutes, DEFAULT_SETTINGS.shortBreakMinutes),
    longBreakMinutes: safeDuration(rawSettings.longBreakMinutes, DEFAULT_SETTINGS.longBreakMinutes),
    notificationSound: rawSettings.notificationSound !== false,
    notificationPreset: isPomodoroSoundPreset(rawSettings.notificationPreset)
      ? rawSettings.notificationPreset
      : DEFAULT_SETTINGS.notificationPreset,
    notificationVolume: safePomodoroSoundVolume(rawSettings.notificationVolume),
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
  const modeDuration = mode === 'focus' ? settings.focusMinutes : mode === 'shortBreak' ? settings.shortBreakMinutes : settings.longBreakMinutes;
  const durationMinutes = safeDuration(rawTimer.durationMinutes, modeDuration);
  const now = Date.now();
  const rawEndAt = Number(rawTimer.endAt);
  const endAt = Number.isFinite(rawEndAt) ? Math.min(rawEndAt, now + durationMinutes * 60_000) : 0;
  const running = Boolean(rawTimer.running) && endAt > now;
  const storedRemaining = Number(rawTimer.remaining);
  const timer: TimerSnapshot = {
    mode,
    durationMinutes,
    remaining: running
      ? Math.max(0, Math.ceil((endAt - now) / 1000))
      : Math.min(durationMinutes * 60, Math.max(0, Number.isFinite(storedRemaining) ? storedRemaining : durationMinutes * 60)),
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
  'night-wind': <Waves size={16} />,
};

function AmbientSoundStudio() {
  const { language } = useI18n();
  const copy = getAmbientAudioCopy(language);
  const { primary, mix, setSelected, setVolume, setNoiseColor, play, toggle } = useAmbientSound();
  const primaryOption = ambientSounds.find((sound) => sound.value === primary.selected);
  const mixOption = ambientSounds.find((sound) => sound.value === mix.selected);
  const primaryLabel = primary.selected ? getAmbientSoundName(primary.selected, language) : copy.primarySound;
  const mixLabel = mix.selected ? getAmbientSoundName(mix.selected, language) : copy.mixLayer;
  const noiseOptions = [
    { value: 'white' as const, label: copy.noiseColors.white },
    { value: 'pink' as const, label: copy.noiseColors.pink },
    { value: 'brown' as const, label: copy.noiseColors.brown },
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
        {copy.source}: {option.attribution ?? 'Mixkit'}
      </a>
      {option.licenseUrl && <> · <a href={option.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2" data-testid={`${testId}-license`}>{copy.license}</a></>}
    </p>
  );

  return (
    <section className="border-t border-[#ddd6c5] pt-5 dark:border-[#41453d]" data-testid="ambient-sounds">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">{copy.title}</p>
          <h2 className="mt-1 font-serif text-[26px] leading-none">{copy.title}</h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{copy.focusAutoPlay}: {copy.focusAutoPlayHint}</p>
        </div>
        <span className={`grid size-9 place-items-center rounded-xl ${primary.playing || mix.playing ? 'bg-[#dcebe4] text-[#47796c]' : 'bg-[#e9e4d4] text-[#887d6b]'}`}><Headphones size={17} /></span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f5f3ea] p-2.5 dark:bg-[#30322c]">
        <button
          type="button"
          onClick={() => { void toggle('primary'); }}
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#47796c] text-white transition-transform hover:scale-105"
          aria-label={`${primary.playing ? copy.pause : copy.start}: ${primaryLabel}`}
          aria-pressed={primary.playing}
          data-testid="button-ambient-studio-toggle"
        >
          {primary.playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <div className="min-w-0 flex-1 text-[10px] text-muted-foreground" role="status" aria-live="polite" data-testid="status-ambient-studio">
          {primary.playing ? <>{copy.primarySound}: <span className="font-semibold text-foreground">{primaryLabel}</span></> : copy.primaryPaused}
          {mix.playing && <span className="ml-2 text-[#47796c] dark:text-[#b9d7c4]">+ {mixLabel}</span>}
        </div>
        {(primary.playing || mix.playing) && <span className="size-2 animate-pulse rounded-full bg-[#47796c]" aria-label={copy.active} />}
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
              aria-label={`${active ? copy.pause : copy.start}: ${getAmbientSoundName(sound.value, language)} · ${copy.primarySound}`}
              className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-[11px] transition-colors ${active ? 'border-[#87ac99] bg-[#e0eee7] text-[#315d4e] shadow-sm dark:border-[#527a67] dark:bg-[#263e34] dark:text-[#c5e4d2]' : chosen ? 'border-[#c8c1aa] bg-[#f2efe5] text-foreground dark:bg-[#3b3d35]' : mixChosen ? 'border-[#d4b98c] bg-[#f1eadb] text-foreground dark:border-[#766447] dark:bg-[#3b372c]' : 'border-transparent bg-[#eeece2] text-muted-foreground hover:border-[#c8c1aa] hover:text-foreground dark:bg-[#34362f]'}`}
              data-testid={`button-sound-${sound.value}`}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${active ? 'bg-white/70 dark:bg-black/15' : 'bg-white/60 dark:bg-black/10'}`}>{SOUND_ICONS[sound.value]}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{getAmbientSoundName(sound.value, language)}</span>
              </span>
              <span className="shrink-0 opacity-70">{mixChosen && !chosen ? <span className="text-[8px]">2</span> : active ? <Pause size={12} /> : <Play size={12} />}</span>
            </button>
          );
        })}
      </div>

      {primary.selected === 'white-noise' && (
        <div className="mt-3 rounded-xl bg-[#f5f3ea] p-3 dark:bg-[#30322c]" aria-label={copy.noiseColor}>
          <p className="mb-2 text-[9px] font-medium text-muted-foreground">{copy.noiseColor}</p>
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
        <input type="range" min={0} max={100} value={primary.volume} onChange={(event) => setVolume('primary', Number(event.target.value))} className="h-1 w-full accent-[#47796c]" aria-label={copy.primaryVolume} data-testid="input-ambient-volume-primary-studio" />
        <Volume2 size={13} />
        <span className="w-8 text-right font-mono">{primary.volume}%</span>
      </label>

      <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">{copy.crossfadeHint} {primary.selected === 'white-noise' || primary.selected === 'night-wind' ? copy.generatedInBrowser : primaryOption?.duration && ` · ${primaryOption.duration}`}</p>
      {sourceDetails(primaryOption, 'link-ambient-source-primary-studio')}
      {primary.error && <p className="mt-3 text-[10px] text-destructive" role="alert" data-testid="status-audio-error">{primary.error}</p>}

      <div className="mt-4 rounded-xl border border-[#ddd6c5] bg-[#f8f6ec] p-3 dark:border-[#41453d] dark:bg-[#2a2d26]" data-testid="ambient-mix-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold">{copy.mixLayer} · {copy.mixOptional}</p>
          </div>
          {mix.selected && <button type="button" onClick={() => { void toggle('mix'); }} className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#47796c] text-white" aria-label={`${mix.playing ? copy.pause : copy.start}: ${mixLabel}`} aria-pressed={mix.playing} data-testid="button-ambient-mix-studio-toggle">{mix.playing ? <Pause size={13} /> : <Play size={13} />}</button>}
        </div>
        <label className="mt-3 block text-[9px] text-muted-foreground" htmlFor="ambient-mix-select-studio">{copy.mixSound}</label>
        <select id="ambient-mix-select-studio" value={mix.selected ?? ''} onChange={(event) => setSelected('mix', event.target.value ? event.target.value as AmbientSound : null)} className="mt-1 w-full rounded-lg border border-[#ddd6c5] bg-white px-2.5 py-2 text-[10px] text-foreground outline-none focus:ring-2 focus:ring-[#87ac99] dark:border-[#41453d] dark:bg-[#22251f]" data-testid="select-ambient-mix-studio">
          <option value="">{copy.mixOff}</option>
          {ambientSounds.map((sound) => <option key={sound.value} value={sound.value}>{getAmbientSoundName(sound.value, language)}</option>)}
        </select>
        {mix.selected && (
          <>
            {mix.selected === 'white-noise' && (
              <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label={`${copy.mixLayer} ${copy.noiseColor}`}>
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
              <input type="range" min={0} max={100} value={mix.volume} onChange={(event) => setVolume('mix', Number(event.target.value))} className="h-1 w-full accent-[#47796c]" aria-label={copy.mixVolume} data-testid="input-ambient-mix-volume-studio" />
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
  onOpenSettings,
}: {
  timer: TimerSnapshot;
  tasks: FocusTask[];
  settings: FocusSettings;
  onTimerChange: (next: TimerSnapshot) => void;
  onSession: (mode: TimerMode, taskId: string | null, minutes: number) => void;
  onOpenSettings: () => void;
}) {
  const [notice, setNotice] = useState('');
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationDraft, setDurationDraft] = useState(String(timer.durationMinutes));
  const timerRef = useRef(timer);
  const changeRef = useRef(onTimerChange);
  const sessionRef = useRef(onSession);
  const completionRef = useRef('');
  const cancelDurationBlurRef = useRef(false);
  const focusPlaybackRef = useRef<boolean | null>(null);
  const { play: playAmbient, pause: pauseAmbient } = useAmbientSound();
  timerRef.current = timer;
  changeRef.current = onTimerChange;
  sessionRef.current = onSession;

  useEffect(() => {
    const shouldPlay = timer.running && timer.mode === 'focus';
    if (focusPlaybackRef.current === shouldPlay) return;
    focusPlaybackRef.current = shouldPlay;
    if (shouldPlay) {
      void playAmbient('primary');
      void playAmbient('mix');
    } else {
      pauseAmbient('primary');
      pauseAmbient('mix');
    }
  }, [timer.running, timer.mode, playAmbient, pauseAmbient]);

  const modeInfo = { label: MODE_LABELS[timer.mode], seconds: timer.durationMinutes * 60, color: MODE_COLORS[timer.mode] };
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
      if (completedMode === 'focus') sessionRef.current('focus', current.activeTaskId, current.durationMinutes);
      if (settings.notificationSound) {
        playPomodoroNotification(settings.notificationPreset, settings.notificationVolume);
      }
      const nextDurationMinutes = secondsForMode(nextMode, settings) / 60;
      changeRef.current({ mode: nextMode, durationMinutes: nextDurationMinutes, remaining: nextDurationMinutes * 60, running: false, endAt: null, activeTaskId: current.activeTaskId, cycle: nextCycle });
      setNotice(completedMode === 'focus' ? 'Diqqat davri tugadi. Endi tanaffus vaqti.' : 'Tanaffus tugadi. Yana bir davrga tayyormisiz?');
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [timer.running, timer.endAt, timer.mode, settings]);

  useEffect(() => {
    setDurationDraft(String(timer.durationMinutes));
  }, [timer.durationMinutes]);

  const applyDuration = (minutes: number) => {
    const durationMinutes = Math.min(MAX_TIMER_MINUTES, Math.max(1, Math.trunc(minutes)));
    const remaining = durationMinutes * 60;
    setDurationDraft(String(durationMinutes));
    setEditingDuration(false);
    onTimerChange({
      ...timer,
      durationMinutes,
      remaining,
      endAt: timer.running ? Date.now() + remaining * 1000 : null,
    });
    setNotice('Joriy taymer yangilandi; odatiy sozlamalar saqlandi.');
  };

  const commitDurationDraft = () => {
    const minutes = parseDurationInput(durationDraft);
    if (minutes === null) {
      setDurationDraft(String(timer.durationMinutes));
      setEditingDuration(false);
      setNotice('1–180 daqiqa orasida butun son kiriting.');
      return;
    }
    applyDuration(minutes);
  };

  const startOrPause = () => {
    preparePomodoroNotificationAudio();
    if (timer.running && timer.endAt) {
      const left = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      focusPlaybackRef.current = false;
      pauseAmbient('primary');
      pauseAmbient('mix');
      onTimerChange({ ...timer, remaining: left, running: false, endAt: null });
      return;
    }
    if (timer.remaining <= 0) return;
    const startsFocus = timer.mode === 'focus';
    focusPlaybackRef.current = startsFocus;
    if (startsFocus) {
      void playAmbient('primary');
      void playAmbient('mix');
    } else {
      pauseAmbient('primary');
      pauseAmbient('mix');
    }
    onTimerChange({ ...timer, running: true, endAt: Date.now() + timer.remaining * 1000 });
    setNotice('');
  };

  const reset = () => {
    focusPlaybackRef.current = false;
    pauseAmbient('primary');
    pauseAmbient('mix');
    onTimerChange({ ...timer, remaining: timer.durationMinutes * 60, running: false, endAt: null });
    setNotice('');
  };

  const skip = () => {
    if (settings.strictMode && timer.mode === 'focus') {
      setNotice('Qat’iy rejimda diqqat davrini o‘tkazib yuborib bo‘lmaydi.');
      return;
    }
    focusPlaybackRef.current = false;
    pauseAmbient('primary');
    pauseAmbient('mix');
    const nextCycle = timer.mode === 'focus' ? timer.cycle + 1 : timer.cycle;
    const nextMode: TimerMode = timer.mode === 'focus' ? (nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak') : 'focus';
    const nextDurationMinutes = secondsForMode(nextMode, settings) / 60;
    onTimerChange({ ...timer, mode: nextMode, durationMinutes: nextDurationMinutes, remaining: nextDurationMinutes * 60, running: false, endAt: null, cycle: nextCycle });
    setNotice('Keyingi davr tayyor.');
  };

  const selectMode = (mode: TimerMode) => {
    if (timer.running) return;
    const durationMinutes = secondsForMode(mode, settings) / 60;
    onTimerChange({ ...timer, mode, durationMinutes, remaining: durationMinutes * 60, endAt: null });
    setNotice('');
  };

  return (
    <section className="relative flex min-h-[min(700px,calc(100dvh-15rem))] w-full min-w-0 max-w-full flex-col items-center justify-center px-0 py-4 sm:py-8" data-testid="focus-timer">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#9a6b23]">Hozirgi davr</p>
          <p className="mt-1 text-[12px] font-semibold text-[#493c2b] dark:text-[#f1e4c3]">{modeInfo.label}</p>
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
          <div className="min-w-0 max-w-full break-words text-right font-mono text-[10px] text-[#8e6d34] [overflow-wrap:anywhere] dark:text-[#dcc78d]" data-testid="text-cycle-count">{timer.cycle} davr yakunlangan</div>
          <button type="button" onClick={onOpenSettings} aria-label="Ilg‘or taymer sozlamalarini ochish" title="Ilg‘or sozlamalar" className="grid size-9 place-items-center rounded-xl border border-[#d8c795] bg-[#fff9e9]/70 text-[#67563a] transition-colors hover:bg-[#f4e8c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b6543]/50 dark:border-[#665837] dark:bg-[#3a3023] dark:text-[#ead9aa]" data-testid="button-timer-settings">
            <Settings2 size={15} />
          </button>
        </div>
      </div>
      <div className="mt-5 flex w-full min-w-0 flex-col items-center">
        <div className="relative aspect-square w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[390px]">
          <svg viewBox="0 0 260 260" className="-rotate-90 size-full" aria-hidden="true">
            <circle cx="130" cy="130" r={radius} fill="none" stroke="#ddd6c5" strokeWidth="7" className="dark:stroke-[#41453d]" />
            <circle cx="130" cy="130" r={radius} fill="none" stroke={modeInfo.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="transition-[stroke-dashoffset] duration-300" />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em]" style={{ color: modeInfo.color }}>{modeInfo.label}</p>
              {editingDuration ? (
                <label className="mt-2 flex items-center justify-center gap-2">
                  <input
                    autoFocus
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_TIMER_MINUTES}
                    step={1}
                    value={durationDraft}
                    onChange={(event) => setDurationDraft(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    onBlur={() => {
                      if (cancelDurationBlurRef.current) {
                        cancelDurationBlurRef.current = false;
                        return;
                      }
                      commitDurationDraft();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelDurationBlurRef.current = true;
                        setDurationDraft(String(timer.durationMinutes));
                        setEditingDuration(false);
                        setNotice('');
                      }
                    }}
                    aria-label={formatTimerDurationFieldLabel(modeInfo.label)}
                    className="w-[5ch] rounded-lg border border-[#d8c795] bg-[#fff9e9] px-1 py-1 text-center font-mono text-[clamp(2.2rem,7vw,3.6rem)] leading-none tracking-[-.08em] text-[#493c2b] outline-none focus:ring-2 focus:ring-[#a56c34]/30 dark:border-[#665837] dark:bg-[#3b3224] dark:text-[#f1e4c3]"
                    data-testid="input-main-timer-duration"
                  />
                  <span className="text-[10px] text-[#88775b] dark:text-[#cdbf9c]">daq</span>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDurationDraft(String(timer.durationMinutes));
                    setEditingDuration(true);
                  }}
                  title="Davomiylikni o‘zgartirish"
                  aria-label={formatTimerDurationAriaLabel(timer.durationMinutes)}
                  className="mt-2 rounded-md font-mono text-[clamp(2.8rem,8vw,4rem)] leading-none tracking-[-.08em] text-[#493c2b] underline decoration-dotted underline-offset-8 transition-colors hover:text-[#47796c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b6543]/50 dark:text-[#f1e4c3]"
                  data-testid="button-edit-main-timer-duration"
                >
                  {formatClock(remaining)}
                </button>
              )}
              <p className="mt-3 min-w-0 max-w-[min(180px,80vw)] break-words text-[11px] text-[#88775b] [overflow-wrap:anywhere] dark:text-[#cdbf9c]" data-testid="text-active-task">{activeTask ? activeTask.title : 'Vazifa tanlanmagan'}</p>
            </div>
          </div>
        </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2" role="group" aria-label={formatTimerPresetsGroupLabel(modeInfo.label)} data-testid="main-timer-duration-presets">
            {[15, 25, 30, 45, 60].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => applyDuration(minutes)}
                aria-pressed={timer.durationMinutes === minutes}
                className={`rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors ${timer.durationMinutes === minutes ? 'bg-[#47796c] text-white shadow-sm' : 'bg-[#eee8d9] text-[#67563a] hover:bg-[#e4dac1] dark:bg-[#3b3b32] dark:text-[#d8cda9] dark:hover:bg-[#48483b]'}`}
                data-testid={`button-main-duration-${minutes}`}
              >
                {minutes}m
              </button>
            ))}
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
      <p className="mt-3 min-h-4 text-center text-[10px] text-[#876f41] dark:text-[#d6c18c]" aria-live="polite" data-testid="status-timer">{notice || (settings.strictMode && timer.mode === 'focus' ? 'Qat’iy rejim faol: diqqat davri tugamaguncha o‘tkazib bo‘lmaydi.' : timer.running ? 'Vaqt ketmoqda. Yozishda davom eting.' : 'Raqamni bosing yoki tez tanlovdan foydalaning.')}</p>
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

function SettingsPanel({ settings, timer, onSettingsChange, onTimerChange }: { settings: FocusSettings; timer: TimerSnapshot; onSettingsChange: (settings: FocusSettings) => void; onTimerChange: (timer: TimerSnapshot) => void }) {
  const { language } = useI18n();
  const copy = FOCUS_SETTINGS_COPY[language];
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [audioPreviewed, setAudioPreviewed] = useState(false);
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
      durationMinutes: safeMinutes,
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
    setDrafts((current) => ({ ...current, [key]: String(minutes) }));
    applyDuration(key, minutes);
  };

  const finishDurationEdit = (key: DurationSettingKey) => {
    const minutes = parseDurationInput(drafts[key]) ?? settings[key];
    setDrafts((current) => ({ ...current, [key]: String(minutes) }));
    applyDuration(key, minutes);
  };

  const testNotificationSound = () => {
    const played = playPomodoroNotification(settings.notificationPreset, settings.notificationVolume);
    setAudioUnavailable(!played);
    setAudioPreviewed(played);
  };

  const durationFields: Array<{ key: DurationSettingKey; label: string }> = [
    { key: 'focusMinutes', label: copy.focus },
    { key: 'shortBreakMinutes', label: copy.shortBreak },
    { key: 'longBreakMinutes', label: copy.longBreak },
  ];

  return (
    <section className="space-y-5" data-testid="timer-settings">
      <div><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">{copy.kicker}</p><h2 className="mt-1 font-serif text-[clamp(2rem,4vw,3.1rem)] leading-none">{copy.title}</h2><p className="mt-2 max-w-xl text-[11px] leading-relaxed text-muted-foreground">{copy.description}</p></div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2"><Settings2 size={16} className="text-[#9b6543]" /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{copy.durationTitle}</p></div>
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
            {durationFields.map(({ key, label }) => {
              const invalid = parseDurationInput(drafts[key]) === null;
              return (
                <div key={key} className="min-w-0 rounded-xl bg-[#f5f1e5] p-4 dark:bg-[#30322c]">
                  <label htmlFor={`input-${key}`} className="block text-[10px] font-semibold">{label}</label>
                  <span className="mt-3 flex min-w-0 items-center gap-2">
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
                      aria-label={formatTimerDurationFieldLabel(label)}
                      aria-invalid={invalid}
                      className="min-w-0 flex-1 rounded-lg border border-[#d8d1bd] bg-card px-3 py-2 font-mono text-[16px] outline-none focus:ring-2 focus:ring-[#47796c]/25 dark:border-[#4b4d43]"
                      data-testid={`input-${key}`}
                    />
                    <span className="shrink-0 text-[10px] text-muted-foreground">{copy.minute}</span>
                  </span>
                  <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={formatTimerPresetsGroupLabel(label)}>
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
                        {minutes} {copy.presetMinute}
                      </button>
                    ))}
                  </div>
                  {invalid && <p className="mt-2 text-[9px] text-destructive" role="status" aria-live="polite" data-testid={`error-${key}`}>{copy.durationError}</p>}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground">{copy.durationHelp}</p>
        </div>
        <div className="min-w-0 space-y-4">
          <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Bell size={16} className="shrink-0 text-[#9b6543]" />
                  <p className="min-w-0 break-words text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground [overflow-wrap:anywhere]">{copy.audioTitle}</p>
                </div>
                <p className="mt-3 break-words text-[11px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{copy.audioDescription}</p>
              </div>
              <div className="flex max-w-full shrink-0 items-center gap-2">
                <select
                  value={settings.notificationPreset}
                  onChange={(event) => {
                    onSettingsChange({ ...settings, notificationPreset: event.target.value as PomodoroSoundPreset });
                    setAudioUnavailable(false);
                    setAudioPreviewed(false);
                  }}
                  aria-label={copy.audioStyle}
                  className="w-[190px] max-w-[55vw] min-w-0 rounded-lg border border-border bg-card px-2 py-1.5 text-[10px] font-medium outline-none focus:ring-2 focus:ring-[#47796c]/25"
                  data-testid="select-notification-preset"
                >
                  {POMODORO_SOUND_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>{FOCUS_SOUND_PRESET_LABELS[language][preset.value]}</option>
                  ))}
                </select>
                <button type="button" role="switch" aria-checked={settings.notificationSound} aria-label={copy.audioToggle} onClick={() => onSettingsChange({ ...settings, notificationSound: !settings.notificationSound })} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.notificationSound ? 'bg-[#47796c]' : 'bg-muted'}`} data-testid="switch-notification-sound"><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${settings.notificationSound ? 'left-6' : 'left-1'}`} /></button>
              </div>
            </div>
            <div className="mt-4 flex min-w-0 items-center gap-3">
              <label htmlFor="notification-volume" className="shrink-0 text-[10px] font-medium text-muted-foreground">{copy.volume}</label>
              <input
                id="notification-volume"
                type="range"
                min={0}
                max={100}
                step={1}
                value={settings.notificationVolume}
                onChange={(event) => {
                  onSettingsChange({ ...settings, notificationVolume: safePomodoroSoundVolume(event.target.value) });
                  setAudioUnavailable(false);
                  setAudioPreviewed(false);
                }}
                aria-label={copy.volume}
                aria-valuetext={`${settings.notificationVolume}%`}
                className="h-2 min-w-0 flex-1 cursor-pointer accent-[#47796c]"
                data-testid="slider-notification-volume"
              />
              <output htmlFor="notification-volume" className="w-9 shrink-0 text-right font-mono text-[10px] text-muted-foreground" data-testid="value-notification-volume">{settings.notificationVolume}%</output>
            </div>
            <button type="button" onClick={testNotificationSound} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground" data-testid="button-test-notification"><Volume2 size={13} /> {copy.preview}</button>
            {audioUnavailable && <p className="mt-2 text-[10px] text-destructive" role="status" data-testid="status-audio-unavailable">{copy.audioUnavailable}</p>}
            {!audioUnavailable && audioPreviewed && <p className="mt-2 text-[10px] text-muted-foreground" role="status" data-testid="status-audio-preview">{settings.notificationVolume === 0 ? copy.previewSilent : copy.previewSuccess}</p>}
          </div>
          <div className={`min-w-0 rounded-2xl border p-5 ${settings.strictMode ? 'border-[#c8aa71] bg-[#fff8e7]' : 'border-border/70 bg-card'}`}><div className="flex min-w-0 items-start justify-between gap-4"><div className="min-w-0"><div className="flex min-w-0 items-center gap-2"><ShieldCheck size={16} className="shrink-0 text-muted-foreground" /><p className="min-w-0 break-words text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground [overflow-wrap:anywhere]">Qat’iy rejim</p></div><p className="mt-3 break-words text-[11px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">Faol bo‘lsa, diqqat davri tugamaguncha uni o‘tkazib yuborish tugmasi ishlamaydi.</p></div><button type="button" role="switch" aria-checked={settings.strictMode} onClick={() => onSettingsChange({ ...settings, strictMode: !settings.strictMode })} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.strictMode ? 'bg-[#9b6543]' : 'bg-muted'}`} data-testid="switch-strict-mode"><span className={`absolute top-1 size-4 rounded-full bg-card transition-transform ${settings.strictMode ? 'left-6' : 'left-1'}`} /></button></div>{settings.strictMode && <p className="mt-4 break-words rounded-xl bg-[#f3e3bd] px-3 py-2 text-[10px] font-medium text-[#745a2f] [overflow-wrap:anywhere]" role="status" data-testid="status-strict-mode">Qat’iy rejim yoqilgan: diqqat paytida o‘tkazish yopiq, qayta boshlash va pauza esa mavjud.</p>}</div>
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

  useEffect(() => () => disposePomodoroNotificationAudio(), []);

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
    const taskTitle = workspace.tasks.find((task) => task.id === id)?.title ?? '';
    if (!window.confirm(formatContentDeleteConfirmation(taskTitle, 'task'))) return;
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
    <div className="box-border min-h-full w-full min-w-0 max-w-[100vw] overflow-x-hidden bg-[#f2efe5] text-[#302c35] dark:bg-[#1d211e] dark:text-[#f3eddf]" data-testid="focus-workspace">
      <div className="box-border w-full min-w-0 max-w-full border-b border-[#d8d1bd] bg-[#f8f6ec]/95 px-5 py-4 backdrop-blur-sm dark:border-[#41453d] dark:bg-[#242821]/95 sm:px-8 lg:px-12">
        {storageError && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#e7c4b8] bg-[#fff1ec] px-4 py-3 text-[11px] text-[#8f493b]" role="alert" data-testid="status-storage-error"><span>{storageError}</span><button type="button" onClick={() => setStorageError('')} aria-label="Xabarni yopish" data-testid="button-close-storage-error"><X size={14} /></button></div>}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#9a6b23]">Fokus kundaligi</p><h1 className="mt-1 font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-[-.045em]">Fokus maydoni<span className="text-[#47796c]">.</span></h1></div>
          <div className="flex max-w-full flex-wrap items-center divide-x divide-[#ddd6c5] dark:divide-[#45463c]" data-testid="focus-summary"><div className="px-3 first:pl-0 sm:px-4"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Bugun</span><strong className="mt-1 block break-words font-serif text-[17px] leading-none [overflow-wrap:anywhere]">{todayFocus} <span className="text-[10px] font-normal">daq</span></strong></div><div className="px-3 sm:px-4"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Reja</span><strong className="mt-1 block break-words font-serif text-[17px] leading-none [overflow-wrap:anywhere]">{estimatedPomodoros} <span className="text-[10px] font-normal">davr</span></strong></div><div className="px-3 last:pr-0 sm:px-4"><span className="block font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground">Bajarildi</span><strong className="mt-1 block break-words font-serif text-[17px] leading-none text-[#47796c] [overflow-wrap:anywhere]">{completedPomodoros} <span className="text-[10px] font-normal text-foreground">davr</span></strong></div></div>
        </div>
        <nav className="sticky top-[57px] z-20 -mx-5 mt-4 flex max-w-full gap-1 overflow-x-auto border-t border-[#e2dccb] bg-[#f8f6ec]/95 pt-2 backdrop-blur-sm dark:border-[#41453d] dark:bg-[#242821]/95 sm:-mx-8 sm:px-3 lg:-mx-12 lg:px-7 md:top-0" aria-label="Fokus bo‘limlari" role="tablist" data-testid="focus-tabs">
          {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-3 text-[11px] font-semibold transition-colors ${activeTab === tab.id ? 'text-[#47796c] dark:text-[#b9d7c4]' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`tab-${tab.id}`}>{tab.icon}{tab.label}{activeTab === tab.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[#47796c]" />}</button>)}
        </nav>
      </div>
      <main className="box-border w-full min-w-0 max-w-full px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <div key={activeTab} className="diary-rise min-w-0 max-w-full">
          {activeTab === 'timer' && <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]"><FocusTimer timer={workspace.timer} tasks={tasks} settings={workspace.settings} onTimerChange={updateTimer} onSession={addSession} onOpenSettings={() => setActiveTab('settings')} /><div className="min-w-0 space-y-5"><section className="min-w-0 rounded-[24px] border border-[#d8d1bd] bg-card p-5 shadow-sm" data-testid="timer-task-preview"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Keyingi qadam</p><h2 className="mt-1 break-words font-serif text-[26px] leading-tight [overflow-wrap:anywhere]">Bugungi vazifa</h2></div><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e2eee7] text-[#47796c]"><ListChecks size={16} /></span></div><div className="mt-5 min-w-0 rounded-2xl bg-[#f5f3ea] p-4 dark:bg-[#30322c]">{activeTask ? <><p className="break-words text-[13px] font-semibold [overflow-wrap:anywhere]">{activeTask.title}</p><p className="mt-2 break-words text-[10px] [overflow-wrap:anywhere]">{activeTask.project} · {activeTask.completedPomodoros}/{activeTask.estimate} davr</p><button type="button" onClick={() => setActiveTab('tasks')} className="mt-4 text-[10px] font-semibold text-[#47796c] hover:underline" data-testid="button-open-tasks">Vazifalar ro‘yxatini ochish</button></> : <><p className="break-words text-[13px] font-semibold [overflow-wrap:anywhere]">Taymer uchun vazifa tanlang</p><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Vazifalar bo‘limidan ish tanlasangiz, sessiya loyihaga biriktiriladi.</p><button type="button" onClick={() => setActiveTab('tasks')} className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#47796c] hover:underline" data-testid="button-choose-task"><Plus size={13} /> Vazifa qo‘shish</button></>}</div></section><AmbientSoundStudio /></div></div>}
          {activeTab === 'tasks' && <section className="w-full min-w-0 max-w-full space-y-5" data-testid="task-workspace"><div className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8d7047]">Ishlar daftarim</p><h2 className="mt-1 break-words font-serif text-[clamp(2rem,4vw,3.1rem)] leading-tight [overflow-wrap:anywhere]">Vazifalar<span className="text-[#a56c34]">.</span></h2><p className="mt-2 text-[11px] text-muted-foreground">{openCount} ta vazifa ochiq · {tasks.length} ta jami</p></div><div className="max-w-full rounded-2xl bg-[#e6efe8] px-4 py-3 text-right dark:bg-[#283c32]"><p className="text-[9px] text-[#527463] dark:text-[#b8d6c3]">Pomodoro hisoboti</p><p className="mt-1 break-words font-mono text-[17px] text-[#315d4e] [overflow-wrap:anywhere] dark:text-[#d1ebd9]">{completedPomodoros}/{estimatedPomodoros} <span className="text-[10px]">davr</span></p></div></div><div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(280px,.7fr)_minmax(0,1.3fr)]"><form onSubmit={submitTask} className="h-fit min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm" data-testid="form-add-task"><div className="flex items-center gap-2"><Plus size={15} className="text-[#47796c]" /><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Yangi vazifa</p></div><input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Vazifa nomi..." className="mt-4 w-full min-w-0 rounded-xl border border-[#d8d1bd] bg-[#f8f6ec] px-3 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#47796c]/25 dark:border-[#4b4d43] dark:bg-[#30322c]" aria-label="Yangi vazifa nomi" data-testid="input-new-task-title" /><div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1"><input value={newProject} onChange={(event) => setNewProject(event.target.value)} placeholder="Loyiha nomi" className="min-w-0 rounded-xl border border-[#d8d1bd] bg-[#f8f6ec] px-3 py-2.5 text-[11px] outline-none focus:ring-2 focus:ring-[#47796c]/25 dark:border-[#4b4d43] dark:bg-[#30322c]" aria-label="Loyiha nomi" data-testid="input-new-task-project" /><select value={newEstimate} onChange={(event) => setNewEstimate(event.target.value)} className="min-w-0 max-w-full rounded-xl border border-[#d8d1bd] bg-[#f8f6ec] px-3 py-2.5 text-[11px] outline-none dark:border-[#4b4d43] dark:bg-[#30322c]" aria-label="Pomodoro taxmini"><option value="1">1 davr · 25 daq</option><option value="2">2 davr · 50 daq</option><option value="3">3 davr · 75 daq</option><option value="4">4 davr · 100 daq</option><option value="8">8 davr · 200 daq</option></select></div><button type="submit" disabled={!newTitle.trim()} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-3 text-[11px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-add-task"><Plus size={14} /> Qo‘shish</button></form><div className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Loyiha filtrlari">{projects.map((project) => <button key={project} type="button" role="tab" aria-selected={filter === project} onClick={() => setFilter(project)} className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] transition-colors ${filter === project ? 'bg-[#47796c] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`} data-testid={`filter-project-${project}`}>{project}</button>)}</div><div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-b border-border/70 pb-3 text-[10px] text-muted-foreground"><span className="min-w-0 break-words [overflow-wrap:anywhere]">{activeTask ? `Taymerda: ${activeTask.title}` : 'Taymer uchun vazifani tanlang'}</span><button type="button" onClick={() => setShowCompleted((value) => !value)} className="shrink-0 font-semibold text-[#47796c]" data-testid="button-toggle-completed">{showCompleted ? 'Bajarilganlarni yashirish' : 'Bajarilganlarni ko‘rsatish'}</button></div><div className="mt-4 space-y-5">{visibleTasks.length ? Array.from(new Set(visibleTasks.map((task) => task.project))).map((project) => <div key={project} className="min-w-0"><div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2"><p className="flex min-w-0 items-center gap-1.5 break-words text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground [overflow-wrap:anywhere]"><FolderOpen size={12} className="shrink-0" /> {project}</p><span className="shrink-0 text-[9px] text-muted-foreground">{visibleTasks.filter((task) => task.project === project).reduce((sum, task) => sum + task.completedPomodoros, 0)}/{visibleTasks.filter((task) => task.project === project).reduce((sum, task) => sum + task.estimate, 0)} davr</span></div><div className="space-y-2">{visibleTasks.filter((task) => task.project === project).map((task) => <TaskRow key={task.id} task={task} active={task.id === workspace.timer.activeTaskId} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} onSelect={() => selectTask(task.id)} onEdit={(title) => renameTask(task.id, title)} />)}</div></div>) : <div className="rounded-2xl border border-dashed border-[#d8d1bd] px-4 py-14 text-center dark:border-[#514e40]"><Circle size={20} className="mx-auto text-[#b7ae98]" /><p className="mt-3 font-serif text-[22px]">Bu yer hali ochiq.</p><p className="mt-1 text-[11px] text-muted-foreground">Birinchi vazifangizni yozib, kuningizga shakl bering.</p></div>}</div></div></div></section>}
          {activeTab === 'reports' && <FocusReports sessions={workspace.sessions} tasks={tasks} />}
          {activeTab === 'settings' && <SettingsPanel settings={workspace.settings} timer={workspace.timer} onSettingsChange={(settings) => setWorkspace((current) => ({ ...current, settings }))} onTimerChange={updateTimer} />}
        </div>
      </main>
      <footer className="flex items-center justify-center gap-2 border-t border-[#ddd6c5] px-5 py-5 text-[10px] text-muted-foreground dark:border-[#41453d]"><span className="size-1.5 rounded-full bg-[#a56c34]" /> Barcha ma’lumotlar faqat ushbu brauzerda saqlanadi <span className="size-1.5 rounded-full bg-[#47796c]" /></footer>
    </div>
  );
}