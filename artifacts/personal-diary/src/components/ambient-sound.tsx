import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AudioLines, Pause, Play, Volume2 } from 'lucide-react';

export type AmbientSound = 'rain' | 'forest' | 'fireplace' | 'white-noise' | 'cafe';

const sounds: Array<{ value: AmbientSound; label: string }> = [
  { value: 'rain', label: 'Yomg‘ir' },
  { value: 'forest', label: 'O‘rmon' },
  { value: 'fireplace', label: 'Kamin' },
  { value: 'white-noise', label: 'Oq shovqin' },
  { value: 'cafe', label: 'Kafe' },
];

type SoundContextValue = {
  selected: AmbientSound;
  playing: boolean;
  volume: number;
  error: string;
  setSelected: (sound: AmbientSound) => void;
  setVolume: (volume: number) => void;
  toggle: () => Promise<void>;
};

type SoundNodes = {
  mainGain: GainNode;
  accentGain: GainNode;
  source: AudioBufferSourceNode;
  accentTimer: number | null;
};

const SoundContext = createContext<SoundContextValue | null>(null);
const settingsKey = 'kundalik-fon-tovushlari-v1';

function readSettings(): { selected: AmbientSound; volume: number } {
  try {
    const raw = window.localStorage.getItem(settingsKey);
    if (!raw) return { selected: 'rain', volume: 28 };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return { selected: 'rain', volume: 28 };
    const candidate = value as { selected?: unknown; volume?: unknown };
    return {
      selected: sounds.some((sound) => sound.value === candidate.selected) ? candidate.selected as AmbientSound : 'rain',
      volume: typeof candidate.volume === 'number' && Number.isFinite(candidate.volume) ? Math.max(0, Math.min(100, candidate.volume)) : 28,
    };
  } catch {
    return { selected: 'rain', volume: 28 };
  }
}

function createNoiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let brown = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.025 * white) / 1.025;
    samples[index] = brown * 3.5;
  }
  return buffer;
}

function playAccent(context: AudioContext, destination: AudioNode, kind: 'bird' | 'crackle') {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const now = context.currentTime;
  const pitch = kind === 'bird' ? 1500 + Math.random() * 850 : 120 + Math.random() * 780;
  const duration = kind === 'bird' ? 0.28 + Math.random() * 0.18 : 0.035 + Math.random() * 0.09;
  oscillator.type = kind === 'bird' ? 'sine' : 'triangle';
  oscillator.frequency.setValueAtTime(pitch, now);
  if (kind === 'bird') {
    oscillator.frequency.exponentialRampToValueAtTime(pitch * 1.22, now + duration * 0.42);
    oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.93, now + duration);
  }
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(kind === 'bird' ? 0.32 : 0.18, now + Math.min(0.025, duration / 3));
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

