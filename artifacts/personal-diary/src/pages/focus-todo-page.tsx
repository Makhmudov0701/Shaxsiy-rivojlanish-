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
        <div className="min-h-[100dvh] w-full px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
          <div className="skeleton h-8 w-52 rounded-xl" />
          <div className="skeleton mt-8 min-h-[620px] rounded-[28px]" />
        </div>
      </DiaryShell>
    );
  }

  return (
    <DiaryShell>
      <div className="min-h-[100dvh] w-full">
        <div className="flex min-h-12 items-center justify-between gap-4 border-b border-[#d8d1bd] bg-[#f2efe5] px-5 py-2 dark:border-[#41453d] dark:bg-[#1d211e] sm:px-8 lg:px-12">
          <Link href="/user-portal" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-focus-back">
            <ChevronLeft size={15} /> Kundalikka qaytish
          </Link>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="grid size-7 place-items-center rounded-lg bg-[#e2eee7] text-[#47796c]"><TimerReset size={14} /></span>
            <span className="hidden sm:inline">Shaxsiy diqqat vaqti</span>
          </div>
        </div>
        <div>
          <FocusTodoWorkspace storageKey={`kundalik-focus-todo-${user.id}`} />
        </div>
      </div>
    </DiaryShell>
  );
}