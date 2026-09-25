import { Check, ChevronDown, Quote, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MotivationMemeResponse } from "@workspace/api-client-react";
import { useFetchMotivationMeme } from "@workspace/api-client-react";
import {
  sectionMotivationContent,
  type SectionId,
} from "@/components/section-motivation-content";

const collapsedStoragePrefix = "kundalik-section-info-collapsed-";
const dailyMemeStoragePrefix = "kundalik-section-daily-meme-";

function localDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dailyQuoteIndex(sectionId: SectionId, day: string, count: number) {
  const seed = `${sectionId}:${day}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % count;
}

function dailyMemeStorageKey(sectionId: SectionId, day: string) {
  return `${dailyMemeStoragePrefix}${sectionId}-${day}`;
}

function isHttpsUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isMotivationMeme(value: unknown): value is MotivationMemeResponse {
  if (typeof value !== "object" || value === null) return false;
  const meme = value as Record<string, unknown>;
  return isHttpsUrl(meme.imageUrl)
    && typeof meme.title === "string"
    && typeof meme.subreddit === "string"
    && isHttpsUrl(meme.postUrl);
}

function readCachedMeme(sectionId: SectionId, day: string) {
  try {
    const stored = window.localStorage.getItem(dailyMemeStorageKey(sectionId, day));
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isMotivationMeme(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cacheMeme(sectionId: SectionId, day: string, meme: MotivationMemeResponse) {
  try {
    const currentKey = dailyMemeStorageKey(sectionId, day);
    window.localStorage.setItem(currentKey, JSON.stringify(meme));
    const sectionPrefix = `${dailyMemeStoragePrefix}${sectionId}-`;
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(sectionPrefix) && key !== currentKey) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Keep the fetched meme for this visit when browser storage is unavailable.
  }
}

function removeCachedMeme(sectionId: SectionId, day: string) {
  try {
    window.localStorage.removeItem(dailyMemeStorageKey(sectionId, day));
  } catch {
    // Keep the fallback available even when browser storage is unavailable.
  }
}

function initialExpandedState(sectionId: SectionId) {
  try {
    return window.localStorage.getItem(`${collapsedStoragePrefix}${sectionId}`) !== "true";
  } catch {
    return true;
  }
}

export function SectionMotivationCard({ sectionId }: { sectionId: SectionId }) {
  const section = sectionMotivationContent[sectionId];
  const [today, setToday] = useState(localDateKey);
  const [meme, setMeme] = useState(() => readCachedMeme(sectionId, localDateKey()));
  const [isLoading, setIsLoading] = useState(() => !readCachedMeme(sectionId, localDateKey()));
  const [imageFailed, setImageFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [expanded, setExpanded] = useState(() => initialExpandedState(sectionId));
  const requestedDateRef = useRef<string | null>(null);
  const { mutate: fetchMeme } = useFetchMotivationMeme();
  const Icon = section.icon;
  const dailyIndex = dailyQuoteIndex(sectionId, today, section.quotes.length);
  const fallbackQuote = section.quotes[dailyIndex];
  const panelId = `section-info-panel-${sectionId}`;

  const requestMeme = useCallback((requestedDate: string) => {
    setIsLoading(true);
    setLoadFailed(false);
    fetchMeme(
      { data: { sectionId } },
      {
        onSuccess: (nextMeme) => {
          cacheMeme(sectionId, requestedDate, nextMeme);
          if (requestedDate !== localDateKey()) return;
          setMeme(nextMeme);
          setImageFailed(false);
          setIsLoading(false);
        },
        onError: () => {
          if (requestedDate !== localDateKey()) return;
          setMeme(null);
          setImageFailed(false);
          setLoadFailed(true);
          setIsLoading(false);
        },
      },
    );
  }, [fetchMeme, sectionId]);

  useEffect(() => {
    const syncDate = () => {
      const currentDate = localDateKey();
      setToday((previousDate) => previousDate === currentDate ? previousDate : currentDate);
    };
    let timer = 0;
    const scheduleMidnightSync = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = window.setTimeout(() => {
        syncDate();
        scheduleMidnightSync();
      }, Math.max(1000, nextMidnight.getTime() - now.getTime() + 50));
    };
    scheduleMidnightSync();
    window.addEventListener("focus", syncDate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", syncDate);
    };
  }, []);

  useEffect(() => {
    const cachedMeme = readCachedMeme(sectionId, today);
    setMeme(cachedMeme);
    setImageFailed(false);
    setLoadFailed(false);
    if (cachedMeme) {
      setIsLoading(false);
      return;
    }
    if (requestedDateRef.current === today) return;
    requestedDateRef.current = today;
    requestMeme(today);
  }, [requestMeme, sectionId, today]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`${collapsedStoragePrefix}${sectionId}`, String(!expanded));
    } catch {
      // Keep the current preference for this visit if browser storage is unavailable.
    }
  }, [expanded, sectionId]);

  const showNextMeme = () => {
    const currentDate = localDateKey();
    if (currentDate !== today) {
      setToday(currentDate);
      return;
    }
    requestMeme(currentDate);
  };

  const handleImageError = () => {
    setImageFailed(true);
    setMeme(null);
    removeCachedMeme(sectionId, today);
  };

  return (
    <section className="mx-auto w-full max-w-[1360px] px-4 pt-4 sm:px-8 sm:pt-6 lg:px-12" data-testid={`section-info-card-${sectionId}`}>
      <div
        className="overflow-hidden rounded-[24px] border bg-card shadow-sm"
        style={{
          backgroundImage: `linear-gradient(125deg, ${section.accent}22 0%, hsl(var(--card)) 55%, ${section.accent}12 100%)`,
          borderColor: `${section.accent}48`,
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-2xl border"
            style={{
              color: section.accent,
              backgroundColor: `${section.accent}1c`,
              borderColor: `${section.accent}45`,
            }}
          >
            <Icon size={20} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bo‘lim haqida</p>
            <h2 className="mt-0.5 truncate font-serif text-[22px] leading-tight text-foreground sm:text-[25px]">{section.title}</h2>
            {!expanded && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{section.eyebrow}</p>}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border/80 bg-background/55 px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            data-testid={`button-toggle-section-info-${sectionId}`}
          >
            <span className="hidden sm:inline">{expanded ? "Yig‘ish" : "Ochish"}</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div
          id={panelId}
          className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          aria-hidden={!expanded}
        >
          <div className="overflow-hidden">
            <div className={`grid gap-4 px-4 pb-4 transition-[opacity,transform] duration-300 ease-out sm:px-6 sm:pb-6 lg:grid-cols-[1fr_0.95fr] ${expanded ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}>
              <div className="flex flex-col justify-center rounded-[20px] border border-border/50 bg-background/40 p-4 sm:p-5">
                <p className="text-[13px] leading-relaxed text-foreground/85" data-testid={`text-section-purpose-${sectionId}`}>{section.purpose}</p>
                <h3 className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Foydasi</h3>
                <ul className="mt-2.5 space-y-2">
                  {section.benefits.map((benefit, index) => (
                    <li key={benefit} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-muted-foreground" data-testid={`text-section-benefit-${sectionId}-${index + 1}`}>
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full" style={{ color: section.accent, backgroundColor: `${section.accent}20` }}>
                        <Check size={10} strokeWidth={2.5} />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <article
                className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[20px] border p-4 sm:min-h-[340px] sm:p-5"
                style={{
                  backgroundImage: `linear-gradient(145deg, ${section.accent}2b 0%, hsl(var(--background) / 0.72) 72%, ${section.accent}20 100%)`,
                  borderColor: `${section.accent}55`,
                }}
                data-testid={`card-daily-motivation-${sectionId}`}
                aria-live="polite"
              >
                <Quote
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-4 size-28 opacity-[0.09]"
                  style={{ color: section.accent }}
                  strokeWidth={1}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg" style={{ color: section.accent, backgroundColor: `${section.accent}20` }}>
                      <Icon size={14} />
                    </span>
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Bugungi motivatsiya</p>
                  </div>
                </div>
                {isLoading ? (
                  <div className="relative flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 text-muted-foreground" role="status" data-testid={`status-daily-meme-loading-${sectionId}`}>
                    <RefreshCw size={22} className="animate-spin" style={{ color: section.accent }} />
                    <span className="text-[12px]">Mem yuklanmoqda…</span>
                  </div>
                ) : meme && !imageFailed ? (
                  <figure className="relative flex flex-1 flex-col justify-center">
                    <a
                      href={meme.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={expanded ? 0 : -1}
                      aria-label="Memni Redditda ochish"
                      data-testid={`link-daily-meme-source-${sectionId}`}
                    >
                      <img
                        src={meme.imageUrl}
                        alt={meme.title}
                        onError={handleImageError}
                        className="h-[220px] max-h-[280px] w-full rounded-xl object-contain sm:h-[240px]"
                        data-testid={`img-daily-meme-${sectionId}`}
                      />
                    </a>
                    <figcaption className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span className="truncate">Reddit · r/{meme.subreddit}</span>
                      <a href={meme.postUrl} target="_blank" rel="noreferrer" tabIndex={expanded ? 0 : -1} className="shrink-0 underline underline-offset-2 hover:text-foreground" data-testid={`link-meme-post-${sectionId}`}>
                        Manba
                      </a>
                    </figcaption>
                  </figure>
                ) : (
                  <div className="relative flex min-h-[220px] flex-1 flex-col justify-center">
                    <Quote
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-2 -top-4 size-28 opacity-[0.09]"
                      style={{ color: section.accent }}
                      strokeWidth={1}
                    />
                    <p key={`${today}-${dailyIndex}`} className="relative mt-5 max-w-[38rem] font-serif text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.08] tracking-[-0.025em] text-foreground" data-testid={`text-daily-quote-${sectionId}`}>
                      “{fallbackQuote}”
                    </p>
                    <p className="relative mt-4 text-[10px] text-muted-foreground" role={loadFailed || imageFailed ? "status" : undefined}>
                      {imageFailed ? "Rasm ochilmadi — bugungi iqtibos." : loadFailed ? "Mem hozircha yuklanmadi — bugungi iqtibos." : "Bugungi iqtibos"}
                    </p>
                  </div>
                )}
                <div className="relative mt-5 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    {meme && !imageFailed ? `r/${meme.subreddit}` : `${section.title} · iqtibos`}
                  </span>
                  <button
                    type="button"
                    onClick={showNextMeme}
                    disabled={!expanded || isLoading}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-background"
                    aria-label="Keyingi motivatsion memni yuklash"
                    data-testid={`button-next-daily-quote-${sectionId}`}
                  >
                    <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                    <span>Keyingisi</span>
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}