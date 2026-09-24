import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, ChevronDown, ChevronUp, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

const MODES: Record<PomodoroMode, { label: string; shortLabel: string; seconds: number; description: string }> = {
  focus: {
    label: 'Diqqat rejimi',
    shortLabel: 'Diqqat',
    seconds: 25 * 60,
    description: 'Yozish, o‘ylash va bir ishga chuqur kirish uchun.',
  },
  shortBreak: {
    label: 'Qisqa tanaffus',
    shortLabel: 'Qisqa tanaffus',
    seconds: 5 * 60,
    description: 'Ko‘zingizni va fikringizni biroz dam oldiring.',
  },
  longBreak: {
    label: 'Uzoq tanaffus',
    shortLabel: 'Uzoq tanaffus',
    seconds: 15 * 60,
    description: 'Bir necha diqqat davridan so‘ng to‘liqroq dam oling.',
  },
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function playGentleAlert(audioContextRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const AudioContextConstructor = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return false;

    const context = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = context;
    void context.resume();

    const now = context.currentTime;
    [660, 880, 660].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.22);
      gain.gain.setValueAtTime(0.0001, now + index * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.22 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.22 + 0.18);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.22);
      oscillator.stop(now + index * 0.22 + 0.2);
    });
    return true;
  } catch {
    return false;
  }
}

