import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AudioLines, Pause, Play, Volume2 } from 'lucide-react';

export type AmbientSound =
  | 'rain'
  | 'storm'
  | 'forest'
  | 'forest-night'
  | 'cafe'
  | 'white-noise'
  | 'ocean'
  | 'fireplace'
  | 'night-city'
  | 'lofi-piano';

export type NoiseColor = 'white' | 'pink' | 'brown';

export type AmbientSoundOption = {
  value: AmbientSound;
  label: string;
  description: string;
  duration: string;
  streamUrl: string | null;
  sourceUrl: string | null;
};

export const ambientSounds: AmbientSoundOption[] = [
  {
    value: 'rain',
    label: 'Mayin yomg‘ir',
    description: 'Deraza ortidagi tinch yomg‘ir',
    duration: '5:35',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/1247/1247-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/rain/',
  },
  {
    value: 'storm',
    label: 'Momaqaldiroq',
    description: 'Yomg‘ir va uzoq momaqaldiroq',
    duration: '0:29',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/storm/',
  },
  {
    value: 'forest',
    label: 'O‘rmon qushlari',
    description: 'Qushlar va yengil shamol',
    duration: '2:31',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/forest/',
  },
  {
    value: 'forest-night',
    label: 'Tungi tabiat',
    description: 'Hasharotlar va sokin tun',
    duration: '1:24',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/2414/2414-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/forest/',
  },
  {
    value: 'cafe',
    label: 'Kafe',
    description: 'Uzoqdagi suhbatlar va xona shovqini',
    duration: '2:00',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/444/444-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/restaurant/',
  },
  {
    value: 'white-noise',
    label: 'Fokus shovqini',
    description: 'Oq, pushti yoki jigarrang shovqin',
    duration: 'Cheksiz',
    streamUrl: null,
    sourceUrl: null,
  },
  {
    value: 'ocean',
    label: 'Dengiz',
    description: 'Sohilga urilayotgan sokin to‘lqinlar',
    duration: '0:48',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/1196/1196-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/ocean/',
  },
  {
    value: 'fireplace',
    label: 'Gulxan',
    description: 'Mayin olovning qirsillashi',
    duration: '0:24',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/1330/1330-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/campfire/',
  },
  {
    value: 'night-city',
    label: 'Tungi shahar',
    description: 'Uzoqdagi tungi shahar muhiti',
    duration: '2:06',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/2678/2678-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/city/',
  },
  {
    value: 'lofi-piano',
    label: 'Sokin pianino',
    description: 'Diqqat uchun mayin instrumental',
    duration: '3:19',
    streamUrl: 'https://assets.mixkit.co/music/22/22.mp3',
    sourceUrl: 'https://mixkit.co/free-stock-music/piano/',
  },
];

const noiseColors: Array<{ value: NoiseColor; label: string }> = [
  { value: 'white', label: 'Oq' },
  { value: 'pink', label: 'Pushti' },
  { value: 'brown', label: 'Jigarrang' },
];

type SoundContextValue = {
  selected: AmbientSound;
  playing: boolean;
  volume: number;
  noiseColor: NoiseColor;
  error: string;
  setSelected: (sound: AmbientSound) => void;
  setVolume: (volume: number) => void;
  setNoiseColor: (color: NoiseColor) => void;
  play: (sound?: AmbientSound, color?: NoiseColor) => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
};

type AudioPlayback = {
  sound: AmbientSound;
  noiseColor: NoiseColor;
  level: number;
  setLevel: (level: number) => void;
  setErrorHandler: (handler: () => void) => void;
  resume: () => Promise<void>;
  pause: () => void;
  stop: () => void;
};

type AudioTransition = {
  from: AudioPlayback | null;
  to: AudioPlayback | null;
  fromFactor: number;
  toFactor: number;
  progress: number;
};

const SoundContext = createContext<SoundContextValue | null>(null);
const settingsKey = 'kundalik-fon-tovushlari-v2';
const legacySettingsKey = 'kundalik-fon-tovushlari-v1';

