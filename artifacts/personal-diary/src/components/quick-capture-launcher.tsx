import { useEffect, useState } from 'react';
import { useUser } from '@clerk/react';
import { Lightbulb, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { QuickCaptureDialog, type QuickCaptureCopy } from '@/components/quick-capture-dialog';
import { useLocalModuleStorage } from '@/lib/local-module-storage';
import { EMPTY_IDEAS, isQuickIdeaList, userStorageKey } from '@/lib/local-life-data';
import { useI18n, type AppLanguage } from '@/lib/i18n';

const launcherCopy: Record<AppLanguage, QuickCaptureCopy & {
  launcher: string;
  saved: string;
  inbox: string;
  storageName: string;
}> = {
  uz: {
    title: 'Tezkor qayd',
    description: 'Xayolingizdagi fikrni hozir qoldiring — u g‘oyalar qutingizga saqlanadi.',
    textLabel: 'Fikr yoki qayd',
    textPlaceholder: 'Bir necha so‘z bilan yozing...',
    tagsLabel: 'Teglar',
    tagsPlaceholder: 'ish, reja, ilhom',
    save: 'Qutiga saqlash',
    cancel: 'Bekor qilish',
    requiredText: 'Fikr matnini kiriting.',
    saveError: 'Qaydni saqlab bo‘lmadi. Brauzer xotirasini tekshiring va qayta urinib ko‘ring.',
    launcher: 'Tez qayd',
    saved: 'G‘oya qutiga saqlandi.',
    inbox: 'G‘oyalar qutisini ochish',
    storageName: 'G‘oyalar',
  },
  en: {
    title: 'Quick capture',
    description: 'Save the thought now and sort it into your Inbox when you are ready.',
    textLabel: 'Thought or note',
    textPlaceholder: 'Write a few words...',
    tagsLabel: 'Tags',
    tagsPlaceholder: 'work, plan, inspiration',
    save: 'Save to Inbox',
    cancel: 'Cancel',
    requiredText: 'Enter a thought before saving.',
    saveError: 'Could not save the note. Check browser storage and try again.',
    launcher: 'Quick capture',
    saved: 'Saved to your Inbox.',
    inbox: 'Open Inbox',
    storageName: 'Ideas',
  },
  ru: {
    title: 'Быстрая заметка',
    description: 'Сохраните мысль сейчас, а разберите её во входящих, когда будет удобно.',
    textLabel: 'Мысль или заметка',
    textPlaceholder: 'Запишите несколько слов...',
    tagsLabel: 'Теги',
    tagsPlaceholder: 'работа, план, идея',
    save: 'Сохранить во входящие',
    cancel: 'Отмена',
    requiredText: 'Введите мысль перед сохранением.',
    saveError: 'Не удалось сохранить заметку. Проверьте хранилище браузера и повторите попытку.',
    launcher: 'Быстрая заметка',
    saved: 'Сохранено во входящие.',
    inbox: 'Открыть входящие',
    storageName: 'Идеи',
  },
  ko: {
    title: '빠른 기록',
    description: '생각을 지금 저장하고, 나중에 받은 편지함에서 정리하세요.',
    textLabel: '생각 또는 메모',
    textPlaceholder: '짧게 적어 두세요...',
    tagsLabel: '태그',
    tagsPlaceholder: '업무, 계획, 아이디어',
    save: '받은 편지함에 저장',
    cancel: '취소',
    requiredText: '저장할 내용을 입력하세요.',
    saveError: '메모를 저장하지 못했습니다. 브라우저 저장 공간을 확인하고 다시 시도하세요.',
    launcher: '빠른 기록',
    saved: '받은 편지함에 저장했습니다.',
    inbox: '받은 편지함 열기',
    storageName: '아이디어',
  },
};

function QuickCaptureForUser({ userId, language }: { userId: string; language: AppLanguage }) {
  const copy = launcherCopy[language];
  const store = useLocalModuleStorage(userStorageKey('ideas', userId), EMPTY_IDEAS, isQuickIdeaList, copy.storageName);
  const [open, setOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!showSaved) return undefined;
    const timer = window.setTimeout(() => setShowSaved(false), 4200);
    return () => window.clearTimeout(timer);
  }, [showSaved]);

  const openDialog = () => {
    setOpen(true);
  };

  const saveIdea = (input: { text: string; tags: string[] }) => {
    if (store.status !== 'ready') {
      return false;
    }
    const now = new Date().toISOString();
    const saved = store.save([{
      id: crypto.randomUUID(),
      text: input.text.slice(0, 3000),
      tags: input.tags.slice(0, 8),
      createdAt: now,
      updatedAt: now,
    }, ...store.value]);
    if (!saved) {
      return false;
    }
    setShowSaved(true);
    return true;
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={store.status !== 'ready'}
        aria-label={copy.launcher}
        title={copy.launcher}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#30243f] px-4 text-[12px] font-semibold text-[#fbf7ef] shadow-[0_10px_28px_rgba(48,36,63,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-[#463556] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b89c5c] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:bottom-6 sm:right-6"
        data-testid="button-global-quick-capture"
      >
        <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
        <span>{copy.launcher}</span>
      </button>
      {store.status === 'error' && (
        <div className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] right-4 z-40 max-w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-destructive/30 bg-card px-3 py-2 text-[11px] text-destructive shadow-lg sm:bottom-20 sm:right-6" role="alert" data-testid="status-quick-capture-storage-error">
          {store.error}
        </div>
      )}
      {showSaved && (
        <div className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] right-4 z-40 flex max-w-[min(22rem,calc(100vw-2rem))] items-center gap-2 rounded-xl border border-[#c3ddcf] bg-[#edf6f0] px-3 py-2 text-[11px] text-[#35614f] shadow-lg sm:bottom-20 sm:right-6" role="status" data-testid="status-quick-capture-saved">
          <span>{copy.saved}</span>
          <Link href="/ideas" className="inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2">
            <Lightbulb size={13} aria-hidden="true" />
            {copy.inbox}
          </Link>
        </div>
      )}
      <QuickCaptureDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={saveIdea}
        copy={copy}
      />
    </>
  );
}

export function QuickCaptureLauncher() {
  const { user } = useUser();
  const { language } = useI18n();
  if (!user?.id) return null;
  return <QuickCaptureForUser userId={user.id} language={language} />;
}