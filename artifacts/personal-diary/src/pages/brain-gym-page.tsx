import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Brain,
  Check,
  ChevronDown,
  Clock3,
  Dumbbell,
  Eye,
  Footprints,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  TimerReset,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { ModulePageFrame, UserStoragePage } from '@/pages/local-module-pages';
import { useI18n, type AppLanguage } from '@/lib/i18n';
import { localDateKey } from '@/lib/date-utils';
import { BRAIN_GYM_FACT_IDS } from '@/pages/brain-gym-content';
import {
  addDaysToDateKey,
  useBrainGymProgress,
  type BrainGymCompletion,
  type BrainGymProgress,
  type BrainGymRecallItem,
  type RecallInterval,
} from '@/lib/brain-gym-progress';

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  back: string;
  science: string;
  scienceIntro: string;
  saveFact: string;
  saved: string;
  savedFacts: string;
  guide: string;
  practice: string;
  gentleNote: string;
  storage: string;
  storageError: string;
  loading: string;
  retry: string;
  error: string;
  noDue: string;
  noDueDescription: string;
  dueToday: string;
  start: string;
  next: string;
  finish: string;
  reset: string;
  score: string;
  of: string;
  reveal: string;
  remembered: string;
  missed: string;
  question: string;
  yourAnswer: string;
  sequencePlaceholder: string;
  submit: string;
  typeStory: string;
  completeRound: string;
  storyRequired: string;
  tipLabel: string;
  sources: string;
  positionResult: string;
  timerDone: string;
  reviewed: string;
  rounds: string;
  noStorySaved: string;
  privatePractice: string;
  matrixTitle: string;
  wordChainTitle: string;
  spacedRecallTitle: string;
  seconds: string;
  lookClosely: string;
  sourceSpacing: string;
  sourceRetrieval: string;
  sourceSleep: string;
  sourceTransfer: string;
  educationDisclaimer: string;
  tipGuidance: string;
  practiceResult: string;
  practiceComplete: string;
  countdownLabel: string;
  phaseShowing: string;
  phaseAnswer: string;
  phaseReview: string;
  phaseExpired: string;
};

