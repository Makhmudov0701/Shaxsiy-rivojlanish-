import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/react';
import { useForm, useWatch } from 'react-hook-form';
import { Download, FileJson, FileSpreadsheet, Leaf, Moon, RefreshCw, Save, Sun, UserCircle2 } from 'lucide-react';
import {
  getDownloadDiaryBackupQueryKey,
  useDownloadDiaryBackup,
  useGetDiarySummary,
  useGetRepetitionStats,
  useListRepetitionCards,
  type RepetitionCard,
} from '@workspace/api-client-react';
import { DiaryShell } from '@/components/diary-ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useI18n, type AppLanguage } from '@/lib/i18n';
import { isPersonalGoalList, isTrackedBookList, userStorageKey, type PersonalGoal, type TrackedBook } from '@/lib/local-life-data';
import { getRecordedFocusMinutes, readFocusWorkspace, type FocusWorkspaceData } from '@/lib/focus-workspace-data';
import {
  applyThemePreference,
  DEFAULT_PROFILE_PREFERENCES,
  readProfilePreferences,
  writeProfilePreferences,
  type AvatarPreset,
  type ProfilePreferences,
  type ThemePreference,
} from '@/lib/profile-preferences';

type ProfileFormValues = ProfilePreferences;

type ProfileCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  identity: string;
  identityHint: string;
  displayName: string;
  displayNameHint: string;
  motto: string;
  mottoHint: string;
  avatar: string;
  avatarHint: string;
  account: string;
  email: string;
  goals: string;
  goalsHint: string;
  pomodoro: string;
  pages: string;
  reviews: string;
  language: string;
  appearance: string;
  theme: string;
  system: string;
  light: string;
  dark: string;
  save: string;
  saved: string;
  storageRead: string;
  storageWrite: string;
  stats: string;
  activeDays: string;
  focusHours: string;
  booksFinished: string;
  mastered: string;
  loading: string;
  noData: string;
  refresh: string;
  exports: string;
  exportsHint: string;
  json: string;
  csv: string;
  preparing: string;
  exported: string;
  exportError: string;
  dataError: string;
  dataUnavailable: string;
  localStorageError: string;
  entries: string;
  photos: string;
  books: string;
  cards: string;
  activeDaysHint: string;
  avatarOptions: Record<AvatarPreset, string>;
};

