import { useUser } from '@clerk/react';
import { Link } from 'wouter';
import { CalendarCheck2, ChevronLeft, LockKeyhole } from 'lucide-react';
import { DiaryShell } from '@/components/diary-ui';
import { HabitTracker } from '@/components/diary-modules';
import { PrivateVault } from '@/components/private-vault';
import { personalDevelopmentBackLabel, useI18n } from '@/lib/i18n';
import { getVaultCopy } from '@/lib/vault-i18n';

export function ModulePageFrame({
  eyebrow,
  title,
  description,
  icon,
  backLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  backLabel?: string;
  children: React.ReactNode;
}) {
  const { language } = useI18n();
  return (
    <DiaryShell>
      <div className="mx-auto max-w-[1120px] px-4 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-10">
        <Link href="/user-portal" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" data-testid="link-module-back">
          <ChevronLeft size={17} /> {backLabel ?? personalDevelopmentBackLabel(language)}
        </Link>
        <div className="mt-6 flex items-start gap-3 sm:gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7def0] text-[#5b3f69] dark:bg-[#3b3044] dark:text-[#d8bce2]">{icon}</span>
          <div>
            <p className="text-[12px] font-semibold text-[#9a6b23]">{eyebrow}</p>
            <h1 className="mt-1 font-serif text-[clamp(2.35rem,5vw,4.25rem)] leading-[.96] tracking-[-.045em]">{title}<span className="text-[#a66a13]">.</span></h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </DiaryShell>
  );
}

export function UserStoragePage({ children }: { children: (userId: string) => React.ReactNode }) {
  const { isLoaded, user } = useUser();
  if (!isLoaded || !user) {
    return <DiaryShell><div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8"><div className="skeleton h-8 w-48 rounded-xl" /><div className="skeleton mt-8 h-72 rounded-[26px]" /></div></DiaryShell>;
  }
  return <>{children(user.id)}</>;
}

export function HabitsPage() {
  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame
          eyebrow="Kundalik ritm"
          title="Odatlar"
          description="Har kuni kichik bir qadamni belgilab, o‘zingizga bergan va’dalaringizni sokin kuzating."
          icon={<CalendarCheck2 size={22} strokeWidth={1.7} />}
        >
          <HabitTracker storageKey={`kundalik-odatlar-${userId}`} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}

export function VaultPage() {
  const { language } = useI18n();
  const copy = getVaultCopy(language);
  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          icon={<LockKeyhole size={22} strokeWidth={1.7} />}
          backLabel={copy.back}
        >
          <PrivateVault key={userId} storageKey={`kundalik-maxfiy-jild-${userId}`} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}