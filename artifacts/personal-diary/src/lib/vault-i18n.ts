import type { AppLanguage } from '@/lib/i18n';

export type VaultCopy = {
  eyebrow: string;
  title: string;
  description: string;
  back: string;
  nav: string;
  setupKicker: string;
  setupTitle: string;
  setupDescription: string;
  separateNotice: string;
  loadFailedHint: string;
  pinChoice: string;
  passwordChoice: string;
  pinHint: string;
  passwordHint: string;
  credential: string;
  confirmCredential: string;
  pinPlaceholder: string;
  passwordPlaceholder: string;
  confirmPlaceholder: string;
  irreversible: string;
  irreversibleBody: string;
  acknowledge: string;
  loadFailedTitle: string;
  create: string;
  creating: string;
  lockedTitle: string;
  lockedDescription: string;
  unlock: string;
  unlocking: string;
  unlockCredential: string;
  lock: string;
  unlockedNotice: string;
  localOnly: string;
  addEntry: string;
  editEntry: string;
  cancel: string;
  save: string;
  saving: string;
  entries: string;
  emptyTitle: string;
  emptyDescription: string;
  category: string;
  titleField: string;
  titlePlaceholder: string;
  username: string;
  usernamePlaceholder: string;
  secret: string;
  secretPlaceholder: string;
  url: string;
  urlPlaceholder: string;
  notes: string;
  notesPlaceholder: string;
  reminder: string;
  noReminder: string;
  customFields: string;
  addField: string;
  fieldLabel: string;
  fieldValue: string;
  customFieldLabelRequired: string;
  sensitive: string;
  removeField: string;
  generate: string;
  reveal: string;
  hide: string;
  copy: string;
  copied: string;
  copyFailed: string;
  edit: string;
  delete: string;
  deleteConfirm: string;
  updated: string;
  reminderToday: string;
  reminderOverdue: string;
  reminderUpcoming: string;
  noUsername: string;
  changeCredential: string;
  changeCredentialTitle: string;
  changeCredentialDescription: string;
  currentType: string;
  newCredential: string;
  confirmNewCredential: string;
  change: string;
  changing: string;
  errors: Record<string, string>;
  categories: Record<'password' | 'bank-pin' | 'wifi-key' | 'secret-note' | 'api-recovery', string>;
};

