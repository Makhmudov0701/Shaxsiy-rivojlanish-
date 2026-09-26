import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LockKeyholeOpen,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  changeVaultCredential,
  createVault,
  generateStrongPassword,
  isValidVaultCredential,
  parseStoredVault,
  saveVaultEntries,
  unlockVault,
  vaultCategories,
  type StoredVault,
  type VaultCategory,
  type VaultCredentialType,
  type VaultCustomField,
  type VaultEntry,
  type VaultEnvelope,
} from '@/lib/vault-crypto';
import { getVaultCopy } from '@/lib/vault-i18n';

type Draft = Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>;
const blankDraft = (): Draft => ({
  category: 'password',
  title: '',
  username: '',
  secret: '',
  url: '',
  notes: '',
  customFields: [],
  reminderDate: null,
});

function errorText(error: unknown, copy: ReturnType<typeof getVaultCopy>) {
  const key = error instanceof Error ? error.message : '';
  return copy.errors[key] ?? copy.errors.generic;
}

function dateLabel(value: string, language: string) {
  return new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : language === 'ko' ? 'ko-KR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function reminderTone(value: string | null, copy: ReturnType<typeof getVaultCopy>) {
  if (!value) return null;
  const key = localDateKey(new Date());
  if (value < key) return { label: copy.reminderOverdue, className: 'text-[#a64935] bg-[#fff0ec] border-[#ecc6bd]' };
  if (value === key) return { label: copy.reminderToday, className: 'text-[#8c621f] bg-[#faf2dc] border-[#e1d4ac]' };
  return { label: copy.reminderUpcoming, className: 'text-[#35614f] bg-[#edf6f0] border-[#c3ddcf]' };
}

