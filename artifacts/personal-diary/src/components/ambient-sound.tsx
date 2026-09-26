import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AudioLines, Pause, Play, Volume2 } from 'lucide-react';
import { formatAmbientControlTitle, formatAmbientLayerToggleLabel, getCurrentLanguage, useI18n } from '@/lib/i18n';
import {
  getAmbientAudioCopy,
  getAmbientSoundName,
  type AmbientNoiseColor,
  type AmbientSoundId,
} from '@/lib/ambient-audio-copy';

export type AmbientSound = AmbientSoundId;
export type NoiseColor = AmbientNoiseColor;
export type AudioLayer = 'primary' | 'mix';

export type AmbientSoundOption = {
  value: AmbientSound;
  label: string;
  description: string;
  duration: string;
  streamUrl: string | null;
  sourceUrl: string | null;
  attribution?: string;
  licenseUrl?: string;
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
  {
    value: 'library',
    label: 'Kutubxona',
    description: 'Sokin o‘quv zali muhiti',
    duration: '10:47',
    streamUrl: 'https://cdn.freesound.org/previews/173/173344_3226149-hq.mp3',
    sourceUrl: 'https://freesound.org/people/morosopher/sounds/173344/',
    attribution: 'Freesound · “Library ambience” by morosopher · CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  },
  {
    value: 'train',
    label: 'Poyezd yo‘li',
    description: 'Eski poyezdning sokin jo‘nashi',
    duration: '1:47',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/1628/1628-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/train/',
  },
  {
    value: 'rain-tent',
    label: 'Chodirdagi yomg‘ir',
    description: 'Chodir matosiga urilgan yomg‘ir',
    duration: '2:33',
    streamUrl: 'https://cdn.freesound.org/previews/462/462845_670687-hq.mp3',
    sourceUrl: 'https://freesound.org/people/Eelke/sounds/462845/',
    attribution: 'Freesound · “rain on tent 01” by Eelke · CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    value: 'space-rumble',
    label: 'Fazo gumburi',
    description: 'Past chastotali, sokin kosmik drone',
    duration: '2:48',
    streamUrl: 'https://cdn.freesound.org/previews/767/767355_4284820-hq.mp3',
    sourceUrl: 'https://freesound.org/people/IsaacRC/sounds/767355/',
    attribution: 'Freesound · “Deep Space Rumble - Low Frequency Background Noise - Ominous FX” by IsaacRC · CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    value: 'waterfall',
    label: 'Sharshara',
    description: 'O‘rmondagi sharsharaning uzluksiz shovqini',
    duration: '1:22',
    streamUrl: 'https://assets.mixkit.co/active_storage/sfx/2517/2517-preview.mp3',
    sourceUrl: 'https://mixkit.co/free-sound-effects/waterfall/',
  },
  {
    value: 'lofi-beats',
    label: 'Mayin lo-fi ritmlar',
    description: 'Sokin ritm va yumshoq instrumental',
    duration: '1:59',
    streamUrl: 'https://assets.mixkit.co/music/135/135.mp3',
    sourceUrl: 'https://mixkit.co/free-stock-music/lo-fi-beats/',
  },
  {
    value: 'night-wind',
    label: 'Tungi shamol',
    description: 'Past chastotali, mayin shamol shovqini',
    duration: 'Cheksiz',
    streamUrl: null,
    sourceUrl: null,
  },
];

const noiseColors: Array<{ value: NoiseColor; label: string }> = [
  { value: 'white', label: 'Oq' },
  { value: 'pink', label: 'Pushti' },
  { value: 'brown', label: 'Jigarrang' },
];

type SlotPreferences = {
  selected: AmbientSound | null;
  volume: number;
  noiseColor: NoiseColor;
};

type SoundSlotState = SlotPreferences & {
  playing: boolean;
  error: string;
};

type SoundContextValue = {
  primary: SoundSlotState;
  mix: SoundSlotState;
  setSelected: (layer: AudioLayer, sound: AmbientSound | null) => void;
  setVolume: (layer: AudioLayer, volume: number) => void;
  setNoiseColor: (layer: AudioLayer, color: NoiseColor) => void;
  play: (layer: AudioLayer, sound?: AmbientSound, color?: NoiseColor) => Promise<void>;
  pause: (layer: AudioLayer) => void;
  toggle: (layer: AudioLayer) => Promise<void>;
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
const settingsKey = 'kundalik-fon-tovushlari-v3';
const legacySettingsKeys = ['kundalik-fon-tovushlari-v2', 'kundalik-fon-tovushlari-v1'];

function isAmbientSound(value: unknown): value is AmbientSound {
  return ambientSounds.some((sound) => sound.value === value);
}

function isNoiseColor(value: unknown): value is NoiseColor {
  return value === 'white' || value === 'pink' || value === 'brown';
}

function defaultPreferences(layer: AudioLayer): SlotPreferences {
  return {
    selected: layer === 'primary' ? 'rain' : null,
    volume: layer === 'primary' ? 28 : 24,
    noiseColor: 'white',
  };
}

function readSettings(): Record<AudioLayer, SlotPreferences> {
  try {
    const raw = [settingsKey, ...legacySettingsKeys]
      .map((key) => window.localStorage.getItem(key))
      .find((value) => value !== null);
    if (!raw) return { primary: defaultPreferences('primary'), mix: defaultPreferences('mix') };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return { primary: defaultPreferences('primary'), mix: defaultPreferences('mix') };
    const candidate = value as {
      primary?: unknown;
      mix?: unknown;
      selected?: unknown;
      volume?: unknown;
      noiseColor?: unknown;
    };
    const readLayer = (layer: AudioLayer, input: unknown): SlotPreferences => {
      const fallback = defaultPreferences(layer);
      if (!input || typeof input !== 'object') return fallback;
      const stored = input as { selected?: unknown; volume?: unknown; noiseColor?: unknown };
      return {
        selected: isAmbientSound(stored.selected) ? stored.selected : fallback.selected,
        volume: typeof stored.volume === 'number' && Number.isFinite(stored.volume)
          ? Math.max(0, Math.min(100, stored.volume))
          : fallback.volume,
        noiseColor: isNoiseColor(stored.noiseColor) ? stored.noiseColor : fallback.noiseColor,
      };
    };
    return {
      primary: readLayer('primary', candidate.primary ?? candidate),
      mix: readLayer('mix', candidate.mix),
    };
  } catch {
    return { primary: defaultPreferences('primary'), mix: defaultPreferences('mix') };
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
  if (sound === 'white-noise' || sound === 'night-wind') {
    const AudioContextConstructor = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) throw new Error('unsupported');
    const context = new AudioContextConstructor();
    const source = context.createBufferSource();
    const gain = context.createGain();
    const isNightWind = sound === 'night-wind';
    const windFilter = isNightWind ? context.createBiquadFilter() : null;
    const windLevel = isNightWind ? context.createGain() : null;
    const gust = isNightWind ? context.createOscillator() : null;
    const gustDepth = isNightWind ? context.createGain() : null;
    source.buffer = createNoiseBuffer(context, isNightWind ? 'brown' : noiseColor);
    source.loop = true;
    gain.gain.value = 0;
    if (windFilter && windLevel && gust && gustDepth) {
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 420;
      windFilter.Q.value = 0.65;
      windLevel.gain.value = 0.32;
      gust.frequency.value = 0.075;
      gustDepth.gain.value = 0.1;
      gust.connect(gustDepth);
      gustDepth.connect(windLevel.gain);
      source.connect(windFilter);
      windFilter.connect(windLevel);
      windLevel.connect(gain);
      gust.start();
    } else {
      source.connect(gain);
    }
    gain.connect(context.destination);
    source.start();
    await context.resume();
    let stopped = false;
    let errorHandler: () => void = () => undefined;
    let level = 0;
    return {
      sound,
      noiseColor: isNightWind ? 'brown' : noiseColor,
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
        try { gust?.stop(); } catch { /* The oscillator may already have stopped. */ }
        source.disconnect();
        gust?.disconnect();
        gustDepth?.disconnect();
        windFilter?.disconnect();
        windLevel?.disconnect();
        gain.disconnect();
        void context.close();
        errorHandler = () => undefined;
      },
    };
  }

  const option = ambientSounds.find((item) => item.value === sound);
  if (!option?.streamUrl) throw new Error('missing-source');
  const streamUrl = option.streamUrl;
  const firstAudio = new Audio(streamUrl);
  firstAudio.loop = true;
  firstAudio.preload = 'metadata';
  firstAudio.volume = 0;
  firstAudio.setAttribute('playsinline', 'true');
  let stopped = false;
  let level = 0;
  let errorHandler: () => void = () => undefined;
  let activeAudio = firstAudio;
  let standbyAudio: HTMLAudioElement | null = null;
  let loopProgress = 0;
  let loopFrame: number | null = null;
  let detachLoopMonitor: () => void = () => undefined;

  const releaseAudio = (audio: HTMLAudioElement) => {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };

  const updateLevels = () => {
    activeAudio.volume = level * (standbyAudio ? 1 - loopProgress : 1);
    if (standbyAudio) standbyAudio.volume = level * loopProgress;
  };

  const stopStandby = () => {
    if (loopFrame !== null) window.cancelAnimationFrame(loopFrame);
    loopFrame = null;
    if (standbyAudio) releaseAudio(standbyAudio);
    standbyAudio = null;
    loopProgress = 0;
    updateLevels();
  };

  const monitorLoop = (audio: HTMLAudioElement) => {
    detachLoopMonitor();
    let loopArmed = true;
    const tryLoopCrossfade = () => {
      if (stopped || audio !== activeAudio || standbyAudio || !Number.isFinite(audio.duration)) return;
      if (audio.currentTime < audio.duration / 2) loopArmed = true;
      if (!loopArmed || audio.duration < 8 || audio.duration - audio.currentTime > 2.25) return;
      loopArmed = false;

      const nextAudio = new Audio(streamUrl);
      nextAudio.loop = true;
      nextAudio.preload = 'metadata';
      nextAudio.volume = 0;
      nextAudio.setAttribute('playsinline', 'true');
      standbyAudio = nextAudio;
      const onStandbyError = () => {
        if (standbyAudio !== nextAudio) return;
        nextAudio.removeEventListener('error', onStandbyError);
        stopStandby();
      };
      nextAudio.addEventListener('error', onStandbyError);
      updateLevels();

      void nextAudio.play().then(() => {
        if (stopped || standbyAudio !== nextAudio) {
          nextAudio.removeEventListener('error', onStandbyError);
          releaseAudio(nextAudio);
          return;
        }
        const startedAt = performance.now();
        const fadeDuration = 1650;
        const animate = (now: number) => {
          if (stopped || standbyAudio !== nextAudio) return;
          const linear = Math.min(1, (now - startedAt) / fadeDuration);
          loopProgress = linear * linear * (3 - 2 * linear);
          updateLevels();
          if (linear < 1) {
            loopFrame = window.requestAnimationFrame(animate);
            return;
          }

          loopFrame = null;
          const outgoing = activeAudio;
          detachLoopMonitor();
          nextAudio.removeEventListener('error', onStandbyError);
          activeAudio = nextAudio;
          standbyAudio = null;
          loopProgress = 0;
          releaseAudio(outgoing);
          updateLevels();
          monitorLoop(activeAudio);
        };
        loopFrame = window.requestAnimationFrame(animate);
      }).catch(() => {
        if (standbyAudio === nextAudio) stopStandby();
      });
    };

    const onError = () => {
      if (audio === activeAudio && !stopped) errorHandler();
      else if (audio === standbyAudio) stopStandby();
    };
    audio.addEventListener('timeupdate', tryLoopCrossfade);
    audio.addEventListener('error', onError);
    detachLoopMonitor = () => {
      audio.removeEventListener('timeupdate', tryLoopCrossfade);
      audio.removeEventListener('error', onError);
      detachLoopMonitor = () => undefined;
    };
  };

  try {
    await firstAudio.play();
  } catch (error) {
    releaseAudio(firstAudio);
    throw error;
  }
  monitorLoop(firstAudio);
  return {
    sound,
    noiseColor,
    get level() { return level; },
    set level(value) { level = value; },
    setLevel(value) {
      level = Math.max(0, Math.min(1, value));
      updateLevels();
    },
    setErrorHandler(handler) { errorHandler = handler; },
    async resume() {
      await Promise.all([activeAudio.play(), ...(standbyAudio ? [standbyAudio.play()] : [])]);
    },
    pause() {
      activeAudio.pause();
      standbyAudio?.pause();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      detachLoopMonitor();
      if (loopFrame !== null) window.cancelAnimationFrame(loopFrame);
      loopFrame = null;
      releaseAudio(activeAudio);
      if (standbyAudio) releaseAudio(standbyAudio);
      standbyAudio = null;
      errorHandler = () => undefined;
    },
  };
}

function clampVolume(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function AmbientSoundProvider({ children }: { children: ReactNode }) {
  const initialSettings = useMemo(readSettings, []);
  const initialSlots = useMemo<Record<AudioLayer, SoundSlotState>>(() => ({
    primary: { ...initialSettings.primary, playing: false, error: '' },
    mix: { ...initialSettings.mix, playing: false, error: '' },
  }), [initialSettings]);
  const [primary, setPrimaryState] = useState(initialSlots.primary);
  const [mix, setMixState] = useState(initialSlots.mix);
  const slotsRef = useRef(initialSlots);
  const playbackRefs = useRef<Record<AudioLayer, AudioPlayback | null>>({ primary: null, mix: null });
  const transitionRefs = useRef<Record<AudioLayer, AudioTransition | null>>({ primary: null, mix: null });
  const animationRefs = useRef<Record<AudioLayer, number | null>>({ primary: null, mix: null });
  const requestRefs = useRef<Record<AudioLayer, number>>({ primary: 0, mix: 0 });

  const setSlotState = useCallback((layer: AudioLayer, patch: Partial<SoundSlotState>) => {
    const next = { ...slotsRef.current[layer], ...patch };
    slotsRef.current = { ...slotsRef.current, [layer]: next };
    if (layer === 'primary') setPrimaryState(next);
    else setMixState(next);
  }, []);

  const persistSettings = useCallback(() => {
    try {
      const { primary: primarySlot, mix: mixSlot } = slotsRef.current;
      window.localStorage.setItem(settingsKey, JSON.stringify({
        primary: {
          selected: primarySlot.selected,
          volume: primarySlot.volume,
          noiseColor: primarySlot.noiseColor,
        },
        mix: {
          selected: mixSlot.selected,
          volume: mixSlot.volume,
          noiseColor: mixSlot.noiseColor,
        },
      }));
    } catch {
      setSlotState('primary', { error: getAmbientAudioCopy(getCurrentLanguage()).errors.save });
    }
  }, [setSlotState]);

  const clearTransition = useCallback((layer: AudioLayer, keep: AudioPlayback | null) => {
    const animation = animationRefs.current[layer];
    if (animation !== null) window.cancelAnimationFrame(animation);
    animationRefs.current[layer] = null;
    const transition = transitionRefs.current[layer];
    if (transition?.from && transition.from !== keep) transition.from.stop();
    if (transition?.to && transition.to !== keep) transition.to.stop();
    transitionRefs.current[layer] = null;
  }, []);

  const fadeBetween = useCallback((
    layer: AudioLayer,
    from: AudioPlayback | null,
    to: AudioPlayback | null,
    duration: number,
    fromFactor: number,
    toFactor: number,
    onComplete: () => void,
  ) => {
    const transition: AudioTransition = { from, to, fromFactor, toFactor, progress: 0 };
    transitionRefs.current[layer] = transition;
    const startedAt = performance.now();
    const animate = (now: number) => {
      if (transitionRefs.current[layer] !== transition) return;
      const linear = Math.min(1, (now - startedAt) / duration);
      const progress = linear * linear * (3 - 2 * linear);
      transition.progress = progress;
      const master = slotsRef.current[layer].volume / 100;
      from?.setLevel(master * fromFactor * (1 - progress));
      to?.setLevel(master * toFactor * progress);
      if (linear < 1) {
        animationRefs.current[layer] = window.requestAnimationFrame(animate);
        return;
      }
      transitionRefs.current[layer] = null;
      animationRefs.current[layer] = null;
      from?.setLevel(0);
      to?.setLevel(master * toFactor);
      onComplete();
    };
    animationRefs.current[layer] = window.requestAnimationFrame(animate);
  }, []);

  const play = useCallback(async (layer: AudioLayer, sound?: AmbientSound, color?: NoiseColor) => {
    const current = slotsRef.current[layer];
    const target = sound ?? current.selected;
    if (!target) return;
    const targetColor = target === 'night-wind' ? 'brown' : color ?? current.noiseColor;
    const wasPlaying = current.playing;
    const existing = playbackRefs.current[layer];
    setSlotState(layer, { selected: target, noiseColor: targetColor, error: '' });
    persistSettings();

    if (wasPlaying && existing?.sound === target && existing.noiseColor === targetColor) return;
    const request = ++requestRefs.current[layer];
    clearTransition(layer, existing);

    if (!wasPlaying && existing?.sound === target && existing.noiseColor === targetColor) {
      try {
        await existing.resume();
        if (request !== requestRefs.current[layer]) return;
        setSlotState(layer, { playing: true });
        fadeBetween(layer, null, existing, 320, 0, 1, () => undefined);
        return;
      } catch {
        if (request === requestRefs.current[layer]) {
          setSlotState(layer, { error: getAmbientAudioCopy(getCurrentLanguage()).errors.blocked });
        }
        return;
      }
    }

    if (!wasPlaying && existing) {
      existing.stop();
      playbackRefs.current[layer] = null;
    }
    const outgoing = wasPlaying ? existing : null;
    const outgoingMaster = current.volume / 100;
    const outgoingFactor = outgoing && outgoingMaster > 0 ? Math.min(1, outgoing.level / outgoingMaster) : 1;
    try {
      const incoming = await createPlayback(target, targetColor);
      if (request !== requestRefs.current[layer]) {
        incoming.stop();
        return;
      }
      incoming.setErrorHandler(() => {
        if (playbackRefs.current[layer] !== incoming) return;
        playbackRefs.current[layer] = null;
        incoming.stop();
        setSlotState(layer, {
          playing: false,
          error: getAmbientAudioCopy(getCurrentLanguage()).errors.stream,
        });
      });
      playbackRefs.current[layer] = incoming;
      setSlotState(layer, { playing: true });
      fadeBetween(layer, outgoing, incoming, 1200, outgoingFactor, 1, () => outgoing?.stop());
    } catch {
      if (request !== requestRefs.current[layer]) return;
      if (wasPlaying && outgoing) {
        setSlotState(layer, {
          selected: outgoing.sound,
          noiseColor: outgoing.noiseColor,
          playing: true,
        });
        persistSettings();
      } else {
        playbackRefs.current[layer] = null;
        setSlotState(layer, { playing: false });
      }
      setSlotState(layer, { error: getAmbientAudioCopy(getCurrentLanguage()).errors.load });
    }
  }, [clearTransition, fadeBetween, persistSettings, setSlotState]);

  const pause = useCallback((layer: AudioLayer) => {
    const current = slotsRef.current[layer];
    const playback = playbackRefs.current[layer];
    if (!playback || !current.playing) {
      setSlotState(layer, { playing: false });
      return;
    }
    requestRefs.current[layer] += 1;
    clearTransition(layer, playback);
    const master = current.volume / 100;
    const factor = master > 0 ? Math.min(1, playback.level / master) : 1;
    setSlotState(layer, { playing: false });
    fadeBetween(layer, playback, null, 280, factor, 0, () => playback.pause());
  }, [clearTransition, fadeBetween, setSlotState]);

  const toggle = useCallback(async (layer: AudioLayer) => {
    if (slotsRef.current[layer].playing) {
      pause(layer);
      return;
    }
    await play(layer);
  }, [pause, play]);

  const setSelected = useCallback((layer: AudioLayer, sound: AmbientSound | null) => {
    if (layer === 'primary' && sound === null) return;
    const current = slotsRef.current[layer];
    if (sound !== null && current.playing) {
      void play(layer, sound);
      return;
    }
    if (sound === current.selected && !current.playing) return;

    requestRefs.current[layer] += 1;
    const existing = playbackRefs.current[layer];
    clearTransition(layer, existing);
    if (sound === null && existing && current.playing) {
      const master = current.volume / 100;
      const factor = master > 0 ? Math.min(1, existing.level / master) : 1;
      setSlotState(layer, { selected: null, playing: false, error: '' });
      persistSettings();
      fadeBetween(layer, existing, null, 240, factor, 0, () => {
        existing.stop();
        if (playbackRefs.current[layer] === existing) playbackRefs.current[layer] = null;
      });
      return;
    }
    existing?.stop();
    playbackRefs.current[layer] = null;
    setSlotState(layer, { selected: sound, playing: false, error: '' });
    persistSettings();
  }, [clearTransition, fadeBetween, persistSettings, play, setSlotState]);

  const setVolume = useCallback((layer: AudioLayer, nextVolume: number) => {
    const safeVolume = clampVolume(nextVolume);
    setSlotState(layer, { volume: safeVolume });
    persistSettings();
    const transition = transitionRefs.current[layer];
    if (transition) {
      const master = safeVolume / 100;
      transition.from?.setLevel(master * transition.fromFactor * (1 - transition.progress));
      transition.to?.setLevel(master * transition.toFactor * transition.progress);
    } else if (slotsRef.current[layer].playing) {
      playbackRefs.current[layer]?.setLevel(safeVolume / 100);
    }
  }, [persistSettings, setSlotState]);

  const setNoiseColor = useCallback((layer: AudioLayer, color: NoiseColor) => {
    const current = slotsRef.current[layer];
    if (current.noiseColor === color) return;
    setSlotState(layer, { noiseColor: color });
    persistSettings();
    if (current.playing && current.selected === 'white-noise') void play(layer, 'white-noise', color);
  }, [persistSettings, play, setSlotState]);

  useEffect(() => () => {
    for (const layer of ['primary', 'mix'] as const) {
      requestRefs.current[layer] += 1;
      const animation = animationRefs.current[layer];
      if (animation !== null) window.cancelAnimationFrame(animation);
      transitionRefs.current[layer]?.from?.stop();
      transitionRefs.current[layer]?.to?.stop();
      playbackRefs.current[layer]?.stop();
      transitionRefs.current[layer] = null;
      playbackRefs.current[layer] = null;
    }
  }, []);

  const value = useMemo(
    () => ({ primary, mix, setSelected, setVolume, setNoiseColor, play, pause, toggle }),
    [primary, mix, setSelected, setVolume, setNoiseColor, play, pause, toggle],
  );
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useAmbientSound() {
  const value = useContext(SoundContext);
  if (!value) throw new Error('AmbientSoundControl AmbientSoundProvider ichida bo‘lishi kerak.');
  return value;
}

export function AmbientSoundControl({ collapsed }: { collapsed: boolean }) {
  const { language } = useI18n();
  const copy = getAmbientAudioCopy(language);
  const { primary, mix, setSelected, setVolume, setNoiseColor, toggle } = useAmbientSound();
  const primaryOption = ambientSounds.find((sound) => sound.value === primary.selected);
  const mixOption = ambientSounds.find((sound) => sound.value === mix.selected);
  const primaryLabel = primary.selected ? getAmbientSoundName(primary.selected, language) : copy.primarySound;
  const mixLabel = mix.selected ? getAmbientSoundName(mix.selected, language) : copy.mixLayer;
  const sourceLink = (option: AmbientSoundOption | undefined, id: string) => option?.sourceUrl && (
    <p className="text-[9px] text-sidebar-foreground/55">
      <a href={option.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2" data-testid={id}>
        {copy.source}: {option.attribution ?? 'Mixkit'}
      </a>
      {option.licenseUrl && <> · <a href={option.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2" data-testid={`${id}-license`}>{copy.license}</a></>}
    </p>
  );

  return (
    <section className={`rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3.5 ${collapsed ? 'md:border-0 md:bg-transparent md:p-0' : ''}`} aria-label={copy.title} data-testid="ambient-sound-control">
      <div className={`flex items-center gap-2 ${collapsed ? 'md:hidden' : ''}`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-primary"><AudioLines size={15} /></span>
        <div className="min-w-0 flex-1"><p className="font-mono text-[8px] uppercase tracking-[.15em] text-sidebar-foreground/55">{copy.title}</p><p className="truncate text-[11px] font-medium">{primary.playing ? primaryLabel : copy.primaryPaused}</p></div>
         <button type="button" onClick={() => { void toggle('primary'); }} className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-transform hover:scale-105" aria-label={formatAmbientLayerToggleLabel(primary.playing, primaryLabel, 'primary')} title={formatAmbientControlTitle(primaryLabel, primary.playing)} data-testid="button-ambient-toggle">{primary.playing ? <Pause size={14} /> : <Play size={14} />}</button>
      </div>
      <div className={`mt-3 space-y-3 ${collapsed ? 'md:hidden' : ''}`}>
        <label className="block text-[9px] text-sidebar-foreground/65" htmlFor="ambient-sound-select">{copy.primarySound}</label>
        <select id="ambient-sound-select" value={primary.selected ?? 'rain'} onChange={(event) => setSelected('primary', event.target.value as AmbientSound)} className="w-full rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-[10px] text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring" data-testid="select-ambient-sound">{ambientSounds.map((sound) => <option key={sound.value} value={sound.value}>{getAmbientSoundName(sound.value, language)}</option>)}</select>
        {primary.selected === 'white-noise' && (
          <label className="block text-[9px] text-sidebar-foreground/65" htmlFor="ambient-noise-color-primary">{copy.noiseType}
            <select id="ambient-noise-color-primary" value={primary.noiseColor} onChange={(event) => setNoiseColor('primary', event.target.value as NoiseColor)} className="mt-1 w-full rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-[10px] text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring">
              {noiseColors.map((color) => <option key={color.value} value={color.value}>{copy.noiseColors[color.value]}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-[9px] text-sidebar-foreground/65" htmlFor="ambient-volume-primary"><Volume2 size={13} /><span className="min-w-0 flex-1">{copy.volume}</span><span className="font-mono">{primary.volume}%</span></label>
        <input id="ambient-volume-primary" type="range" min={0} max={100} value={primary.volume} onChange={(event) => setVolume('primary', Number(event.target.value))} className="w-full accent-[#d9a441]" aria-label={copy.primaryVolume} data-testid="input-ambient-volume-primary-sidebar" />
        {sourceLink(primaryOption, 'link-ambient-source-primary-sidebar')}
        {primary.error && <p className="text-[9px] text-[#f1b6a8]" role="status" data-testid="status-ambient-error">{primary.error}</p>}

        <div className="space-y-2 border-t border-sidebar-border/70 pt-3">
          <label className="block text-[9px] text-sidebar-foreground/65" htmlFor="ambient-mix-select">{copy.mixLayer} · {copy.mixOptional}</label>
          <select id="ambient-mix-select" value={mix.selected ?? ''} onChange={(event) => setSelected('mix', event.target.value ? event.target.value as AmbientSound : null)} className="w-full rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-[10px] text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring" data-testid="select-ambient-mix">
            <option value="">{copy.mixOff}</option>
            {ambientSounds.map((sound) => <option key={sound.value} value={sound.value}>{getAmbientSoundName(sound.value, language)}</option>)}
          </select>
          {mix.selected && (
            <>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { void toggle('mix'); }} className="grid size-7 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-primary" aria-label={formatAmbientLayerToggleLabel(mix.playing, mixLabel, 'secondary')} title={formatAmbientControlTitle(mixLabel, mix.playing)} data-testid="button-ambient-mix-toggle">{mix.playing ? <Pause size={12} /> : <Play size={12} />}</button>
                <span className="min-w-0 flex-1 truncate text-[10px]">{mix.playing ? `${copy.playingPrefix}: ${mixLabel}` : mixLabel}</span>
              </div>
              {mix.selected === 'white-noise' && (
                <label className="block text-[9px] text-sidebar-foreground/65" htmlFor="ambient-noise-color-mix">{copy.noiseType}
                  <select id="ambient-noise-color-mix" value={mix.noiseColor} onChange={(event) => setNoiseColor('mix', event.target.value as NoiseColor)} className="mt-1 w-full rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-[10px] text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring">
                    {noiseColors.map((color) => <option key={color.value} value={color.value}>{copy.noiseColors[color.value]}</option>)}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2 text-[9px] text-sidebar-foreground/65" htmlFor="ambient-volume-mix"><Volume2 size={13} /><span className="min-w-0 flex-1">{copy.volume}</span><span className="font-mono">{mix.volume}%</span></label>
              <input id="ambient-volume-mix" type="range" min={0} max={100} value={mix.volume} onChange={(event) => setVolume('mix', Number(event.target.value))} className="w-full accent-[#d9a441]" aria-label={copy.mixVolume} data-testid="input-ambient-volume-mix-sidebar" />
              {sourceLink(mixOption, 'link-ambient-source-mix-sidebar')}
            </>
          )}
          {mix.error && <p className="text-[9px] text-[#f1b6a8]" role="status" data-testid="status-ambient-mix-error">{mix.error}</p>}
        </div>
      </div>
      {collapsed && <div className="hidden items-center justify-center gap-1 md:flex">
         <button type="button" onClick={() => { void toggle('primary'); }} className="grid size-10 w-full place-items-center rounded-xl text-sidebar-primary transition-colors hover:bg-sidebar-accent md:w-10" aria-label={formatAmbientLayerToggleLabel(primary.playing, primaryLabel, 'primary')} title={formatAmbientControlTitle(primaryLabel, primary.playing)} data-testid="button-ambient-toggle-collapsed">{primary.playing ? <Pause size={16} /> : <AudioLines size={17} />}</button>
         {mix.selected && <button type="button" onClick={() => { void toggle('mix'); }} className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-sidebar-accent ${mix.playing ? 'text-sidebar-primary' : 'text-sidebar-foreground/60'}`} aria-label={formatAmbientLayerToggleLabel(mix.playing, mixLabel, 'secondary')} title={formatAmbientControlTitle(mixLabel, mix.playing)} data-testid="button-ambient-mix-toggle-collapsed">{mix.playing ? <Pause size={14} /> : <AudioLines size={15} />}</button>}
      </div>}
    </section>
  );
}