export function AmbientSoundProvider({ children }: { children: ReactNode }) {
  const initialSettings = useMemo(readSettings, []);
  const [selected, setSelectedState] = useState<AmbientSound>(initialSettings.selected);
  const [volume, setVolumeState] = useState(initialSettings.volume);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<SoundNodes | null>(null);

  const setSelected = useCallback((sound: AmbientSound) => {
    setSelectedState(sound);
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify({ selected: sound, volume }));
    } catch {
      setError('Ovoz sozlamasini saqlab bo‘lmadi.');
    }
  }, [volume]);

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.max(0, Math.min(100, Math.round(nextVolume)));
    setVolumeState(safeVolume);
    try {
      window.localStorage.setItem(settingsKey, JSON.stringify({ selected, volume: safeVolume }));
    } catch {
      setError('Ovoz sozlamasini saqlab bo‘lmadi.');
    }
  }, [selected]);

  const toggle = useCallback(async () => {
    if (playing) {
      setPlaying(false);
      setError('');
      return;
    }
    try {
      const AudioContextConstructor = window.AudioContext
        ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('unsupported');
      const context = contextRef.current ?? new AudioContextConstructor();
      contextRef.current = context;
      await context.resume();
      setError('');
      setPlaying(true);
    } catch {
      setError('Bu brauzer fon tovushini ishga tushira olmadi.');
    }
  }, [playing]);

  useEffect(() => {
    if (!playing || !contextRef.current) return undefined;
    const context = contextRef.current;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const mainGain = context.createGain();
    const accentGain = context.createGain();
    source.buffer = createNoiseBuffer(context);
    source.loop = true;

    if (selected === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 1900;
      filter.Q.value = 0.55;
    } else if (selected === 'forest') {
      filter.type = 'lowpass';
      filter.frequency.value = 1250;
      filter.Q.value = 0.35;
    } else if (selected === 'fireplace') {
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.4;
    } else if (selected === 'cafe') {
      filter.type = 'bandpass';
      filter.frequency.value = 620;
      filter.Q.value = 0.45;
    } else {
      filter.type = 'highpass';
      filter.frequency.value = 65;
    }

    mainGain.gain.value = volume / 100 * 0.34;
    accentGain.gain.value = volume / 100 * (selected === 'forest' ? 0.11 : 0.09);
    source.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(context.destination);
    accentGain.connect(context.destination);
    source.start();

    let accentTimer: number | null = null;
    const scheduleAccent = () => {
      if (selected !== 'forest' && selected !== 'fireplace') return;
      playAccent(context, accentGain, selected === 'forest' ? 'bird' : 'crackle');
      const delay = selected === 'forest' ? 1800 + Math.random() * 3200 : 220 + Math.random() * 760;
      accentTimer = window.setTimeout(scheduleAccent, delay);
    };
    if (selected === 'forest' || selected === 'fireplace') {
      accentTimer = window.setTimeout(scheduleAccent, selected === 'forest' ? 1200 : 250);
    }
    nodesRef.current = { mainGain, accentGain, source, accentTimer };

    return () => {
      if (accentTimer !== null) window.clearTimeout(accentTimer);
      try { source.stop(); } catch { /* The source may already have ended. */ }
      source.disconnect();
      filter.disconnect();
      mainGain.disconnect();
      accentGain.disconnect();
      nodesRef.current = null;
    };
  }, [playing, selected]);

  useEffect(() => {
    const nodes = nodesRef.current;
    const context = contextRef.current;
    if (!nodes || !context) return;
    nodes.mainGain.gain.setTargetAtTime(volume / 100 * 0.34, context.currentTime, 0.08);
    nodes.accentGain.gain.setTargetAtTime(volume / 100 * (selected === 'forest' ? 0.11 : 0.09), context.currentTime, 0.08);
  }, [selected, volume]);

  useEffect(() => () => {
    const nodes = nodesRef.current;
    if (nodes?.accentTimer !== null && nodes?.accentTimer !== undefined) window.clearTimeout(nodes.accentTimer);
    try { nodes?.source.stop(); } catch { /* The source may already have stopped. */ }
    void contextRef.current?.close();
  }, []);

  const value = useMemo(() => ({ selected, playing, volume, error, setSelected, setVolume, toggle }), [selected, playing, volume, error, setSelected, setVolume, toggle]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

function useAmbientSound() {
  const value = useContext(SoundContext);
  if (!value) throw new Error('AmbientSoundControl AmbientSoundProvider ichida bo‘lishi kerak.');
  return value;
}

export function AmbientSoundControl({ collapsed }: { collapsed: boolean }) {
  const { selected, playing, volume, error, setSelected, setVolume, toggle } = useAmbientSound();
  const selectedLabel = sounds.find((sound) => sound.value === selected)?.label ?? 'Yomg‘ir';
  return (
    <section className={`rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3.5 ${collapsed ? 'md:border-0 md:bg-transparent md:p-0' : ''}`} aria-label="Fon tovushlari" data-testid="ambient-sound-control">
      <div className={`flex items-center gap-2 ${collapsed ? 'md:hidden' : ''}`}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sidebar-primary"><AudioLines size={15} /></span>
        <div className="min-w-0 flex-1"><p className="font-mono text-[8px] uppercase tracking-[.15em] text-sidebar-foreground/55">Fon tovushlari</p><p className="truncate text-[11px] font-medium">{playing ? selectedLabel : 'Tinchlik rejimi'}</p></div>
        <button type="button" onClick={() => { void toggle(); }} className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-transform hover:scale-105" aria-label={playing ? 'Fon tovushini to‘xtatish' : 'Fon tovushini boshlash'} title={playing ? 'To‘xtatish' : 'Boshlash'} data-testid="button-ambient-toggle">{playing ? <Pause size={14} /> : <Play size={14} />}</button>
      </div>
      <div className={`mt-3 space-y-3 ${collapsed ? 'md:hidden' : ''}`}>
        <label className="block text-[9px] text-sidebar-foreground/65" htmlFor="ambient-sound-select">Tovush turi</label>
        <select id="ambient-sound-select" value={selected} onChange={(event) => setSelected(event.target.value as AmbientSound)} className="w-full rounded-lg border border-sidebar-border bg-sidebar px-2.5 py-2 text-[10px] text-sidebar-foreground outline-none focus:ring-2 focus:ring-sidebar-ring" data-testid="select-ambient-sound">{sounds.map((sound) => <option key={sound.value} value={sound.value}>{sound.label}</option>)}</select>
        <label className="flex items-center gap-2 text-[9px] text-sidebar-foreground/65" htmlFor="ambient-volume"><Volume2 size={13} /><span className="min-w-0 flex-1">Ovoz balandligi</span><span className="font-mono">{volume}%</span></label>
        <input id="ambient-volume" type="range" min={0} max={100} value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-full accent-[#d9a441]" aria-label="Ovoz balandligi" data-testid="input-ambient-volume" />
        {error && <p className="text-[9px] text-[#f1b6a8]" role="status" data-testid="status-ambient-error">{error}</p>}
      </div>
      {collapsed && <button type="button" onClick={() => { void toggle(); }} className="hidden size-10 w-full items-center justify-center rounded-xl text-sidebar-primary transition-colors hover:bg-sidebar-accent md:flex md:w-10" aria-label={playing ? `Fon tovushini to‘xtatish: ${selectedLabel}` : `Fon tovushini boshlash: ${selectedLabel}`} title={`${selectedLabel} · ${playing ? 'to‘xtatish' : 'boshlash'}`} data-testid="button-ambient-toggle-collapsed">{playing ? <Pause size={16} /> : <AudioLines size={17} />}</button>}
    </section>
  );
}