const copy: Record<AppLanguage, Copy> = {
  uz: {
    eyebrow: 'Sokin mashq xonasi',
    title: 'Xotira va Miya Mashqlari',
    description: 'Xotira qanday ishlashini bilib oling, keyin uni bosimsiz, qisqa mashqlar bilan sinab ko‘ring.',
    back: 'Kundalikka qaytish',
    science: 'Ilmiy javon',
    scienceIntro: 'Yaxshi xotira tug‘ma sir emas. U e’tibor, vaqt va qayta chaqirish bilan asta-sekin quriladi.',
    saveFact: 'Keyin eslash uchun saqlash',
    saved: 'Saqlangan',
    savedFacts: 'Saqlangan faktlar',
    guide: 'Usul yo‘riqnomalari',
    practice: 'Bugungi amaliyot',
    gentleNote: 'Bu musobaqa emas. Bugungi kichik urinish ham yetarli.',
    storage: 'Natijalar faqat shu brauzerda, sizning kundaligingiz uchun saqlanadi.',
    storageError: 'Xotira mashqlari ma’lumotlarini o‘qib bo‘lmadi. Brauzer xotirasini tekshiring.',
    loading: 'Mashqlar yuklanmoqda',
    retry: 'Qayta urinish',
    error: 'Saqlashda xatolik yuz berdi. Keyinroq urinib ko‘ring.',
    noDue: 'Bugun uchun fakt yo‘q',
    noDueDescription: 'Ilmiy javondan bir faktni saqlang. U ertaga muloyimlik bilan qaytib keladi.',
    dueToday: 'Bugun eslash vaqti',
    start: 'Boshlash',
    next: 'Keyingi',
    finish: 'Yakunlash',
    reset: 'Qayta boshlash',
    score: 'Natija',
    of: 'dan',
    reveal: 'Javobni ko‘rsatish',
    remembered: 'Esladim',
    missed: 'Hali eslay olmadim',
    question: 'Savol',
    yourAnswer: 'Javobingiz',
    sequencePlaceholder: '9 ta raqamni ketma-ket kiriting',
    submit: 'Tekshirish',
    typeStory: 'To‘rtta so‘zni tartib bilan bog‘laydigan jonli hikoya yozing',
    completeRound: 'Raundni yakunlash',
    storyRequired: 'Hikoya qisqa bo‘lsa ham yozing.',
    tipLabel: 'Bugungi kichik qadam',
    sources: 'Manbalar',
    positionResult: 'Pozitsiyalar bo‘yicha moslik',
    timerDone: 'Ikki daqiqa tugadi. Tugallanmagan faktlar bajarilgan deb belgilanmadi.',
    reviewed: 'ta fakt ko‘rib chiqildi',
    rounds: 'raund',
    noStorySaved: 'Hikoya saqlanmaydi — u faqat shu mashq davomida sizniki.',
    privatePractice: 'shaxsiy mashq',
    matrixTitle: 'Raqamlar matritsasi',
    wordChainTitle: 'So‘zlar zanjiri',
    spacedRecallTitle: 'Oraliqli qayta chaqirish',
    seconds: 'soniya',
    lookClosely: 'Diqqat bilan qarang',
    sourceSpacing: 'oraliqli mashq',
    sourceRetrieval: 'qayta chaqirish',
    sourceSleep: 'uyqu',
    sourceTransfer: 'ko‘chish ehtiyotkorligi',
    educationDisclaimer: 'Bu bo‘lim ta’limiy va muloyim mashq uchun. Natijalar diagnostika emas va tibbiy baho o‘rnini bosmaydi.',
    tipGuidance: 'Amaliy yo‘l-yo‘riq, eksperimental xulosa emas',
    practiceResult: 'Mashq mosligi',
    practiceComplete: 'Mashq bajarildi',
    countdownLabel: 'Qolgan vaqt',
    phaseShowing: 'Raqamlar ko‘rsatilmoqda',
    phaseAnswer: 'Javobni kiriting',
    phaseReview: 'Javoblar ko‘rib chiqilmoqda',
    phaseExpired: 'Vaqt tugadi',
  },
  en: {
    eyebrow: 'A quiet practice room',
    title: 'Memory & Brain Gym',
    description: 'Learn how memory works, then try short, low-pressure exercises that leave room for curiosity.',
    back: 'Back to diary',
    science: 'The science shelf',
    scienceIntro: 'A strong memory is not a secret gift. It is built slowly with attention, time, and retrieval.',
    saveFact: 'Save for later recall',
    saved: 'Saved',
    savedFacts: 'Saved facts',
    guide: 'Method guides',
    practice: 'Today’s practice',
    gentleNote: 'This is not a competition. A small attempt is enough for today.',
    storage: 'Results stay in this browser, scoped to your diary.',
    storageError: 'Memory gym data could not be loaded. Check your browser storage.',
    loading: 'Loading your practice',
    retry: 'Try again',
    error: 'Could not save this change. Please try again.',
    noDue: 'Nothing due today',
    noDueDescription: 'Save a fact from the science shelf. It will return gently tomorrow.',
    dueToday: 'Ready to recall',
    start: 'Begin',
    next: 'Next',
    finish: 'Finish',
    reset: 'Start over',
    score: 'Score',
    of: 'of',
    reveal: 'Reveal answer',
    remembered: 'I remembered',
    missed: 'Not yet',
    question: 'Question',
    yourAnswer: 'Your answer',
    sequencePlaceholder: 'Enter the 9 digits in order',
    submit: 'Check sequence',
    typeStory: 'Write a vivid story that links all four words in order',
    completeRound: 'Complete round',
    storyRequired: 'Write even a very short story first.',
    tipLabel: 'A small step for today',
    sources: 'References',
    positionResult: 'Position-by-position match',
    timerDone: 'Two minutes are up. Unreviewed facts were not marked complete.',
    reviewed: 'facts reviewed',
    rounds: 'round',
    noStorySaved: 'The story is not saved — it belongs only to this practice round.',
    privatePractice: 'private practice',
    matrixTitle: 'Number memory matrix',
    wordChainTitle: 'Word association chain',
    spacedRecallTitle: 'Spaced recall',
    seconds: 'sec',
    lookClosely: 'Look closely',
    sourceSpacing: 'spacing',
    sourceRetrieval: 'retrieval',
    sourceSleep: 'sleep',
    sourceTransfer: 'transfer caveat',
    educationDisclaimer: 'This space is for education and gentle practice. Results are not diagnostic and do not replace medical evaluation.',
    tipGuidance: 'Practical guidance, not an experimental finding',
    practiceResult: 'Practice match',
    practiceComplete: 'Practice complete',
    countdownLabel: 'Time remaining',
    phaseShowing: 'Numbers are showing',
    phaseAnswer: 'Enter your answer',
    phaseReview: 'Reviewing answers',
    phaseExpired: 'Time expired',
  },
  ru: {
    eyebrow: 'Тихая комната практики',
    title: 'Гимнастика памяти',
    description: 'Узнайте, как работает память, и попробуйте короткие упражнения без давления и соревнования.',
    back: 'Вернуться в дневник',
    science: 'Научная полка',
    scienceIntro: 'Хорошая память не тайный дар. Она постепенно строится вниманием, временем и извлечением.',
    saveFact: 'Сохранить для повторения',
    saved: 'Сохранено',
    savedFacts: 'Сохранённые факты',
    guide: 'Инструкции к методам',
    practice: 'Сегодняшняя практика',
    gentleNote: 'Это не соревнование. Маленькой попытки на сегодня достаточно.',
    storage: 'Результаты хранятся только в этом браузере и относятся к вашему дневнику.',
    storageError: 'Не удалось загрузить данные гимнастики памяти. Проверьте хранилище браузера.',
    loading: 'Загрузка практики',
    retry: 'Повторить',
    error: 'Не удалось сохранить изменение. Попробуйте ещё раз.',
    noDue: 'На сегодня ничего нет',
    noDueDescription: 'Сохраните факт на научной полке. Завтра он спокойно вернётся.',
    dueToday: 'Время вспомнить',
    start: 'Начать',
    next: 'Далее',
    finish: 'Завершить',
    reset: 'Начать заново',
    score: 'Результат',
    of: 'из',
    reveal: 'Показать ответ',
    remembered: 'Вспомнил(а)',
    missed: 'Пока не вспомнил(а)',
    question: 'Вопрос',
    yourAnswer: 'Ваш ответ',
    sequencePlaceholder: 'Введите 9 цифр по порядку',
    submit: 'Проверить',
    typeStory: 'Напишите яркую историю, которая по порядку свяжет все четыре слова',
    completeRound: 'Завершить раунд',
    storyRequired: 'Сначала напишите хотя бы короткую историю.',
    tipLabel: 'Маленький шаг на сегодня',
    sources: 'Источники',
    positionResult: 'Совпадение по позициям',
    timerDone: 'Две минуты закончились. Непросмотренные факты не отмечены выполненными.',
    reviewed: 'фактов просмотрено',
    rounds: 'раунд',
    noStorySaved: 'История не сохраняется — она принадлежит только этому раунду.',
    privatePractice: 'личная практика',
    matrixTitle: 'Матрица чисел',
    wordChainTitle: 'Цепочка слов',
    spacedRecallTitle: 'Интервальное повторение',
    seconds: 'сек.',
    lookClosely: 'Смотрите внимательно',
    sourceSpacing: 'интервалы',
    sourceRetrieval: 'извлечение',
    sourceSleep: 'сон',
    sourceTransfer: 'оговорка о переносе',
    educationDisclaimer: 'Этот раздел создан для обучения и мягкой практики. Результаты не являются диагностикой и не заменяют медицинскую оценку.',
    tipGuidance: 'Практическая рекомендация, а не экспериментальный вывод',
    practiceResult: 'Совпадение в практике',
    practiceComplete: 'Практика завершена',
    countdownLabel: 'Осталось времени',
    phaseShowing: 'Числа показаны',
    phaseAnswer: 'Введите ответ',
    phaseReview: 'Проверка ответа',
    phaseExpired: 'Время вышло',
  },
  ko: {
    eyebrow: '조용한 연습방',
    title: '기억 체육관',
    description: '기억이 작동하는 방식을 알아보고, 부담 없이 호기심으로 짧은 연습을 해보세요.',
    back: '일기로 돌아가기',
    science: '과학 서가',
    scienceIntro: '좋은 기억력은 비밀스러운 재능이 아닙니다. 주의, 시간, 인출 연습으로 천천히 만들어집니다.',
    saveFact: '나중에 회상하도록 저장',
    saved: '저장됨',
    savedFacts: '저장한 사실',
    guide: '방법 안내',
    practice: '오늘의 연습',
    gentleNote: '경쟁이 아닙니다. 오늘은 작은 시도만으로 충분합니다.',
    storage: '결과는 이 브라우저에만, 내 일기 범위로 저장됩니다.',
    storageError: '기억 체육관 데이터를 불러오지 못했습니다. 브라우저 저장 공간을 확인하세요.',
    loading: '연습을 불러오는 중',
    retry: '다시 시도',
    error: '변경 사항을 저장하지 못했습니다. 다시 시도해 주세요.',
    noDue: '오늘 복습할 내용이 없습니다',
    noDueDescription: '과학 서가에서 사실을 저장해 보세요. 내일 차분히 돌아옵니다.',
    dueToday: '회상할 시간',
    start: '시작',
    next: '다음',
    finish: '완료',
    reset: '다시 시작',
    score: '점수',
    of: '/',
    reveal: '답 보기',
    remembered: '기억했어요',
    missed: '아직 떠오르지 않아요',
    question: '질문',
    yourAnswer: '내 답',
    sequencePlaceholder: '9개의 숫자를 순서대로 입력',
    submit: '순서 확인',
    typeStory: '네 단어를 순서대로 연결하는 생생한 이야기를 써보세요',
    completeRound: '라운드 완료',
    storyRequired: '아주 짧아도 먼저 이야기를 써주세요.',
    tipLabel: '오늘의 작은 한 걸음',
    sources: '참고 문헌',
    positionResult: '위치별 일치',
    timerDone: '2분이 지났습니다. 확인하지 않은 사실은 완료로 표시하지 않았습니다.',
    reviewed: '개 사실을 복습함',
    rounds: '라운드',
    noStorySaved: '이야기는 저장되지 않습니다. 이 연습 라운드 안에서만 남습니다.',
    privatePractice: '개인 연습',
    matrixTitle: '숫자 기억 매트릭스',
    wordChainTitle: '단어 연결 고리',
    spacedRecallTitle: '간격 회상',
    seconds: '초',
    lookClosely: '집중해서 보세요',
    sourceSpacing: '간격 연습',
    sourceRetrieval: '회상',
    sourceSleep: '수면',
    sourceTransfer: '전이 주의',
    educationDisclaimer: '이 공간은 교육과 부담 없는 연습을 위한 곳입니다. 결과는 진단이 아니며 의료 평가를 대신하지 않습니다.',
    tipGuidance: '실용적인 안내이며 실험적 결론이 아닙니다',
    practiceResult: '연습 일치도',
    practiceComplete: '연습 완료',
    countdownLabel: '남은 시간',
    phaseShowing: '숫자를 보여주는 중',
    phaseAnswer: '답을 입력하세요',
    phaseReview: '답을 확인하는 중',
    phaseExpired: '시간이 끝났습니다',
  },
};

type Fact = { id: string; title: string; body: string; question: string; answer: string; citation: string };
type Guide = { title: string; intro: string; steps: string[] };

export { BRAIN_GYM_FACT_IDS };