const COPY: Record<AppLanguage, ProfileCopy> = {
  uz: {
    eyebrow: 'Sokin makon',
    title: 'Shaxsiy profil.',
    intro: 'Bu yerda kundaligingiz sizga qanday hamroh bo‘lishini tanlang.',
    identity: 'Siz haqingizda',
    identityHint: 'Ismingiz va kunlarga qaytib kelishga yordam beradigan bir jumla.',
    displayName: 'Ko‘rinadigan ism',
    displayNameHint: 'Kundalik ichida shu ism ishlatiladi.',
    motto: 'Shaxsiy shior',
    mottoHint: 'Bugun eslab qolmoqchi bo‘lgan qisqa fikr.',
    avatar: 'Rasmcha ohangi',
    avatarHint: 'Sizga yaqin rangdagi belgini tanlang.',
    account: 'Hisob',
    email: 'Email manzili',
    goals: 'Kundalik maqsadlar',
    goalsHint: 'Maqsadlar faqat sizning brauzeringizda saqlanadi.',
    pomodoro: 'Diqqat daqiqalari',
    pages: 'O‘qish sahifalari',
    reviews: 'Kartochka takrorlashlari',
    language: 'Til',
    appearance: 'Ko‘rinish',
    theme: 'Mavzu',
    system: 'Tizim',
    light: 'Yorug‘',
    dark: 'Qorong‘i',
    save: 'Profilni saqlash',
    saved: 'O‘zgarishlar saqlandi.',
    storageRead: 'Profil ma’lumotlari o‘qilmadi. Standart qiymatlar ko‘rsatildi; brauzer xotirasini tekshiring.',
    storageWrite: 'Profil saqlanmadi. Brauzer xotirasi to‘lmaganini tekshiring.',
    stats: 'Sizning izlaringiz',
    activeDays: 'Faol kunlar',
    focusHours: 'Diqqat soatlari',
    booksFinished: 'Tugagan kitoblar',
    mastered: 'O‘zlashtirilgan kartochkalar',
    loading: 'Ma’lumotlar yuklanmoqda',
    noData: 'Hali ma’lumot yo‘q',
    refresh: 'Qayta urinish',
    exports: 'Xotiralarni olib chiqing',
    exportsHint: 'Kundalik, kitob qaydlari, maqsadlar, topshiriqlar, fokus davrlari va kartochkalarni JSON yoki CSV faylga saqlang.',
    json: 'JSON nusxa',
    csv: 'CSV jadval',
    preparing: 'Tayyorlanmoqda',
    exported: 'Fayl yuklab olindi.',
    exportError: 'Eksportni tayyorlab bo‘lmadi. Qayta urinib ko‘ring.',
    dataError: 'Ba’zi ko‘rsatkichlar yuklanmadi.',
    dataUnavailable: 'Hozircha mavjud emas',
    localStorageError: 'Mahalliy ma’lumotlarni o‘qib bo‘lmadi. Brauzer xotirasini tekshiring.',
    entries: 'yozuv',
    photos: 'surat',
    books: 'kitob',
    cards: 'kartochka',
    activeDaysHint: 'Kundalikka kamida bitta yozuv kiritilgan kunlar.',
    avatarOptions: { sunrise: 'Tong', leaf: 'Barg', moon: 'Oy', ink: 'Siyoh', horizon: 'Ufqlar' },
  },
  en: {
    eyebrow: 'A quiet space',
    title: 'Personal profile.',
    intro: 'Choose how your diary should feel when you return to it.',
    identity: 'About you',
    identityHint: 'A name and a small sentence to help you return to your days.',
    displayName: 'Display name',
    displayNameHint: 'This name appears inside your diary.',
    motto: 'Personal motto',
    mottoHint: 'A short thought you want to keep close today.',
    avatar: 'Avatar tone',
    avatarHint: 'Choose a color that feels like you.',
    account: 'Account',
    email: 'Email address',
    goals: 'Daily intentions',
    goalsHint: 'Intentions stay in this browser, just for you.',
    pomodoro: 'Focus minutes',
    pages: 'Reading pages',
    reviews: 'Flashcard reviews',
    language: 'Language',
    appearance: 'Appearance',
    theme: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    save: 'Save profile',
    saved: 'Changes saved.',
    storageRead: 'Your profile could not be read. Defaults are shown; check browser storage.',
    storageWrite: 'Your profile could not be saved. Check that browser storage is available.',
    stats: 'Your traces',
    activeDays: 'Active days',
    focusHours: 'Focus hours',
    booksFinished: 'Books finished',
    mastered: 'Cards mastered',
    loading: 'Loading your data',
    noData: 'No data yet',
    refresh: 'Try again',
    exports: 'Take your memories with you',
    exportsHint: 'Save journal entries, book notes, goals, tasks, focus sessions, and flashcards as JSON or CSV.',
    json: 'JSON copy',
    csv: 'CSV table',
    preparing: 'Preparing',
    exported: 'File downloaded.',
    exportError: 'The export could not be prepared. Try again.',
    dataError: 'Some measurements could not be loaded.',
    dataUnavailable: 'Not available yet',
    localStorageError: 'Local data could not be read. Check your browser storage.',
    entries: 'entries',
    photos: 'photos',
    books: 'books',
    cards: 'cards',
    activeDaysHint: 'Days with at least one journal entry.',
    avatarOptions: { sunrise: 'Sunrise', leaf: 'Leaf', moon: 'Moon', ink: 'Ink', horizon: 'Horizon' },
  },
  ru: {
    eyebrow: 'Тихое пространство',
    title: 'Личный профиль.',
    intro: 'Настройте то, каким будет ваш дневник при каждом возвращении.',
    identity: 'О вас',
    identityHint: 'Имя и короткая фраза, которая помогает возвращаться к своим дням.',
    displayName: 'Отображаемое имя',
    displayNameHint: 'Это имя будет видно внутри дневника.',
    motto: 'Личный девиз',
    mottoHint: 'Короткая мысль, которую хочется сохранить сегодня.',
    avatar: 'Цвет аватара',
    avatarHint: 'Выберите близкий вам оттенок.',
    account: 'Аккаунт',
    email: 'Электронная почта',
    goals: 'Ежедневные цели',
    goalsHint: 'Цели хранятся только в этом браузере.',
    pomodoro: 'Минуты фокуса',
    pages: 'Страницы чтения',
    reviews: 'Повторения карточек',
    language: 'Язык',
    appearance: 'Вид',
    theme: 'Тема',
    system: 'Системная',
    light: 'Светлая',
    dark: 'Тёмная',
    save: 'Сохранить профиль',
    saved: 'Изменения сохранены.',
    storageRead: 'Профиль не удалось прочитать. Показаны значения по умолчанию; проверьте хранилище.',
    storageWrite: 'Профиль не удалось сохранить. Проверьте доступность хранилища браузера.',
    stats: 'Ваши следы',
    activeDays: 'Активные дни',
    focusHours: 'Часы фокуса',
    booksFinished: 'Прочитанные книги',
    mastered: 'Освоенные карточки',
    loading: 'Загружаем ваши данные',
    noData: 'Данных пока нет',
    refresh: 'Повторить',
    exports: 'Заберите свои воспоминания',
    exportsHint: 'Сохраните дневник, заметки о книгах, цели, задачи, сеансы фокуса и карточки в формате JSON или CSV.',
    json: 'Копия JSON',
    csv: 'Таблица CSV',
    preparing: 'Подготовка',
    exported: 'Файл скачан.',
    exportError: 'Не удалось подготовить экспорт. Попробуйте снова.',
    dataError: 'Некоторые показатели не загрузились.',
    dataUnavailable: 'Пока недоступно',
    localStorageError: 'Локальные данные не удалось прочитать. Проверьте хранилище браузера.',
    entries: 'записей',
    photos: 'фото',
    books: 'книг',
    cards: 'карточек',
    activeDaysHint: 'Дни хотя бы с одной записью в дневнике.',
    avatarOptions: { sunrise: 'Рассвет', leaf: 'Лист', moon: 'Луна', ink: 'Чернила', horizon: 'Горизонт' },
  },
  ko: {
    eyebrow: '고요한 공간',
    title: '개인 프로필.',
    intro: '다시 돌아왔을 때 일기가 어떤 느낌일지 정해 보세요.',
    identity: '나에 대해',
    identityHint: '나의 하루로 돌아오게 해 주는 이름과 짧은 문장입니다.',
    displayName: '표시 이름',
    displayNameHint: '일기 안에서 이 이름이 사용됩니다.',
    motto: '개인 문장',
    mottoHint: '오늘 가까이 두고 싶은 짧은 생각입니다.',
    avatar: '아바타 색감',
    avatarHint: '나와 닮은 색을 골라 보세요.',
    account: '계정',
    email: '이메일 주소',
    goals: '하루 목표',
    goalsHint: '목표는 이 브라우저에만 저장됩니다.',
    pomodoro: '집중 시간(분)',
    pages: '읽을 페이지',
    reviews: '카드 복습',
    language: '언어',
    appearance: '화면',
    theme: '테마',
    system: '시스템',
    light: '밝게',
    dark: '어둡게',
    save: '프로필 저장',
    saved: '변경 사항이 저장되었습니다.',
    storageRead: '프로필을 읽지 못했습니다. 기본값을 표시했습니다. 브라우저 저장 공간을 확인하세요.',
    storageWrite: '프로필을 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.',
    stats: '나의 기록',
    activeDays: '활동한 날',
    focusHours: '집중 시간',
    booksFinished: '읽은 책',
    mastered: '익힌 카드',
    loading: '데이터를 불러오는 중',
    noData: '아직 데이터가 없습니다',
    refresh: '다시 시도',
    exports: '기억을 가져가세요',
    exportsHint: '일기, 독서 메모, 목표, 작업, 집중 세션과 플래시카드를 JSON 또는 CSV로 저장합니다.',
    json: 'JSON 사본',
    csv: 'CSV 표',
    preparing: '준비 중',
    exported: '파일을 다운로드했습니다.',
    exportError: '내보내기를 준비하지 못했습니다. 다시 시도하세요.',
    dataError: '일부 통계를 불러오지 못했습니다.',
    dataUnavailable: '아직 없음',
    localStorageError: '로컬 데이터를 읽지 못했습니다. 브라우저 저장 공간을 확인하세요.',
    entries: '기록',
    photos: '사진',
    books: '권',
    cards: '카드',
    activeDaysHint: '일기 기록이 하나 이상 있는 날짜 수입니다.',
    avatarOptions: { sunrise: '일출', leaf: '잎', moon: '달', ink: '잉크', horizon: '수평선' },
  },
};

