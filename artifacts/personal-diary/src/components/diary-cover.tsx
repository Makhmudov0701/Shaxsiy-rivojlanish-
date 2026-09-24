import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/react';
import { Check, CircleAlert, ImagePlus, LoaderCircle, Palette, RotateCcw, Upload } from 'lucide-react';
import {
  compressDiaryCoverImage,
  DEFAULT_DIARY_COVER_SETTINGS,
  diaryCoverPresets,
  diaryCoverStorageKey,
  getDiaryCoverImage,
  getDiaryCoverPresetStyle,
  readDiaryCoverSettings,
  writeDiaryCoverSettings,
  type DiaryCoverSettings,
} from '@/lib/diary-cover';

type DiaryCoverContextValue = {
  settings: DiaryCoverSettings;
  status: 'loading' | 'ready';
  error: string;
  save: (next: DiaryCoverSettings) => boolean;
};

const DiaryCoverContext = createContext<DiaryCoverContextValue | null>(null);

export function DiaryCoverProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';
  const [settings, setSettings] = useState<DiaryCoverSettings>({ ...DEFAULT_DIARY_COVER_SETTINGS });
  const [status, setStatus] = useState<DiaryCoverContextValue['status']>('loading');
  const [error, setError] = useState('');
  const [readyUserId, setReadyUserId] = useState('');

  useEffect(() => {
    if (!isLoaded) {
      setStatus('loading');
      return;
    }
    if (!userId) {
      setSettings({ ...DEFAULT_DIARY_COVER_SETTINGS });
      setReadyUserId('');
      setError('');
      setStatus('ready');
      return;
    }

    setStatus('loading');
    try {
      setSettings(readDiaryCoverSettings(userId));
      setReadyUserId(userId);
      setError('');
    } catch (cause) {
      setSettings({ ...DEFAULT_DIARY_COVER_SETTINGS });
      setReadyUserId(userId);
      setError(cause instanceof Error ? cause.message : 'Muqova sozlamalarini o‘qib bo‘lmadi.');
    }
    setStatus('ready');
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!userId) return;
    const storageKey = diaryCoverStorageKey(userId);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        setSettings(readDiaryCoverSettings(userId));
        setError('');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Muqova sozlamalarini o‘qib bo‘lmadi.');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  const save = useCallback((next: DiaryCoverSettings) => {
    if (!isLoaded || !userId || readyUserId !== userId) return false;
    try {
      writeDiaryCoverSettings(userId, next);
      setSettings(next);
      setError('');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Muqova sozlamalarini saqlab bo‘lmadi.');
      return false;
    }
  }, [isLoaded, readyUserId, userId]);

  const value = useMemo(() => ({ settings, status, error, save }), [settings, status, error, save]);
  return <DiaryCoverContext.Provider value={value}>{children}</DiaryCoverContext.Provider>;
}

export function useDiaryCover() {
  const context = useContext(DiaryCoverContext);
  if (!context) throw new Error('DiaryCoverProvider sahifa daraxtiga qo‘shilmagan.');
  return context;
}

export function DiaryCoverBackdrop() {
  const { settings } = useDiaryCover();
  const imageSource = getDiaryCoverImage(settings);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [imageSource]);

  return <>
    {(!imageSource || imageFailed) && <div className="absolute inset-0" style={getDiaryCoverPresetStyle(settings.preset)} />}
    {imageSource && !imageFailed && <img src={imageSource} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" onError={() => setImageFailed(true)} />}
    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
    {imageFailed && <span className="absolute bottom-3 right-4 z-10 rounded-full bg-black/60 px-3 py-1.5 text-[9px] text-white/90">Muqova rasmi yuklanmadi. Sozlamalarni tekshiring.</span>}
  </>;
}