const copy: Record<AppLanguage, VaultCopy> = {
  uz: {
    eyebrow: 'Alohida himoya',
    title: 'Maxfiy jild',
    description: 'Kundalikdan alohida, shu brauzerda shifrlangan ishonchli bo‘lim.',
    back: 'Shaxsiy rivojlanishga qaytish',
    nav: 'Maxfiy jild',
    setupKicker: 'Birinchi qadam',
    setupTitle: 'O‘zingiz uchun yopiq joy yarating',
    setupDescription: 'Bu himoya kundalik hisobingiz PIN-kodidan alohida. Ma’lumotlar faqat shu brauzerda shifrlanadi.',
    separateNotice: '4 xonali PIN qulay, ammo asosiy paroldan kuchsizroq. Kuchli asosiy parol yaxshiroq himoya beradi. Unutilgan credential tiklanmaydi.',
    loadFailedHint: 'Mavjud ma’lumot o‘zgartirilmadi. Brauzer xotirasini tekshirib, sahifani qayta yuklang.',
    pinChoice: '4 xonali PIN',
    passwordChoice: 'Asosiy parol',
    pinHint: 'Qulayroq, ammo kuchli asosiy paroldan kuchsizroq',
    passwordHint: 'Kamida 12 belgi, kuchliroq himoya',
    credential: 'Maxfiy credential',
    confirmCredential: 'Credentialni takrorlang',
    pinPlaceholder: 'Masalan, 4827',
    passwordPlaceholder: 'Kamida 12 belgidan iborat parol',
    confirmPlaceholder: 'Yana bir bor kiriting',
    irreversible: 'Qaytarib bo‘lmaydigan yo‘qotish haqida ogohlantirish',
    irreversibleBody: 'Parol yoki PIN unutilsa, bu ma’lumotlarni tiklash yo‘li yo‘q. Uni xavfsiz joyda saqlashingizga roziman.',
    acknowledge: 'Men bu ogohlantirishni tushundim',
    loadFailedTitle: 'Mavjud jildni yuklab bo‘lmadi',
    create: 'Maxfiy jildni yaratish',
    creating: 'Yaratilmoqda…',
    lockedTitle: 'Jild qulflangan',
    lockedDescription: 'Maxfiy ma’lumotlarni ko‘rish uchun jild credentialini kiriting.',
    unlock: 'Ochish',
    unlocking: 'Tekshirilmoqda…',
    unlockCredential: 'Credential',
    lock: 'Qulflash',
    unlockedNotice: 'Jild ochiq. Ma’lumotlar faqat shu qurilmada shifrlangan holda saqlanadi.',
    localOnly: 'Faqat shu brauzerda · serverga yuborilmaydi',
    addEntry: 'Yangi yozuv',
    editEntry: 'Yozuvni tahrirlash',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    saving: 'Shifrlanmoqda…',
    entries: 'yozuv',
    emptyTitle: 'Jild hozircha bo‘sh',
    emptyDescription: 'Parol, bank PIN-kodi, Wi-Fi kaliti yoki boshqa eslatmani shu yerda saqlang.',
    category: 'Toifa',
    titleField: 'Sarlavha',
    titlePlaceholder: 'Masalan, Ish elektron pochtasi',
    username: 'Login yoki email',
    usernamePlaceholder: 'name@example.com',
    secret: 'Maxfiy qiymat',
    secretPlaceholder: 'Parol, PIN yoki kod',
    url: 'Manzil',
    urlPlaceholder: 'https://…',
    notes: 'Izoh',
    notesPlaceholder: 'Kontekst yoki eslatma',
    reminder: 'Eslatma sanasi',
    noReminder: 'Sana belgilanmagan',
    customFields: 'Qo‘shimcha maydonlar',
    addField: 'Maydon qo‘shish',
    fieldLabel: 'Yorliq',
    fieldValue: 'Qiymat',
    customFieldLabelRequired: 'Qiymati bor har bir qo‘shimcha maydon uchun yorliq kiriting.',
    sensitive: 'Maxfiy',
    removeField: 'Maydonni olib tashlash',
    generate: 'Kuchli parol yaratish',
    reveal: 'Ko‘rsatish',
    hide: 'Yashirish',
    copy: 'Nusxalash',
    copied: 'Nusxalandi',
    copyFailed: 'Nusxalab bo‘lmadi. Qiymatni qo‘lda belgilang.',
    edit: 'Tahrirlash',
    delete: 'O‘chirish',
    deleteConfirm: 'Ushbu yozuvni butunlay o‘chirishni xohlaysizmi?',
    updated: 'Yangilangan',
    reminderToday: 'Bugun',
    reminderOverdue: 'Muddati o‘tgan',
    reminderUpcoming: 'Eslatma',
    noUsername: 'Login ko‘rsatilmagan',
    changeCredential: 'Credentialni almashtirish',
    changeCredentialTitle: 'Yangi himoya credentiali',
    changeCredentialDescription: 'Barcha yozuvlar yangi credential bilan qayta shifrlanadi.',
    currentType: 'Joriy turi',
    newCredential: 'Yangi credential',
    confirmNewCredential: 'Yangi credentialni takrorlang',
    change: 'Almashtirish',
    changing: 'Almashtirilmoqda…',
    errors: {
      'vault-crypto-unavailable': 'Bu brauzer xavfsiz shifrlashni qo‘llab-quvvatlamaydi.',
      'vault-storage-invalid': 'Maxfiy jild ma’lumoti yaroqsiz yoki buzilgan.',
      'vault-unlock-failed': 'Credential noto‘g‘ri yoki jild ma’lumoti ochilmadi.',
      'vault-credential-invalid': 'Credential tanlangan talabga mos kelmaydi.',
      'vault-entries-invalid': 'Jild yozuvlari yaroqsiz.',
      storage: 'Jildni saqlab bo‘lmadi. Brauzer xotirasi to‘lgan bo‘lishi mumkin.',
      generic: 'Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring.',
    },
    categories: { password: 'Parol', 'bank-pin': 'Bank PIN-kodi', 'wifi-key': 'Wi-Fi kaliti', 'secret-note': 'Maxfiy eslatma', 'api-recovery': 'API / tiklash kodi' },
  },
  en: {
    eyebrow: 'Separate protection',
    title: 'Private vault',
    description: 'A dependable compartment, encrypted in this browser and separate from your diary account.',
    back: 'Back to Personal Development',
    nav: 'Private vault',
    setupKicker: 'First step',
    setupTitle: 'Make a room only you can open',
    setupDescription: 'This protection is separate from your diary account PIN. Everything is encrypted in this browser.',
    separateNotice: 'A 4-digit PIN is convenient but weaker than a strong master password. You can change the credential later, but a forgotten one cannot be recovered.',
    loadFailedHint: 'Existing data was not changed. Check browser storage and reload the page.',
    pinChoice: '4-digit PIN',
    passwordChoice: 'Master password',
    pinHint: 'Convenient, but weaker than a strong master password',
    passwordHint: 'At least 12 characters, stronger protection',
    credential: 'Vault credential',
    confirmCredential: 'Confirm credential',
    pinPlaceholder: 'For example, 4827',
    passwordPlaceholder: 'At least 12 characters',
    confirmPlaceholder: 'Enter it once more',
    irreversible: 'Irrecoverable loss warning',
    irreversibleBody: 'If you forget this password or PIN, there is no recovery path for these records. I will keep it somewhere safe.',
    acknowledge: 'I understand this warning',
    loadFailedTitle: 'Could not load the existing vault',
    create: 'Create private vault',
    creating: 'Creating…',
    lockedTitle: 'Vault locked',
    lockedDescription: 'Enter the vault credential to view your private records.',
    unlock: 'Unlock',
    unlocking: 'Checking…',
    unlockCredential: 'Credential',
    lock: 'Lock',
    unlockedNotice: 'Vault unlocked. Records stay encrypted on this device only.',
    localOnly: 'This browser only · never sent to a server',
    addEntry: 'New record',
    editEntry: 'Edit record',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Encrypting…',
    entries: 'records',
    emptyTitle: 'Your vault is quiet',
    emptyDescription: 'Keep a password, bank PIN, Wi-Fi key, recovery code, or private note here.',
    category: 'Category',
    titleField: 'Title',
    titlePlaceholder: 'For example, Work email',
    username: 'Username or email',
    usernamePlaceholder: 'name@example.com',
    secret: 'Secret value',
    secretPlaceholder: 'Password, PIN, or code',
    url: 'Website',
    urlPlaceholder: 'https://…',
    notes: 'Notes',
    notesPlaceholder: 'Context or a small reminder',
    reminder: 'Reminder date',
    noReminder: 'No date set',
    customFields: 'Custom fields',
    addField: 'Add field',
    fieldLabel: 'Label',
    fieldValue: 'Value',
    customFieldLabelRequired: 'Add a label to every custom field that has a value.',
    sensitive: 'Sensitive',
    removeField: 'Remove field',
    generate: 'Generate strong password',
    reveal: 'Reveal',
    hide: 'Hide',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Could not copy. Select the value manually.',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Delete this record permanently?',
    updated: 'Updated',
    reminderToday: 'Today',
    reminderOverdue: 'Overdue',
    reminderUpcoming: 'Reminder',
    noUsername: 'No username added',
    changeCredential: 'Change credential',
    changeCredentialTitle: 'New vault credential',
    changeCredentialDescription: 'Every record will be encrypted again with the new credential.',
    currentType: 'Current type',
    newCredential: 'New credential',
    confirmNewCredential: 'Confirm new credential',
    change: 'Change',
    changing: 'Changing…',
    errors: {
      'vault-crypto-unavailable': 'This browser does not support secure encryption.',
      'vault-storage-invalid': 'The vault data is invalid or damaged.',
      'vault-unlock-failed': 'The credential is incorrect or the vault could not be opened.',
      'vault-credential-invalid': 'The credential does not meet the selected requirements.',
      'vault-entries-invalid': 'The vault records are invalid.',
      storage: 'Could not save the vault. Browser storage may be full.',
      generic: 'That action could not be completed. Please try again.',
    },
    categories: { password: 'Password', 'bank-pin': 'Bank PIN', 'wifi-key': 'Wi-Fi key', 'secret-note': 'Private note', 'api-recovery': 'API / recovery code' },
  },
  ru: {
    eyebrow: 'Отдельная защита',
    title: 'Личный сейф',
    description: 'Надёжное отделение дневника: данные шифруются в этом браузере отдельно от PIN аккаунта.',
    back: 'Вернуться к личностному росту',
    nav: 'Личный сейф',
    setupKicker: 'Первый шаг',
    setupTitle: 'Создайте место только для себя',
    setupDescription: 'Эта защита не связана с PIN дневника. Данные шифруются только в этом браузере.',
    separateNotice: 'PIN из 4 цифр удобен, но слабее надёжного мастер-пароля. Ключ можно сменить, но забытый восстановить нельзя.',
    loadFailedHint: 'Существующие данные не изменены. Проверьте хранилище браузера и перезагрузите страницу.',
    pinChoice: 'PIN из 4 цифр',
    passwordChoice: 'Мастер-пароль',
    pinHint: 'Удобнее, но слабее надёжного мастер-пароля',
    passwordHint: 'Минимум 12 символов, более сильная защита',
    credential: 'Ключ сейфа',
    confirmCredential: 'Повторите ключ',
    pinPlaceholder: 'Например, 4827',
    passwordPlaceholder: 'Не менее 12 символов',
    confirmPlaceholder: 'Введите ещё раз',
    irreversible: 'Предупреждение о невозвратной потере',
    irreversibleBody: 'Если вы забудете пароль или PIN, восстановить записи будет невозможно. Я сохраню ключ в безопасном месте.',
    acknowledge: 'Я понимаю это предупреждение',
    loadFailedTitle: 'Не удалось загрузить существующий сейф',
    create: 'Создать сейф',
    creating: 'Создание…',
    lockedTitle: 'Сейф закрыт',
    lockedDescription: 'Введите ключ сейфа, чтобы увидеть личные записи.',
    unlock: 'Открыть',
    unlocking: 'Проверка…',
    unlockCredential: 'Ключ',
    lock: 'Закрыть',
    unlockedNotice: 'Сейф открыт. Записи зашифрованы только на этом устройстве.',
    localOnly: 'Только этот браузер · на сервер не отправляется',
    addEntry: 'Новая запись',
    editEntry: 'Изменить запись',
    cancel: 'Отмена',
    save: 'Сохранить',
    saving: 'Шифрование…',
    entries: 'записей',
    emptyTitle: 'Сейф пока пуст',
    emptyDescription: 'Храните здесь пароль, PIN банка, ключ Wi-Fi, код восстановления или личную заметку.',
    category: 'Категория',
    titleField: 'Название',
    titlePlaceholder: 'Например, рабочая почта',
    username: 'Логин или email',
    usernamePlaceholder: 'name@example.com',
    secret: 'Секретное значение',
    secretPlaceholder: 'Пароль, PIN или код',
    url: 'Сайт',
    urlPlaceholder: 'https://…',
    notes: 'Заметки',
    notesPlaceholder: 'Контекст или напоминание',
    reminder: 'Дата напоминания',
    noReminder: 'Дата не задана',
    customFields: 'Дополнительные поля',
    addField: 'Добавить поле',
    fieldLabel: 'Название',
    fieldValue: 'Значение',
    customFieldLabelRequired: 'Укажите название для каждого заполненного дополнительного поля.',
    sensitive: 'Секретное',
    removeField: 'Удалить поле',
    generate: 'Создать сильный пароль',
    reveal: 'Показать',
    hide: 'Скрыть',
    copy: 'Копировать',
    copied: 'Скопировано',
    copyFailed: 'Не удалось скопировать. Выделите значение вручную.',
    edit: 'Изменить',
    delete: 'Удалить',
    deleteConfirm: 'Удалить эту запись навсегда?',
    updated: 'Обновлено',
    reminderToday: 'Сегодня',
    reminderOverdue: 'Просрочено',
    reminderUpcoming: 'Напоминание',
    noUsername: 'Логин не указан',
    changeCredential: 'Сменить ключ',
    changeCredentialTitle: 'Новый ключ сейфа',
    changeCredentialDescription: 'Все записи будут заново зашифрованы новым ключом.',
    currentType: 'Текущий тип',
    newCredential: 'Новый ключ',
    confirmNewCredential: 'Повторите новый ключ',
    change: 'Сменить',
    changing: 'Смена…',
    errors: {
      'vault-crypto-unavailable': 'Этот браузер не поддерживает безопасное шифрование.',
      'vault-storage-invalid': 'Данные сейфа недействительны или повреждены.',
      'vault-unlock-failed': 'Неверный ключ или сейф не удалось открыть.',
      'vault-credential-invalid': 'Ключ не соответствует выбранным требованиям.',
      'vault-entries-invalid': 'Записи сейфа недействительны.',
      storage: 'Не удалось сохранить сейф. Возможно, хранилище браузера заполнено.',
      generic: 'Не удалось выполнить действие. Попробуйте ещё раз.',
    },
    categories: { password: 'Пароль', 'bank-pin': 'PIN банка', 'wifi-key': 'Ключ Wi-Fi', 'secret-note': 'Личная заметка', 'api-recovery': 'API / код восстановления' },
  },
  ko: {
    eyebrow: '별도 보호',
    title: '개인 보관함',
    description: '일기 계정 PIN과 분리되어 이 브라우저에서 암호화되는 믿을 수 있는 공간입니다.',
    back: '자기계발로 돌아가기',
    nav: '개인 보관함',
    setupKicker: '첫 단계',
    setupTitle: '나만 열 수 있는 공간을 만드세요',
    setupDescription: '일기 계정 PIN과 별개의 보호 수단입니다. 모든 데이터는 이 브라우저에서 암호화됩니다.',
    separateNotice: '4자리 PIN은 편리하지만 강력한 마스터 비밀번호보다 보안이 약합니다. 나중에 바꿀 수 있지만 잊어버린 자격 증명은 복구할 수 없습니다.',
    loadFailedHint: '기존 데이터는 변경되지 않았습니다. 브라우저 저장 공간을 확인한 뒤 페이지를 새로고침하세요.',
    pinChoice: '4자리 PIN',
    passwordChoice: '마스터 비밀번호',
    pinHint: '편리하지만 강력한 마스터 비밀번호보다 보안이 약함',
    passwordHint: '최소 12자, 더 강한 보호',
    credential: '보관함 자격 증명',
    confirmCredential: '자격 증명 확인',
    pinPlaceholder: '예: 4827',
    passwordPlaceholder: '12자 이상의 비밀번호',
    confirmPlaceholder: '한 번 더 입력하세요',
    irreversible: '복구 불가 손실 경고',
    irreversibleBody: '비밀번호나 PIN을 잊으면 기록을 복구할 방법이 없습니다. 안전한 곳에 보관하겠습니다.',
    acknowledge: '이 경고를 이해했습니다',
    loadFailedTitle: '기존 보관함을 불러오지 못했습니다',
    create: '개인 보관함 만들기',
    creating: '만드는 중…',
    lockedTitle: '보관함 잠김',
    lockedDescription: '개인 기록을 보려면 보관함 자격 증명을 입력하세요.',
    unlock: '잠금 해제',
    unlocking: '확인 중…',
    unlockCredential: '자격 증명',
    lock: '잠그기',
    unlockedNotice: '보관함이 열렸습니다. 기록은 이 기기에만 암호화되어 저장됩니다.',
    localOnly: '이 브라우저에서만 · 서버로 전송되지 않음',
    addEntry: '새 기록',
    editEntry: '기록 수정',
    cancel: '취소',
    save: '저장',
    saving: '암호화 중…',
    entries: '개 기록',
    emptyTitle: '보관함이 비어 있습니다',
    emptyDescription: '비밀번호, 은행 PIN, Wi-Fi 키, 복구 코드 또는 개인 메모를 보관하세요.',
    category: '분류',
    titleField: '제목',
    titlePlaceholder: '예: 회사 이메일',
    username: '사용자 이름 또는 이메일',
    usernamePlaceholder: 'name@example.com',
    secret: '비밀 값',
    secretPlaceholder: '비밀번호, PIN 또는 코드',
    url: '웹사이트',
    urlPlaceholder: 'https://…',
    notes: '메모',
    notesPlaceholder: '맥락 또는 작은 알림',
    reminder: '알림 날짜',
    noReminder: '날짜 없음',
    customFields: '사용자 지정 필드',
    addField: '필드 추가',
    fieldLabel: '레이블',
    fieldValue: '값',
    customFieldLabelRequired: '값을 입력한 사용자 지정 필드마다 레이블을 입력하세요.',
    sensitive: '민감 정보',
    removeField: '필드 삭제',
    generate: '강력한 비밀번호 생성',
    reveal: '표시',
    hide: '숨기기',
    copy: '복사',
    copied: '복사됨',
    copyFailed: '복사하지 못했습니다. 값을 직접 선택하세요.',
    edit: '수정',
    delete: '삭제',
    deleteConfirm: '이 기록을 영구적으로 삭제할까요?',
    updated: '업데이트',
    reminderToday: '오늘',
    reminderOverdue: '기한 지남',
    reminderUpcoming: '알림',
    noUsername: '사용자 이름 없음',
    changeCredential: '자격 증명 변경',
    changeCredentialTitle: '새 보관함 자격 증명',
    changeCredentialDescription: '모든 기록이 새 자격 증명으로 다시 암호화됩니다.',
    currentType: '현재 유형',
    newCredential: '새 자격 증명',
    confirmNewCredential: '새 자격 증명 확인',
    change: '변경',
    changing: '변경 중…',
    errors: {
      'vault-crypto-unavailable': '이 브라우저는 안전한 암호화를 지원하지 않습니다.',
      'vault-storage-invalid': '보관함 데이터가 올바르지 않거나 손상되었습니다.',
      'vault-unlock-failed': '자격 증명이 올바르지 않거나 보관함을 열 수 없습니다.',
      'vault-credential-invalid': '자격 증명이 선택한 조건을 충족하지 않습니다.',
      'vault-entries-invalid': '보관함 기록이 올바르지 않습니다.',
      storage: '보관함을 저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.',
      generic: '작업을 완료하지 못했습니다. 다시 시도하세요.',
    },
    categories: { password: '비밀번호', 'bank-pin': '은행 PIN', 'wifi-key': 'Wi-Fi 키', 'secret-note': '개인 메모', 'api-recovery': 'API / 복구 코드' },
  },
};

export function getVaultCopy(language: AppLanguage): VaultCopy {
  return copy[language];
}

export function vaultNavigationLabel(language: AppLanguage): string {
  return copy[language].nav;
}