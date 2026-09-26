export const POMODORO_SOUND_PRESETS = [
  { value: 'zen-bowl', label: 'Zen Gong / Singing Bowl' },
  { value: 'digital-chime', label: 'Digital Chime / Bell Trio' },
  { value: 'marimba-strum', label: 'Marimba Melodic Strum' },
  { value: 'soft-flute', label: 'Soft Flute / Acoustic Chord' },
] as const;

export type PomodoroSoundPreset = (typeof POMODORO_SOUND_PRESETS)[number]['value'];

export const DEFAULT_POMODORO_SOUND_PRESET: PomodoroSoundPreset = 'zen-bowl';
export const DEFAULT_POMODORO_SOUND_VOLUME = 65;

export function isPomodoroSoundPreset(value: unknown): value is PomodoroSoundPreset {
  return POMODORO_SOUND_PRESETS.some((preset) => preset.value === value);
}

export function safePomodoroSoundVolume(value: unknown): number {
  if (typeof value !== 'number' && typeof value !== 'string') return DEFAULT_POMODORO_SOUND_VOLUME;
  if (typeof value === 'string' && !value.trim()) return DEFAULT_POMODORO_SOUND_VOLUME;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_POMODORO_SOUND_VOLUME;
  return Math.round(Math.min(100, Math.max(0, parsed)));
}

type Harmonic = { ratio: number; level: number };
type SynthNote = {
  frequency: number;
  offset: number;
  duration: number;
  attack: number;
  release: number;
  hold: boolean;
  waveform: OscillatorType;
  harmonics: Harmonic[];
};

const SOUND_NOTES: Record<PomodoroSoundPreset, SynthNote[]> = {
  'zen-bowl': [
    {
      frequency: 220,
      offset: 0,
      duration: 3.1,
      attack: 0.09,
      release: 1.9,
      hold: false,
      waveform: 'sine',
      harmonics: [
        { ratio: 1, level: 0.2 },
        { ratio: 2.02, level: 0.085 },
        { ratio: 2.99, level: 0.045 },
        { ratio: 4.03, level: 0.025 },
        { ratio: 5.41, level: 0.014 },
      ],
    },
  ],
  'digital-chime': [784, 988, 1175].map((frequency, index) => ({
    frequency,
    offset: index * 0.17,
    duration: 1.15,
    attack: 0.008,
    release: 0.72,
    hold: false,
    waveform: 'sine',
    harmonics: [
      { ratio: 1, level: 0.17 },
      { ratio: 2.76, level: 0.065 },
      { ratio: 5.4, level: 0.018 },
    ],
  })),
  'marimba-strum': [392, 494, 587, 784].map((frequency, index) => ({
    frequency,
    offset: index * 0.11,
    duration: 0.72,
    attack: 0.006,
    release: 0.36,
    hold: false,
    waveform: 'triangle',
    harmonics: [
      { ratio: 1, level: 0.14 },
      { ratio: 2.04, level: 0.028 },
    ],
  })),
  'soft-flute': [349.23, 440, 523.25].map((frequency, index) => ({
    frequency,
    offset: index * 0.045,
    duration: 1.75,
    attack: 0.16,
    release: 0.62,
    hold: true,
    waveform: 'sine',
    harmonics: [
      { ratio: 1, level: 0.14 },
      { ratio: 2, level: 0.018 },
    ],
  })),
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextConstructor();
  }
  return sharedAudioContext;
}

function resumeAudioContext(context: AudioContext) {
  if (context.state === 'suspended') void context.resume().catch(() => undefined);
}

export function preparePomodoroNotificationAudio(): boolean {
  try {
    const context = getAudioContext();
    if (!context) return false;
    resumeAudioContext(context);
    return true;
  } catch {
    return false;
  }
}

function scheduleNote(context: AudioContext, output: GainNode, startAt: number, note: SynthNote) {
  const noteStart = startAt + note.offset;
  const noteEnd = noteStart + note.duration;
  const attackEnd = noteStart + Math.min(note.attack, note.duration * 0.4);
  const releaseStart = note.hold
    ? Math.max(attackEnd, noteEnd - note.release)
    : attackEnd;

  note.harmonics.forEach(({ ratio, level }) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = note.waveform;
    oscillator.frequency.setValueAtTime(note.frequency * ratio, noteStart);
    envelope.gain.setValueAtTime(0.0001, noteStart);
    envelope.gain.exponentialRampToValueAtTime(level, attackEnd);
    if (releaseStart > attackEnd) envelope.gain.setValueAtTime(level, releaseStart);
    envelope.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd + 0.03);
  });
}

export function playPomodoroNotification(preset: PomodoroSoundPreset, volume: number): boolean {
  if (volume <= 0) return true;

  try {
    const context = getAudioContext();
    if (!context) return false;
    resumeAudioContext(context);

    const notes = SOUND_NOTES[preset];
    if (!notes) return false;
    const startAt = context.currentTime + 0.035;
    const normalizedVolume = Math.min(100, Math.max(0, volume)) / 100;
    const output = context.createGain();
    output.gain.setValueAtTime(0.72 * normalizedVolume, startAt);
    output.connect(context.destination);
    notes.forEach((note) => scheduleNote(context, output, startAt, note));

    const duration = Math.max(...notes.map((note) => note.offset + note.duration));
    output.gain.setValueAtTime(0.72 * normalizedVolume, startAt + duration);
    output.gain.exponentialRampToValueAtTime(0.0001, startAt + duration + 0.12);
    window.setTimeout(() => output.disconnect(), (duration + 0.2) * 1000);
    return true;
  } catch {
    return false;
  }
}

export function disposePomodoroNotificationAudio() {
  const context = sharedAudioContext;
  sharedAudioContext = null;
  if (context && context.state !== 'closed') void context.close().catch(() => undefined);
}