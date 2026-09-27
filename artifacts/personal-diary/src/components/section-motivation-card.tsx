import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  generateMotivationEntry,
  getMotivationPoolSize,
} from "@/components/section-motivation-generator";
import {
  sectionMotivationContent,
  type SectionId,
} from "@/components/section-motivation-content";
import {
  dailyMotivationIndex,
  dailySectionGuideIndex,
  localDateKey,
  nextMotivationIndex,
  randomMotivationStride,
} from "@/components/section-motivation-rotation";
import {
  SECTION_DAILY_GUIDE_POOL_SIZE,
  generateSectionDailyGuide,
  sectionGuideBenefitsHeading,
  sectionGuideFooterLabel,
  sectionGuideHeading,
  sectionCardControls,
} from "@/components/section-daily-guide-generator";
import { translateUiText, useI18n } from "@/lib/i18n";

const collapsedStoragePrefix = "kundalik-section-info-collapsed-";
const legacyDailyMemeStoragePrefix = "kundalik-section-daily-meme-";

function initialExpandedState(sectionId: SectionId) {
  try {
    return window.localStorage.getItem(`${collapsedStoragePrefix}${sectionId}`) !== "true";
  } catch {
    return true;
  }
}

function clearLegacyMemeCache() {
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(legacyDailyMemeStoragePrefix)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Legacy cache cleanup is best-effort when browser storage is unavailable.
  }
}

interface ManualQuoteSelection {
  date: string;
  userId: string;
  sectionId: SectionId;
  index: number;
  stride: number;
}

