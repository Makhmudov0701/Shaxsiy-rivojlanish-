import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, ChevronDown, ChevronUp, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useI18n, type AppLanguage } from '@/lib/i18n';

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

const COPY: Record<AppLanguage, {
  modes: Record<PomodoroMode, { label: string; shortLabel: string; description: string }>;
  eyebrow: string;
  title: string;
  taskPrefix: string;
  emptyPrompt: string;
  selectedTask: string;
  removeTask: string;
  modeTabs: string;
  start: string;
  pause: string;
  reset: string;
  runningStatus: string;
  readyStatus: string;
  notificationUnavailable: string;
  notificationsEnabled: string;
  enableNotifications: string;
  unsupportedNotification: string;
  deniedNotification: string;
  completion: (mode: PomodoroMode) => string;
  notificationTitle: string;
  timerToggle: string;
  startTimer: string;
  pauseTimer: string;
  resetTimer: string;
  modeTab: (label: string) => string;
}> = {
  uz: {
    modes: {
      focus: { label: 'Diqqat rejimi', shortLabel: 'Diqqat', description: 'Yozish, o‘ylash va bir ishga chuqur kirish uchun.' },
      shortBreak: { label: 'Qisqa tanaffus', shortLabel: 'Qisqa tanaffus', description: 'Ko‘zingizni va fikringizni biroz dam oldiring.' },
      longBreak: { label: 'Uzoq tanaffus', shortLabel: 'Uzoq tanaffus', description: 'Bir necha diqqat davridan so‘ng to‘liqroq dam oling.' },
    },
    eyebrow: 'Yozish ritmi', title: 'Diqqat taymeri', taskPrefix: 'Vazifa', emptyPrompt: 'Bir ishni tanlang, 25 daqiqa diqqat qiling, so‘ng dam oling.',
    selectedTask: 'Tanlangan vazifa', removeTask: 'Vazifani olib tashlash', modeTabs: 'Taymer rejimlari', start: 'Boshlash', pause: 'Pauza', reset: 'Qayta tiklash',
    runningStatus: 'Taymer boshlandi. Xotirangizni yozishda davom eting.', readyStatus: 'Taymer tayyor. Boshlash uchun bosing.',
    notificationUnavailable: 'Bildirishnoma mavjud emas', notificationsEnabled: 'Bildirishnomalar yoqilgan', enableNotifications: 'Eslatmani yoqish',
    unsupportedNotification: 'Bu brauzer bildirishnomalarni qo‘llab-quvvatlamaydi. Ovozli eslatma baribir ishlaydi.',
    deniedNotification: 'Bildirishnoma ruxsati berilmadi. Ovozli eslatma baribir ishlaydi.',
    completion: (mode) => mode === 'focus' ? 'Diqqat vaqti tugadi. Endi tanaffus qilish vaqti.' : 'Tanaffus tugadi. Yana bir diqqat davrini boshlashingiz mumkin.',
    notificationTitle: 'Shaxsiy rivojlanish', timerToggle: 'Diqqat taymerini ochish yoki yopish', startTimer: 'Taymerni boshlash', pauseTimer: 'Taymerni pauza qilish', resetTimer: 'Taymerni qayta tiklash',
    modeTab: (label) => `${label} rejimini tanlash`,
  },
  en: {
    modes: {
      focus: { label: 'Focus mode', shortLabel: 'Focus', description: 'For writing, thinking, and deep work on one task.' },
      shortBreak: { label: 'Short break', shortLabel: 'Short break', description: 'Give your eyes and mind a little rest.' },
      longBreak: { label: 'Long break', shortLabel: 'Long break', description: 'Take a fuller rest after several focus sessions.' },
    },
    eyebrow: 'Writing rhythm', title: 'Focus timer', taskPrefix: 'Task', emptyPrompt: 'Choose one task, focus for 25 minutes, then take a break.',
    selectedTask: 'Selected task', removeTask: 'Remove task', modeTabs: 'Timer modes', start: 'Start', pause: 'Pause', reset: 'Reset',
    runningStatus: 'Timer started. Keep writing your thoughts.', readyStatus: 'Timer ready. Press start to begin.',
    notificationUnavailable: 'Notifications unavailable', notificationsEnabled: 'Notifications enabled', enableNotifications: 'Enable reminders',
    unsupportedNotification: 'This browser does not support notifications. The sound reminder will still work.',
    deniedNotification: 'Notification permission was not granted. The sound reminder will still work.',
    completion: (mode) => mode === 'focus' ? 'Focus time is over. It is time to take a break.' : 'Break time is over. You can start another focus session.',
    notificationTitle: 'Personal Development', timerToggle: 'Open or close focus timer', startTimer: 'Start timer', pauseTimer: 'Pause timer', resetTimer: 'Reset timer',
    modeTab: (label) => `Select ${label} mode`,
  },
  ru: {
    modes: {
      focus: { label: 'Режим концентрации', shortLabel: 'Фокус', description: 'Для письма, размышлений и глубокой работы над одной задачей.' },
      shortBreak: { label: 'Короткий перерыв', shortLabel: 'Короткий перерыв', description: 'Дайте глазам и мыслям немного отдохнуть.' },
      longBreak: { label: 'Длинный перерыв', shortLabel: 'Длинный перерыв', description: 'Отдохните подольше после нескольких периодов концентрации.' },
    },
    eyebrow: 'Ритм письма', title: 'Таймер концентрации', taskPrefix: 'Задача', emptyPrompt: 'Выберите задачу, поработайте 25 минут, затем отдохните.',
    selectedTask: 'Выбранная задача', removeTask: 'Убрать задачу', modeTabs: 'Режимы таймера', start: 'Начать', pause: 'Пауза', reset: 'Сбросить',
    runningStatus: 'Таймер запущен. Продолжайте записывать свои мысли.', readyStatus: 'Таймер готов. Нажмите, чтобы начать.',
    notificationUnavailable: 'Уведомления недоступны', notificationsEnabled: 'Уведомления включены', enableNotifications: 'Включить напоминания',
    unsupportedNotification: 'Этот браузер не поддерживает уведомления. Звуковое напоминание всё равно будет работать.',
    deniedNotification: 'Разрешение на уведомления не предоставлено. Звуковое напоминание всё равно будет работать.',
    completion: (mode) => mode === 'focus' ? 'Время концентрации закончилось. Пора сделать перерыв.' : 'Перерыв закончился. Можно начать новый период концентрации.',
    notificationTitle: 'Личностное развитие', timerToggle: 'Открыть или закрыть таймер концентрации', startTimer: 'Запустить таймер', pauseTimer: 'Приостановить таймер', resetTimer: 'Сбросить таймер',
    modeTab: (label) => `Выбрать режим «${label}»`,
  },
  ko: {
    modes: {
      focus: { label: '집중 모드', shortLabel: '집중', description: '글쓰기, 생각하기, 한 가지 일에 깊이 몰입할 때 사용하세요.' },
      shortBreak: { label: '짧은 휴식', shortLabel: '짧은 휴식', description: '눈과 마음을 잠시 쉬게 하세요.' },
      longBreak: { label: '긴 휴식', shortLabel: '긴 휴식', description: '여러 집중 세션 후에는 더 충분히 쉬세요.' },
    },
    eyebrow: '글쓰기 리듬', title: '집중 타이머', taskPrefix: '작업', emptyPrompt: '작업을 하나 선택하고 25분 집중한 다음 휴식하세요.',
    selectedTask: '선택한 작업', removeTask: '작업 삭제', modeTabs: '타이머 모드', start: '시작', pause: '일시정지', reset: '재설정',
    runningStatus: '타이머가 시작되었습니다. 생각을 계속 기록하세요.', readyStatus: '타이머가 준비되었습니다. 시작을 누르세요.',
    notificationUnavailable: '알림을 사용할 수 없음', notificationsEnabled: '알림 켜짐', enableNotifications: '알림 켜기',
    unsupportedNotification: '이 브라우저는 알림을 지원하지 않습니다. 소리 알림은 계속 작동합니다.',
    deniedNotification: '알림 권한이 허용되지 않았습니다. 소리 알림은 계속 작동합니다.',
    completion: (mode) => mode === 'focus' ? '집중 시간이 끝났습니다. 이제 휴식할 시간입니다.' : '휴식 시간이 끝났습니다. 다시 집중 세션을 시작할 수 있습니다.',
    notificationTitle: '자기계발', timerToggle: '집중 타이머 열기 또는 닫기', startTimer: '타이머 시작', pauseTimer: '타이머 일시정지', resetTimer: '타이머 재설정',
    modeTab: (label) => `${label} 모드 선택`,
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

export function PomodoroTimer({ taskName, onClearTask }: { taskName?: string; onClearTask?: () => void } = {}) {
  const { language } = useI18n();
  const copy = COPY[language];
  const [expanded, setExpanded] = useState(false);
  const [activeTaskName, setActiveTaskName] = useState(taskName?.trim() ?? '');
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
  const messageFadeTimeoutRef = useRef<number | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);
  const messageSequenceRef = useRef(0);
  const [completionMessageFading, setCompletionMessageFading] = useState(false);

  useEffect(() => {
    if (taskName === undefined) return;
    const nextTask = taskName.trim();
    setActiveTaskName(nextTask);
    if (nextTask) setExpanded(true);
  }, [taskName]);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const clearMessageTimeouts = () => {
    if (messageFadeTimeoutRef.current !== null) {
      window.clearTimeout(messageFadeTimeoutRef.current);
      messageFadeTimeoutRef.current = null;
    }
    if (messageTimeoutRef.current !== null) {
      window.clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    messageSequenceRef.current += 1;
  };

  const clearCompletionMessage = () => {
    clearMessageTimeouts();
    setCompletionMessage('');
    setCompletionMessageFading(false);
  };

  const showTimedMessage = (message: string) => {
    clearMessageTimeouts();
    const sequence = messageSequenceRef.current;
    setCompletionMessage(message);
    setCompletionMessageFading(false);
    messageFadeTimeoutRef.current = window.setTimeout(() => {
      if (messageSequenceRef.current === sequence) setCompletionMessageFading(true);
    }, 4500);
    messageTimeoutRef.current = window.setTimeout(() => {
      if (messageSequenceRef.current !== sequence) return;
      messageTimeoutRef.current = null;
      setCompletionMessage('');
      setCompletionMessageFading(false);
    }, 5000);
  };

  const announceCompletion = (completedMode: PomodoroMode) => {
    const message = copy.completion(completedMode);
    showTimedMessage(message);

    playGentleAlert(audioContextRef);
    if (notificationPermission === 'granted' && 'Notification' in window) {
      new Notification(copy.notificationTitle, { body: message });
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
  }, [isRunning, mode, notificationPermission, language]);

  useEffect(() => () => {
    clearTimer();
    clearMessageTimeouts();
    if (audioContextRef.current) void audioContextRef.current.close();
  }, []);

  const startTimer = () => {
    if (isRunning || remainingSeconds <= 0) return;
    clearCompletionMessage();
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
    clearCompletionMessage();
  };

  const selectMode = (nextMode: PomodoroMode) => {
    if (nextMode === mode) return;
    clearTimer();
    endAtRef.current = null;
    setIsRunning(false);
    setMode(nextMode);
    setRemainingSeconds(MODES[nextMode].seconds);
    clearCompletionMessage();
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      showTimedMessage(copy.unsupportedNotification);
      return;
    }
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    showTimedMessage(
      permission === 'granted'
        ? copy.notificationsEnabled
        : copy.deniedNotification,
    );
  };

  const modeDetails = { ...MODES[mode], ...copy.modes[mode] };
  const progress = 1 - remainingSeconds / modeDetails.seconds;

  return (
    <section id="pomodoro-timer" className="mb-8 overflow-hidden rounded-[24px] border border-[#d8c795] bg-[#faf3df] shadow-sm dark:border-[#5e5037] dark:bg-[#302a20]" data-testid="pomodoro-timer">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f5e9ca] dark:hover:bg-[#392f22] sm:px-6"
        aria-expanded={expanded}
        aria-controls="pomodoro-timer-panel"
        aria-label={copy.timerToggle}
        data-testid="button-pomodoro-toggle"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${isRunning ? 'bg-[#dcebe4] text-[#35614f] dark:bg-[#294538] dark:text-[#b5d9c4]' : 'bg-[#eadfbf] text-[#8f601a] dark:bg-[#463b29] dark:text-[#e3c984]'}`}>
            <Volume2 size={16} />
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[9px] uppercase tracking-[.18em] text-[#9a6b23]">{copy.eyebrow}</span>
              <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-serif text-[21px] leading-none text-primary">{copy.title}</span>
              <span className="text-[11px] text-muted-foreground">{modeDetails.label}</span>
            </span>
              {!expanded && <span className="mt-1 block text-[12px] leading-relaxed text-muted-foreground">{activeTaskName ? `${copy.taskPrefix}: ${activeTaskName}` : copy.emptyPrompt}</span>}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className={`font-mono text-[18px] tracking-[.08em] ${isRunning ? 'text-[#35614f] dark:text-[#b5d9c4]' : 'text-primary'}`}>{formatTime(remainingSeconds)}</span>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </span>
      </button>

      {expanded && (
        <div id="pomodoro-timer-panel" className="border-t border-[#e2d4ad] px-5 pb-5 pt-4 dark:border-[#5a4d38] sm:px-6 sm:pb-6">
           {activeTaskName && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d9c99f] bg-card/70 px-3.5 py-3 dark:border-[#5a4d38]" data-testid="pomodoro-selected-task"><div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#9a6b23]">{copy.selectedTask}</p><p className="mt-1 break-words text-[13px] font-semibold text-foreground">{activeTaskName}</p></div>{onClearTask && <button type="button" onClick={onClearTask} aria-label={copy.removeTask} className="min-h-9 rounded-lg px-2.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-clear-pomodoro-task">{copy.removeTask}</button>}</div>}
           <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.modeTabs}>
            {(Object.keys(MODES) as PomodoroMode[]).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                aria-label={copy.modeTab(copy.modes[item].label)}
                onClick={() => selectMode(item)}
                className={`rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${mode === item ? 'bg-primary text-primary-foreground' : 'bg-card/70 text-muted-foreground hover:bg-card hover:text-foreground'}`}
                disabled={isRunning}
                data-testid={`button-pomodoro-mode-${item}`}
              >
                 {copy.modes[item].shortLabel}
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
                aria-label={isRunning ? copy.pauseTimer : copy.startTimer}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                data-testid="button-pomodoro-start-pause"
              >
                {isRunning ? <Pause size={15} /> : <Play size={15} />}
                 {isRunning ? copy.pause : copy.start}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                 aria-label={copy.resetTimer}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 text-[12px] font-semibold text-foreground transition-colors hover:border-[#b89c5c]"
                data-testid="button-pomodoro-reset"
              >
                 <RotateCcw size={15} /> {copy.reset}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#e2d4ad] pt-4 dark:border-[#5a4d38] sm:flex-row sm:items-center sm:justify-between">
            <p className={`min-h-4 text-[11px] leading-relaxed text-[#755f2f] transition-opacity duration-500 dark:text-[#d6c18c] ${completionMessageFading ? 'opacity-0' : 'opacity-100'}`} aria-live="polite">
              {completionMessage || (isRunning ? copy.runningStatus : copy.readyStatus)}
            </p>
            {notificationPermission === 'unsupported' ? (
               <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><BellOff size={13} /> {copy.notificationUnavailable}</span>
            ) : notificationPermission === 'granted' ? (
               <span className="inline-flex items-center gap-1.5 text-[10px] text-[#47796c]"><Bell size={13} /> {copy.notificationsEnabled}</span>
            ) : (
              <button type="button" onClick={requestNotifications} className="inline-flex min-h-11 items-center gap-1.5 self-start text-[12px] font-semibold text-[#8f601a] underline decoration-[#cdbd8e] underline-offset-4 transition-colors hover:text-primary sm:self-auto" data-testid="button-pomodoro-notifications">
                 <Bell size={15} /> {copy.enableNotifications}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}