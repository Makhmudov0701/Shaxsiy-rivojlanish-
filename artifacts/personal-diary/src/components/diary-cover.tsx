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
  isSecureImageUrl,
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
  const [urlDraft, setUrlDraft] = useState(settings.imageUrl);
  const [panelError, setPanelError] = useState('');
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const activeImage = getDiaryCoverImage(settings);

  useEffect(() => setUrlDraft(settings.imageUrl), [settings.imageUrl]);
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

  const applyUrl = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const imageUrl = urlDraft.trim();
    if (!isSecureImageUrl(imageUrl)) {
      setPanelError('Rasm havolasi https:// bilan boshlanishi kerak.');
      return;
    }
    const next = { ...settings, mode: 'url' as const, imageUrl };
    setPanelError('');
    if (save(next)) {
      setNotice('Rasm havolasi saqlandi.');
      window.setTimeout(() => setNotice(''), 2400);
    }
  };

  const resetCover = () => {
    const next = { ...DEFAULT_DIARY_COVER_SETTINGS, preset: settings.preset };
    setPanelError('');
    if (save(next)) {
      setUrlDraft('');
      setNotice('Standart muqova tiklandi.');
      window.setTimeout(() => setNotice(''), 2400);
    }
  };

  const disabled = status !== 'ready' || working;

  return <section className="mt-5 rounded-[24px] border border-card-border bg-card p-6 sm:p-8" data-testid="diary-cover-settings">
    <div className="flex items-start gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e9e4f0] text-[#514469]"><Palette size={21} strokeWidth={1.6} /></span>
      <div>
        <h2 className="font-serif text-[27px]">Kundalik muqovasi</h2>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">Yozish sahifangiz uchun tayyor uslubni tanlang yoki o‘zingizning rasmingizdan foydalaning.</p>
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
          className={`group flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left transition-all disabled:cursor-wait disabled:opacity-60 ${selected ? 'border-[#a77f3d] bg-[#fbf7ed] ring-2 ring-[#c5a25f]/25 dark:bg-[#312d25]' : 'border-border bg-background hover:border-[#b89c5c]'}`}
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
            <div><p className="text-[12px] font-semibold">Qurilmadan rasm yuklash</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">JPG, PNG yoki WEBP · 12 MB gacha. Rasm avtomatik kichraytiriladi.</p></div>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-[11px] font-semibold transition-colors hover:border-[#b89c5c] disabled:opacity-60" data-testid="button-upload-diary-cover">
            {working ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />} {working ? 'Rasm tayyorlanmoqda...' : 'Rasm tanlash'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadCover} className="sr-only" aria-label="Muqova uchun rasm tanlash" />
        </div>

        <form onSubmit={applyUrl} className="rounded-2xl border border-border bg-background p-4">
          <label htmlFor="diary-cover-url" className="text-[12px] font-semibold">Rasm havolasidan foydalanish</label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input id="diary-cover-url" value={urlDraft} onChange={(event) => setUrlDraft(event.target.value)} placeholder="https://misol.uz/muqova.jpg" maxLength={2048} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-[11px] outline-none transition-colors focus:border-[#b89c5c]" data-testid="input-diary-cover-url" />
            <button type="submit" disabled={disabled} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-apply-cover-url">Havolani qo‘llash</button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Havola xavfsiz HTTPS bilan boshlanishi kerak.</p>
        </form>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={resetCover} disabled={disabled} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground disabled:opacity-60" data-testid="button-reset-diary-cover"><RotateCcw size={12} /> Standart muqovaga qaytish</button>
          {settings.mode === 'upload' && settings.uploadName && <span className="max-w-full truncate text-[10px] text-muted-foreground">Tanlangan fayl: {settings.uploadName}</span>}
          {settings.mode === 'url' && <span className="text-[10px] text-muted-foreground">Havola orqali tanlangan</span>}
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">Muqova sozlamalari va yuklangan rasm ushbu qurilmadagi brauzerda saqlanadi.</p>
        {status === 'loading' && <p className="text-[11px] text-muted-foreground">Muqova sozlamalari yuklanmoqda...</p>}
        {(panelError || storageError) && <p className="flex gap-2 text-[11px] leading-relaxed text-destructive" role="alert"><CircleAlert size={14} className="mt-0.5 shrink-0" />{panelError || storageError}</p>}
        {notice && <p className="flex items-center gap-2 text-[11px] text-[#47796c]" role="status"><Check size={14} />{notice}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background p-3">
        <p className="mb-2 px-1 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">Ko‘rinishi</p>
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