function FieldLabel({ children, htmlFor }: { children: string; htmlFor: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">{children}</label>;
}

function SecretValue({
  value,
  visible,
  onToggle,
  onCopy,
  copyLabel,
  revealLabel,
  hideLabel,
}: {
  value: string;
  visible: boolean;
  onToggle: () => void;
  onCopy: () => void;
  copyLabel: string;
  revealLabel: string;
  hideLabel: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-xl border border-border bg-background px-2 py-1.5">
      <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{visible ? value : '••••••••••••'}</span>
      <button type="button" onClick={onToggle} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={visible ? hideLabel : revealLabel} data-testid={`${visible ? 'button-hide' : 'button-reveal'}-secret`}>
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button type="button" onClick={onCopy} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={copyLabel} data-testid="button-copy-secret">
        <Clipboard size={14} />
      </button>
    </div>
  );
}

export function PrivateVault({ storageKey }: { storageKey: string }) {
  const { language } = useI18n();
  const copy = getVaultCopy(language);
  const [stored, setStored] = useState<StoredVault | null>(null);
  const [envelope, setEnvelope] = useState<VaultEnvelope | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [credentialType, setCredentialType] = useState<VaultCredentialType>('pin');
  const [credential, setCredential] = useState('');
  const [confirmCredential, setConfirmCredential] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [showCredentialChange, setShowCredentialChange] = useState(false);

  useEffect(() => {
    setLoading(true);
    setStored(null);
    setEnvelope(null);
    setKey(null);
    setEntries([]);
    setDraft(blankDraft());
    setEditingId(null);
    setVisibleFields(new Set());
    setError('');
    setLoadFailed(false);
    try {
      if (!storageKey.trim()) throw new Error('vault-storage-invalid');
      if (!globalThis.crypto?.subtle) throw new Error('vault-crypto-unavailable');
      setStored(parseStoredVault(window.localStorage.getItem(storageKey)));
    } catch (caught) {
      setError(errorText(caught, copy));
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  const persist = (next: VaultEnvelope) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStored(next);
      setEnvelope(next);
      return true;
    } catch {
      setError(copy.errors.storage);
      return false;
    }
  };

  const resetCredentials = () => {
    setCredential('');
    setConfirmCredential('');
    setAcknowledged(false);
  };

  const setup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidVaultCredential(credential, credentialType)) {
      setError(copy.errors['vault-credential-invalid']);
      return;
    }
    if (credential !== confirmCredential) {
      setError(copy.confirmCredential);
      return;
    }
    if (!acknowledged) {
      setError(copy.irreversible);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await createVault(credential, credentialType);
      if (!persist(result.envelope)) return;
      setKey(result.key);
      setEntries([]);
      resetCredentials();
    } catch (caught) {
      setError(errorText(caught, copy));
    } finally {
      setBusy(false);
    }
  };

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stored) return;
    setBusy(true);
    setError('');
    try {
      const result = await unlockVault(credential, stored);
      if (result.migrated && !persist(result.envelope)) {
        // Keep the successfully unlocked data available for this session while
        // preserving the untouched legacy record in localStorage.
        setEnvelope(result.envelope);
        setKey(result.key);
        setEntries(result.entries);
        setCredentialType(result.envelope.credentialType);
        resetCredentials();
        return;
      }
      setEnvelope(result.envelope);
      setKey(result.key);
      setEntries(result.entries);
      setCredentialType(result.envelope.credentialType);
      resetCredentials();
    } catch (caught) {
      setError(errorText(caught, copy));
    } finally {
      setBusy(false);
    }
  };

  const lock = () => {
    setKey(null);
    setEntries([]);
    setEnvelope(null);
    setDraft(blankDraft());
    setEditingId(null);
    setVisibleFields(new Set());
    setShowCredentialChange(false);
    resetCredentials();
    setError('');
  };

  const copyValue = async (value: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) throw new Error('copy');
      }
      setFeedback(copy.copied);
      window.setTimeout(() => setFeedback(''), 2200);
    } catch {
      setFeedback(copy.copyFailed);
    }
  };

  const saveEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!key || !envelope) return;
    if (!draft.title.trim()) {
      setError(copy.titleField);
      return;
    }
    if (draft.category !== 'secret-note' && !draft.secret.trim()) {
      setError(copy.secret);
      return;
    }
    if (draft.customFields.some((field) => field.value.trim() && !field.label.trim())) {
      setError(copy.customFieldLabelRequired);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const previous = editingId ? entries.find((entry) => entry.id === editingId) : undefined;
      const entry: VaultEntry = {
        ...draft,
        title: draft.title.trim(),
        customFields: draft.customFields
          .filter((field) => field.label.trim())
          .map((field) => ({ ...field, label: field.label.trim() })),
        id: previous?.id ?? globalThis.crypto.randomUUID(),
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      };
      const nextEntries = previous ? entries.map((item) => item.id === entry.id ? entry : item) : [entry, ...entries];
      const nextEnvelope = await saveVaultEntries(key, envelope, nextEntries);
      if (!persist(nextEnvelope)) return;
      setEntries(nextEntries);
      setDraft(blankDraft());
      setEditingId(null);
      setVisibleFields(new Set());
    } catch (caught) {
      setError(errorText(caught, copy));
    } finally {
      setBusy(false);
    }
  };

  const deleteEntry = async (entry: VaultEntry) => {
    if (!key || !envelope || !window.confirm(copy.deleteConfirm)) return;
    setBusy(true);
    setError('');
    try {
      const nextEntries = entries.filter((item) => item.id !== entry.id);
      const nextEnvelope = await saveVaultEntries(key, envelope, nextEntries);
      if (!persist(nextEnvelope)) return;
      setEntries(nextEntries);
      if (editingId === entry.id) {
        setEditingId(null);
        setDraft(blankDraft());
      }
    } catch (caught) {
      setError(errorText(caught, copy));
    } finally {
      setBusy(false);
    }
  };

  const beginEdit = (entry: VaultEntry) => {
    setEditingId(entry.id);
    setDraft({
      category: entry.category,
      title: entry.title,
      username: entry.username,
      secret: entry.secret,
      url: entry.url,
      notes: entry.notes,
      customFields: entry.customFields.map((field) => ({ ...field })),
      reminderDate: entry.reminderDate,
    });
    setError('');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const changeCredential = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!key || !envelope) return;
    if (!isValidVaultCredential(credential, credentialType)) {
      setError(copy.errors['vault-credential-invalid']);
      return;
    }
    if (credential !== confirmCredential) {
      setError(copy.confirmCredential);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await changeVaultCredential(credential, credentialType, entries);
      if (!persist(result.envelope)) return;
      setKey(result.key);
      setShowCredentialChange(false);
      resetCredentials();
      setFeedback(copy.change);
    } catch (caught) {
      setError(errorText(caught, copy));
    } finally {
      setBusy(false);
    }
  };

  const updateDraft = <K extends keyof Draft>(field: K, value: Draft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const updateCustomField = (id: string, field: keyof VaultCustomField, value: string | boolean) => {
    updateDraft('customFields', draft.customFields.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };
  const addCustomField = () => updateDraft('customFields', [...draft.customFields, { id: globalThis.crypto.randomUUID(), label: '', value: '', secret: false }]);

  const categoryOptions = useMemo(() => vaultCategories.map((category) => ({ value: category, label: copy.categories[category] })), [copy]);

  if (loading) {
    return <section className="rounded-[26px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="module-private-vault"><div className="space-y-3" aria-label={copy.title}><div className="skeleton h-16 rounded-2xl" /><div className="skeleton h-32 rounded-2xl" /></div></section>;
  }

  return (
    <section className="rounded-[26px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="module-private-vault">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${key ? 'bg-[#dcebe4] text-[#35614f]' : 'bg-[#f8e9bf] text-[#8f6b2c]'}`}><ShieldCheck size={21} /></span>
          <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{copy.eyebrow}</p><h2 className="mt-1 font-serif text-[29px] leading-none tracking-[-.035em]">{copy.title}</h2><p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground">{copy.description}</p></div>
        </div>
        {key && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setShowCredentialChange(true); setCredentialType(envelope?.credentialType ?? 'pin'); resetCredentials(); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-[11px] font-semibold hover:bg-muted" data-testid="button-change-credential"><KeyRound size={14} /> {copy.changeCredential}</button><button type="button" onClick={lock} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#a9ccb9] px-3 text-[11px] font-semibold text-[#35614f] hover:bg-[#edf6f0]" data-testid="button-lock-vault"><Lock size={14} /> {copy.lock}</button></div>}
      </div>

      {error && <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-[#ecc6bd] bg-[#fff0ec] px-3.5 py-3 text-[12px] leading-relaxed text-[#8f3f2d]" role="alert" data-testid="status-vault-error"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
      {feedback && <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#c3ddcf] bg-[#edf6f0] px-3.5 py-3 text-[12px] text-[#35614f]" role="status" data-testid="status-vault-feedback"><Check size={15} />{feedback}</div>}

      {loadFailed ? (
        <div className="rounded-2xl border border-dashed border-[#d5c8a9] bg-[#faf6ea] px-5 py-8 text-center dark:border-[#5d5037] dark:bg-[#2d281f]">
          <p className="font-serif text-[21px]">{copy.loadFailedTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-muted-foreground">{copy.loadFailedHint}</p>
        </div>
      ) : !stored ? (
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[22px] border border-[#e1d4ac] bg-[#faf2dc] p-5 dark:border-[#66552f] dark:bg-[#332c21]">
            <ShieldCheck size={23} className="text-[#9a742f]" />
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[.16em] text-[#9a742f]">{copy.setupKicker}</p>
            <h3 className="mt-2 font-serif text-[27px] leading-tight">{copy.setupTitle}</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-[#75613a] dark:text-[#d6c18c]">{copy.setupDescription}</p>
            <p className="mt-4 border-t border-[#dfcf9f] pt-4 text-[11px] leading-relaxed text-[#75613a] dark:border-[#66552f] dark:text-[#d6c18c]">{copy.separateNotice}</p>
          </div>
          <form onSubmit={setup} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[{ type: 'pin' as const, label: copy.pinChoice, hint: copy.pinHint }, { type: 'password' as const, label: copy.passwordChoice, hint: copy.passwordHint }].map((option) => <button key={option.type} type="button" onClick={() => { setCredentialType(option.type); setCredential(''); setConfirmCredential(''); }} className={`rounded-2xl border p-3 text-left transition-colors ${credentialType === option.type ? 'border-[#b89c5c] bg-[#faf2dc] dark:bg-[#332c21]' : 'border-border hover:bg-muted'}`} aria-pressed={credentialType === option.type} data-testid={`button-credential-type-${option.type}`}><span className="block text-[12px] font-semibold">{option.label}</span><span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{option.hint}</span></button>)}
            </div>
             <div><FieldLabel htmlFor="vault-credential">{copy.credential}</FieldLabel><input id="vault-credential" type="password" inputMode={credentialType === 'pin' ? 'numeric' : 'text'} maxLength={credentialType === 'pin' ? 4 : 128} autoComplete="new-password" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder={credentialType === 'pin' ? copy.pinPlaceholder : copy.passwordPlaceholder} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" data-testid="input-vault-credential" /></div>
             <div><FieldLabel htmlFor="vault-confirm-credential">{copy.confirmCredential}</FieldLabel><input id="vault-confirm-credential" type="password" inputMode={credentialType === 'pin' ? 'numeric' : 'text'} maxLength={credentialType === 'pin' ? 4 : 128} autoComplete="new-password" value={confirmCredential} onChange={(event) => setConfirmCredential(event.target.value)} placeholder={copy.confirmPlaceholder} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" data-testid="input-vault-confirm-credential" /></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#ecc6bd] bg-[#fff7f4] p-3 text-[11px] leading-relaxed text-[#8f3f2d] dark:border-[#704038] dark:bg-[#3a2422] dark:text-[#f0b0a0]"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 accent-[#30243f]" data-testid="checkbox-vault-warning" /><span><strong className="block">{copy.irreversible}</strong>{copy.irreversibleBody}<span className="mt-1 block font-semibold">{copy.acknowledge}</span></span></label>
            <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-create-vault"><Lock size={15} />{busy ? copy.creating : copy.create}</button>
          </form>
        </div>
      ) : !key ? (
        <div className="mx-auto max-w-md">
          <div className="mb-5 rounded-[22px] border border-[#e1d4ac] bg-[#faf2dc] p-5 text-center dark:border-[#66552f] dark:bg-[#332c21]"><Lock size={24} className="mx-auto text-[#9a742f]" /><h3 className="mt-3 font-serif text-[26px]">{copy.lockedTitle}</h3><p className="mt-1 text-[12px] leading-relaxed text-[#75613a] dark:text-[#d6c18c]">{copy.lockedDescription}</p></div>
          <form onSubmit={unlock} className="space-y-3"><FieldLabel htmlFor="vault-unlock-credential">{copy.unlockCredential}</FieldLabel><input id="vault-unlock-credential" type="password" inputMode={stored && 'version' in stored && stored.credentialType === 'pin' ? 'numeric' : 'text'} autoComplete="current-password" value={credential} onChange={(event) => setCredential(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-background px-3 text-[14px] outline-none focus:border-[#b89c5c] focus:ring-2 focus:ring-[#d9c795]/40" data-testid="input-vault-unlock-credential" /><button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-unlock-vault"><LockKeyholeOpen size={15} />{busy ? copy.unlocking : copy.unlock}</button></form>
          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">{copy.irreversibleBody}</p>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#c3ddcf] bg-[#edf6f0] p-4 text-[#35614f] dark:border-[#365b49] dark:bg-[#243a2f] dark:text-[#b5d9c4] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2.5"><ShieldCheck size={17} className="mt-0.5 shrink-0" /><div><p className="text-[12px] leading-relaxed">{copy.unlockedNotice}</p><p className="mt-1 text-[10px] opacity-80">{copy.localOnly}</p></div></div><span className="font-mono text-[10px] uppercase tracking-[.12em]">{entries.length} {copy.entries}</span></div>
          {showCredentialChange && <form onSubmit={changeCredential} className="mb-5 rounded-2xl border border-[#d8ccb0] bg-[#faf6eb] p-4 dark:bg-[#2d281f]"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{copy.changeCredential}</p><h3 className="mt-1 font-serif text-[23px]">{copy.changeCredentialTitle}</h3><p className="mt-1 text-[11px] text-muted-foreground">{copy.changeCredentialDescription}</p></div><button type="button" onClick={() => { setShowCredentialChange(false); resetCredentials(); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={copy.cancel} data-testid="button-cancel-credential-change"><X size={16} /></button></div><div className="mt-4 grid grid-cols-2 gap-2">{[{ type: 'pin' as const, label: copy.pinChoice }, { type: 'password' as const, label: copy.passwordChoice }].map((option) => <button key={option.type} type="button" onClick={() => { setCredentialType(option.type); setCredential(''); setConfirmCredential(''); }} className={`rounded-xl border p-2.5 text-left text-[11px] font-semibold transition-colors ${credentialType === option.type ? 'border-[#b89c5c] bg-[#faf2dc] dark:bg-[#332c21]' : 'border-border hover:bg-muted'}`} aria-pressed={credentialType === option.type} data-testid={`button-change-credential-type-${option.type}`}>{option.label}</button>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><FieldLabel htmlFor="vault-new-credential">{copy.newCredential}</FieldLabel><input id="vault-new-credential" type="password" inputMode={credentialType === 'pin' ? 'numeric' : 'text'} maxLength={credentialType === 'pin' ? 4 : 128} value={credential} onChange={(event) => setCredential(event.target.value)} placeholder={credentialType === 'pin' ? copy.pinPlaceholder : copy.passwordPlaceholder} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px]" data-testid="input-new-vault-credential" /></div><div><FieldLabel htmlFor="vault-confirm-new-credential">{copy.confirmNewCredential}</FieldLabel><input id="vault-confirm-new-credential" type="password" inputMode={credentialType === 'pin' ? 'numeric' : 'text'} maxLength={credentialType === 'pin' ? 4 : 128} value={confirmCredential} onChange={(event) => setConfirmCredential(event.target.value)} placeholder={copy.confirmPlaceholder} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px]" data-testid="input-confirm-new-vault-credential" /></div></div><div className="mt-3 flex items-center justify-end gap-3 text-[11px] text-muted-foreground"><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-submit-credential-change"><RefreshCw size={14} />{busy ? copy.changing : copy.change}</button></div></form>}
          <div className="grid gap-6 lg:grid-cols-[.92fr_1.08fr]">
            <form onSubmit={saveEntry} className="rounded-2xl border border-[#e5dac1] bg-[#faf6eb] p-4 dark:border-[#514832] dark:bg-[#2d281f]">
              <div className="mb-4 flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{editingId ? copy.editEntry : copy.addEntry}</p><h3 className="mt-1 font-serif text-[24px]">{editingId ? copy.editEntry : copy.addEntry}</h3></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(blankDraft()); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={copy.cancel} data-testid="button-cancel-edit"><X size={16} /></button>}</div>
              <div className="grid gap-3 sm:grid-cols-2"><div><FieldLabel htmlFor="vault-category">{copy.category}</FieldLabel><select id="vault-category" value={draft.category} onChange={(event) => updateDraft('category', event.target.value as VaultCategory)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[12px]" data-testid="select-vault-category">{categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div><FieldLabel htmlFor="vault-title">{copy.titleField}</FieldLabel><input id="vault-title" value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} placeholder={copy.titlePlaceholder} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[12px]" data-testid="input-vault-title" /></div></div>
              <div className="mt-3"><FieldLabel htmlFor="vault-username">{copy.username}</FieldLabel><input id="vault-username" value={draft.username} onChange={(event) => updateDraft('username', event.target.value)} placeholder={copy.usernamePlaceholder} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[12px]" data-testid="input-vault-username" /></div>
              <div className="mt-3"><div className="mb-1.5 flex items-center justify-between gap-2"><label htmlFor="vault-secret" className="text-[11px] font-semibold text-muted-foreground">{copy.secret}</label><button type="button" onClick={() => { updateDraft('secret', generateStrongPassword()); setVisibleFields((current) => new Set(current).add('draft-secret')); }} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8f6b2c] hover:text-[#6c4c21]" data-testid="button-generate-password"><RefreshCw size={12} />{copy.generate}</button></div><div className="flex gap-2"><input id="vault-secret" type={visibleFields.has('draft-secret') ? 'text' : 'password'} value={draft.secret} onChange={(event) => updateDraft('secret', event.target.value)} placeholder={copy.secretPlaceholder} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 font-mono text-[12px]" data-testid="input-vault-secret" /><button type="button" onClick={() => setVisibleFields((current) => { const next = new Set(current); if (next.has('draft-secret')) next.delete('draft-secret'); else next.add('draft-secret'); return next; })} className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground" aria-label={visibleFields.has('draft-secret') ? copy.hide : copy.reveal} data-testid="button-toggle-draft-secret">{visibleFields.has('draft-secret') ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
              <div className="mt-3"><FieldLabel htmlFor="vault-url">{copy.url}</FieldLabel><input id="vault-url" type="url" value={draft.url} onChange={(event) => updateDraft('url', event.target.value)} placeholder={copy.urlPlaceholder} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[12px]" data-testid="input-vault-url" /></div>
              <div className="mt-3"><FieldLabel htmlFor="vault-notes">{copy.notes}</FieldLabel><textarea id="vault-notes" value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} placeholder={copy.notesPlaceholder} rows={3} className="w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-[12px] leading-relaxed" data-testid="textarea-vault-notes" /></div>
              <div className="mt-3"><FieldLabel htmlFor="vault-reminder">{copy.reminder}</FieldLabel><div className="flex gap-2"><input id="vault-reminder" type="date" value={draft.reminderDate ?? ''} onChange={(event) => updateDraft('reminderDate', event.target.value || null)} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-[12px]" data-testid="input-vault-reminder" /><button type="button" onClick={() => updateDraft('reminderDate', null)} className="rounded-xl border border-border px-3 text-[10px] text-muted-foreground hover:bg-muted" data-testid="button-clear-reminder">{copy.noReminder}</button></div></div>
               <div className="mt-4 border-t border-border/70 pt-4"><div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold text-muted-foreground">{copy.customFields}</p><button type="button" onClick={addCustomField} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-[#8f6b2c] hover:bg-[#faf2dc]" data-testid="button-add-custom-field"><Plus size={12} />{copy.addField}</button></div>{draft.customFields.map((field) => { const draftFieldKey = `draft-custom-${field.id}`; return <div key={field.id} className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-1.5"><input value={field.label} onChange={(event) => updateCustomField(field.id, 'label', event.target.value)} placeholder={copy.fieldLabel} aria-label={copy.fieldLabel} className="h-9 min-w-0 rounded-lg border border-border bg-card px-2 text-[11px]" data-testid={`input-custom-label-${field.id}`} /><input value={field.value} onChange={(event) => updateCustomField(field.id, 'value', event.target.value)} placeholder={copy.fieldValue} aria-label={copy.fieldValue} type={field.secret && !visibleFields.has(draftFieldKey) ? 'password' : 'text'} className="h-9 min-w-0 rounded-lg border border-border bg-card px-2 text-[11px]" data-testid={`input-custom-value-${field.id}`} /><div className="flex items-center gap-0.5"><button type="button" onClick={() => setVisibleFields((current) => { const next = new Set(current); if (next.has(draftFieldKey)) next.delete(draftFieldKey); else next.add(draftFieldKey); return next; })} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={visibleFields.has(draftFieldKey) ? copy.hide : copy.reveal} data-testid={`button-reveal-custom-field-${field.id}`}>{visibleFields.has(draftFieldKey) ? <EyeOff size={13} /> : <Eye size={13} />}</button><button type="button" onClick={() => updateCustomField(field.id, 'secret', !field.secret)} className={`grid size-9 place-items-center rounded-lg ${field.secret ? 'bg-[#f8e9bf] text-[#8f6b2c]' : 'text-muted-foreground hover:bg-muted'}`} aria-label={copy.sensitive} aria-pressed={field.secret} data-testid={`button-toggle-custom-secret-${field.id}`}><ShieldCheck size={13} /></button><button type="button" onClick={() => updateDraft('customFields', draft.customFields.filter((item) => item.id !== field.id))} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-[#fff0ec] hover:text-destructive" aria-label={copy.removeField} data-testid={`button-remove-custom-field-${field.id}`}><Trash2 size={13} /></button></div></div>; })}</div>
              <button type="submit" disabled={busy} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-60" data-testid="button-save-vault-entry">{editingId ? <Pencil size={14} /> : <Plus size={15} />}{busy ? copy.saving : copy.save}</button>
            </form>
           <div><div className="mb-3 flex items-end justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">{copy.entries}</p><p className="mt-1 font-serif text-[24px]">{entries.length} {copy.entries}</p></div><LockKeyholeOpen size={18} className="text-[#9a742f]" /></div>{entries.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d5c8a9] bg-[#faf6ea] px-5 py-12 text-center dark:border-[#5d5037] dark:bg-[#2d281f]"><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#eee8d5] text-[#8f6b2c]"><Lock size={19} /></span><p className="mt-3 font-serif text-[23px]">{copy.emptyTitle}</p><p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-muted-foreground">{copy.emptyDescription}</p></div> : <div className="space-y-2">{entries.map((entry) => { const reminder = reminderTone(entry.reminderDate, copy); const noteKey = `${entry.id}-notes`; return <article key={entry.id} className="rounded-2xl border border-card-border bg-background/45 p-4 transition-colors hover:border-[#cdbd91]" data-testid={`card-vault-entry-${entry.id}`}><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eee8d5] text-[#8f6b2c]"><KeyRound size={15} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-serif text-[20px] leading-tight">{entry.title}</p><span className="mt-1 inline-flex rounded-full bg-[#eee8d5] px-2 py-1 text-[9px] uppercase tracking-[.08em] text-[#756d5e] dark:bg-[#413a2b] dark:text-[#d4c49b]">{copy.categories[entry.category]}</span></div><div className="flex gap-1"><button type="button" onClick={() => beginEdit(entry)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`${copy.edit}: ${entry.title}`} data-testid={`button-edit-vault-entry-${entry.id}`}><Pencil size={14} /></button><button type="button" onClick={() => deleteEntry(entry)} disabled={busy} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-[#fff0ec] hover:text-destructive" aria-label={`${copy.delete}: ${entry.title}`} data-testid={`button-delete-vault-entry-${entry.id}`}><Trash2 size={14} /></button></div></div><p className="mt-2 truncate text-[11px] text-muted-foreground">{entry.username || copy.noUsername}</p>{entry.secret && <div className="mt-2 max-w-full"><SecretValue value={entry.secret} visible={visibleFields.has(entry.id)} onToggle={() => setVisibleFields((current) => { const next = new Set(current); if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id); return next; })} onCopy={() => copyValue(entry.secret)} copyLabel={copy.copy} revealLabel={copy.reveal} hideLabel={copy.hide} /></div>}{(entry.url || entry.notes || entry.customFields.length > 0 || entry.reminderDate) && <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground">{entry.url && <a href={entry.url} target="_blank" rel="noreferrer" className="block truncate text-[#6c4c21] hover:underline" data-testid={`link-vault-url-${entry.id}`}>{entry.url}</a>}{entry.notes && <div className="space-y-1"><span className="font-semibold">{copy.notes}</span><SecretValue value={entry.notes} visible={visibleFields.has(noteKey)} onToggle={() => setVisibleFields((current) => { const next = new Set(current); if (next.has(noteKey)) next.delete(noteKey); else next.add(noteKey); return next; })} onCopy={() => copyValue(entry.notes)} copyLabel={copy.copy} revealLabel={copy.reveal} hideLabel={copy.hide} /></div>}{entry.customFields.map((field) => field.label && <div key={field.id} className="flex items-center gap-2"><span className="shrink-0 font-semibold">{field.label}</span><SecretValue value={field.value} visible={visibleFields.has(`${entry.id}-${field.id}`)} onToggle={() => setVisibleFields((current) => { const next = new Set(current); const fieldKey = `${entry.id}-${field.id}`; if (next.has(fieldKey)) next.delete(fieldKey); else next.add(fieldKey); return next; })} onCopy={() => copyValue(field.value)} copyLabel={copy.copy} revealLabel={copy.reveal} hideLabel={copy.hide} /></div>)}{reminder && <span className={`inline-flex rounded-full border px-2 py-1 ${reminder.className}`}>{reminder.label}: {dateLabel(entry.reminderDate!, language)}</span>}</div>}<p className="mt-3 text-[10px] text-muted-foreground">{copy.updated}: {dateLabel(entry.updatedAt.slice(0, 10), language)}</p></div></div></article>; })}</div>}</div>
          </div>
        </>
      )}
    </section>
  );
}