const AVATARS: Array<{ value: AvatarPreset; className: string; icon: typeof Sun }> = [
  { value: 'sunrise', className: 'bg-[#d9a441] text-[#4a3520]', icon: Sun },
  { value: 'leaf', className: 'bg-[#8eb59c] text-[#244c3e]', icon: Leaf },
  { value: 'moon', className: 'bg-[#77739a] text-[#f3eee1]', icon: Moon },
  { value: 'ink', className: 'bg-[#4c3b5e] text-[#f4e8c7]', icon: UserCircle2 },
  { value: 'horizon', className: 'bg-[#c78665] text-[#4c2c29]', icon: Sun },
];

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return `"${text.replaceAll('"', '""').replace(/\r?\n/g, ' ')}"`;
}

function csvTimestamp(value: unknown) {
  if (typeof value === 'string' && Number.isNaN(Number(value))) return value;
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp).toISOString() : '';
}

function buildCsv(
  backup: { entries: unknown[] },
  books: TrackedBook[],
  cards: RepetitionCard[],
  goals: PersonalGoal[],
  focus: FocusWorkspaceData,
  reviewActivity: ReadonlyArray<{ reviewedOn: string; count: number }>,
) {
  const headers = ['record_type', 'id', 'parent_id', 'title', 'date', 'content', 'details_json'];
  const rows: unknown[][] = [headers];
  backup.entries.forEach((entry) => {
    const item = entry as Record<string, unknown>;
    const photoCount = Array.isArray(item.photos) ? item.photos.length : 0;
    rows.push(['journal', item.id, '', item.title, item.entryDate, item.content, { folder: item.folder, mood: item.mood, tags: item.tags, photoCount, favorite: item.favorite }]);
  });
  books.forEach((book) => {
    rows.push(['book', book.id, '', book.title, '', book.takeaways, { author: book.author, status: book.status, quotes: book.quotes }]);
  });
  goals.forEach((goal) => {
    rows.push(['goal', goal.id, '', goal.title, goal.targetDate, goal.description, {
      horizon: goal.horizon,
      category: goal.category,
      motivation: goal.motivation,
      metric: goal.metric,
      metricTarget: goal.metricTarget,
      metricCurrent: goal.metricCurrent,
      metricUnit: goal.metricUnit,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }]);
    goal.tasks.forEach((task) => {
      rows.push(['goal_task', task.id, goal.id, task.text, '', '', { done: task.done, goalTitle: goal.title }]);
    });
  });
  focus.tasks.forEach((task) => {
    rows.push(['focus_task', task.id, '', task.title, csvTimestamp(task.completedAt ?? task.createdAt), task.project, task]);
  });
  focus.sessions.forEach((session) => {
    rows.push(['focus_session', session.id, session.taskId, session.mode, csvTimestamp(session.startedAt), session.project, session]);
  });
  cards.forEach((card) => {
    rows.push(['flashcard', card.id, '', card.front, card.lastReviewedAt, card.back, {
      deckName: card.deckName,
      dueAt: card.dueAt,
      learnedAt: card.learnedAt,
      repetitions: card.repetitions,
      lapses: card.lapses,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
    }]);
  });
  reviewActivity.forEach((day) => {
    rows.push(['flashcard_review_day', '', '', '', day.reviewedOn, '', { count: day.count }]);
  });
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

function MetricCard({ label, value, accent, testId, hint }: { label: string; value: string; accent: string; testId: string; hint?: string }) {
  return (
    <div className={`rounded-[22px] border p-4 ${accent}`} data-testid={testId}>
      <p className="font-mono text-[9px] uppercase tracking-[.14em] opacity-75">{label}</p>
      <p className="mt-3 font-serif text-[clamp(2rem,5vw,3rem)] leading-none">{value}</p>
      {hint && <p className="mt-2 text-[10px] leading-relaxed opacity-75">{hint}</p>}
    </div>
  );
}

export function ProfilePage() {
  const { isLoaded, user } = useUser();
  const { language, setLanguage } = useI18n();
  const text = COPY[language];
  const [preferences, setPreferences] = useState<ProfilePreferences>(DEFAULT_PROFILE_PREFERENCES);
  const [profileReady, setProfileReady] = useState(false);
  const [profileUserId, setProfileUserId] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [books, setBooks] = useState<TrackedBook[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [booksStorageError, setBooksStorageError] = useState(false);
  const [goalsStorageError, setGoalsStorageError] = useState(false);
  const [focusStorageError, setFocusStorageError] = useState(false);
  const [exporting, setExporting] = useState<'json' | 'csv' | ''>('');
  const form = useForm<ProfileFormValues>({ defaultValues: DEFAULT_PROFILE_PREFERENCES });
  const selectedAvatar = useWatch({ control: form.control, name: 'avatarPreset' });
  const selectedTheme = useWatch({ control: form.control, name: 'theme' });
  const summary = useGetDiarySummary();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const repetitionStats = useGetRepetitionStats({ timeZone });
  const cardsQuery = useListRepetitionCards();
  const backupQuery = useDownloadDiaryBackup({ query: { enabled: false, queryKey: getDownloadDiaryBackupQueryKey() } });

  useEffect(() => {
    if (!user?.id) return;
    setProfileReady(false);
    setBooksStorageError(false);
    setGoalsStorageError(false);
    setFocusStorageError(false);
    const stored = readProfilePreferences(user.id);
    const next = { ...stored.value, displayName: stored.value.displayName || user.firstName || '' };
    setPreferences(next);
    form.reset(next);
    setProfileReady(true);
    setStorageMessage(stored.error ? text.storageRead : '');
    const storedBooks = (() => {
      try {
        const raw = window.localStorage.getItem(userStorageKey('books', user.id));
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (!isTrackedBookList(parsed)) {
          setBooksStorageError(true);
          return [];
        }
        return parsed;
      } catch {
        setBooksStorageError(true);
        return [];
      }
    })();
    setBooks(storedBooks);
    try {
      const raw = window.localStorage.getItem(userStorageKey('goals', user.id));
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!isPersonalGoalList(parsed)) setGoalsStorageError(true);
    } catch {
      setGoalsStorageError(true);
    }
    const focus = readFocusWorkspace(user.id);
    setFocusMinutes(getRecordedFocusMinutes(focus.data));
    if (focus.error) setFocusStorageError(true);
    setProfileUserId(user.id);
    setProfileReady(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    applyThemePreference(selectedTheme ?? preferences.theme);
  }, [selectedTheme, user?.id]);

  useEffect(() => {
    const currentLanguage = form.getValues('language');
    if (currentLanguage !== language) form.setValue('language', language, { shouldDirty: false });
  }, [form, language]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const syncPreferences = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId !== user.id) return;
      const next = readProfilePreferences(user.id).value;
      setPreferences(next);
      form.setValue('language', next.language, { shouldDirty: false });
      form.setValue('theme', next.theme, { shouldDirty: false });
    };
    window.addEventListener('kundalik-profile-preferences', syncPreferences);
    return () => window.removeEventListener('kundalik-profile-preferences', syncPreferences);
  }, [form, user?.id]);

  const finishedBooks = useMemo(() => books.filter((book) => book.status === 'finished').length, [books]);
  const statsError = summary.isError || repetitionStats.isError || cardsQuery.isError;
  const statsLoading = summary.isLoading || repetitionStats.isLoading || cardsQuery.isLoading;

  if (!isLoaded || !user || !profileReady || profileUserId !== user.id) {
    return <DiaryShell><div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 lg:px-14"><div className="skeleton h-3 w-28 rounded-full" /><div className="skeleton mt-5 h-16 w-3/4 max-w-xl rounded-2xl" /><div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="skeleton min-h-[480px] rounded-[28px]" /><div className="skeleton min-h-[260px] rounded-[28px]" /></div></div></DiaryShell>;
  }

  const saveProfile = form.handleSubmit((values) => {
    const next = {
      ...values,
      displayName: values.displayName.trim(),
      motto: values.motto.trim(),
      goals: {
        pomodoroMinutes: Math.min(10000, Math.max(0, Math.round(Number(values.goals.pomodoroMinutes) || 0))),
        readingPages: Math.min(10000, Math.max(0, Math.round(Number(values.goals.readingPages) || 0))),
        flashcardReviews: Math.min(10000, Math.max(0, Math.round(Number(values.goals.flashcardReviews) || 0))),
      },
    };
    if (!writeProfilePreferences(user.id, next)) {
      setStorageMessage(text.storageWrite);
      return;
    }
    setPreferences(next);
    form.reset(next);
    setLanguage(next.language);
    applyThemePreference(next.theme);
    setStorageMessage('');
    setNotice(text.saved);
    window.setTimeout(() => setNotice(''), 2800);
  });

  const exportData = async (kind: 'json' | 'csv') => {
    if (booksStorageError || goalsStorageError || focusStorageError) {
      setNotice(text.exportError);
      return;
    }
    setExporting(kind);
    try {
      const [backupResult, cardsResult, statsResult] = await Promise.all([
        backupQuery.refetch(),
        cardsQuery.refetch(),
        repetitionStats.refetch(),
      ]);
      if (!backupResult.data || !cardsResult.data || !statsResult.data) throw new Error('export-data-unavailable');
      const currentFocus = readFocusWorkspace(user.id);
      const rawGoals = window.localStorage.getItem(userStorageKey('goals', user.id));
      const parsedGoals: unknown = rawGoals ? JSON.parse(rawGoals) : [];
      if (currentFocus.error || !isPersonalGoalList(parsedGoals)) throw new Error('local-data-unavailable');
      const exportedGoals = parsedGoals;
      const payload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        diary: backupResult.data,
        books,
        goals: exportedGoals,
        focusWorkspace: currentFocus.data,
        flashcards: cardsResult.data,
        flashcardReviewActivity: statsResult.data.reviewActivity,
      };
      if (kind === 'json') {
        downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), 'shaxsiy-kundalik-profil.json');
      } else {
        downloadBlob(new Blob([buildCsv(
          backupResult.data,
          books,
          cardsResult.data,
          exportedGoals,
          currentFocus.data,
          statsResult.data.reviewActivity,
        )], { type: 'text/csv;charset=utf-8' }), 'shaxsiy-kundalik-profil.csv');
      }
      setNotice(text.exported);
    } catch {
      setNotice(text.exportError);
    } finally {
      setExporting('');
    }
  };

  return (
    <DiaryShell>
      <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 md:px-10 lg:px-14 lg:py-12">
        <header className="diary-rise">
          <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#9a6b23]">{text.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[clamp(3.2rem,7vw,6.5rem)] leading-[.88] tracking-[-.055em] text-primary">{text.title}</h1>
          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-muted-foreground">{text.intro}</p>
        </header>

        {storageMessage && <div className="mt-6 rounded-2xl border border-[#ecc6bd] bg-[#fff0ec] px-4 py-3 text-[12px] text-[#8f3f2d]" role="alert" data-testid="status-profile-storage-error">{storageMessage}</div>}
        {(booksStorageError || goalsStorageError || focusStorageError) && <div className="mt-4 rounded-2xl border border-[#e3d3a8] bg-[#faf3df] px-4 py-3 text-[12px] text-[#765a27]" role="alert" data-testid="status-local-data-error">{text.localStorageError}</div>}

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
          <section className="rounded-[28px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="section-profile-form">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e7def0] text-[#5b3f69]"><UserCircle2 size={23} strokeWidth={1.5} /></span>
              <div><h2 className="font-serif text-[29px] leading-none">{text.identity}</h2><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{text.identityHint}</p></div>
            </div>
            <Form {...form}>
              <form onSubmit={saveProfile} className="mt-7 space-y-6">
                <FormField control={form.control} name="displayName" rules={{ maxLength: { value: 80, message: text.displayName } }} render={({ field }) => (
                  <FormItem><FormLabel>{text.displayName}</FormLabel><FormControl><Input {...field} maxLength={80} placeholder={user.firstName || text.displayName} data-testid="input-profile-display-name" /></FormControl><p className="text-[11px] text-muted-foreground">{text.displayNameHint}</p><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="motto" render={({ field }) => (
                  <FormItem><FormLabel>{text.motto}</FormLabel><FormControl><textarea {...field} maxLength={180} rows={3} className="flex w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring" placeholder={text.mottoHint} data-testid="input-profile-motto" /></FormControl><p className="text-[11px] text-muted-foreground">{text.mottoHint}</p><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="avatarPreset" render={({ field }) => (
                  <FormItem><FormLabel>{text.avatar}</FormLabel><p className="text-[11px] text-muted-foreground">{text.avatarHint}</p><FormControl><div className="mt-1 flex flex-wrap gap-2" data-testid="group-profile-avatar">
                    {AVATARS.map(({ value, className, icon: Icon }) => <button key={value} type="button" onClick={() => field.onChange(value)} aria-pressed={selectedAvatar === value} aria-label={text.avatarOptions[value]} title={text.avatarOptions[value]} className={`grid size-12 place-items-center rounded-2xl transition-transform hover:-translate-y-0.5 ${className} ${selectedAvatar === value ? 'ring-4 ring-[#d9a441]/35 ring-offset-2 ring-offset-card' : 'opacity-65'}`} data-testid={`button-avatar-${value}`}><Icon size={19} strokeWidth={1.6} /></button>)}
                  </div></FormControl><FormMessage /></FormItem>
                )} />
                <div className="border-t border-border pt-5"><p className="text-[12px] font-semibold">{text.account}</p><p className="mt-2 break-all rounded-xl bg-muted px-3 py-2.5 text-[13px] text-muted-foreground" data-testid="text-profile-email">{user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? text.dataUnavailable}</p><p className="mt-2 text-[10px] text-muted-foreground">{text.email}</p></div>
                <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-[12px] font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60" disabled={form.formState.isSubmitting} data-testid="button-save-profile"><Save size={15} />{text.save}</button>
              </form>
            </Form>
          </section>

          <div className="space-y-5">
            <section className="rounded-[28px] border border-[#d8ccb0] bg-[#f7f0df] p-5 shadow-sm sm:p-7 dark:border-[#514832] dark:bg-[#2d291f]" data-testid="section-profile-goals">
              <h2 className="font-serif text-[28px] leading-none">{text.goals}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{text.goalsHint}</p>
              <Form {...form}><div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {([['pomodoroMinutes', text.pomodoro], ['readingPages', text.pages], ['flashcardReviews', text.reviews]] as const).map(([name, label]) => <FormField key={name} control={form.control} name={`goals.${name}`} render={({ field }) => <FormItem><FormLabel className="text-[11px]">{label}</FormLabel><FormControl><Input {...field} type="number" min={0} max={10000} onChange={(event) => field.onChange(Number(event.target.value))} data-testid={`input-goal-${name}`} /></FormControl><FormMessage /></FormItem>} />)}
              </div></Form>
              <p className="mt-5 border-t border-[#d8ccb0] pt-4 font-mono text-[9px] uppercase tracking-[.18em] text-[#9a6b23] dark:border-[#514832]">{text.appearance}</p>
              <Form {...form}><FormField control={form.control} name="language" render={({ field }) => <FormItem className="mt-5"><FormLabel className="text-[11px]">{text.language}</FormLabel><FormControl><select {...field} onChange={(event) => { field.onChange(event.target.value); setLanguage(event.target.value as AppLanguage); }} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" data-testid="select-profile-language"><option value="uz">UZ</option><option value="en">EN</option><option value="ru">RU</option><option value="ko">KO</option></select></FormControl><FormMessage /></FormItem>} /></Form>
              <Form {...form}><FormField control={form.control} name="theme" render={({ field }) => <FormItem className="mt-5"><FormLabel className="text-[11px]">{text.theme}</FormLabel><FormControl><div className="grid grid-cols-3 gap-2">{([['system', text.system], ['light', text.light], ['dark', text.dark]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => field.onChange(value as ThemePreference)} className={`rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-colors ${field.value === value ? 'border-[#b89c5c] bg-card text-foreground shadow-sm' : 'border-transparent bg-card/60 text-muted-foreground hover:text-foreground'}`} data-testid={`button-theme-${value}`}>{label}</button>)}</div></FormControl><FormMessage /></FormItem>} /></Form>
            </section>
          </div>
        </div>

        <section className="mt-5 rounded-[28px] border border-card-border bg-card p-5 shadow-sm sm:p-7" data-testid="section-profile-stats">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><h2 className="font-serif text-[31px] leading-none">{text.stats}</h2>{statsError && <button type="button" onClick={() => { void summary.refetch(); void repetitionStats.refetch(); void cardsQuery.refetch(); }} className="inline-flex min-h-9 items-center gap-2 self-start rounded-lg border border-border px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground sm:self-auto" data-testid="button-retry-profile-stats"><RefreshCw size={13} />{text.refresh}</button>}</div>
          {statsLoading ? <div className="mt-6 grid gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="skeleton h-28 rounded-[22px]" key={item} data-testid={`skeleton-profile-stat-${item}`} />)}</div> : <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
             <MetricCard label={text.activeDays} value={summary.data ? String(summary.data.activeDays) : '—'} hint={text.activeDaysHint} accent="border-[#d8c795] bg-[#faf3df] text-[#6b4e26] dark:border-[#5e5037] dark:bg-[#302a20] dark:text-[#eed9a1]" testId="stat-active-days" />
             <MetricCard label={text.focusHours} value={focusStorageError ? '—' : (focusMinutes / 60).toFixed(1)} accent="border-[#d9e5db] bg-[#f1f7f2] text-[#35614f] dark:border-[#3e5c4c] dark:bg-[#25372d] dark:text-[#b9d7c4]" testId="stat-focus-hours" />
             <MetricCard label={text.booksFinished} value={booksStorageError ? '—' : String(finishedBooks)} accent="border-[#e7def0] bg-[#f4eff7] text-[#5b3f69] dark:border-[#554565] dark:bg-[#30283a] dark:text-[#dec9e9]" testId="stat-books-finished" />
            <MetricCard label={text.mastered} value={repetitionStats.data ? String(repetitionStats.data.totalLearned) : '—'} accent="border-[#ecd3c7] bg-[#fff1eb] text-[#8f4f3c] dark:border-[#664237] dark:bg-[#3b2823] dark:text-[#efc5b5]" testId="stat-cards-mastered" />
          </div>}
          {statsError && <p className="mt-4 text-[11px] text-muted-foreground" role="status" data-testid="status-profile-stats-error">{text.dataError}</p>}
          {!statsLoading && !statsError && summary.data?.activeDays === 0 && focusMinutes === 0 && finishedBooks === 0 && (repetitionStats.data?.totalLearned ?? 0) === 0 && <p className="mt-4 text-[11px] text-muted-foreground" data-testid="status-profile-no-data">{text.noData}</p>}
        </section>

        <section className="mt-5 rounded-[28px] border border-[#d9e5db] bg-[#f1f7f2] p-5 shadow-sm dark:border-[#3e5c4c] dark:bg-[#25372d] sm:p-7" data-testid="section-profile-exports">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="max-w-xl"><h2 className="font-serif text-[30px] leading-none">{text.exports}</h2><p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{text.exportsHint}</p></div><Download className="hidden text-[#47796c] sm:block" size={25} strokeWidth={1.5} /></div>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-[#c9dfcf] pt-5 dark:border-[#416c55]"><button type="button" onClick={() => void exportData('json')} disabled={Boolean(exporting) || booksStorageError} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#47796c] px-4 py-3 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60" data-testid="button-profile-export-json"><FileJson size={16} />{exporting === 'json' ? `${text.preparing}…` : text.json}</button><button type="button" onClick={() => void exportData('csv')} disabled={Boolean(exporting) || booksStorageError} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#a7c6b0] bg-card/70 px-4 py-3 text-[12px] font-semibold text-[#35614f] transition-colors hover:bg-card disabled:opacity-60 dark:border-[#527a67] dark:text-[#b9d7c4]" data-testid="button-profile-export-csv"><FileSpreadsheet size={16} />{exporting === 'csv' ? `${text.preparing}…` : text.csv}</button></div>
          <p className="mt-4 text-[10px] text-muted-foreground">{text.entries}, {text.books}, {text.cards} · {text.photos}</p>
        </section>
      </div>
      {notice && <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex min-h-12 items-center justify-center rounded-2xl border border-[#c3ddcf] bg-[#edf6f0] px-5 py-3 text-center text-[13px] font-medium text-[#35614f] shadow-lg" role="status" data-testid="status-profile-feedback">{notice}</div>}
    </DiaryShell>
  );
}