function isAmbientSound(value: unknown): value is AmbientSound {
  return ambientSounds.some((sound) => sound.value === value);
}

function isNoiseColor(value: unknown): value is NoiseColor {
  return value === 'white' || value === 'pink' || value === 'brown';
}

function readSettings(): { selected: AmbientSound; volume: number; noiseColor: NoiseColor } {
  try {
    const raw = window.localStorage.getItem(settingsKey) ?? window.localStorage.getItem(legacySettingsKey);
    if (!raw) return { selected: 'rain', volume: 28, noiseColor: 'white' };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return { selected: 'rain', volume: 28, noiseColor: 'white' };
    const candidate = value as { selected?: unknown; volume?: unknown; noiseColor?: unknown };
    return {
      selected: isAmbientSound(candidate.selected) ? candidate.selected : 'rain',
      volume: typeof candidate.volume === 'number' && Number.isFinite(candidate.volume) ? Math.max(0, Math.min(100, candidate.volume)) : 28,
      noiseColor: isNoiseColor(candidate.noiseColor) ? candidate.noiseColor : 'white',
    };
  } catch {
    return { selected: 'rain', volume: 28, noiseColor: 'white' };
  }
}

function createNoiseBuffer(context: AudioContext, color: NoiseColor) {
  const length = context.sampleRate * 12;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let brown = 0;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let peak = 0;

  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    let sample = white;
    if (color === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else if (color === 'brown') {
      brown = (brown + 0.025 * white) / 1.025;
      sample = brown * 3.5;
    }
    samples[index] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  const edge = Math.floor(context.sampleRate * 0.035);
  const normalization = peak > 0 ? 0.62 / peak : 1;
  for (let index = 0; index < length; index += 1) {
    const edgeLevel = Math.min(1, index / edge, (length - index - 1) / edge);
    samples[index] *= normalization * Math.max(0, edgeLevel);
  }
  return buffer;
}

async function createPlayback(sound: AmbientSound, noiseColor: NoiseColor): Promise<AudioPlayback> {
  if (sound === 'white-noise') {
    const AudioContextConstructor = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error('unsupported');
    const context = new AudioContextConstructor();
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = createNoiseBuffer(context, noiseColor);
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
    await context.resume();
    let stopped = false;
    let errorHandler: () => void = () => undefined;
    let level = 0;
    return {
      sound,
      noiseColor,
      get level() { return level; },
      set level(value: number) { level = value; },
      setLevel(value) {
        level = Math.max(0, Math.min(1, value));
        gain.gain.setTargetAtTime(level * 0.3, context.currentTime, 0.035);
      },
      setErrorHandler(handler) { errorHandler = handler; },
      async resume() { await context.resume(); },
      pause() { void context.suspend(); },
      stop() {
        if (stopped) return;
        stopped = true;
        try { source.stop(); } catch { /* The source may already have stopped. */ }
        source.disconnect();
        gain.disconnect();
        void context.close();
        errorHandler = () => undefined;
      },
    };
  }

  const option = ambientSounds.find((item) => item.value === sound);
  if (!option?.streamUrl) throw new Error('missing-source');
  const audio = new Audio(option.streamUrl);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  audio.setAttribute('playsinline', 'true');
  let stopped = false;
  let level = 0;
  let errorHandler: () => void = () => undefined;
  audio.addEventListener('error', () => {
    if (!stopped) errorHandler();
  });
  try {
    await audio.play();
  } catch (error) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    throw error;
  }
  return {
    sound,
    noiseColor,
    get level() { return level; },
    set level(value: number) { level = value; },
    setLevel(value) {
      level = Math.max(0, Math.min(1, value));
      audio.volume = level;
    },
    setErrorHandler(handler) { errorHandler = handler; },
    async resume() { await audio.play(); },
    pause() { audio.pause(); },
    stop() {
      if (stopped) return;
      stopped = true;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      errorHandler = () => undefined;
    },
  };
}

