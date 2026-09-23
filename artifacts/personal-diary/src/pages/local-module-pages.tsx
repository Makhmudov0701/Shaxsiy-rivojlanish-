import { useUser } from '@clerk/react';
import { Link } from 'wouter';
import { CalendarCheck2, ChevronLeft, LockKeyhole } from 'lucide-react';
import { DiaryShell } from '@/components/diary-ui';
import { HabitTracker, PrivateVault } from '@/components/diary-modules';

function ModulePageFrame({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DiaryShell>
      <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-12">
        <Link href="/user-portal" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-module-back">
          <ChevronLeft size={15} /> Kundalikka qaytish
        </Link>
        <div className="mt-9 flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e7def0] text-[#5b3f69] dark:bg-[#3b3044] dark:text-[#d8bce2]">{icon}</span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#9a6b23]">{eyebrow}</p>
            <h1 className="mt-2 font-serif text-[clamp(3rem,6vw,5.8rem)] leading-[.9] tracking-[-.05em]">{title}<span className="text-[#a66a13]">.</span></h1>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </DiaryShell>
  );
}

function UserStoragePage({ children }: { children: (userId: string) => React.ReactNode }) {
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
  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame
          eyebrow="Alohida himoya"
          title="Maxfiy jild"
          description="Oddiy kundalikdan alohida, faqat o‘zingiz biladigan kod bilan ochiladigan shaxsiy sahifalar."
          icon={<LockKeyhole size={22} strokeWidth={1.7} />}
        >
          <PrivateVault storageKey={`kundalik-maxfiy-jild-${userId}`} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}