export function PomodoroTimer() {
  const [expanded, setExpanded] = useState(true);
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [remainingSeconds, setRemainingSeconds] = useState(MODES.focus.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported',
  );
  const endAtRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const announceCompletion = (completedMode: PomodoroMode) => {
    const message = completedMode === 'focus'
      ? 'Diqqat vaqti tugadi. Endi tanaffus qilish vaqti.'
      : 'Tanaffus tugadi. Yana bir diqqat davrini boshlashingiz mumkin.';
    setCompletionMessage(message);
    window.setTimeout(() => setCompletionMessage(''), 5000);

    playGentleAlert(audioContextRef);
    if (notificationPermission === 'granted' && 'Notification' in window) {
      new Notification('Shaxsiy kundalik', { body: message });
    }
  };

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return undefined;
    }

    const tick = () => {
      const endAt = endAtRef.current;
      if (!endAt) return;
      const nextRemaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        clearTimer();
        endAtRef.current = null;
        setIsRunning(false);
        announceCompletion(mode);
      }
    };

    tick();
    intervalRef.current = window.setInterval(tick, 250);
    return clearTimer;
  }, [isRunning, mode, notificationPermission]);

  useEffect(() => () => {
    clearTimer();
    if (audioContextRef.current) void audioContextRef.current.close();
  }, []);

  const startTimer = () => {
    if (isRunning || remainingSeconds <= 0) return;
    setCompletionMessage('');
    endAtRef.current = Date.now() + remainingSeconds * 1000;
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    const endAt = endAtRef.current;
    const nextRemaining = endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : remainingSeconds;
    clearTimer();
    endAtRef.current = null;
    setRemainingSeconds(nextRemaining);
    setIsRunning(false);
  };

  const resetTimer = () => {
    clearTimer();
    endAtRef.current = null;
    setIsRunning(false);
    setRemainingSeconds(MODES[mode].seconds);
    setCompletionMessage('');
  };

  const selectMode = (nextMode: PomodoroMode) => {
    if (nextMode === mode) return;
    clearTimer();
    endAtRef.current = null;
    setIsRunning(false);
    setMode(nextMode);
    setRemainingSeconds(MODES[nextMode].seconds);
    setCompletionMessage('');
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      setCompletionMessage('Bu brauzer bildirishnomalarni qo‘llab-quvvatlamaydi. Ovozli eslatma baribir ishlaydi.');
      return;
    }
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    setCompletionMessage(
      permission === 'granted'
        ? 'Brauzer bildirishnomalari yoqildi.'
        : 'Bildirishnoma ruxsati berilmadi. Ovozli eslatma baribir ishlaydi.',
    );
    window.setTimeout(() => setCompletionMessage(''), 5000);
  };

  const modeDetails = MODES[mode];
  const progress = 1 - remainingSeconds / modeDetails.seconds;

  return (
    <section className="mb-8 overflow-hidden rounded-[24px] border border-[#d8c795] bg-[#faf3df] shadow-sm dark:border-[#5e5037] dark:bg-[#302a20]" data-testid="pomodoro-timer">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f5e9ca] dark:hover:bg-[#392f22] sm:px-6"
        aria-expanded={expanded}
        aria-controls="pomodoro-timer-panel"
        data-testid="button-pomodoro-toggle"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${isRunning ? 'bg-[#dcebe4] text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]' : 'bg-[#eadfbf] text-[#8f601a] dark:bg-[#463b29] dark:text-[#e3c984]'}`}>
            <Volume2 size={16} />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[9px] uppercase tracking-[.18em] text-[#9a6b23]">Yozish ritmi</span>
            <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-serif text-[21px] leading-none text-primary">Diqqat taymeri</span>
              <span className="text-[11px] text-muted-foreground">{modeDetails.label}</span>
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className={`font-mono text-[18px] tracking-[.08em] ${isRunning ? 'text-[#35614f] dark:text-[#b5d9c4]' : 'text-primary'}`}>{formatTime(remainingSeconds)}</span>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </span>
      </button>

      {expanded && (
        <div id="pomodoro-timer-panel" className="border-t border-[#e2d4ad] px-5 pb-5 pt-4 dark:border-[#5a4d38] sm:px-6 sm:pb-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Taymer rejimlari">
            {(Object.keys(MODES) as PomodoroMode[]).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                onClick={() => selectMode(item)}
                className={`rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${mode === item ? 'bg-primary text-primary-foreground' : 'bg-card/70 text-muted-foreground hover:bg-card hover:text-foreground'}`}
                disabled={isRunning}
                data-testid={`button-pomodoro-mode-${item}`}
              >
                {MODES[item].shortLabel}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-serif text-[25px] leading-none">{modeDetails.label}</p>
                  <p className="mt-2 max-w-md text-[11px] leading-relaxed text-muted-foreground">{modeDetails.description}</p>
                </div>
                <p className="shrink-0 font-mono text-[30px] leading-none tracking-[-.04em] text-primary">{formatTime(remainingSeconds)}</p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e6dcc3] dark:bg-[#4a402d]" aria-hidden="true">
                <div className="h-full rounded-full bg-[#47796c] transition-[width] duration-300 dark:bg-[#83b494]" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={isRunning ? pauseTimer : startTimer}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                data-testid="button-pomodoro-start-pause"
              >
                {isRunning ? <Pause size={15} /> : <Play size={15} />}
                {isRunning ? 'Pauza' : 'Boshlash'}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-[12px] font-semibold text-foreground transition-colors hover:border-[#b89c5c]"
                data-testid="button-pomodoro-reset"
              >
                <RotateCcw size={15} /> Qayta tiklash
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#e2d4ad] pt-4 dark:border-[#5a4d38] sm:flex-row sm:items-center sm:justify-between">
            <p className="min-h-4 text-[11px] leading-relaxed text-[#755f2f] dark:text-[#d6c18c]" aria-live="polite">
              {completionMessage || (isRunning ? 'Vaqt ketmoqda. Yozishda davom eting.' : 'Taymer tayyor. Boshlashga tayyormisiz?')}
            </p>
            {notificationPermission === 'unsupported' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><BellOff size={13} /> Bildirishnoma mavjud emas</span>
            ) : notificationPermission === 'granted' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-[#47796c]"><Bell size={13} /> Bildirishnomalar yoqilgan</span>
            ) : (
              <button type="button" onClick={requestNotifications} className="inline-flex items-center gap-1.5 self-start text-[10px] font-semibold text-[#8f601a] underline decoration-[#cdbd8e] underline-offset-4 transition-colors hover:text-primary sm:self-auto" data-testid="button-pomodoro-notifications">
                <Bell size={13} /> Bildirishnomani yoqish
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}