function clampVolume(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function AmbientSoundProvider({ children }: { children: ReactNode }) {
  const initialSettings = useMemo(readSettings, []);
  const [selected, setSelectedState] = useState<AmbientSound>(initialSettings.selected);
  const [volume, setVolumeState] = useState(initialSettings.volume);
  const [noiseColor, setNoiseColorState] = useState<NoiseColor>(initialSettings.noiseColor);
  const [playing, setPlayingState] = useState(false);
  const [error, setError] = useState('');
  const selectedRef = useRef(selected);
  const volumeRef = useRef(volume);
  const noiseColorRef = useRef(noiseColor);
  const playingRef = useRef(playing);
  const playbackRef = useRef<AudioPlayback | null>(null);
  const transitionRef = useRef<AudioTransition | null>(null);
  const animationRef = useRef<number | null>(null);
  const requestRef = useRef(0);

  const persistSettings = useCallback(() => {
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify({
        selected: selectedRef.current,
        volume: volumeRef.current,
        noiseColor: noiseColorRef.current,
      }));
    } catch {
      setError('Ovoz sozlamasini saqlab bo‘lmadi.');
    }
  }, []);

  const setPlaying = useCallback((next: boolean) => {
    playingRef.current = next;
    setPlayingState(next);
  }, []);

  const clearTransition = useCallback((keep: AudioPlayback | null) => {
    if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    const transition = transitionRef.current;
    if (transition?.from && transition.from !== keep) transition.from.stop();
    if (transition?.to && transition.to !== keep) transition.to.stop();
    transitionRef.current = null;
  }, []);

  const fadeBetween = useCallback((
    from: AudioPlayback | null,
    to: AudioPlayback | null,
    duration: number,
    fromFactor: number,
    toFactor: number,
    onComplete: () => void,
  ) => {
    const transition: AudioTransition = { from, to, fromFactor, toFactor, progress: 0 };
    transitionRef.current = transition;
    const startedAt = performance.now();
    const animate = (now: number) => {
      if (transitionRef.current !== transition) return;
      const linear = Math.min(1, (now - startedAt) / duration);
      const progress = linear * linear * (3 - 2 * linear);
      transition.progress = progress;
      const master = volumeRef.current / 100;
      from?.setLevel(master * fromFactor * (1 - progress));
      to?.setLevel(master * toFactor * progress);
      if (linear < 1) {
        animationRef.current = window.requestAnimationFrame(animate);
        return;
      }
      transitionRef.current = null;
      animationRef.current = null;
      from?.setLevel(0);
      to?.setLevel(master * toFactor);
      onComplete();
    };
    animationRef.current = window.requestAnimationFrame(animate);
  }, []);

  const play = useCallback(async (sound?: AmbientSound, color?: NoiseColor) => {
    const target = sound ?? selectedRef.current;
    const targetColor = color ?? noiseColorRef.current;
    const wasPlaying = playingRef.current;
    const existing = playbackRef.current;
    selectedRef.current = target;
    noiseColorRef.current = targetColor;
    setSelectedState(target);
    setNoiseColorState(targetColor);
    persistSettings();
    setError('');

    if (wasPlaying && existing?.sound === target && existing.noiseColor === targetColor) return;
    const request = ++requestRef.current;
    clearTransition(existing);

    if (!wasPlaying && existing?.sound === target && existing.noiseColor === targetColor) {
      try {
        await existing.resume();
        if (request !== requestRef.current) return;
        setPlaying(true);
        fadeBetween(null, existing, 320, 0, 1, () => undefined);
        return;
      } catch {
        if (request === requestRef.current) setError('Bu brauzer fon tovushini ishga tushira olmadi.');
        return;
      }
    }

    if (!wasPlaying && existing) {
      existing.stop();
      playbackRef.current = null;
    }
    const outgoing = wasPlaying ? existing : null;
    const outgoingMaster = volumeRef.current / 100;
    const outgoingFactor = outgoing && outgoingMaster > 0 ? Math.min(1, outgoing.level / outgoingMaster) : 1;
    try {
      const incoming = await createPlayback(target, targetColor);
      if (request !== requestRef.current) {
        incoming.stop();
        return;
      }
      incoming.setErrorHandler(() => {
        if (playbackRef.current !== incoming) return;
        incoming.pause();
        incoming.setLevel(0);
        setPlaying(false);
        setError('Ovoz oqimi uzildi. Internet aloqasini tekshirib qayta boshlang.');
      });
      playbackRef.current = incoming;
      setPlaying(true);
      fadeBetween(outgoing, incoming, 1200, outgoingFactor, 1, () => outgoing?.stop());
    } catch {
      if (request !== requestRef.current) return;
      if (wasPlaying && outgoing) {
        selectedRef.current = outgoing.sound;
        noiseColorRef.current = outgoing.noiseColor;
        setSelectedState(outgoing.sound);
        setNoiseColorState(outgoing.noiseColor);
        persistSettings();
        setPlaying(true);
      } else {
        playbackRef.current = null;
        setPlaying(false);
      }
      setError('Tovush yuklanmadi. Internet aloqasini tekshiring.');
    }
  }, [clearTransition, fadeBetween, persistSettings, setPlaying]);

  const pause = useCallback(() => {
    const current = playbackRef.current;
    if (!current || !playingRef.current) {
      setPlaying(false);
      return;
    }
    requestRef.current += 1;
    clearTransition(current);
    const master = volumeRef.current / 100;
    const factor = master > 0 ? Math.min(1, current.level / master) : 1;
    setPlaying(false);
    fadeBetween(current, null, 280, factor, 0, () => current.pause());
  }, [clearTransition, fadeBetween, setPlaying]);

  const toggle = useCallback(async () => {
    if (playingRef.current) {
      pause();
      return;
    }
    await play();
  }, [pause, play]);

  const setSelected = useCallback((sound: AmbientSound) => {
    if (playingRef.current) {
      void play(sound);
      return;
    }
    selectedRef.current = sound;
    setSelectedState(sound);
    persistSettings();
    requestRef.current += 1;
    clearTransition(null);
    playbackRef.current?.stop();
    playbackRef.current = null;
    setError('');
  }, [clearTransition, persistSettings, play]);

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = clampVolume(nextVolume);
    volumeRef.current = safeVolume;
    setVolumeState(safeVolume);
    persistSettings();
    const transition = transitionRef.current;
    if (transition) {
      const master = safeVolume / 100;
      transition.from?.setLevel(master * transition.fromFactor * (1 - transition.progress));
      transition.to?.setLevel(master * transition.toFactor * transition.progress);
    } else if (playingRef.current) {
      playbackRef.current?.setLevel(safeVolume / 100);
    }
  }, [persistSettings]);

  const setNoiseColor = useCallback((color: NoiseColor) => {
    if (noiseColorRef.current === color) return;
    noiseColorRef.current = color;
    setNoiseColorState(color);
    persistSettings();
    if (playingRef.current && selectedRef.current === 'white-noise') void play('white-noise', color);
  }, [persistSettings, play]);

  useEffect(() => () => {
    requestRef.current += 1;
    if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    transitionRef.current?.from?.stop();
    transitionRef.current?.to?.stop();
    playbackRef.current?.stop();
    transitionRef.current = null;
    playbackRef.current = null;
  }, []);

  const value = useMemo(
    () => ({ selected, playing, volume, noiseColor, error, setSelected, setVolume, setNoiseColor, play, pause, toggle }),
    [selected, playing, volume, noiseColor, error, setSelected, setVolume, setNoiseColor, play, pause, toggle],
  );
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useAmbientSound() {
  const value = useContext(SoundContext);
  if (!value) throw new Error('AmbientSoundControl AmbientSoundProvider ichida bo‘lishi kerak.');
  return value;
}