const facts: Record<AppLanguage, Fact[]> = {
  uz: [
    { id: 'spaced-practice', title: 'Oraliqli mashq', body: 'Bir necha qisqa seansni vaqt oralatib qilish, bir martalik uzoq o‘qishdan ko‘ra uzoq muddatli eslab qolishga ko‘proq yordam berishi mumkin.', question: 'Oraliqli mashq nimaga yordam berishi mumkin?', answer: 'Vaqt oralatib qilingan qisqa seanslar uzoq muddatli eslab qolishga yordam berishi mumkin.', citation: 'Cepeda va boshq. (2006), doi:10.1037/0033-2909.132.3.354' },
    { id: 'forgetting-curve', title: 'Unutish egri chizig‘i', body: 'Ebbinghaus kuzatuvi qo‘pol umumiy naqshni ko‘rsatadi: yangi ma’lumot boshida tezroq xiralashadi, keyingi qayta chaqirishlar esa uni mustahkamlaydi. Bu siz uchun aniq taymer emas.', question: 'Unutish egri chizig‘i nimani ko‘rsatadi?', answer: 'Yangi ma’lumot boshida tezroq xiralashishi, qayta chaqirish esa uni mustahkamlashi mumkin; bu shaxsiy aniq taymer emas.', citation: 'Ebbinghaus (1885)' },
    { id: 'active-recall', title: 'Faol qayta chaqirish', body: 'Matnni qayta o‘qish o‘rniga kitobni yopib, javobni o‘zingizdan so‘rash xotira izini mustahkamlashi mumkin.', question: 'Faol qayta chaqirish qanday mashq?', answer: 'Matnni yopib, javobni o‘zingizdan so‘rash va uni xotiradan aytish.', citation: 'Roediger & Karpicke (2006), doi:10.1111/j.1467-9280.2006.01693.x' },
    { id: 'neuroplasticity', title: 'Neyroplastiklik', body: 'Mashq va tajriba miya tarmoqlarining moslashishiga hissa qo‘shadi. O‘zgarish odatda kichik, izchil urinishlar bilan keladi.', question: 'Neyroplastiklikni bu yerda qanday tushunamiz?', answer: 'Tajriba va mashq miya tarmoqlarining moslashishiga hissa qo‘shishi mumkin.', citation: 'Kleim & Jones (2008), doi:10.1044/1092-4388(2008/018)' },
    { id: 'sleep', title: 'Uyqu va mustahkamlash', body: 'Uyqu yangi o‘rganilgan xotiralarni qayta ishlash va mustahkamlashga yordam beradigan jarayonlar bilan bog‘liq.', question: 'Uyqu xotira bilan qanday bog‘liq?', answer: 'Uyqu yangi o‘rganilgan xotiralarni qayta ishlash va mustahkamlash jarayonlari bilan bog‘liq.', citation: 'Rasch & Born (2013), doi:10.1152/physrev.00032.2012' },
    { id: 'chunking', title: 'Bo‘laklash', body: 'Uzun qatorni mazmunli kichik guruhlarga ajratish ishchi xotiraga tushadigan yukni yengillashtirishi mumkin.', question: 'Bo‘laklash nima qiladi?', answer: 'Uzun qatorni mazmunli kichik guruhlarga ajratib, ishchi xotira yukini yengillashtirishi mumkin.', citation: 'Gobet va boshq. (2001), doi:10.1016/S1364-6613(00)01662-4' },
    { id: 'movement', title: 'Harakat va idrok', body: 'Katta yoshdagilar ishtirokidagi bir tadqiqotda aerob faollik gippokamp hajmi va fazoviy xotira ko‘rsatkichlaridagi o‘zgarishlar bilan bog‘langan; bu hamma uchun kafolat emas.', question: 'Harakat haqidagi tadqiqotda nimaga e’tibor berish kerak?', answer: 'Bir tadqiqot katta yoshdagilarda aerob faollikni gippokamp va fazoviy xotira ko‘rsatkichlari bilan bog‘lagan, ammo natija hamma uchun kafolat emas.', citation: 'Erickson va boshq. (2011), doi:10.1073/pnas.1015950108' },
    { id: 'dual-n-back', title: 'Dual n-back', body: 'Bu mashqda tovush va joylashuv ketma-ketligi kuzatiladi. Mashq qilingan vazifada o‘sish ko‘rinishi mumkin, ammo umumiy aqlga uzoq ko‘chish dalillari aralash va bahsli.', question: 'Dual n-back haqida muhim ehtiyotkorlik nima?', answer: 'Mashq qilingan vazifada natija yaxshilanishi mumkin, ammo umumiy aqlga uzoq ko‘chish dalillari aralash va bahsli.', citation: 'Jaeggi va boshq. (2008), doi:10.1073/pnas.0801268105; Simons va boshq. (2016), doi:10.1177/1529100616661983' },
  ],
  en: [
    { id: 'spaced-practice', title: 'Spaced practice', body: 'Several short sessions separated by time can support long-term retention better than one long cram session.', question: 'What can spaced practice support?', answer: 'Short sessions separated by time can support long-term retention.', citation: 'Cepeda et al. (2006), doi:10.1037/0033-2909.132.3.354' },
    { id: 'forgetting-curve', title: 'The forgetting curve', body: 'Ebbinghaus described a rough pattern: new material often fades quickly at first, while later retrievals strengthen it. It is not an exact timer for you.', question: 'What does the forgetting curve describe?', answer: 'New material may fade faster at first, while later retrieval can strengthen it; it is not a personal exact timer.', citation: 'Ebbinghaus (1885)' },
    { id: 'active-recall', title: 'Active recall', body: 'Instead of rereading, close the page and ask yourself for the answer. That effort can strengthen the memory trace.', question: 'What is active recall?', answer: 'Close the page and retrieve the answer from memory instead of simply rereading.', citation: 'Roediger & Karpicke (2006), doi:10.1111/j.1467-9280.2006.01693.x' },
    { id: 'neuroplasticity', title: 'Neuroplasticity', body: 'Practice and experience help brain networks adapt. Change usually comes from small, consistent attempts rather than one heroic session.', question: 'How is neuroplasticity described here?', answer: 'Practice and experience can help brain networks adapt over time.', citation: 'Kleim & Jones (2008), doi:10.1044/1092-4388(2008/018)' },
    { id: 'sleep', title: 'Sleep and consolidation', body: 'Sleep is associated with processes that help newly learned memories be processed and consolidated.', question: 'How is sleep connected to memory?', answer: 'Sleep is associated with processes that help newly learned memories be processed and consolidated.', citation: 'Rasch & Born (2013), doi:10.1152/physrev.00032.2012' },
    { id: 'chunking', title: 'Chunking', body: 'Grouping a long sequence into meaningful small units can reduce the load on working memory.', question: 'What can chunking do?', answer: 'It can group a long sequence into meaningful units and reduce working-memory load.', citation: 'Gobet et al. (2001), doi:10.1016/S1364-6613(00)01662-4' },
    { id: 'movement', title: 'Movement and cognition', body: 'In one study of older adults, aerobic activity was linked with changes in hippocampal volume and spatial-memory performance; that does not guarantee the same effect for everyone.', question: 'What is an important caveat about the movement study?', answer: 'One study linked aerobic activity with hippocampal and spatial-memory changes in older adults, but it does not guarantee the same effect for everyone.', citation: 'Erickson et al. (2011), doi:10.1073/pnas.1015950108' },
    { id: 'dual-n-back', title: 'Dual n-back', body: 'This task tracks sound and location sequences. Practice-task performance may improve, but far transfer to general intelligence remains mixed and contested.', question: 'What is the important dual n-back caveat?', answer: 'The practiced task may improve, but evidence for far transfer to general intelligence is mixed and contested.', citation: 'Jaeggi et al. (2008), doi:10.1073/pnas.0801268105; Simons et al. (2016), doi:10.1177/1529100616661983' },
  ],
  ru: [
    { id: 'spaced-practice', title: 'Распределённая практика', body: 'Несколько коротких занятий с паузами могут поддерживать долговременное запоминание лучше, чем одна длинная зубрёжка.', question: 'Что может поддерживать распределённая практика?', answer: 'Короткие занятия с паузами могут поддерживать долговременное запоминание.', citation: 'Cepeda и др. (2006), doi:10.1037/0033-2909.132.3.354' },
    { id: 'forgetting-curve', title: 'Кривая забывания', body: 'Эббингауз описал общий, приблизительный рисунок: новое сначала часто забывается быстрее, а последующие извлечения укрепляют память. Это не точный таймер для вас.', question: 'Что описывает кривая забывания?', answer: 'Новое может сначала забываться быстрее, а последующее извлечение укрепляет память; это не личный точный таймер.', citation: 'Ebbinghaus (1885)' },
    { id: 'active-recall', title: 'Активное извлечение', body: 'Вместо перечитывания закройте страницу и спросите себя об ответе. Это усилие может укрепить след памяти.', question: 'Что такое активное извлечение?', answer: 'Закрыть страницу и вспомнить ответ из памяти вместо простого перечитывания.', citation: 'Roediger & Karpicke (2006), doi:10.1111/j.1467-9280.2006.01693.x' },
    { id: 'neuroplasticity', title: 'Нейропластичность', body: 'Практика и опыт помогают сетям мозга адаптироваться. Изменения обычно рождаются из небольших регулярных попыток.', question: 'Как здесь описывается нейропластичность?', answer: 'Практика и опыт могут со временем помогать сетям мозга адаптироваться.', citation: 'Kleim & Jones (2008), doi:10.1044/1092-4388(2008/018)' },
    { id: 'sleep', title: 'Сон и консолидация', body: 'Сон связан с процессами, которые помогают обрабатывать и закреплять недавно выученные воспоминания.', question: 'Как сон связан с памятью?', answer: 'Сон связан с процессами обработки и закрепления недавно выученных воспоминаний.', citation: 'Rasch & Born (2013), doi:10.1152/physrev.00032.2012' },
    { id: 'chunking', title: 'Группировка', body: 'Разделение длинной последовательности на осмысленные небольшие группы может снизить нагрузку на рабочую память.', question: 'Что может делать группировка?', answer: 'Разделять длинный ряд на осмысленные части и снижать нагрузку на рабочую память.', citation: 'Gobet и др. (2001), doi:10.1016/S1364-6613(00)01662-4' },
    { id: 'movement', title: 'Движение и мышление', body: 'В одном исследовании пожилых людей аэробная активность была связана с изменениями объёма гиппокампа и пространственной памяти; такой эффект не гарантирован для всех.', question: 'Какую оговорку важно помнить о движении?', answer: 'Одно исследование связало аэробную активность у пожилых людей с изменениями гиппокампа и пространственной памяти, но это не гарантия для всех.', citation: 'Erickson и др. (2011), doi:10.1073/pnas.1015950108' },
    { id: 'dual-n-back', title: 'Dual n-back', body: 'Здесь нужно отслеживать последовательности звуков и позиций. Результат в самой задаче может расти, но перенос на общий интеллект остаётся смешанным и спорным.', question: 'Какая важная оговорка есть у dual n-back?', answer: 'Результат в самой задаче может вырасти, но данные о переносе на общий интеллект смешанные и спорные.', citation: 'Jaeggi и др. (2008), doi:10.1073/pnas.0801268105; Simons и др. (2016), doi:10.1177/1529100616661983' },
  ],
  ko: [
    { id: 'spaced-practice', title: '간격을 둔 연습', body: '한 번에 오래 몰아서 공부하는 것보다 시간 간격을 둔 짧은 세션 여러 번이 장기 기억에 도움이 될 수 있습니다.', question: '간격을 둔 연습은 무엇에 도움이 될까요?', answer: '시간 간격을 둔 짧은 세션은 장기 기억을 돕는 데 유용할 수 있습니다.', citation: 'Cepeda et al. (2006), doi:10.1037/0033-2909.132.3.354' },
    { id: 'forgetting-curve', title: '망각 곡선', body: '에빙하우스는 새 정보가 처음에 빠르게 흐려지고 이후 회상이 기억을 강화하는 대략적인 패턴을 설명했습니다. 개인에게 맞는 정확한 타이머는 아닙니다.', question: '망각 곡선은 무엇을 설명하나요?', answer: '새 정보는 처음에 더 빨리 흐려질 수 있고 이후 회상이 기억을 강화할 수 있습니다. 개인의 정확한 타이머는 아닙니다.', citation: 'Ebbinghaus (1885)' },
    { id: 'active-recall', title: '능동적 회상', body: '다시 읽는 대신 페이지를 덮고 스스로 답을 떠올려 보세요. 그 노력이 기억 흔적을 강화할 수 있습니다.', question: '능동적 회상이란 무엇인가요?', answer: '다시 읽기보다 페이지를 덮고 기억에서 답을 꺼내는 것입니다.', citation: 'Roediger & Karpicke (2006), doi:10.1111/j.1467-9280.2006.01693.x' },
    { id: 'neuroplasticity', title: '신경가소성', body: '연습과 경험은 뇌 네트워크의 적응을 돕습니다. 변화는 한 번의 대단한 시도보다 작고 꾸준한 시도에서 보통 생깁니다.', question: '여기서 신경가소성은 어떻게 설명되나요?', answer: '연습과 경험은 시간이 지나며 뇌 네트워크가 적응하도록 도울 수 있습니다.', citation: 'Kleim & Jones (2008), doi:10.1044/1092-4388(2008/018)' },
    { id: 'sleep', title: '수면과 기억 공고화', body: '수면은 새로 배운 기억을 처리하고 공고화하는 과정과 관련이 있습니다.', question: '수면은 기억과 어떤 관련이 있나요?', answer: '수면은 새로 배운 기억을 처리하고 공고화하는 과정과 관련이 있습니다.', citation: 'Rasch & Born (2013), doi:10.1152/physrev.00032.2012' },
    { id: 'chunking', title: '청킹', body: '긴 순서를 의미 있는 작은 묶음으로 나누면 작업 기억의 부담을 줄일 수 있습니다.', question: '청킹은 무엇을 할 수 있나요?', answer: '긴 순서를 의미 있는 묶음으로 나누어 작업 기억의 부담을 줄일 수 있습니다.', citation: 'Gobet et al. (2001), doi:10.1016/S1364-6613(00)01662-4' },
    { id: 'movement', title: '움직임과 인지', body: '고령자를 대상으로 한 한 연구에서 유산소 활동은 해마 부피와 공간 기억 수행의 변화와 관련되었습니다. 모든 사람에게 같은 효과가 보장되지는 않습니다.', question: '움직임 연구에서 중요한 주의점은 무엇인가요?', answer: '한 연구가 고령자의 유산소 활동과 해마·공간 기억 변화를 연결했지만, 모든 사람에게 같은 효과를 보장하지는 않습니다.', citation: 'Erickson et al. (2011), doi:10.1073/pnas.1015950108' },
    { id: 'dual-n-back', title: 'Dual n-back', body: '소리와 위치의 순서를 추적하는 과제입니다. 연습한 과제의 수행은 좋아질 수 있지만 일반 지능으로의 원거리 전이는 혼합되어 있고 논쟁 중입니다.', question: 'dual n-back의 중요한 주의점은 무엇인가요?', answer: '연습한 과제의 수행은 좋아질 수 있지만 일반 지능으로의 원거리 전이는 혼합되어 있고 논쟁 중입니다.', citation: 'Jaeggi et al. (2008), doi:10.1073/pnas.0801268105; Simons et al. (2016), doi:10.1177/1529100616661983' },
  ],
};

