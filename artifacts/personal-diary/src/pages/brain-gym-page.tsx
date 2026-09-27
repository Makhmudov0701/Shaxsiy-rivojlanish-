import { Brain } from 'lucide-react';
import { BrainKnowledgeHub } from '@/pages/brain-knowledge-hub';
import { useI18n } from '@/lib/i18n';
import { ModulePageFrame, UserStoragePage } from '@/pages/local-module-pages';

export { BRAIN_GYM_FACT_IDS } from '@/pages/brain-gym-content';

const pageCopy = {
  uz: {
    eyebrow: 'Xotira va miya',
    title: 'Bilim va foydali maslahatlar',
    description: 'Xotira, diqqat va miya salomatligi uchun ilmga asoslangan kundalik g‘oyalarni kashf eting.',
  },
  en: {
    eyebrow: 'Memory & brain',
    title: 'Knowledge & practical tips',
    description: 'Explore evidence-informed daily ideas for memory, focus, and cognitive health.',
  },
  ru: {
    eyebrow: 'Память и мозг',
    title: 'Знания и практические советы',
    description: 'Изучайте научно обоснованные идеи для памяти, внимания и здоровья мозга.',
  },
  ko: {
    eyebrow: '기억과 뇌',
    title: '지식과 실용적인 팁',
    description: '기억력, 집중력과 인지 건강을 위한 근거 기반의 일상 아이디어를 만나 보세요.',
  },
} as const;

export function BrainGymPage() {
  const { language } = useI18n();
  const copy = pageCopy[language];

  return (
    <UserStoragePage>
      {(userId) => (
        <ModulePageFrame
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={copy.description}
          icon={<Brain size={22} strokeWidth={1.7} />}
        >
          <BrainKnowledgeHub key={userId} userId={userId} language={language} />
        </ModulePageFrame>
      )}
    </UserStoragePage>
  );
}

export default BrainGymPage;