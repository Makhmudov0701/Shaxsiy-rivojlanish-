import { useUser } from '@clerk/react';
import { useState, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useGetDiarySettings, useVerifyDiaryPin } from '@workspace/api-client-react';

export function PinLockGate({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const settings = useGetDiarySettings();
  const verify = useVerifyDiaryPin();
  const sessionKey = user?.id ? `kundalik-pin-${user.id}` : 'kundalik-pin';
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(() => window.sessionStorage.getItem(sessionKey) === 'ochiq');

  if (settings.isLoading || !settings.data) {
    return <div className="min-h-[100dvh] bg-background" />;
  }
  if (!settings.data.pinEnabled || unlocked) return <>{children}</>;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN kodi 4 ta raqamdan iborat bo‘lishi kerak.');
      return;
    }
    setError('');
    try {
      const result = await verify.mutateAsync({ data: { pin } });
      if (!result.verified) {
        setError('PIN kodi noto‘g‘ri.');
        setPin('');
        return;
      }
      window.sessionStorage.setItem(sessionKey, 'ochiq');
      setUnlocked(true);
    } catch {
      setError('PIN tekshirilmadi. Qayta urinib ko‘ring.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <form onSubmit={submit} className="w-full max-w-[390px] rounded-[28px] border border-[#d8ccb0] bg-[#fffaf0] p-8 text-center shadow-xl">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <LockKeyhole size={24} strokeWidth={1.5} />
        </span>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">Shaxsiy kundalik</p>
        <h1 className="mt-3 font-serif text-[35px] leading-none text-[#30243f]">Kundalik qulflangan</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#756d7e]">Davom etish uchun 4 xonali PIN kodni kiriting.</p>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
          className="mt-7 h-14 w-full rounded-2xl border border-[#d8ccb0] bg-[#f7f0df] text-center font-mono text-[25px] tracking-[.55em] text-[#30243f] outline-none focus:border-[#b89c5c]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          aria-label="4 xonali PIN kodi"
          autoFocus
        />
        {error && <p className="mt-3 text-[12px] text-destructive" role="alert">{error}</p>}
        <button type="submit" disabled={verify.isPending} className="mt-6 w-full rounded-2xl bg-primary px-4 py-3.5 text-[13px] font-semibold text-primary-foreground disabled:opacity-60">
          {verify.isPending ? 'Tekshirilmoqda...' : 'Kundalikni ochish'}
        </button>
      </form>
    </div>
  );
}