const guides: Record<AppLanguage, Guide[]> = {
  uz: [
    { title: 'Loci / Xotira saroyi', intro: 'Tanish joyni ma’lumot uchun yo‘l xaritasiga aylantiring.', steps: ['Yaxshi biladigan yo‘l yoki xonani tanlang.', 'Yo‘nalish bo‘ylab aniq bekatlarni belgilang.', 'Har bir faktni o‘sha bekatda g‘ayrioddiy obraz sifatida joylashtiring.', 'Keyin ko‘zingizda yo‘l bo‘ylab yuring va obrazlarni qayta chaqiring.'] },
    { title: 'Major tizimi va raqam qoziqlari', intro: 'Major tizimi raqamlarni undoshlarga, qoziqlar esa sonlarni barqaror obrazlarga bog‘laydi.', steps: ['Major mosligini boshlang: 0=s/z, 1=t/d, 2=n, 3=m, 4=r, 5=l, 6=j/sh/ch, 7=k/g, 8=f/v, 9=p/b.', 'Raqamlar uchun unlilar qo‘shib so‘z yoki obraz yarating; masalan, 21 uchun n-t tovushlaridan “net” kabi so‘z.', '1–10 sonlari uchun o‘zgarmas tasvirlar ro‘yxatini tuzing va raqam qoziqlarini shu tartibda ishlating.', 'Yangi ketma-ketlikdagi har bir narsani tegishli qoziq bilan jonli sahnada bog‘lang, keyin qoziqlar bo‘ylab qayta eslang.'] },
    { title: 'Bo‘laklash', intro: 'Katta qatorni miyaga qulay mayda guruhlarga ajrating.', steps: ['Qatorni 2–4 belgilik guruhlarga bo‘ling.', 'Guruhlarni ma’noli sana, ritm yoki so‘zga o‘xshating.', 'Guruhlar orasida kichik pauza qiling.', 'Avval guruhlarni, keyin butun qatorni chaqiring.'] },
    { title: 'Feynman / o‘zini tushuntirish', intro: 'Bilimingizni sodda qilib aytib, bo‘sh joyni toping.', steps: ['Mavzuni bir jumlada yozing.', 'Uni yangi o‘rganuvchiga aytayotgandek sodda tushuntiring.', 'Qayerda to‘xtaganingizni belgilang va o‘sha joyni tekshiring.', 'Tushuntirishni qisqartirib, o‘z so‘zlaringiz bilan qayta ayting.'] },
  ],
  en: [
    { title: 'Loci / Mind Palace', intro: 'Turn a familiar place into a route for your information.', steps: ['Choose a route or room you know well.', 'Mark clear stations along it.', 'Place each fact at a station as an unusual image.', 'Walk the route in your mind and retrieve the images.'] },
    { title: 'Major System and number pegs', intro: 'The Major System maps digits to consonants; number pegs link numbers to stable images.', steps: ['Start with a consonant map: 0=s/z, 1=t/d, 2=n, 3=m, 4=r, 5=l, 6=j/sh/ch, 7=k/g, 8=f/v, 9=p/b.', 'Add vowels to make a word or image; for 21, the n-t sounds might become “net.”', 'Make a fixed image list for 1–10 and keep those number pegs in the same order.', 'Link each new item to its matching peg in a vivid scene, then recall the sequence by walking the pegs.'] },
    { title: 'Chunking', intro: 'Break a large sequence into small, usable groups.', steps: ['Split the sequence into groups of 2–4 items.', 'Give each group a meaning, rhythm, or word shape.', 'Leave a tiny pause between groups.', 'Recall the groups first, then the full sequence.'] },
    { title: 'Feynman / self-explanation', intro: 'Explain simply to find the edge of your understanding.', steps: ['Name the topic in one sentence.', 'Explain it as if speaking to a curious beginner.', 'Notice where you hesitate and check that part.', 'Shorten the explanation and say it again in your own words.'] },
  ],
  ru: [
    { title: 'Loci / Дворец памяти', intro: 'Превратите знакомое место в маршрут для информации.', steps: ['Выберите хорошо знакомый путь или комнату.', 'Отметьте на нём ясные остановки.', 'Разместите каждый факт на остановке как необычный образ.', 'Мысленно пройдите маршрут и извлеките образы.'] },
    { title: 'Система Major и числовые якоря', intro: 'Система Major связывает цифры с согласными, а числовые якоря — числа с постоянными образами.', steps: ['Начните с соответствий: 0=s/z, 1=t/d, 2=n, 3=m, 4=r, 5=l, 6=j/sh/ch, 7=k/g, 8=f/v, 9=p/b.', 'Добавьте гласные, чтобы получить слово или образ; для 21 звуки n-t могут стать словом net.', 'Создайте постоянный список образов для чисел 1–10 и не меняйте порядок якорей.', 'Свяжите каждый новый предмет с нужным якорем в яркой сцене, затем пройдите якоря по порядку.'] },
    { title: 'Группировка', intro: 'Разделите большой ряд на небольшие удобные группы.', steps: ['Разбейте ряд на группы по 2–4 элемента.', 'Придайте каждой группе смысл, ритм или форму слова.', 'Оставьте маленькую паузу между группами.', 'Сначала вспомните группы, затем весь ряд.'] },
    { title: 'Фейнман / самообъяснение', intro: 'Простое объяснение показывает границу понимания.', steps: ['Назовите тему одним предложением.', 'Объясните её любознательному новичку.', 'Заметьте паузу и проверьте этот фрагмент.', 'Сократите объяснение и повторите своими словами.'] },
  ],
  ko: [
    { title: '장소법 / 기억의 궁전', intro: '익숙한 장소를 정보를 위한 경로로 바꿔보세요.', steps: ['잘 아는 길이나 방을 고릅니다.', '경로에 분명한 지점을 표시합니다.', '각 사실을 특이한 이미지로 지점에 배치합니다.', '마음속으로 경로를 걸으며 이미지를 회상합니다.'] },
    { title: 'Major 체계와 숫자 페그', intro: 'Major 체계는 숫자를 자음에 연결하고, 숫자 페그는 숫자를 고정된 이미지에 연결합니다.', steps: ['자음 대응을 익힙니다: 0=s/z, 1=t/d, 2=n, 3=m, 4=r, 5=l, 6=j/sh/ch, 7=k/g, 8=f/v, 9=p/b.', '모음을 더해 단어나 이미지를 만듭니다. 예를 들어 21의 n-t 소리를 net으로 만들 수 있습니다.', '1–10에 고정된 이미지 목록을 만들고 숫자 페그의 순서를 바꾸지 않습니다.', '새 항목을 해당 페그와 생생한 장면으로 연결한 뒤 페그 순서대로 회상합니다.'] },
    { title: '청킹', intro: '큰 순서를 작고 다루기 쉬운 묶음으로 나눕니다.', steps: ['순서를 2–4개 묶음으로 나눕니다.', '각 묶음에 의미, 리듬, 단어 형태를 줍니다.', '묶음 사이에 짧은 멈춤을 둡니다.', '먼저 묶음을, 다음에 전체 순서를 회상합니다.'] },
    { title: '파인만 / 자기 설명', intro: '쉽게 설명하면 이해의 빈틈이 보입니다.', steps: ['주제를 한 문장으로 이름 붙입니다.', '호기심 많은 초보자에게 말하듯 설명합니다.', '막힌 곳을 알아차리고 그 부분을 확인합니다.', '설명을 줄여 자기 말로 다시 말합니다.'] },
  ],
};

