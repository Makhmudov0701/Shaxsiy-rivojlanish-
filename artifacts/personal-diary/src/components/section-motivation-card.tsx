import { Check, ChevronDown, Quote, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  sectionMotivationContent,
  type SectionId,
} from "@/components/section-motivation-content";

const collapsedStoragePrefix = "kundalik-section-info-collapsed-";

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
  const [manualQuoteIndex, setManualQuoteIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(() => initialExpandedState(sectionId));
  const Icon = section.icon;
  const dailyIndex = dailyQuoteIndex(sectionId, today, section.quotes.length);
  const quoteIndex = manualQuoteIndex ?? dailyIndex;
  const quote = section.quotes[quoteIndex];
  const panelId = `section-info-panel-${sectionId}`;

  useEffect(() => {
    const syncDate = () => {
      const currentDate = localDateKey();
      setToday((previousDate) => previousDate === currentDate ? previousDate : currentDate);
    };
    const timer = window.setInterval(syncDate, 60_000);
    window.addEventListener("focus", syncDate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncDate);
    };
  }, []);

  useEffect(() => {
    setManualQuoteIndex(null);
  }, [today]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`${collapsedStoragePrefix}${sectionId}`, String(!expanded));
    } catch {
      // Keep the current preference for this visit if browser storage is unavailable.
    }
  }, [expanded, sectionId]);

  const showNextQuote = () => {
    setManualQuoteIndex((currentIndex) => ((currentIndex ?? dailyIndex) + 1) % section.quotes.length);
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
                className="relative flex min-h-[218px] flex-col justify-between overflow-hidden rounded-[20px] border p-4 sm:min-h-[230px] sm:p-5"
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
                  <p key={`${today}-${quoteIndex}`} className="mt-5 max-w-[38rem] font-serif text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.08] tracking-[-0.025em] text-foreground" data-testid={`text-daily-quote-${sectionId}`}>
                    “{quote}”
                  </p>
                </div>
                <div className="relative mt-5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{section.title} · {String(quoteIndex + 1).padStart(2, "0")}/{String(section.quotes.length).padStart(2, "0")}</span>
                  <button
                    type="button"
                    onClick={showNextQuote}
                    disabled={!expanded}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-background"
                    aria-label="Keyingi motivatsion iqtibos"
                    data-testid={`button-next-daily-quote-${sectionId}`}
                  >
                    <RefreshCw size={13} />
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