export function AmbientSoundControl({ collapsed }: { collapsed: boolean }) {
  const { selected, playing, volume, noiseColor, error, setSelected, setVolume, setNoiseColor, toggle } = useAmbientSound();
  const selectedOption = ambientSounds.find((sound) => sound.value === selected);
  const selectedLabel = selectedOption?.label ?? 'Mayin yomg‘ir';
  return (
    <section className={`rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3.5 ${collapsed ? 'md:border-0 md:bg-transparent md:p-0' : ''}`} aria-label="Fon tovushlari" data-testid="ambient-sound-control">
      <div className={`flex items-center gap-2 ${collapsed ? 'md:hidden' : ''}`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-primary"><AudioLines size={15} /></span>
        <div className="min-w-0 flex-1"><p className="font-mono text-[8px] uppercase tracking-[.15em] text-sidebar-foreground/55">Fon tovushlari</p><p className="truncate text-[11px] font-medium">{playing ? selectedLabel : 'Tinchlik rejimi'}</p></div>
        <button type="button" onClick={() => { void toggle(); }} className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-transform hover:scale-105" aria-label={playing ? 'Fon tovushini to‘xtatish' : 'Fon tovushini boshlash'} title={playing ? 'To‘xtatish' : 'Boshlash'} data-testid="button-ambient-toggle">{playing ? <Pause size={14} /> : <Play size={14} />}</button>
      </div>
      <div className={`mt-3 space-y-3 ${collapsed ? 'md:hidden' : ''}`}>
        <label className="block text-[9px] text-sidebar-foreground/65" htmlFor="ambient-sound-select">Tovush turi</label>
        <select id="ambient-sound-select" value={selected} onChange={(event) => setSelected(event.target.value as AmbientSound)} className="w-full rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-[10px] text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring" data-testid="select-ambient-sound">{ambientSounds.map((sound) => <option key={sound.value} value={sound.value}>{sound.label}</option>)}</select>
        {selected === 'white-noise' && (
          <label className="block text-[9px] text-sidebar-foreground/65" htmlFor="ambient-noise-color">Shovqin turi
            <select id="ambient-noise-color" value={noiseColor} onChange={(event) => setNoiseColor(event.target.value as NoiseColor)} className="mt-1 w-full rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-[10px] text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring">
              {noiseColors.map((color) => <option key={color.value} value={color.value}>{color.label}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-[9px] text-sidebar-foreground/65" htmlFor="ambient-volume"><Volume2 size={13} /><span className="min-w-0 flex-1">Ovoz balandligi</span><span className="font-mono">{volume}%</span></label>
        <input id="ambient-volume" type="range" min={0} max={100} value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-full accent-[#d9a441]" aria-label="Ovoz balandligi" data-testid="input-ambient-volume" />
        {selectedOption?.sourceUrl && <a href={selectedOption.sourceUrl} target="_blank" rel="noreferrer" className="block text-[9px] text-sidebar-foreground/55 underline underline-offset-2">Audio manbasi: Mixkit</a>}
        {error && <p className="text-[9px] text-[#f1b6a8]" role="status" data-testid="status-ambient-error">{error}</p>}
      </div>
      {collapsed && <button type="button" onClick={() => { void toggle(); }} className="hidden size-10 w-full items-center justify-center rounded-xl text-sidebar-primary transition-colors hover:bg-sidebar-accent md:flex md:w-10" aria-label={playing ? `Fon tovushini to‘xtatish: ${selectedLabel}` : `Fon tovushini boshlash: ${selectedLabel}`} title={`${selectedLabel} · ${playing ? 'to‘xtatish' : 'boshlash'}`} data-testid="button-ambient-toggle-collapsed">{playing ? <Pause size={16} /> : <AudioLines size={17} />}</button>}
    </section>
  );
}