const dailyTips: Record<AppLanguage, string[]> = {
  uz: ['Bugun uyqu uchun odatdagi vaqtingizga yaqinroq yoting; xotira faqat mashqdan iborat emas.', 'Ovqatni rang-barang va muvozanatli tanlang. Hech bir yagona oziq-ovqat xotirani bir zumda yaxshilaydigan yechim emas.', '5–10 daqiqa yuring yoki cho‘ziling; harakat fikrga yumshoq tanaffus beradi.', 'Bir sahifani yopib, o‘qiganingizdan uchta fikrni o‘zingizdan so‘rang.'],
  en: ['Aim for a bedtime close to your usual rhythm; memory is more than practice alone.', 'Choose balanced, varied food. No single food is a quick fix for memory.', 'Walk or stretch for 5–10 minutes; movement gives thinking a gentle reset.', 'Close one page and ask yourself for three things you just learned.'],
  ru: ['Постарайтесь лечь примерно в привычное время: память — это не только тренировка.', 'Выбирайте разнообразную и сбалансированную еду. Ни один продукт не является быстрым решением для памяти.', 'Пройдитесь или потянитесь 5–10 минут: движение мягко перезагружает внимание.', 'Закройте одну страницу и попросите себя назвать три только что изученные мысли.'],
  ko: ['평소 리듬에 가까운 시간에 잠자리에 들어 보세요. 기억은 연습만의 일이 아닙니다.', '다양하고 균형 잡힌 식사를 선택하세요. 단 하나의 음식이 기억력을 빠르게 해결해 주지는 않습니다.', '5–10분 걷거나 스트레칭해 보세요. 움직임은 생각에 부드러운 전환을 줍니다.', '페이지를 덮고 방금 배운 것 세 가지를 스스로 물어보세요.'],
};

const wordPairs: Record<AppLanguage, [string, string, string, string][]> = {
  uz: [['oyna', 'kompas', 'anor', 'sham'], ['qalam', 'bulut', 'soat', 'qayiq'], ['chiroq', 'daryo', 'non', 'kalit'], ['kitob', 'qush', 'piyola', 'oy']],
  en: [['lantern', 'compass', 'pomegranate', 'shoe'], ['pencil', 'cloud', 'teacup', 'bridge'], ['window', 'river', 'candle', 'bicycle'], ['key', 'feather', 'orange', 'clock']],
  ru: [['фонарь', 'компас', 'гранат', 'башмак'], ['карандаш', 'облако', 'чашка', 'мост'], ['окно', 'река', 'свеча', 'велосипед'], ['ключ', 'перо', 'апельсин', 'часы']],
  ko: [['등불', '나침반', '석류', '구두'], ['연필', '구름', '찻잔', '다리'], ['창문', '강', '촛불', '자전거'], ['열쇠', '깃털', '귤', '시계']],
};

const today = () => localDateKey(new Date());

