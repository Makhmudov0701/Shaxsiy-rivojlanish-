import { useUser } from '@clerk/react';
import { ChevronLeft, TimerReset } from 'lucide-react';
import { Link } from 'wouter';
import { DiaryShell } from '@/components/diary-ui';
import { FocusTodoWorkspace } from '@/components/focus-todo-module';

export function FocusTodoPage() {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) {
    return (
      <DiaryShell>
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 lg:px-14">
          <div className="skeleton h-8 w-52 rounded-xl" />
          <div className="skeleton mt-8 h-[520px] rounded-[30px]" />
        </div>
      </DiaryShell>
    );
  }

  return (
    <DiaryShell>
      <div className="mx-auto max-w-[1260px] px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-12">
        <Link href="/user-portal" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-focus-back">
          <ChevronLeft size={15} /> Kundalikka qaytish
        </Link>
        <div className="mt-8 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-[#e2eee7] text-[#47796c]"><TimerReset size={17} /></span>
          <span>Shaxsiy diqqat vaqti</span>
        </div>
        <div className="mt-8">
          <FocusTodoWorkspace storageKey={`kundalik-focus-todo-${user.id}`} />
        </div>
      </div>
    </DiaryShell>
  );
}