import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/react";
import {
  getGetActiveTimeLimitQueryKey,
  getGetDiarySettingsQueryKey,
  useGetActiveTimeLimit,
  useHeartbeatActiveTime,
  useOverrideActiveTimeLimit,
  useSetDiaryPin,
  useUpdateActiveTimeLimit,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock3, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  activeTimeCopy,
  activeTimeLanguages,
  formatActiveClock,
  type ActiveTimeLanguage,
} from "@/lib/active-time-copy";

type LimitState = {
  enabled: boolean;
  limitSeconds: number;
  usedSeconds: number;
  extensionSeconds: number;
  effectiveLimitSeconds: number;
  remainingSeconds: number;
  locked: boolean;
  language: ActiveTimeLanguage;
  pinEnabled: boolean;
  timeZone: string;
  today: string;
};

type OverrideAction = "extend" | "reset";

function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function ActiveTimeGateForUser({ children }: { children: ReactNode }) {
  const timeZone = useMemo(currentTimeZone, []);
  const queryClient = useQueryClient();
  const stateQuery = useGetActiveTimeLimit({ timeZone });
  const heartbeat = useHeartbeatActiveTime();
  const override = useOverrideActiveTimeLimit();
  const [now, setNow] = useState(Date.now());
  const [syncedAt, setSyncedAt] = useState(Date.now());
  const [visible, setVisible] = useState(
    () => document.visibilityState !== "hidden",
  );
  const [pin, setPin] = useState("");
  const [overrideError, setOverrideError] = useState("");
  const state = stateQuery.data as LimitState | undefined;
  const language = state?.language ?? "uz";
  const copy = activeTimeCopy[language];
  const queryKey = getGetActiveTimeLimitQueryKey({ timeZone });

  useEffect(() => {
    if (state) setSyncedAt(Date.now());
  }, [state]);

  const sendHeartbeat = useCallback(async (closingActiveInterval = false) => {
    if (
      !state?.enabled ||
      (!closingActiveInterval && document.visibilityState === "hidden")
    ) {
      return;
    }
    try {
      const result = await heartbeat.mutateAsync({ data: { timeZone } });
      queryClient.setQueryData(queryKey, result);
      setSyncedAt(Date.now());
    } catch {
      // The gate displays a persistent warning while the API is unreachable.
    }
  }, [heartbeat, queryClient, queryKey, state?.enabled, timeZone]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const timer = window.setInterval(() => void sendHeartbeat(), 10_000);
    const onVisibilityChange = () => {
      const isVisible = document.visibilityState !== "hidden";
      setVisible(isVisible);
      if (isVisible) void sendHeartbeat();
      else void sendHeartbeat(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (state?.enabled && document.visibilityState !== "hidden") {
      void sendHeartbeat();
    }
    return () => {
      window.clearInterval(tick);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [sendHeartbeat, state?.enabled]);

  const projectedUsed = state
    ? state.usedSeconds +
      (state.enabled && visible
        ? Math.max(0, Math.floor((now - syncedAt) / 1000))
        : 0)
    : 0;
  const locked =
    Boolean(state?.enabled) &&
    (Boolean(state?.locked) || projectedUsed >= (state?.effectiveLimitSeconds ?? 0));

  const applyOverride = async (action: OverrideAction) => {
    if (!state || !/^\d{4}$/.test(pin)) return;
    setOverrideError("");
    try {
      const result = await override.mutateAsync({
        data: { action, pin, timeZone },
      });
      queryClient.setQueryData(queryKey, result);
      setSyncedAt(Date.now());
      setPin("");
    } catch (error) {
      const status = (error as { status?: number })?.status;
      setOverrideError(status === 429 ? copy.pinRateLimited : copy.incorrectPin);
    }
  };

  if (stateQuery.isError) {
    return (
      <>
        <div
          role="status"
          className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-[#e3b8aa] bg-[#fff0ec] px-4 py-3 text-sm text-[#71392e] shadow-lg"
        >
          <AlertTriangle size={17} className="shrink-0" />
          <span>{copy.loadError}</span>
          <button
            type="button"
            onClick={() => void stateQuery.refetch()}
            className="ml-auto shrink-0 font-semibold underline underline-offset-2"
          >
            {copy.retry}
          </button>
        </div>
        {children}
      </>
    );
  }

  if (!state || !locked) return <>{children}</>;

  return (
    <main
      className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#21182c] px-5 py-10 text-[#fffaf0]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="active-time-locked-title"
    >
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#30243f] p-7 shadow-2xl sm:p-9">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#e9b658]/15 text-[#e9b658]">
          <LockKeyhole size={25} />
        </div>
        <p className="mt-7 font-mono text-[10px] uppercase tracking-[.22em] text-[#e9b658]">
          {copy.activeTimer}
        </p>
        <h1
          id="active-time-locked-title"
          className="mt-3 font-serif text-3xl leading-tight sm:text-4xl"
        >
          {copy.locked}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          {copy.lockedHelp}
        </p>
        <div className="mt-6 rounded-2xl bg-white/5 p-4">
          <p className="text-xs text-white/60">{copy.usedToday}</p>
          <p className="mt-1 font-mono text-2xl tabular-nums">
            {formatActiveClock(state.usedSeconds)} /{" "}
            {formatActiveClock(state.effectiveLimitSeconds)}
          </p>
        </div>
        <label
          htmlFor="active-time-pin"
          className="mt-6 block text-xs font-medium text-white/80"
        >
          {copy.pinInput}
        </label>
        <input
          id="active-time-pin"
          aria-label={copy.pinInput}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(event) =>
            setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
          }
          className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-black/15 px-4 font-mono text-lg tracking-[.4em] text-white outline-none focus:border-[#e9b658]"
          placeholder="••••"
          type="password"
          data-testid="active-time-pin"
        />
        {overrideError && (
          <p role="alert" className="mt-3 text-sm text-[#ffc3b6]">
            {overrideError}
          </p>
        )}
        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => void applyOverride("extend")}
            disabled={pin.length !== 4 || override.isPending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e9b658] px-4 py-3 text-sm font-semibold text-[#30243f] transition hover:bg-[#f2c873] disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="active-time-extend"
          >
            {override.isPending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Clock3 size={16} />
            )}
            {copy.extend}
          </button>
          <button
            type="button"
            onClick={() => void applyOverride("reset")}
            disabled={pin.length !== 4 || override.isPending}
            className="min-h-12 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="active-time-reset"
          >
            {copy.reset}
          </button>
        </div>
      </section>
    </main>
  );
}

export function ActiveTimeGate({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <>{children}</>;
  return <ActiveTimeGateForUser>{children}</ActiveTimeGateForUser>;
}

export function ActiveTimeSettings() {
  const timeZone = useMemo(currentTimeZone, []);
  const queryClient = useQueryClient();
  const query = useGetActiveTimeLimit({ timeZone });
  const setPinMutation = useSetDiaryPin();
  const updateMutation = useUpdateActiveTimeLimit();
  const [draft, setDraft] = useState<{
    enabled?: boolean;
    limitSeconds?: number;
    language?: ActiveTimeLanguage;
  }>({});
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const state = query.data as LimitState | undefined;
  const language = draft.language ?? state?.language ?? "uz";
  const copy = activeTimeCopy[language];
  const enabled = draft.enabled ?? state?.enabled ?? false;
  const limitSeconds = draft.limitSeconds ?? state?.limitSeconds ?? 7200;
  const queryKey = getGetActiveTimeLimitQueryKey({ timeZone });
  const pending = setPinMutation.isPending || updateMutation.isPending;

  const savePin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setMessage(copy.pinInput);
      return;
    }
    setMessage("");
    try {
      await setPinMutation.mutateAsync({ data: { pin } });
      await queryClient.invalidateQueries({
        queryKey: getGetDiarySettingsQueryKey(),
      });
      await query.refetch();
      setPin("");
      setMessage(copy.pinSet);
    } catch {
      setMessage(copy.saveError);
    }
  };

  const saveLimit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!state) return;
    setMessage("");
    try {
      const result = await updateMutation.mutateAsync({
        data: { enabled, limitSeconds, language, timeZone },
      });
      queryClient.setQueryData(queryKey, result);
      setDraft({});
      setMessage(copy.save);
    } catch {
      setMessage(copy.saveError);
    }
  };

  if (query.isLoading || !state) {
    return (
      <section className="mt-5 rounded-[24px] border border-card-border bg-card p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">
          {query.isError ? copy.loadError : copy.title}
        </p>
        {query.isError && (
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-3 text-sm font-semibold text-primary underline"
          >
            {copy.retry}
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-[24px] border border-card-border bg-card p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e4efea] text-[#35614f]">
          <Clock3 size={21} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[27px]">{copy.title}</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            {copy.description}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-xs text-muted-foreground">{copy.usedToday}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">
            {formatActiveClock(state.usedSeconds)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-background px-4 py-3">
          <p className="text-xs text-muted-foreground">{copy.remaining}</p>
          <p className="mt-1 font-mono text-xl tabular-nums">
            {state.enabled
              ? formatActiveClock(state.remainingSeconds)
              : "—"}
          </p>
        </div>
      </div>

      <form onSubmit={saveLimit} className="mt-6 space-y-5 border-t border-border pt-6">
        <label className="flex items-center justify-between gap-4 text-sm font-medium">
          <span>{copy.enabled}</span>
          <input
            type="checkbox"
            checked={enabled}
            disabled={!state.pinEnabled}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                enabled: event.target.checked,
              }))
            }
            className="size-5 accent-[#3e2e56] disabled:opacity-40"
            data-testid="active-time-enabled"
          />
        </label>
        {!state.pinEnabled && (
          <p className="rounded-xl bg-[#f7f0df] px-4 py-3 text-xs leading-relaxed text-[#76521a]">
            {copy.pinRequired}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium">
            {copy.dailyLimit}
            <input
              type="number"
              min={15}
              max={1440}
              step={15}
              value={Math.round(limitSeconds / 60)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  limitSeconds: Math.min(
                    86400,
                    Math.max(900, (Number(event.target.value) || 15) * 60),
                  ),
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-[#b89c5c]"
              data-testid="active-time-limit-minutes"
            />
            <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
              {copy.limitMinutes}
            </span>
          </label>
          <label className="text-xs font-medium">
            {copy.language}
            <select
              value={language}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  language: event.target.value as ActiveTimeLanguage,
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#b89c5c]"
              data-testid="active-time-language"
            >
              {activeTimeLanguages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          data-testid="active-time-save"
        >
          {updateMutation.isPending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ShieldCheck size={16} />
          )}
          {updateMutation.isPending ? copy.saving : copy.save}
        </button>
      </form>

      <form onSubmit={savePin} className="mt-6 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} className="text-[#47796c]" />
          <h3 className="text-sm font-semibold">{copy.pinTitle}</h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {state.pinEnabled ? copy.pinSet : copy.pinRequired}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            aria-label={copy.pinInput}
            autoComplete="new-password"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 font-mono tracking-[.35em] outline-none focus:border-[#b89c5c]"
            placeholder="••••"
            data-testid="active-time-pin-setup"
          />
          <button
            type="submit"
            disabled={pin.length !== 4 || pending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold disabled:opacity-50"
            data-testid="active-time-pin-save"
          >
            {setPinMutation.isPending && (
              <LoaderCircle size={15} className="animate-spin" />
            )}
            {state.pinEnabled ? copy.updatePin : copy.setPin}
          </button>
        </div>
      </form>

      {message && (
        <p role="status" className="mt-4 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </section>
  );
}