function completion(exercise: BrainGymCompletion['exercise'], score: number, possible: number): BrainGymCompletion {
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `brain-gym-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return { id, exercise, date: today(), completedAt: new Date().toISOString(), score, possible };
}

function Panel({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return <section className={`rounded-[26px] border border-[#d9cba9]/80 bg-card p-5 shadow-[0_12px_34px_rgba(71,52,35,.07)] sm:p-7 ${className}`} data-testid={testId}>{children}</section>;
}

function SectionHeading({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
  return <div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#e1eee8] text-[#47796c]">{icon}</span><div className="min-w-0"><h2 className="font-serif text-[28px] leading-none tracking-[-.03em]">{title}</h2>{description && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>}</div></div>;
}

function randomMatrix() {
  const bytes = new Uint8Array(9);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(bytes);
  else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  return Array.from(bytes, (value) => value % 10);
}

function NumberMatrix({ copy: c, disabled, onComplete }: { copy: Copy; disabled: boolean; onComplete: (score: number, possible: number) => void }) {
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input' | 'result'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [sequence, setSequence] = useState(randomMatrix);

  useEffect(() => {
    if (phase !== 'showing') return undefined;
    setCountdown(3);
    const timers = [
      window.setTimeout(() => setCountdown(2), 1000),
      window.setTimeout(() => setCountdown(1), 2000),
      window.setTimeout(() => {
        setCountdown(0);
        setPhase('input');
      }, 3000),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [phase]);

  const start = () => { setSequence(randomMatrix()); setCountdown(3); setAnswer(''); setScore(null); setPhase('showing'); };
  const grade = () => {
    if (answer.replace(/\D/g, '').length < 9) return;
    const typed = answer.replace(/\D/g, '').slice(0, 9).split('').map(Number);
    const nextScore = typed.reduce((total, value, index) => total + (value === sequence[index] ? 1 : 0), 0);
    setScore(nextScore);
    setPhase('result');
    onComplete(nextScore, 9);
  };
  return <div className="mt-6 rounded-[22px] bg-[#f5edda] p-4 sm:p-5" data-testid="exercise-number-matrix">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#9a6b23]">01 / {c.matrixTitle}</p><h3 className="mt-1 font-serif text-[24px]">{c.matrixTitle}</h3></div><span className="rounded-full bg-card px-3 py-1.5 font-mono text-[10px] text-muted-foreground">3 {c.seconds}</span></div>
    <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground" role="status" aria-live="polite" data-testid="status-number-phase">{phase === 'showing' ? `${c.phaseShowing} · ${c.lookClosely}` : phase === 'input' ? c.phaseAnswer : phase === 'result' ? c.phaseReview : c.practiceResult}</p>
    <div className="mx-auto mt-5 grid max-w-[250px] grid-cols-3 gap-2" data-testid="status-number-grid">
      {(phase === 'showing' ? sequence : Array(9).fill(null)).map((digit, index) => <span key={`${sequence[index]}-${index}`} className={`grid aspect-square place-items-center rounded-xl border text-[24px] font-semibold transition-opacity duration-300 ${phase === 'showing' ? 'border-[#c8a963] bg-[#fffaf0] text-[#30243f]' : 'border-[#d9cba9] bg-[#faf6e9] text-transparent'}`} data-testid={`cell-number-${index}`}>{digit}</span>)}
    </div>
    {phase === 'idle' && <button type="button" disabled={disabled} onClick={start} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#30243f] px-4 py-2.5 text-[13px] font-semibold text-[#fffaf0] transition-transform hover:-translate-y-0.5 disabled:opacity-45" data-testid="button-start-number-matrix"><Eye size={16} />{c.start}</button>}
    {phase === 'showing' && <p className="mt-4 text-center font-mono text-[11px] text-[#9a6b23]" role="status" aria-live="off" data-testid="status-number-countdown">{countdown} {c.seconds} · {c.lookClosely}</p>}
    {phase === 'input' && <div className="mt-5 flex flex-col gap-2 sm:flex-row"><input inputMode="numeric" disabled={disabled} maxLength={9} value={answer} onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ''))} placeholder={c.sequencePlaceholder} aria-label={c.sequencePlaceholder} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d9cba9] bg-card px-3 text-[13px] outline-none focus:border-[#9a6b23] disabled:opacity-60" data-testid="input-number-sequence" /><button type="button" onClick={grade} disabled={disabled || answer.length < 9} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#47796c] px-4 py-2.5 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-submit-number-matrix"><Check size={16} />{c.submit}</button></div>}
    {phase === 'result' && score !== null && <><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3.5" role="status" data-testid="status-number-result"><span className="text-[13px] font-semibold">{c.practiceResult}: <strong className="font-serif text-[24px]">{score}</strong> {c.of} 9</span><button type="button" disabled={disabled} onClick={() => { setSequence(randomMatrix()); setPhase('idle'); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-[12px] font-semibold hover:bg-muted disabled:opacity-45" data-testid="button-reset-number-matrix"><RotateCcw size={14} />{c.reset}</button></div><div className="mt-3 flex justify-center gap-1.5" aria-label={c.positionResult} data-testid="status-number-position-results">{sequence.map((digit, index) => <span key={`result-${index}`} className={`grid size-7 place-items-center rounded-lg text-[11px] font-bold ${answer[index] === String(digit) ? 'bg-[#d8eade] text-[#35614f]' : 'bg-[#f4ddd4] text-[#8f3f2d]'}`} data-testid={`status-number-position-${index}`}>{answer[index] === String(digit) ? <Check size={13} /> : <X size={13} />}</span>)}</div></>}
  </div>;
}

function WordChain({ copy: c, language, disabled, onComplete }: { copy: Copy; language: AppLanguage; disabled: boolean; onComplete: (score: number, possible: number) => void }) {
  const index = new Date().getDate() % wordPairs[language].length;
  const [story, setStory] = useState('');
  const [done, setDone] = useState(false);
  const words = wordPairs[language][index];
  return <div className="mt-6 rounded-[22px] border border-[#d8e4dd] bg-[#edf5f0] p-4 sm:p-5" data-testid="exercise-word-chain">
    <p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#47796c]">02 / {c.wordChainTitle}</p>
    <h3 className="mt-1 font-serif text-[24px]">{c.wordChainTitle}</h3>
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center" role="group" aria-label={c.typeStory}>{words.map((word, index) => <span className="contents" key={`${word}-${index}`}><span className="max-w-full break-words rounded-2xl bg-card px-3 py-2 font-serif text-[19px] sm:px-4 sm:py-3 sm:text-[23px]" data-testid={`text-word-chain-${index}`}>{word}</span>{index < words.length - 1 && <Waves size={16} className="shrink-0 text-[#9a6b23]" aria-hidden="true" />}</span>)}</div>
    <label htmlFor="word-story" className="mt-5 block text-[12px] font-semibold text-[#47796c]">{c.typeStory}</label>
    <textarea id="word-story" disabled={disabled} value={story} onChange={(event) => setStory(event.target.value)} rows={4} maxLength={1200} placeholder={language === 'en' ? 'Make it surprising, sensory, and yours…' : language === 'ru' ? 'Пусть она будет неожиданной и образной…' : language === 'ko' ? '뜻밖이고 감각적인 이야기로 만들어 보세요…' : 'Uni kutilmagan va jonli qiling…'} className="mt-2 w-full resize-y rounded-xl border border-[#cbdcd2] bg-card px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/65 focus:border-[#47796c] disabled:opacity-60" data-testid="input-word-story" />
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] italic text-muted-foreground" data-testid="status-word-storage">{c.noStorySaved}</p>{done ? <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d8eade] px-4 text-[13px] font-semibold text-[#35614f]" role="status" data-testid="status-word-complete"><Check size={16} />{c.practiceComplete}</span> : <button type="button" disabled={disabled || !story.trim()} onClick={() => { setDone(true); onComplete(1, 1); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#47796c] px-4 py-2.5 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-complete-word-chain"><Sparkles size={16} />{c.completeRound}</button>}</div>
    {!story.trim() && !done && <p className="mt-2 text-[11px] text-[#a14e36]" role="alert" data-testid="status-word-required">{c.storyRequired}</p>}
  </div>;
}

function RecallPractice({ copy: c, language, factsForLanguage, progress, save, disabled, onComplete }: { copy: Copy; language: AppLanguage; factsForLanguage: Fact[]; progress: BrainGymProgress; save: (next: BrainGymProgress) => boolean; disabled: boolean; onComplete: (score: number, possible: number) => void }) {
  const [seconds, setSeconds] = useState(120);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const dueItems = useMemo(() => progress.recallItems.filter((item) => item.nextReviewOn <= today()), [progress.recallItems]);
  const currentItem = progress.recallItems.find((item) => item.factId === sessionIds[currentIndex]);
  const currentFact = factsForLanguage.find((fact) => fact.id === currentItem?.factId);

  useEffect(() => {
    if (!started || timedOut || seconds <= 0) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, started, timedOut]);

  useEffect(() => {
    if (!started || seconds > 0 || timedOut) return;
    setTimedOut(true);
    if (reviewed.length === 0 || completionRecorded) return;
    const nextProgress = {
      ...progress,
      completions: [...progress.completions, completion('spaced-recall', reviewed.length, sessionIds.length)].slice(-2000),
    };
    if (save(nextProgress)) {
      setCompletionRecorded(true);
      onComplete(reviewed.length, sessionIds.length);
    }
  }, [seconds, started, timedOut, reviewed.length, completionRecorded, progress, sessionIds, save, onComplete]);

  const rate = (remembered: boolean) => {
    if (disabled || timedOut || !currentItem || !currentFact) return;
    const date = today();
    const nextItems = progress.recallItems.flatMap((item) => {
      if (item.factId !== currentItem.factId) return [item];
      if (!remembered) return [{ ...item, firstLearnedOn: date, nextReviewOn: addDaysToDateKey(date, 1), interval: 1 as RecallInterval }];
      if (item.interval === 7) return [{ ...item, interval: 7 as RecallInterval, nextReviewOn: addDaysToDateKey(date, 7) }];
      const nextInterval = item.interval === 1 ? 3 : 7;
      return [{ ...item, interval: nextInterval as RecallInterval, nextReviewOn: addDaysToDateKey(date, nextInterval) }];
    });
    const isFinal = currentIndex + 1 >= sessionIds.length;
    const reviewCount = reviewed.length + 1;
    const shouldRecordCompletion = isFinal && !completionRecorded;
    const nextProgress = {
      ...progress,
      recallItems: nextItems,
      completions: shouldRecordCompletion ? [...progress.completions, completion('spaced-recall', reviewCount, sessionIds.length)].slice(-2000) : progress.completions,
    };
    if (save(nextProgress)) {
      setReviewed((items) => [...items, currentItem.factId]);
      if (shouldRecordCompletion) setCompletionRecorded(true);
      setRevealed(false);
      if (shouldRecordCompletion) onComplete(reviewCount, sessionIds.length);
       if (!isFinal) setCurrentIndex((value) => value + 1);
       else setStarted(false);
    }
  };
  const start = () => { setSessionIds(dueItems.map((item) => item.factId)); setCurrentIndex(0); setReviewed([]); setCompletionRecorded(false); setRevealed(false); setStarted(true); setTimedOut(false); setSeconds(120); };
  const formatTime = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return <div className="mt-6 rounded-[22px] border border-[#e3d3bd] bg-[#fbf4e7] p-4 sm:p-5" data-testid="exercise-spaced-recall">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#9a6b23]">03 / {c.spacedRecallTitle}</p><h3 className="mt-1 font-serif text-[24px]">{c.spacedRecallTitle}</h3></div><span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-mono text-[12px] text-[#9a6b23]" role="timer" aria-live="polite" aria-atomic="true" aria-label={`${c.countdownLabel}: ${formatTime}`} data-testid="status-recall-timer"><Clock3 size={14} />{formatTime}</span></div>
    <p className="sr-only" aria-live="polite" data-testid="status-recall-phase">{timedOut ? c.phaseExpired : started ? (revealed ? c.phaseReview : c.phaseAnswer) : c.start}</p>
    {!dueItems.length && !started ? <div className="mt-5 rounded-xl border border-dashed border-[#d9cba9] bg-card/60 p-5 text-center" data-testid="status-recall-empty"><Target size={22} className="mx-auto text-[#9a6b23]" /><p className="mt-2 font-serif text-[21px]">{c.noDue}</p><p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">{c.noDueDescription}</p></div> : started && currentFact ? <div className="mt-5" data-testid={`card-recall-fact-${currentFact.id}`}><p className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{c.question} · {currentIndex + 1}/{sessionIds.length}</p><p className="mt-3 rounded-xl bg-card p-4 text-[15px] font-semibold leading-relaxed" data-testid="text-recall-question">{currentFact.question}</p>{revealed ? <div className="mt-3 rounded-xl border border-[#d8e4dd] bg-[#edf5f0] p-4" data-testid="text-recall-answer"><p className="text-[13px] leading-relaxed">{currentFact.answer}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={disabled || timedOut} onClick={() => rate(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#47796c] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-recall-remembered"><Check size={16} />{c.remembered}</button><button type="button" disabled={disabled || timedOut} onClick={() => rate(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#c98e76] px-4 text-[13px] font-semibold text-[#a14e36] disabled:opacity-45" data-testid="button-recall-missed"><X size={16} />{c.missed}</button></div></div> : <button type="button" disabled={disabled || timedOut} onClick={() => setRevealed(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#30243f] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-recall-reveal"><Eye size={16} />{c.reveal}</button>}</div> : null}
    {started && (timedOut || seconds === 0) && <p className="mt-4 rounded-xl border border-[#e4c2b7] bg-[#fff0ec] p-3 text-[12px] text-[#8f3f2d]" role="status" data-testid="status-recall-timeout">{c.timerDone}</p>}
    {!started && dueItems.length > 0 && <button type="button" disabled={disabled} onClick={start} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#30243f] px-4 text-[13px] font-semibold text-[#fffaf0] disabled:opacity-45" data-testid="button-start-spaced-recall"><TimerReset size={16} />{c.start} · {c.dueToday}</button>}
    {timedOut && <button type="button" disabled={disabled} onClick={start} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#30243f] px-4 text-[13px] font-semibold text-[#30243f] disabled:opacity-45" data-testid="button-retry-spaced-recall"><RotateCcw size={15} />{c.reset}</button>}
    {started && <p className="mt-4 text-[11px] text-muted-foreground" data-testid="status-recall-reviewed">{reviewed.length} {c.reviewed}</p>}
  </div>;
}

function BrainGymContent({ userId }: { userId: string }) {
  const { language } = useI18n();
  const c = copy[language];
  const store = useBrainGymProgress(userId, c.title);
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');
  const [storageIssue, setStorageIssue] = useState(false);
  const noticeTimer = useRef<number | null>(null);
  const factsForLanguage = facts[language];
  const todayTip = dailyTips[language][new Date().getDate() % dailyTips[language].length];
  const saveRef = useRef(store.save);
  saveRef.current = store.save;
  useEffect(() => () => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
  }, []);
  const showNotice = (message: string, tone: 'success' | 'error' = 'success') => {
    setNotice(message);
    setNoticeTone(tone);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2800);
  };
  const saveProgress = (next: BrainGymProgress) => {
    const result = saveRef.current(next);
    if (!result) {
      setStorageIssue(true);
      showNotice(c.error, 'error');
    }
    return result;
  };
  const recordCompletion = (exercise: BrainGymCompletion['exercise'], score: number, possible: number) => {
    const result = saveProgress({ ...store.value, completions: [...store.value.completions, completion(exercise, score, possible)].slice(-2000) });
    if (result) showNotice(`${c.practiceResult}: ${score} ${c.of} ${possible}`);
  };
  const toggleFact = (fact: Fact) => {
    const existing = store.value.recallItems.some((item) => item.factId === fact.id);
    const date = today();
    const nextItems = existing ? store.value.recallItems.filter((item) => item.factId !== fact.id) : [...store.value.recallItems, { factId: fact.id, firstLearnedOn: date, nextReviewOn: addDaysToDateKey(date, 1), interval: 1 as RecallInterval }];
    if (saveProgress({ ...store.value, recallItems: nextItems.slice(0, 500) })) showNotice(existing ? c.savedFacts : c.saved);
  };
  const completionCount = store.value.completions.length;
  if (store.status === 'loading') return <div className="space-y-4" data-testid="status-brain-gym-loading"><div className="skeleton h-36 rounded-[26px]" /><div className="skeleton h-72 rounded-[26px]" /><p className="sr-only">{c.loading}</p></div>;
  if (store.status === 'error') return <div className="rounded-[26px] border border-destructive/30 bg-destructive/5 p-7 text-center" role="alert" data-testid="status-brain-gym-error"><Brain size={25} className="mx-auto text-destructive" /><p className="mt-3 text-[14px]">{store.error || c.storageError}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-[13px] font-semibold" data-testid="button-retry-brain-gym"><RotateCcw size={15} />{c.retry}</button></div>;
  const mutationsDisabled = store.status !== 'ready' || storageIssue;
  return <div className="space-y-7 overflow-x-hidden" data-testid="page-brain-gym">
    <div className="relative overflow-hidden rounded-[30px] border border-[#c8d8ce] bg-[#e8f1ec] p-5 sm:p-8" data-testid="card-brain-gym-intro"><div className="pointer-events-none absolute -right-14 -top-16 size-52 rounded-full border-[22px] border-[#c4d9ca]/70" /><div className="pointer-events-none absolute -bottom-20 left-1/3 size-44 rounded-full border-[18px] border-[#f1dfb1]/70" /><div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.14em] text-[#47796c]"><Brain size={14} /> {c.privatePractice}</span><h2 className="mt-5 max-w-2xl font-serif text-[clamp(2.6rem,7vw,5.6rem)] leading-[.88] tracking-[-.055em] text-[#30243f]">{language === 'uz' ? 'Yodda qoladigan qiziqish.' : language === 'ru' ? 'Любопытство, которое остаётся.' : language === 'ko' ? '기억에 남는 호기심.' : 'Curiosity that stays.'}</h2><p className="mt-5 max-w-xl text-[14px] leading-relaxed text-[#47796c]">{c.scienceIntro}</p><div className="mt-6 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-xl bg-[#30243f] px-3.5 py-2.5 text-[12px] font-semibold text-[#fffaf0]" data-testid="status-brain-gym-completions"><Zap size={15} />{completionCount} {c.rounds}</span><span className="text-[12px] text-[#47796c]" data-testid="status-brain-gym-storage"><LockKeyhole size={13} className="mr-1 inline" />{c.storage}</span></div></div></div>
    <div className="flex items-start gap-3 rounded-2xl border border-[#d9cba9] bg-[#f5edda] p-4 text-[12px] leading-relaxed text-[#756d5e]" role="note" data-testid="status-brain-gym-disclaimer"><Brain size={16} className="mt-0.5 shrink-0 text-[#9a6b23]" />{c.educationDisclaimer}</div>
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.22fr)_minmax(280px,.78fr)]">
      <Panel testId="section-science-repository"><SectionHeading icon={<Lightbulb size={19} />} title={c.science} description={c.scienceIntro} /><div className="mt-6 grid gap-3 sm:grid-cols-2">{factsForLanguage.map((fact) => { const isSaved = store.value.recallItems.some((item) => item.factId === fact.id); return <article key={fact.id} className={`rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5 ${isSaved ? 'border-[#b6d0c0] bg-[#f1f7f3]' : 'border-border bg-background/40'}`} data-testid={`card-science-fact-${fact.id}`}><div className="flex items-start justify-between gap-3"><h3 className="font-serif text-[21px] leading-tight">{fact.title}</h3><button type="button" disabled={mutationsDisabled} onClick={() => toggleFact(fact)} aria-pressed={isSaved} aria-label={`${isSaved ? c.saved : c.saveFact}: ${fact.title}`} className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors disabled:opacity-45 ${isSaved ? 'bg-[#d8eade] text-[#35614f]' : 'bg-[#f5edda] text-[#9a6b23] hover:bg-[#ebddb6]'}`} data-testid={`button-save-fact-${fact.id}`}>{isSaved ? <Check size={16} /> : <Save size={16} />}</button></div><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{fact.body}</p><p className="mt-3 text-[10px] leading-relaxed text-[#9a6b23]" data-testid={`text-citation-${fact.id}`}>{fact.citation}</p></article>; })}</div><div className="mt-5 flex items-center gap-2 rounded-xl bg-[#f5edda] p-3 text-[11px] leading-relaxed text-[#756d5e]" data-testid="status-saved-facts"><Save size={14} className="shrink-0 text-[#9a6b23]" />{store.value.recallItems.length} {c.savedFacts}</div></Panel>
      <div className="space-y-7"><Panel className="bg-[#30243f] text-[#fffaf0]" testId="card-daily-tip"><div className="flex items-center gap-2 text-[#d9a441]"><Sparkles size={17} /><p className="font-mono text-[10px] uppercase tracking-[.14em]">{c.tipLabel}</p></div><p className="mt-5 font-serif text-[27px] leading-tight" data-testid="text-daily-tip">{todayTip}</p><p className="mt-4 text-[11px] leading-relaxed text-[#e9dfcf]" data-testid="text-tip-guidance">{c.tipGuidance}</p></Panel><Panel testId="section-guides"><SectionHeading icon={<Footprints size={19} />} title={c.guide} /> <div className="mt-5 space-y-2">{guides[language].map((item, index) => { const id = `${language}-${index}`; const open = openGuide === id; return <div key={id} className="overflow-hidden rounded-xl border border-border bg-background/45" data-testid={`guide-${index}`}><button type="button" onClick={() => setOpenGuide(open ? null : id)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 py-3 text-left text-[13px] font-semibold" data-testid={`button-toggle-guide-${index}`}><span className="min-w-0">{item.title}</span><ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="border-t border-border px-3.5 pb-4 pt-3" data-testid={`text-guide-${index}`}><p className="text-[12px] leading-relaxed text-muted-foreground">{item.intro}</p><ol className="mt-3 space-y-2">{item.steps.map((step, stepIndex) => <li key={step} className="flex gap-2 text-[12px] leading-relaxed"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e1eee8] font-mono text-[9px] text-[#47796c]">{stepIndex + 1}</span><span>{step}</span></li>)}</ol></div>}</div>; })}</div></Panel></div>
    </div>
    <Panel testId="section-practice"><SectionHeading icon={<Dumbbell size={19} />} title={c.practice} description={c.gentleNote} /><NumberMatrix copy={c} disabled={mutationsDisabled} onComplete={(score, possible) => recordCompletion('number-matrix', score, possible)} /><WordChain copy={c} language={language} disabled={mutationsDisabled} onComplete={(score, possible) => recordCompletion('word-chain', score, possible)} /><RecallPractice copy={c} language={language} factsForLanguage={factsForLanguage} progress={store.value} save={saveProgress} disabled={mutationsDisabled} onComplete={(score, possible) => showNotice(`${c.practiceResult}: ${score} ${c.of} ${possible}`)} /></Panel>
    <Panel className="bg-[#f5edda]" testId="section-sources">
      <SectionHeading icon={<Waves size={19} />} title={c.sources} />
      <div className="mt-5 grid gap-3 text-[11px] leading-relaxed text-muted-foreground sm:grid-cols-2">
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1037/0033-2909.132.3.354" target="_blank" rel="noreferrer" data-testid="link-source-cepeda">Cepeda et al. (2006) · {c.sourceSpacing}</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1111/j.1467-9280.2006.01693.x" target="_blank" rel="noreferrer" data-testid="link-source-roediger">Roediger & Karpicke (2006) · {c.sourceRetrieval}</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1152/physrev.00032.2012" target="_blank" rel="noreferrer" data-testid="link-source-rasch">Rasch & Born (2013) · {c.sourceSleep}</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1177/1529100616661983" target="_blank" rel="noreferrer" data-testid="link-source-simons">Simons et al. (2016) · {c.sourceTransfer}</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1044/1092-4388(2008/018)" target="_blank" rel="noreferrer" data-testid="link-source-kleim">Kleim & Jones (2008) · 10.1044/1092-4388(2008/018)</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1016/S1364-6613(00)01662-4" target="_blank" rel="noreferrer" data-testid="link-source-gobet">Gobet et al. (2001) · 10.1016/S1364-6613(00)01662-4</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1073/pnas.1015950108" target="_blank" rel="noreferrer" data-testid="link-source-erickson">Erickson et al. (2011) · 10.1073/pnas.1015950108</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://doi.org/10.1073/pnas.0801268105" target="_blank" rel="noreferrer" data-testid="link-source-jaeggi">Jaeggi et al. (2008) · 10.1073/pnas.0801268105</a>
        <a className="rounded-xl bg-card p-3 underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" href="https://psychclassics.yorku.ca/Ebbinghaus/" target="_blank" rel="noreferrer" data-testid="link-source-ebbinghaus">Ebbinghaus (1885) · Memory: A Contribution to Experimental Psychology</a>
      </div>
    </Panel>
    {notice && <div className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border px-4 py-3 text-center text-[13px] font-semibold shadow-lg ${noticeTone === 'error' ? 'border-[#ecc6bd] bg-[#fff0ec] text-[#8f3f2d]' : 'border-[#c3ddcf] bg-[#edf6f0] text-[#35614f]'}`} role="status" data-testid="status-brain-gym-notice">{notice}</div>}
  </div>;
}

export function BrainGymPage() {
  const { language } = useI18n();
  const c = copy[language];
  return <UserStoragePage>{(userId) => <ModulePageFrame eyebrow={c.eyebrow} title={c.title} description={c.description} icon={<Brain size={22} strokeWidth={1.7} />} backLabel={c.back}><BrainGymContent key={userId} userId={userId} /></ModulePageFrame>}</UserStoragePage>;
}

export default BrainGymPage;