export function SectionMotivationCard({ sectionId, userId }: { sectionId: SectionId; userId: string }) {
  const { language } = useI18n();
  const section = sectionMotivationContent[sectionId];
  const category = section.motivationCategory;
  const poolSize = getMotivationPoolSize(category);
  const [today, setToday] = useState(localDateKey);
  const [expanded, setExpanded] = useState(() => initialExpandedState(sectionId));
  const [manualSelection, setManualSelection] = useState<ManualQuoteSelection | null>(null);
  const Icon = section.icon;
  const dailyIndex = dailyMotivationIndex(category, userId, today);
  const dailyGuideIndex = dailySectionGuideIndex(sectionId, userId, today, SECTION_DAILY_GUIDE_POOL_SIZE);
  const dailyGuide = generateSectionDailyGuide(sectionId, dailyGuideIndex, language);
  const guideHeading = sectionId === "diary"
    ? {
      uz: "SHAXSIY RIVOJLANISH YO‘RIQNOMASI",
      en: "PERSONAL DEVELOPMENT GUIDE",
      ru: "РУКОВОДСТВО ПО ЛИЧНОСТНОМУ РОСТУ",
      ko: "자기계발 안내",
    }[language]
    : sectionGuideHeading[language];
  const manualSelectionIsCurrent = manualSelection?.date === today
    && manualSelection.userId === userId
    && manualSelection.sectionId === sectionId;
  const currentIndex = manualSelectionIsCurrent ? manualSelection.index : dailyIndex;
  const currentEntry = generateMotivationEntry(category, currentIndex, language);
  const panelId = `section-info-panel-${sectionId}`;

  useEffect(() => {
    clearLegacyMemeCache();
  }, []);

  useEffect(() => {
    const syncDate = () => {
      const currentDate = localDateKey();
      setToday((previousDate) => previousDate === currentDate ? previousDate : currentDate);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") syncDate();
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
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", syncDate);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(`${collapsedStoragePrefix}${sectionId}`, String(!expanded));
    } catch {
      // Keep the current preference for this visit if browser storage is unavailable.
    }
  }, [expanded, sectionId]);

  const showNextQuote = () => {
    const currentDate = localDateKey();
    const currentManualSelection = manualSelection?.date === currentDate
      && manualSelection.userId === userId
      && manualSelection.sectionId === sectionId
      ? manualSelection
      : null;
    const previousIndex = currentManualSelection?.index
      ?? dailyMotivationIndex(category, userId, currentDate);
    const stride = currentManualSelection?.stride ?? randomMotivationStride(poolSize);
    setToday(currentDate);
    setManualSelection({
      date: currentDate,
      userId,
      sectionId,
      index: nextMotivationIndex(previousIndex, stride, poolSize),
      stride,
    });
  };

  return (
    <section className="mx-auto box-border w-full min-w-0 max-w-[100vw] px-4 pt-4 font-sans sm:px-8 sm:pt-6 lg:px-12" data-testid={`section-info-card-${sectionId}`}>
      <div
        className="box-border w-full min-w-0 max-w-full overflow-hidden rounded-[24px] border bg-card shadow-sm"
        style={{
          backgroundImage: `linear-gradient(125deg, ${section.accent}22 0%, hsl(var(--card)) 55%, ${section.accent}12 100%)`,
          borderColor: `${section.accent}48`,
        }}
      >
        <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-6">
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{guideHeading}</p>
            <h2 className="mt-0.5 break-words font-sans text-[22px] leading-tight text-foreground [overflow-wrap:anywhere] sm:text-[25px]">{translateUiText(section.title, language)}</h2>
            {!expanded && <p className="mt-0.5 break-words text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{translateUiText(section.eyebrow, language)}</p>}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border/80 bg-background/55 px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            data-testid={`button-toggle-section-info-${sectionId}`}
          >
            <span className="hidden sm:inline">{expanded ? sectionCardControls[language].collapse : sectionCardControls[language].expand}</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div
          id={panelId}
          className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          aria-hidden={!expanded}
        >
          <div className="overflow-hidden">
            <div className={`grid min-w-0 gap-4 px-4 pb-4 transition-[opacity,transform] duration-300 ease-out sm:px-6 sm:pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.95fr)] ${expanded ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}>
              <article
                className="flex min-h-[320px] min-w-0 max-w-full flex-col justify-between rounded-[20px] border border-border/50 bg-background/40 p-4 sm:p-5"
                aria-live="polite"
                data-testid={`card-daily-section-guide-${sectionId}`}
              >
                <div className="min-w-0">
                  <p
                    className="min-w-0 break-words font-sans text-[clamp(1.2rem,1.7vw,1.55rem)] leading-[1.3] tracking-[-0.015em] text-foreground [overflow-wrap:anywhere]"
                    data-testid={`text-daily-section-guide-${sectionId}`}
                  >
                    {dailyGuide.intro}
                  </p>
                  <div className="mt-6">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {sectionGuideBenefitsHeading[language]}
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {dailyGuide.benefits.map((benefit, index) => (
                        <li key={`${dailyGuideIndex}-${index}`} className="flex min-w-0 items-start gap-2.5">
                          <span
                            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full"
                            style={{ color: section.accent, backgroundColor: `${section.accent}20` }}
                            aria-hidden="true"
                          >
                            <Check size={13} strokeWidth={2.4} />
                          </span>
                          <span className="min-w-0 break-words text-[13px] leading-relaxed text-foreground/85 [overflow-wrap:anywhere]">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="border-t border-border/60 pt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                  {translateUiText(section.title, language)} {sectionGuideFooterLabel[language]} · {dailyGuideIndex + 1}/{SECTION_DAILY_GUIDE_POOL_SIZE}
                </p>
              </article>

              <article
                className="relative flex min-h-[320px] w-full min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-[20px] border p-4 sm:min-h-[340px] sm:p-5"
                style={{
                  backgroundImage: `linear-gradient(145deg, ${section.accent}2b 0%, hsl(var(--background) / 0.72) 72%, ${section.accent}20 100%)`,
                  borderColor: `${section.accent}55`,
                }}
                data-testid={`card-daily-motivation-${sectionId}`}
                aria-live="polite"
              >
                <div className="relative">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{translateUiText("Bugungi motivatsiya", language)}</p>
                </div>
                <div className="relative flex min-h-[220px] min-w-0 flex-1 flex-col justify-center py-5" key={`${today}-${sectionId}-${currentIndex}`}>
                  <p className="min-w-0 max-w-full break-words font-sans text-[clamp(1.45rem,2.35vw,1.9rem)] leading-[1.13] tracking-[-0.025em] text-foreground [overflow-wrap:anywhere] sm:max-w-[38rem]" data-testid={`text-daily-quote-${sectionId}`}>
                    “{currentEntry.text}”
                  </p>
                  <p className="mt-4 min-w-0 break-words font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [overflow-wrap:anywhere]">
                    {translateUiText(section.motivationLabel, language)} · {currentIndex + 1}/{poolSize}
                  </p>
                </div>
                <div className="relative mt-5 flex min-w-0 items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    {translateUiText(section.eyebrow, language)}
                  </span>
                  <button
                    type="button"
                    onClick={showNextQuote}
                    disabled={!expanded}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-background"
                    aria-label={sectionCardControls[language].nextQuoteAriaLabel}
                    data-testid={`button-next-daily-quote-${sectionId}`}
                  >
                    <RefreshCw size={13} />
                    <span>{sectionCardControls[language].nextQuote}</span>
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