export function DiaryCoverSettingsPanel() {
  const { settings, status, error: storageError, save } = useDiaryCover();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panelError, setPanelError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const activeImage = getDiaryCoverImage(settings);

  useEffect(() => setPreviewFailed(false), [activeImage]);

  const selectPreset = (preset: DiaryCoverSettings['preset']) => {
    const next = { ...settings, mode: 'preset' as const, preset };
    setPanelError('');
    if (save(next)) {
      setNotice('Muqova uslubi saqlandi.');
      window.setTimeout(() => setNotice(''), 2400);
    }
  };

  const uploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setWorking(true);
    setPanelError('');
    setNotice('');
    try {
      const uploadDataUrl = await compressDiaryCoverImage(file);
      const next = { ...settings, mode: 'upload' as const, uploadDataUrl, uploadName: file.name.slice(0, 180) };
      if (save(next)) {
        setNotice('Yuklangan muqova saqlandi.');
        window.setTimeout(() => setNotice(''), 2400);
      }
    } catch (cause) {
      setPanelError(cause instanceof Error ? cause.message : 'Rasmni yuklab bo‘lmadi.');
    } finally {
      setWorking(false);
    }
  };

  const resetCover = () => {
    const next = { ...DEFAULT_DIARY_COVER_SETTINGS, preset: settings.preset };
    setPanelError('');
    if (save(next)) {
      setNotice('Standart muqova tiklandi.');
      window.setTimeout(() => setNotice(''), 2400);
    }
  };

  const disabled = status !== 'ready' || working;

  return <section className="mt-5 rounded-[24px] border border-card-border bg-card p-4 sm:p-6" data-testid="diary-cover-settings">
    <div className="flex items-start gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e9e4f0] text-[#514469]"><Palette size={21} strokeWidth={1.6} /></span>
      <div>
        <h2 className="font-serif text-[25px]">Muqova ko‘rinishi</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">Yozish sahifangiz uchun bir uslub tanlang yoki telefoningizdan surat qo‘shing.</p>
      </div>
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {diaryCoverPresets.map((preset) => {
        const selected = settings.mode === 'preset' && settings.preset === preset.id;
        return <button
          key={preset.id}
          type="button"
          onClick={() => selectPreset(preset.id)}
          disabled={disabled}
          aria-pressed={selected}
          className={`group flex min-w-0 min-h-[88px] items-center gap-3 rounded-2xl border p-3 text-left transition-all disabled:cursor-wait disabled:opacity-60 ${selected ? 'border-[#a77f3d] bg-[#fbf7ed] ring-2 ring-[#c5a25f]/25 dark:bg-[#312d25]' : 'border-border bg-background hover:border-[#b89c5c]'}`}
          data-testid={`button-cover-preset-${preset.id}`}
        >
          <span className="relative h-[66px] w-[92px] shrink-0 overflow-hidden rounded-xl shadow-sm" style={getDiaryCoverPresetStyle(preset.id)} aria-hidden="true">
            <span className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-white/45" />
            <span className="absolute inset-x-2 bottom-5 h-1 w-2/3 rounded-full bg-white/65" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-[12px] font-semibold text-foreground">{preset.label}</span>
            <span className="mt-1 block text-[10px] leading-snug text-muted-foreground">{preset.description}</span>
          </span>
          {selected && <Check size={16} className="shrink-0 text-[#8e641e]" />}
        </button>;
      })}
    </div>

    <div className="mt-6 grid gap-5 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ImagePlus size={17} className="mt-0.5 shrink-0 text-[#9a6b23]" />
             <div><p className="text-[14px] font-semibold">O‘zingizning suratingiz</p><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Telefoningizdan yoki kompyuteringizdan rasm tanlang.</p></div>
          </div>
           <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-[13px] font-semibold transition-colors hover:border-[#b89c5c] disabled:opacity-60" data-testid="button-upload-diary-cover">
             {working ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />} {working ? 'Rasm tayyorlanmoqda…' : 'Surat tanlash'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCover} className="sr-only" aria-label="Muqova uchun rasm tanlash" />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
           <button type="button" onClick={resetCover} disabled={disabled} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60" data-testid="button-reset-diary-cover"><RotateCcw size={16} /> Standart ko‘rinishga qaytish</button>
           {settings.mode === 'upload' && settings.uploadName && <span className="max-w-full truncate text-[12px] text-muted-foreground">Tanlangan surat: {settings.uploadName}</span>}
           {settings.mode === 'url' && <span className="text-[12px] text-muted-foreground">Avval tanlangan rasm ishlatilmoqda.</span>}
        </div>

         <p className="text-[12px] leading-relaxed text-muted-foreground">Bu tanlov faqat shu brauzerda saqlanadi.</p>
         {status === 'loading' && <p className="text-[13px] text-muted-foreground">Yuklanmoqda…</p>}
         {(panelError || storageError) && <p className="flex gap-2 text-[13px] leading-relaxed text-destructive" role="alert"><CircleAlert size={16} className="mt-0.5 shrink-0" />{panelError || storageError}</p>}
         {notice && <p className="flex items-center gap-2 text-[13px] font-medium text-[#47796c]" role="status"><Check size={16} />{notice}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background p-3">
         <p className="mb-2 px-1 text-[13px] font-semibold text-muted-foreground">Shunday ko‘rinadi</p>
        <div className="diary-cover relative flex min-h-[150px] flex-col justify-end overflow-hidden rounded-xl p-4 text-white" style={!activeImage || previewFailed ? getDiaryCoverPresetStyle(settings.preset) : undefined}>
          {activeImage && !previewFailed && <img src={activeImage} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" onError={() => setPreviewFailed(true)} />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/15" />
          <div className="relative z-10">
            <span className="font-mono text-[8px] uppercase tracking-[.16em] text-white/70">Shaxsiy kundalik</span>
            <p className="mt-2 font-serif text-[27px] leading-none">Yangi sahifa</p>
            {previewFailed && <span className="mt-2 inline-block text-[9px] text-white/80">Rasm yuklanmadi</span>}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
