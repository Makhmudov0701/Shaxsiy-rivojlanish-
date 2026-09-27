import { useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Brain,
  CircleAlert,
  Focus,
  HeartPulse,
  Lightbulb,
  LockKeyhole,
  Quote,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useLocalModuleStorage } from "@/lib/local-module-storage";
import type { AppLanguage } from "@/lib/i18n";

type Localized = Record<AppLanguage, string>;
type InsightCategory = "memory" | "focus" | "health" | "facts";
type Filter = InsightCategory | "saved" | "all";

type Insight = {
  id: string;
  category: InsightCategory;
  title: Localized;
  content: Localized;
  source?: { label: Localized; href: string };
};

const text = (uz: string, en: string, ru: string, ko: string): Localized => ({ uz, en, ru, ko });

const SOURCES = {
  spacing: {
    label: text("Cepeda va boshq. (2006)", "Cepeda et al. (2006)", "Cepeda и др. (2006)", "Cepeda 외 (2006)"),
    href: "https://doi.org/10.1037/0033-2909.132.3.354",
  },
  retrieval: {
    label: text("Roediger va Karpicke (2006)", "Roediger & Karpicke (2006)", "Roediger и Karpicke (2006)", "Roediger와 Karpicke (2006)"),
    href: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
  },
  loci: {
    label: text("Legge va boshq. (2012)", "Legge et al. (2012)", "Legge и др. (2012)", "Legge 외 (2012)"),
    href: "https://doi.org/10.3758/s13423-012-0271-1",
  },
  sleep: {
    label: text("Rasch va Born (2013)", "Rasch & Born (2013)", "Rasch и Born (2013)", "Rasch와 Born (2013)"),
    href: "https://doi.org/10.1152/physrev.00032.2012",
  },
  movement: {
    label: text("Erickson va boshq. (2011)", "Erickson et al. (2011)", "Erickson и др. (2011)", "Erickson 외 (2011)"),
    href: "https://doi.org/10.1073/pnas.1015950108",
  },
  nback: {
    label: text("Simons va boshq. (2016)", "Simons et al. (2016)", "Simons и др. (2016)", "Simons 외 (2016)"),
    href: "https://doi.org/10.1177/1529100616661983",
  },
  nutrition: {
    label: text("Global Council on Brain Health (2018)", "Global Council on Brain Health (2018)", "Global Council on Brain Health (2018)", "Global Council on Brain Health (2018)"),
    href: "https://doi.org/10.26419/pia.00070.001",
  },
};

const INSIGHTS: Insight[] = [
  {
    id: "memory-loci",
    category: "memory",
    title: text("Lokuslar (xotira saroyi) usuli", "Method of loci (memory palace)", "Метод локусов (дворец памяти)", "장소법(기억의 궁전)"),
    content: text(
      "Tanish yo‘l bo‘ylab aniq joylarni tanlang va eslab qolmoqchi bo‘lgan narsalarni o‘sha joylarda g‘ayrioddiy, jonli tasvir sifatida joylashtiring. Keyin yo‘lni xayolan bosib o‘tib, ma’lumotni qaytaring.",
      "Choose distinct places along a familiar route and place what you want to remember there as vivid, unusual images. Mentally walk the route later to retrieve the information.",
      "Выберите заметные места на знакомом маршруте и мысленно разместите там информацию в виде ярких, необычных образов. Позже пройдите маршрут в воображении и извлеките её.",
      "익숙한 길에서 구별되는 장소를 고르고, 기억할 내용을 생생하고 독특한 이미지로 그곳에 배치하세요. 나중에 마음속으로 길을 따라가며 정보를 떠올립니다.",
    ),
    source: SOURCES.loci,
  },
  {
    id: "memory-major-system",
    category: "memory",
    title: text("Major tizimi", "Major system", "Мажорная система", "메이저 시스템"),
    content: text(
      "Raqamlarni undosh tovushlarga aylantirib, tovushlardan so‘z va tasvir yarating. Kodlash qoidasi siz uchun barqaror bo‘lsa, uzun raqamlar oddiyroq hikoyaga aylanadi; tezlikdan oldin aniqlikni mashq qiling.",
      "Map digits to consonant sounds, then turn the sounds into words and images. When the code is consistent, long numbers become a story; practise accuracy before speed.",
      "Связывайте цифры с согласными звуками, а затем превращайте звуки в слова и образы. При постоянном коде длинные числа становятся историей; сначала тренируйте точность.",
      "숫자를 자음 소리에 연결한 뒤 소리로 단어와 이미지를 만드세요. 규칙을 일관되게 쓰면 긴 숫자가 이야기가 됩니다. 속도보다 정확성을 먼저 연습하세요.",
    ),
  },
  {
    id: "memory-chunking",
    category: "memory",
    title: text("Bo‘laklash", "Chunking", "Группировка", "청킹"),
    content: text(
      "Alohida elementlarni ma’noli kichik guruhlarga birlashtiring: telefon raqamini qismlarga ajratish yoki g‘oyani uch bandli tuzilma qilish kabi. Guruhlar sizning mavjud bilimingizga bog‘lansa, qayta ishlash osonlashadi.",
      "Combine separate elements into meaningful small groups, such as splitting a phone number or giving an idea a three-part structure. Groups are easier to handle when they connect to what you already know.",
      "Объединяйте отдельные элементы в небольшие смысловые группы: например, разделите номер телефона или оформите идею в три части. Связь с уже знакомым материалом облегчает обработку.",
      "낱개 요소를 의미 있는 작은 묶음으로 합치세요. 전화번호를 나누거나 생각을 세 부분으로 구조화하는 식입니다. 기존 지식과 연결하면 다루기 쉬워집니다.",
    ),
  },
  {
    id: "memory-elaboration",
    category: "memory",
    title: text("Izohlab bog‘lash", "Elaborative encoding", "Осмысленное кодирование", "정교화"),
    content: text(
      "Yangi fikrga “Bu nimaga o‘xshaydi?”, “Nega shunday?” yoki “Qayerda ishlataman?” deb savol bering. Javobni o‘z so‘zlaringiz bilan aytish ma’lumotga bir nechta kirish yo‘lini yaratadi.",
      "Ask a new idea, “What is this like?”, “Why might it be so?” or “Where would I use it?” Explaining the answer in your own words creates more than one route back to the idea.",
      "Спросите себя о новой идее: «На что это похоже?», «Почему это может быть так?», «Где я это применю?». Объяснение своими словами создаёт несколько путей к воспоминанию.",
      "새로운 생각에 “무엇과 비슷한가?”, “왜 그런가?”, “어디에 쓸까?”를 물어보세요. 자신의 말로 설명하면 기억으로 돌아가는 경로가 늘어납니다.",
    ),
  },
  {
    id: "memory-retrieval",
    category: "memory",
    title: text("Qayta chaqirish mashqi", "Retrieval practice", "Практика извлечения", "인출 연습"),
    content: text(
      "Matnni qayta o‘qishdan oldin uni yopib, asosiy fikrlarni xotiradan yozing yoki ayting. Xatoni ko‘rib tuzatishning o‘zi o‘rganish signalidir; maqsad mukammal natija emas, faol chaqirishdir.",
      "Before rereading, close the material and write or say the main ideas from memory. Checking and correcting an error is part of the learning signal; the goal is active recall, not a perfect first attempt.",
      "Перед повторным чтением закройте материал и запишите или расскажите основные идеи по памяти. Проверка и исправление ошибки тоже дают обучающий сигнал; цель — активное извлечение.",
      "다시 읽기 전에 자료를 덮고 핵심을 기억에서 써 보거나 말해 보세요. 오류를 확인하고 고치는 과정도 학습 신호입니다. 첫 시도에서 완벽할 필요는 없습니다.",
    ),
    source: SOURCES.retrieval,
  },
  {
    id: "memory-spacing",
    category: "memory",
    title: text("Oraliqli takrorlash", "Spaced repetition", "Интервальное повторение", "간격 반복"),
    content: text(
      "Bir necha qisqa seansni vaqt oralatib rejalang: bugun, ertaga, keyin bir necha kun o‘tib. Oraliqning aniq uzunligi mavzu va odamga bog‘liq, lekin siqib o‘qishdan ko‘ra vaqt bo‘ylab tarqatish ko‘pincha uzoqroq eslab qolishga yordam beradi.",
      "Plan several short sessions with gaps: today, tomorrow, then a few days later. The best interval depends on the material and person, but spreading practice over time often supports longer retention than cramming.",
      "Планируйте несколько коротких занятий с паузами: сегодня, завтра, затем через несколько дней. Лучший интервал зависит от материала и человека, но распределённая практика часто поддерживает более длительное запоминание.",
      "오늘, 내일, 며칠 뒤처럼 짧은 학습 세션 사이에 간격을 두세요. 적절한 간격은 사람과 자료에 따라 다르지만 몰아서 공부하는 것보다 장기 기억에 도움이 되는 경우가 많습니다.",
    ),
    source: SOURCES.spacing,
  },
  {
    id: "memory-interleaving",
    category: "memory",
    title: text("Aralashtirib mashq qilish", "Interleaving", "Чередование", "교차 연습"),
    content: text(
      "Bir xil turdagi 20 ta misol o‘rniga ikki yoki uch turdagi masalani navbatlab bajaring. Bu usul har safar qaysi strategiya kerakligini ajratishni talab qiladi, shuning uchun mashq paytida qiyinroq tuyulishi mumkin.",
      "Instead of doing 20 problems of one type, alternate between two or three types. Each switch asks you to identify the right strategy, so practice can feel harder even when later recall improves.",
      "Вместо 20 однотипных задач чередуйте два или три типа. Каждая смена требует выбрать подходящую стратегию, поэтому тренировка может ощущаться сложнее.",
      "한 유형의 문제 20개를 연속으로 풀기보다 두세 유형을 번갈아 연습하세요. 매번 전략을 골라야 하므로 연습은 더 어렵게 느껴질 수 있습니다.",
    ),
  },
  {
    id: "memory-generation",
    category: "memory",
    title: text("Javobni o‘zingiz yaratish", "The generation effect", "Эффект генерации", "생성 효과"),
    content: text(
      "Tayyor javobni ko‘rishdan oldin taxmin qiling, so‘zni to‘ldiring yoki savolga javob berishga urinib ko‘ring. Javob noto‘g‘ri chiqsa ham, faol urinish keyingi tekshiruvni mazmunli qiladi.",
      "Before seeing an answer, make a prediction, complete a word, or attempt the question. Even an incorrect attempt can make the later explanation more meaningful.",
      "До просмотра ответа сделайте предположение, дополните слово или попробуйте решить задачу. Даже ошибка может сделать последующее объяснение более содержательным.",
      "답을 보기 전에 예측하거나 단어를 완성하거나 문제를 풀어 보세요. 틀리더라도 뒤의 설명을 더 의미 있게 받아들이는 데 도움이 될 수 있습니다.",
    ),
  },
  {
    id: "memory-dual-coding",
    category: "memory",
    title: text("Ikki yo‘l bilan kodlash", "Dual coding", "Двойное кодирование", "이중 부호화"),
    content: text(
      "G‘oyani qisqa jumla va sodda sxema bilan ifodalang, lekin bezak uchun rasm qo‘shmang. Matn va mazmunli tasvir bir-birini takrorlasa emas, to‘ldirsa, qayta chaqirish uchun foydali ishoralar ko‘payadi.",
      "Represent an idea with a short sentence and a simple diagram, not decorative imagery. When words and a meaningful visual complement rather than duplicate each other, they provide more useful retrieval cues.",
      "Представьте идею короткой фразой и простой схемой, а не декоративной картинкой. Когда слова и содержательный образ дополняют друг друга, появляется больше подсказок для извлечения.",
      "아이디어를 짧은 문장과 단순한 도식으로 표현하세요. 장식적인 그림보다 의미 있는 시각 자료가 글을 보완할 때 인출 단서가 늘어납니다.",
    ),
  },
  {
    id: "memory-context-cues",
    category: "memory",
    title: text("Kontekst ishoralari", "Context cues", "Контекстные подсказки", "맥락 단서"),
    content: text(
      "Muhim materialni o‘rganayotganda keyin qayta ko‘rishingiz mumkin bo‘lgan sarlavha, misol yoki savol qoldiring. Ishora mazmunning o‘zi emas, unga olib boradigan eshik bo‘lsin.",
      "Leave a heading, example, or question that you can use when returning to important material. A cue should be a doorway to the meaning, not a substitute for it.",
      "Оставьте заголовок, пример или вопрос для возвращения к важному материалу. Подсказка должна быть дверью к смыслу, а не заменой самому материалу.",
      "중요한 자료로 돌아올 때 쓸 제목, 예시, 질문을 남기세요. 단서는 내용을 대신하는 것이 아니라 의미로 들어가는 문이어야 합니다.",
    ),
  },
  {
    id: "memory-feynman",
    category: "memory",
    title: text("Feynman usuli: sodda tushuntirish", "Feynman technique: explain simply", "Метод Фейнмана: объяснить просто", "파인만 기법: 쉽게 설명하기"),
    content: text(
      "Mavzuni yangi o‘rganuvchiga tushuntirgandek, jargonni kamaytirib yozing. Qayerda to‘xtab qolishingiz aniq bo‘lmagan joyni ko‘rsatadi; o‘sha bo‘shliqni manbaga qaytib tekshiring.",
      "Write as if you are explaining the topic to a beginner, using less jargon. Where you get stuck reveals an unclear part; return to the source and check that gap.",
      "Напишите так, будто объясняете тему новичку, уменьшая количество жаргона. Место, где вы застряли, показывает неясность; вернитесь к источнику и проверьте пробел.",
      "초보자에게 설명한다고 생각하고 전문 용어를 줄여 써 보세요. 막히는 지점은 이해가 흐린 부분을 보여 주므로 자료로 돌아가 확인합니다.",
    ),
  },
  {
    id: "memory-sleep-review",
    category: "memory",
    title: text("Uyqudan oldingi yengil ko‘rib chiqish", "A light pre-sleep review", "Лёгкое повторение перед сном", "잠들기 전 가벼운 복습"),
    content: text(
      "Uyqu oldidan yangi mavzuni uzoq siqib o‘qish emas, bir necha asosiy savolni xotiradan chaqirishni sinab ko‘ring. Bu uyquni qisqartirish uchun sabab emas: tiklanish va yetarli uyqu ustuvor.",
      "Before sleep, try recalling a few key questions rather than cramming a new topic for a long time. This is not a reason to shorten sleep: recovery and enough sleep come first.",
      "Перед сном попробуйте вспомнить несколько ключевых вопросов вместо долгой зубрёжки. Это не повод сокращать сон: восстановление и достаточная продолжительность сна важнее.",
      "잠들기 전에 새 내용을 오래 몰아서 공부하기보다 핵심 질문 몇 개를 떠올려 보세요. 수면 시간을 줄이라는 뜻은 아닙니다. 회복과 충분한 수면이 우선입니다.",
    ),
    source: SOURCES.sleep,
  },
  {
    id: "memory-error-log",
    category: "memory",
    title: text("Xatolar jurnali", "An error log", "Журнал ошибок", "오류 기록"),
    content: text(
      "Xato javobni shunchaki belgilamang: savol, siz bergan javob, to‘g‘ri javob va keyingi ishorani yozing. Keyingi takrorlashda aynan shu xatoni qayta chaqirishni mashq qiling.",
      "Do not only mark a wrong answer: record the question, your answer, the correct answer, and a cue for next time. Practise retrieving that exact error at the next review.",
      "Не просто отмечайте ошибку: запишите вопрос, свой ответ, правильный ответ и подсказку на будущее. На следующем повторении потренируйте извлечение именно этой ошибки.",
      "오답에 표시만 하지 말고 질문, 내 답, 정답, 다음 단서를 적으세요. 다음 복습에서는 바로 그 오류를 떠올리는 연습을 합니다.",
    ),
  },
  {
    id: "focus-single-task",
    category: "focus",
    title: text("Bir vazifali boshlanish", "A single-task start", "Начало одной задачи", "한 가지 일로 시작하기"),
    content: text(
      "Seans boshida faqat bitta natijani yozing: “paragrafning birinchi qoralamasi” yoki “uchta misol”. Aniq yakun nuqtasi e’tiborni tanlashni osonlashtiradi; boshqa fikrlar uchun yon daftar qoldiring.",
      "At the start of a session, write one outcome: “first draft of the paragraph” or “three problems”. A clear finish line simplifies attention; keep a side note for other thoughts.",
      "В начале занятия запишите один результат: «первый черновик абзаца» или «три задачи». Чёткая финишная точка упрощает выбор внимания; другие мысли записывайте отдельно.",
      "세션 시작에 “문단 초안”이나 “문제 세 개”처럼 한 가지 결과를 적으세요. 분명한 끝점이 집중을 돕고 다른 생각은 옆 메모에 남길 수 있습니다.",
    ),
  },
  {
    id: "focus-implementation",
    category: "focus",
    title: text("Agar–unda rejasi", "If–then planning", "План «если — то»", "실행 의도"),
    content: text(
      "“Agar soat 9 bo‘lsa va stolimga o‘tirsam, telefonni boshqa xonaga qo‘yib, 20 daqiqa yozaman” kabi reja tuzing. Vaqt, joy va birinchi harakatni aniq qilish qarorni o‘sha lahzaga qoldirmaydi.",
      "Make a plan such as, “If it is 9 and I sit at my desk, I will put my phone in another room and write for 20 minutes.” Naming the time, place, and first action removes a decision in the moment.",
      "Сформулируйте план: «Если будет девять и я сяду за стол, я уберу телефон в другую комнату и буду писать 20 минут». Время, место и первый шаг уменьшают решение в момент действия.",
      "“9시가 되어 책상에 앉으면 휴대폰을 다른 방에 두고 20분간 쓴다”처럼 계획하세요. 시간, 장소, 첫 행동을 정하면 그 순간의 결정을 줄일 수 있습니다.",
    ),
  },
  {
    id: "focus-attention-residue",
    category: "focus",
    title: text("Diqqat qoldig‘ini kamaytirish", "Reduce attention residue", "Уменьшайте остаток внимания", "주의 잔여 줄이기"),
    content: text(
      "Vazifani almashtirishdan oldin qayerda qolganingiz va keyingi qadamni bir jumlada yozing. Bu ishni tugatmaydi, lekin miyaga qaytish uchun aniq ilgak beradi.",
      "Before switching tasks, write where you stopped and the next step in one sentence. It does not finish the work, but gives your mind a clear hook for returning.",
      "Перед переключением запишите одним предложением, где остановились и каков следующий шаг. Это не завершает работу, но даёт ясную зацепку для возвращения.",
      "일을 바꾸기 전에 어디까지 했고 다음 단계가 무엇인지 한 문장으로 적으세요. 일을 끝내지는 않지만 돌아올 명확한 고리를 만듭니다.",
    ),
  },
  {
    id: "focus-notification-budget",
    category: "focus",
    title: text("Bildirishnoma byudjeti", "A notification budget", "Бюджет уведомлений", "알림 예산"),
    content: text(
      "Bildirishnomalarni bir muddat butunlay yoqish yoki o‘chirish o‘rniga, qaysi kanallar haqiqatan ham shoshilinchligini tanlang. Qolganini rejalangan ikki tekshiruv oynasiga yig‘ing.",
      "Instead of treating every notification as urgent, decide which channels truly need interruption. Batch the rest into two planned checking windows.",
      "Не считайте каждое уведомление срочным: выберите каналы, которым действительно нужно прерывать вас. Остальные соберите в два запланированных окна проверки.",
      "모든 알림을 긴급하게 다루지 말고 정말 중단이 필요한 채널만 고르세요. 나머지는 정해 둔 두 번의 확인 시간에 모읍니다.",
    ),
  },
  {
    id: "focus-breathing-reset",
    category: "focus",
    title: text("Qisqa qayta sozlash", "A brief reset", "Короткая перезагрузка", "짧은 재설정"),
    content: text(
      "Chalg‘iganda o‘zingizni koyish o‘rniga, bir nafasni sekin kuzating, stolga qaytib, keyingi eng kichik harakatni ayting. Bu diqqatni majburlash emas, qaytishni tezroq payqash mashqidir.",
      "When distracted, notice one slow breath, return to the desk, and name the smallest next action instead of scolding yourself. This trains noticing and returning, not forced concentration.",
      "При отвлечении вместо самокритики заметьте один медленный вдох, вернитесь к столу и назовите самый маленький следующий шаг. Это тренировка возвращения, а не принуждение к концентрации.",
      "주의가 흐트러지면 자책하지 말고 느린 호흡 하나를 알아차린 뒤 책상으로 돌아와 가장 작은 다음 행동을 말하세요. 억지 집중이 아니라 돌아오는 연습입니다.",
    ),
  },
  {
    id: "focus-timebox",
    category: "focus",
    title: text("Vaqt qutisi", "Time-boxing", "Временные блоки", "시간 상자"),
    content: text(
      "Vazifaga 25 yoki 45 daqiqalik vaqt qutisi qo‘ying va tugaganda to‘xtab, keyingi qadamni belgilang. Raqamlar qat’iy qoida emas; energiyangiz va ish turiga moslang.",
      "Give a task a 25- or 45-minute time box, then stop at the boundary and mark the next step. The numbers are not rules; adapt them to your energy and the kind of work.",
      "Назначьте задаче блок на 25 или 45 минут, затем остановитесь на границе и отметьте следующий шаг. Числа не являются правилом — подстройте их под энергию и работу.",
      "일에 25분 또는 45분의 시간 상자를 정하고 끝나면 멈춰 다음 단계를 표시하세요. 숫자는 규칙이 아니므로 에너지와 일의 종류에 맞추세요.",
    ),
  },
  {
    id: "focus-environment",
    category: "focus",
    title: text("Muhitni oldindan tayyorlash", "Prepare the environment", "Подготовьте среду", "환경 미리 준비하기"),
    content: text(
      "Kerakli hujjatni oching, suvni qo‘ying va chalg‘ituvchi yorliqlarni yoping — buni seansdan oldin qiling. Muhitni o‘zgartirish iroda kuchiga doimiy tayanishdan ko‘ra yengilroq bo‘lishi mumkin.",
      "Open the needed document, set out water, and close distracting tabs before the session begins. Changing the environment may be easier than relying on willpower every minute.",
      "Откройте нужный документ, поставьте воду и закройте отвлекающие вкладки до начала занятия. Изменить среду может быть легче, чем каждую минуту полагаться на силу воли.",
      "필요한 문서를 열고 물을 준비하고 방해되는 탭을 세션 전에 닫으세요. 매 순간 의지력에 기대기보다 환경을 바꾸는 편이 쉬울 수 있습니다.",
    ),
  },
  {
    id: "focus-deep-work",
    category: "focus",
    title: text("Chuqur ishning kirish marosimi", "A deep-work entry ritual", "Ритуал входа в глубокую работу", "깊은 작업 진입 의식"),
    content: text(
      "Har safar bir xil qisqa ketma-ketlikni takrorlang: stolni tozalash, maqsadni yozish, taymerni qo‘yish. Marosim sehrli tugma emas, balki boshlash belgilarini bir xil qilish usulidir.",
      "Repeat a short sequence each time: clear the desk, write the aim, set a timer. The ritual is not a magic switch; it makes starting cues consistent.",
      "Повторяйте короткую последовательность: освободите стол, запишите цель, поставьте таймер. Ритуал не является магической кнопкой, он делает сигналы начала постоянными.",
      "매번 책상을 정리하고 목표를 쓰고 타이머를 설정하는 짧은 순서를 반복하세요. 의식은 마법 버튼이 아니라 시작 신호를 일정하게 만드는 방법입니다.",
    ),
  },
  {
    id: "focus-worry-note",
    category: "focus",
    title: text("Tashvish uchun alohida qayd", "A worry note", "Запись тревог", "걱정 메모"),
    content: text(
      "Ish paytida kelgan tashvishni bir jumla bilan yozib, unga kunning keyinroq bo‘ladigan 10 daqiqalik vaqtini belgilang. Muammoni inkor qilmaysiz, faqat hozirgi vazifadan ajratasiz.",
      "Write a worry in one sentence and assign it a 10-minute time later in the day. You are not denying the problem; you are separating it from the current task.",
      "Запишите тревогу одним предложением и назначьте ей десять минут позже. Вы не отрицаете проблему, а отделяете её от текущей задачи.",
      "걱정을 한 문장으로 적고 하루 중 나중의 10분을 배정하세요. 문제를 부정하는 것이 아니라 현재 일과 분리하는 것입니다.",
    ),
  },
  {
    id: "focus-breaks",
    category: "focus",
    title: text("Tanaffusni haqiqiy qilish", "Make breaks real", "Настоящие перерывы", "진짜 휴식"),
    content: text(
      "Tanaffusda ekranni boshqa ekranga almashtirish o‘rniga ko‘zni uzoqqa qarating, turing yoki suv iching. Tanaffusning vazifasi yana bir oqim emas, diqqat tizimiga o‘zgarish berishdir.",
      "During a break, look into the distance, stand, or drink water instead of swapping one screen for another. A break should change the input, not add another stream.",
      "Во время перерыва посмотрите вдаль, встаньте или выпейте воды вместо смены одного экрана на другой. Перерыв должен менять нагрузку, а не добавлять новый поток.",
      "쉬는 동안 화면을 다른 화면으로 바꾸기보다 먼 곳을 보거나 일어나거나 물을 마셔 보세요. 휴식은 또 다른 입력이 아니라 자극을 바꾸는 시간입니다.",
    ),
  },
  {
    id: "focus-mind-wandering",
    category: "focus",
    title: text("Chalg‘ishni belgi sifatida ko‘rish", "Notice mind-wandering", "Замечайте блуждание ума", "마음의 방황 알아차리기"),
    content: text(
      "Diqqat ketganini payqagan har bir lahzani kichik qaytish takrori deb belgilang. Chalg‘ishning mavjudligi muvaffaqiyatsizlik o‘lchovi emas; qaytishni qanchalik tez sezishingiz amaliy ko‘rsatkichdir.",
      "Treat each moment you notice attention has wandered as one small return repetition. Mind-wandering is not a failure score; noticing the return is useful practice.",
      "Считайте каждое замеченное отвлечение одной маленькой тренировкой возвращения. Блуждание ума не является оценкой провала; полезна сама фиксация возвращения.",
      "주의가 떠난 것을 알아차릴 때마다 한 번의 돌아오기 연습으로 보세요. 마음의 방황은 실패 점수가 아니며 돌아옴을 알아차리는 것이 중요합니다.",
    ),
  },
  {
    id: "focus-reading-question",
    category: "focus",
    title: text("Savol bilan o‘qish", "Read with a question", "Читайте с вопросом", "질문을 품고 읽기"),
    content: text(
      "O‘qishdan oldin bitta tekshiruvchi savol yozing: “Muallif nimani o‘zgartirmoqchi?” Har bir bo‘limdan keyin javobni xotiradan bir jumlada yozish passiv skanerlashni faol izlashga aylantiradi.",
      "Before reading, write one guiding question such as, “What does the author want to change?” After each section, answer from memory in one sentence to turn scanning into active searching.",
      "Перед чтением запишите один направляющий вопрос: «Что автор хочет изменить?». После каждого раздела ответьте одним предложением по памяти, превращая просмотр в активный поиск.",
      "읽기 전에 “저자는 무엇을 바꾸려 하는가?” 같은 안내 질문을 하나 쓰세요. 각 절 뒤에 기억에서 한 문장으로 답하면 훑어보기가 능동적 탐색이 됩니다.",
    ),
  },
  {
    id: "focus-task-boundary",
    category: "focus",
    title: text("Vazifa chegarasini belgilash", "Set a task boundary", "Определите границу задачи", "과제의 경계 정하기"),
    content: text(
      "“Ishlayman” o‘rniga hujjatning qaysi qismigacha borishingizni belgilang: ikki misol, bir sahifa yoki bitta qaror. Chegara juda katta bo‘lsa, uni yana kichikroq bo‘lakka ajrating.",
      "Instead of saying “I will work,” define how far you will go: two examples, one page, or one decision. If the boundary is too large, divide it into a smaller piece.",
      "Вместо «я поработаю» определите границу: два примера, одна страница или одно решение. Если граница слишком большая, разделите её на меньшие части.",
      "“일하겠다”고만 하지 말고 두 개의 예시, 한 페이지, 한 가지 결정처럼 범위를 정하세요. 너무 크다면 더 작은 조각으로 나눕니다.",
    ),
  },
  {
    id: "focus-pomodoro-recovery",
    category: "focus",
    title: text("Pomodoro: ish va tiklanish", "Pomodoro: work and recovery", "Помодоро: работа и восстановление", "포모도로: 집중과 회복"),
    content: text(
      "25 daqiqa ish va 5 daqiqa tanaffus — boshlash uchun qulay namuna, biologik qoida emas. Tanaffusda turib yuring yoki ko‘zingizni ekrandan uzing; vazifaga mos bo‘lsa, vaqtni o‘zgartiring va damni tashlab ketmang.",
      "Twenty-five minutes of work and five minutes of rest is a convenient starting pattern, not a biological rule. Stand or look away from the screen during breaks; adjust the interval to the task and keep recovery time.",
      "25 минут работы и 5 минут отдыха — удобный шаблон для начала, а не биологическое правило. Во время перерыва встаньте или отведите взгляд от экрана; подстройте интервалы под задачу и не отменяйте отдых.",
      "25분 집중과 5분 휴식은 시작하기 좋은 예시이지 생물학적 규칙은 아닙니다. 휴식에는 일어나 걷거나 화면에서 눈을 떼고, 과제에 맞게 시간을 조절하되 회복 시간을 지키세요.",
    ),
  },
  {
    id: "focus-dopamine-cues",
    category: "focus",
    title: text("Dopamin va odat ishoralari", "Dopamine and habit cues", "Дофамин и сигналы привычек", "도파민과 습관 단서"),
    content: text(
      "Dopamin — o‘rganish va motivatsiyada qatnashadigan odatiy signal tizimining bir qismi; “dopaminni tozalash” uni tanadan chiqarish degani emas. Chalg‘ishni kamaytirish uchun keraksiz bildirishnomalarni o‘chiring, vasvasali ilovalarni uzoqroqqa qo‘ying va keyingi aniq qadamni yozing.",
      "Dopamine is part of normal signalling involved in learning and motivation; a “dopamine detox” does not remove it from the body. To reduce distraction, mute nonessential notifications, add distance from tempting apps, and write down the next concrete step.",
      "Дофамин — часть обычной системы сигналов, участвующей в обучении и мотивации; «дофаминовый детокс» не выводит его из организма. Чтобы меньше отвлекаться, отключите необязательные уведомления, уберите соблазнительные приложения подальше и запишите следующий конкретный шаг.",
      "도파민은 학습과 동기에 관여하는 정상적인 신호 체계의 일부이며, “도파민 디톡스”가 몸에서 도파민을 제거한다는 뜻은 아닙니다. 방해를 줄이려면 불필요한 알림을 끄고 유혹적인 앱을 멀리 두며 다음에 할 구체적인 일을 적어 보세요.",
    ),
  },
  {
    id: "health-sleep-regularity",
    category: "health",
    title: text("Uyqu vaqti barqarorligi", "A regular sleep window", "Стабильное окно сна", "규칙적인 수면 시간"),
    content: text(
      "Uyquni faqat davomiylik emas, uyg‘onish va yotish vaqtining muntazamligi bilan ham kuzating. Uyqu ehtiyoji odamga qarab farq qiladi; kunduzgi holsizlik davom etsa, shifokor bilan maslahatlashish o‘rinli.",
      "Track not only sleep duration but also how regular your sleep and wake times are. Sleep needs differ; persistent daytime sleepiness is a reason to speak with a clinician.",
      "Отслеживайте не только длительность сна, но и регулярность времени сна и подъёма. Потребность во сне различается; при постоянной дневной сонливости стоит обратиться к врачу.",
      "수면 시간뿐 아니라 잠들고 일어나는 시간이 얼마나 일정한지도 살펴보세요. 필요한 수면은 사람마다 다르며 낮의 졸림이 계속되면 의료진과 상담할 이유가 됩니다.",
    ),
    source: SOURCES.sleep,
  },
  {
    id: "health-sleep-memory",
    category: "health",
    title: text("Uyqu va xotira", "Sleep and memory", "Сон и память", "수면과 기억"),
    content: text(
      "Uyqu paytida yangi o‘rganilgan ma’lumotlarni mustahkamlash jarayonlari davom etishi mumkin. Bu “uyquda hammasini o‘rganish” degani emas; rejalashtirilgan o‘rganish va yetarli dam birga kerak.",
      "Processes that support newly learned memories can continue during sleep. This does not mean learning everything while asleep; planned learning and adequate rest work together.",
      "Во время сна могут продолжаться процессы, поддерживающие закрепление нового материала. Это не означает, что всё можно выучить во сне: нужны и обучение, и достаточный отдых.",
      "수면 중 새로 배운 기억을 돕는 과정이 이어질 수 있습니다. 잠자는 동안 모든 것을 배운다는 뜻은 아니며 계획된 학습과 충분한 휴식이 함께 필요합니다.",
    ),
    source: SOURCES.sleep,
  },
  {
    id: "health-aerobic-movement",
    category: "health",
    title: text("Muntazam harakat", "Regular movement", "Регулярное движение", "규칙적인 움직임"),
    content: text(
      "Hafta davomida muntazam yurish, raqs yoki boshqa yoqimli harakatni kichik bo‘laklarda to‘plang. Jismoniy faollik kognitiv salomatlik bilan bog‘liq bo‘lishi mumkin, lekin bitta mashq aniq kognitiv natijani kafolatlamaydi.",
      "Accumulate regular walking, dancing, or another enjoyable activity in manageable pieces across the week. Physical activity is associated with cognitive health, but one workout cannot guarantee a specific cognitive outcome.",
      "Собирайте в течение недели регулярную ходьбу, танцы или другое приятное движение небольшими отрезками. Активность связана с когнитивным здоровьем, но одна тренировка не гарантирует конкретного результата.",
      "일주일 동안 걷기, 춤 또는 즐거운 활동을 감당 가능한 작은 단위로 꾸준히 쌓아 보세요. 신체 활동은 인지 건강과 관련될 수 있지만 한 번의 운동이 특정 결과를 보장하지는 않습니다.",
    ),
    source: SOURCES.movement,
  },
  {
    id: "health-break-sitting",
    category: "health",
    title: text("Uzoq o‘tirishni bo‘lish", "Break up sitting", "Прерывайте сидение", "오래 앉아 있기 나누기"),
    content: text(
      "Uzoq o‘tirish vaqtida vaqti-vaqti bilan turish, yurish yoki yengil cho‘zilish uchun eslatma qo‘ying. Bu kognitiv qobiliyatni darhol oshiradi degan va’da emas; kunni kamroq bir holatda o‘tkazish uchun amaliy tanlov.",
      "Set a reminder to stand, walk, or stretch lightly during long sitting periods. This is not a promise of an instant cognitive boost; it is a practical way to vary the day.",
      "Поставьте напоминание вставать, немного ходить или растягиваться при долгом сидении. Это не обещание мгновенного улучшения мышления, а практичный способ менять положение в течение дня.",
      "오래 앉아 있을 때 일어나 걷거나 가볍게 스트레칭할 알림을 설정하세요. 즉각적인 인지 향상을 약속하는 것이 아니라 하루의 자세를 바꾸는 실천입니다.",
    ),
  },
  {
    id: "health-balanced-meals",
    category: "health",
    title: text("Muvozanatli ovqatlanish", "Balanced meals", "Сбалансированное питание", "균형 잡힌 식사"),
    content: text(
      "Kundalik ovqatda turli sabzavotlar, mevalar, dukkaklilar, butun donlar va sizga mos oqsil manbalarini ko‘paytirishga e’tibor bering. Bitta “miya mahsuloti” yoki qo‘shimcha barcha muammolarni hal qilmaydi.",
      "Aim for variety across vegetables, fruit, legumes, whole grains, and protein sources that suit you. No single “brain food” or supplement solves every problem.",
      "Старайтесь включать разнообразные овощи, фрукты, бобовые, цельные злаки и подходящие вам источники белка. Ни один «продукт для мозга» или препарат не решает все проблемы.",
      "채소, 과일, 콩류, 통곡물과 자신에게 맞는 단백질원을 다양하게 드세요. 특정 ‘뇌 음식’이나 보충제가 모든 문제를 해결하지는 않습니다.",
    ),
    source: SOURCES.nutrition,
  },
  {
    id: "health-hydration",
    category: "health",
    title: text("Chanqoqni e’tiborsiz qoldirmaslik", "Respond to thirst", "Учитывайте жажду", "갈증에 반응하기"),
    content: text(
      "Suvni stol yonida saqlang va chanqoqni uzoq vaqt e’tiborsiz qoldirmang. Har kimning ehtiyoji iqlim, faollik va sog‘liq holatiga bog‘liq; majburan haddan tashqari suv ichish kerak emas.",
      "Keep water nearby and do not ignore thirst for long periods. Needs vary with climate, activity, and health; there is no need to force excessive intake.",
      "Держите воду рядом и не игнорируйте жажду долгое время. Потребности зависят от климата, активности и здоровья; заставлять себя пить чрезмерно не нужно.",
      "물을 가까이 두고 갈증을 오래 무시하지 마세요. 필요한 양은 기후, 활동량, 건강 상태에 따라 다르며 지나치게 마실 필요는 없습니다.",
    ),
  },
  {
    id: "health-daylight",
    category: "health",
    title: text("Kunduzgi yorug‘lik", "Daylight", "Дневной свет", "낮의 빛"),
    content: text(
      "Ertalab yoki kunning birinchi yarmida tashqaridagi yorug‘likka chiqish tananing kun-tun ritmiga tayanch bo‘lishi mumkin. Ob-havo va teri xavfsizligini hisobga oling; bu uyqu muammosini davolash va’dasi emas.",
      "Getting outdoor light in the morning or first part of the day can support the body’s day–night timing. Consider weather and skin safety; it is not a promise to treat sleep problems.",
      "Утренний или дневной свет на улице может поддерживать суточные ритмы. Учитывайте погоду и безопасность кожи; это не обещание лечения проблем со сном.",
      "아침이나 낮에 바깥의 빛을 받는 것은 일주기 리듬을 돕는 데 유용할 수 있습니다. 날씨와 피부 안전을 고려하며 수면 문제의 치료를 약속하는 것은 아닙니다.",
    ),
  },
  {
    id: "health-stress-recovery",
    category: "health",
    title: text("Stress va tiklanish sikli", "Stress and recovery", "Стресс и восстановление", "스트레스와 회복"),
    content: text(
      "Zehni yuklama ortidan qisqa yurish, sokin nafas yoki yaqin inson bilan suhbat kabi tiklanish oynasini rejalang. Stressning o‘zi yagona sabab deb xulosa qilmang; kuchli yoki uzoq davom etgan alomatlar uchun mutaxassisga murojaat qiling.",
      "Plan a recovery window after demanding work: a short walk, quiet breathing, or a conversation with someone close. Do not assume stress is the only cause; seek professional support for severe or persistent symptoms.",
      "Запланируйте восстановление после нагрузки: короткую прогулку, спокойное дыхание или разговор с близким. Не считайте стресс единственной причиной; при сильных или длительных симптомах обратитесь к специалисту.",
      "힘든 작업 뒤 짧은 산책, 조용한 호흡, 가까운 사람과의 대화 같은 회복 시간을 계획하세요. 스트레스가 유일한 원인이라고 단정하지 말고 심하거나 지속되는 증상은 전문가와 상의하세요.",
    ),
  },
  {
    id: "health-social-connection",
    category: "health",
    title: text("Ijtimoiy bog‘lanish", "Social connection", "Социальные связи", "사회적 연결"),
    content: text(
      "Muntazam, ma’noli suhbat yoki birga bajariladigan faoliyatni rejalang. Ijtimoiy aloqalar umumiy farovonlik va kognitiv salomatlikka hissa qo‘shishi mumkin, lekin har bir inson uchun shakli va miqdori har xil.",
      "Plan regular, meaningful conversation or a shared activity. Social connection may support wellbeing and cognitive health, while its helpful form and amount differ for each person.",
      "Планируйте регулярные содержательные разговоры или совместные занятия. Социальные связи могут поддерживать благополучие и когнитивное здоровье, но их форма и объём индивидуальны.",
      "정기적인 의미 있는 대화나 함께하는 활동을 계획하세요. 사회적 연결은 웰빙과 인지 건강에 도움이 될 수 있지만 알맞은 방식과 양은 사람마다 다릅니다.",
    ),
  },
  {
    id: "health-hearing-vision",
    category: "health",
    title: text("Sezgi salomatligini tekshirtirish", "Support hearing and vision", "Проверяйте слух и зрение", "청력과 시력 돌보기"),
    content: text(
      "Eshitish yoki ko‘rish qiyinlashsa, ma’lumotni qayta ishlashni faqat “diqqat muammosi” deb atamang. Ko‘rik va mos yordam kundalik muloqot hamda o‘rganishni yengillashtirishi mumkin.",
      "If hearing or vision becomes harder, do not label the experience only as an attention problem. An assessment and appropriate support can make daily communication and learning easier.",
      "Если слух или зрение ухудшаются, не объясняйте это только «проблемой внимания». Обследование и подходящая помощь могут облегчить общение и обучение.",
      "청력이나 시력이 어려워지면 이를 단순히 주의력 문제라고만 생각하지 마세요. 검사와 알맞은 도움은 일상 소통과 학습을 편하게 할 수 있습니다.",
    ),
  },
  {
    id: "health-routine-review",
    category: "health",
    title: text("Odatlarni mehr bilan ko‘rib chiqish", "Review routines kindly", "Мягкий обзор привычек", "습관을 다정하게 점검하기"),
    content: text(
      "Uyqu, harakat, ovqat va diqqatni bir haftalik kuzatuv sifatida ko‘ring, axloqiy baho sifatida emas. Bitta kichik o‘zgarishni sinab ko‘rib, natijani “menga qanday ta’sir qildi?” deb baholang.",
      "Treat sleep, movement, food, and focus as a one-week observation, not a moral score. Try one small change and ask, “How did this affect me?”",
      "Смотрите на сон, движение, питание и внимание как на наблюдение за неделей, а не как на моральную оценку. Попробуйте одно небольшое изменение и спросите: «Как оно на меня повлияло?»",
      "수면, 움직임, 식사와 집중을 도덕적 점수가 아니라 일주일 관찰로 보세요. 작은 변화 하나를 시도하고 “나에게 어떤 영향을 주었나?”를 물어보세요.",
    ),
  },
  {
    id: "health-caffeine-timing",
    category: "health",
    title: text("Kofeinni kuzatish", "Observe caffeine timing", "Наблюдайте за временем кофеина", "카페인 시간을 관찰하기"),
    content: text(
      "Kofein ichimliklari va uyqu vaqtingizni bir necha kun qayd etib, kechroq ichish sizga qanday ta’sir qilishini kuzating. Sezgirlik shaxsiy; bu umumiy tibbiy ko‘rsatma yoki kofeinni ko‘paytirish tavsiyasi emas.",
      "For a few days, note caffeinated drinks and sleep timing, then observe whether later use seems to affect you. Sensitivity is personal; this is not medical advice or a recommendation to increase caffeine.",
      "Несколько дней отмечайте кофеин и время сна, наблюдая, влияет ли позднее употребление именно на вас. Чувствительность индивидуальна; это не медицинская рекомендация и не совет увеличивать кофеин.",
      "며칠 동안 카페인 섭취와 수면 시간을 기록하고 늦은 섭취가 자신에게 영향을 주는지 관찰하세요. 민감도는 개인마다 다르며 카페인을 늘리라는 의학적 조언이 아닙니다.",
    ),
  },
  {
    id: "health-restful-winddown",
    category: "health",
    title: text("Sokin yakun marosimi", "A calmer wind-down", "Спокойное завершение дня", "차분한 마무리"),
    content: text(
      "Yotishdan oldingi oxirgi 20–30 daqiqani xira yorug‘lik, sokin musiqa yoki qog‘oz kitob kabi takrorlanuvchi tinch faoliyatga ajrating. Marosim majburiyat emas; uyquni buzadigan sabablar davom etsa, mutaxassis bilan gaplashing.",
      "Reserve the last 20–30 minutes before bed for a repeatable quiet activity such as dimmer light, calm music, or a paper book. It is a routine, not a requirement; discuss persistent sleep disruption with a professional.",
      "Оставьте последние 20–30 минут перед сном для спокойного повторяемого занятия: приглушённого света, тихой музыки или бумажной книги. Это привычка, а не обязанность; при постоянных нарушениях сна поговорите со специалистом.",
      "잠들기 전 20~30분을 어두운 조명, 잔잔한 음악, 종이책처럼 반복 가능한 조용한 활동에 써 보세요. 의무가 아니라 습관이며 수면 문제가 계속되면 전문가와 상의하세요.",
    ),
  },
  {
    id: "facts-neuroplasticity",
    category: "facts",
    title: text("Miya o‘zgaruvchan tizim", "A changing brain", "Изменяющийся мозг", "변화하는 뇌"),
    content: text(
      "O‘rganish va tajriba asab tizimidagi aloqalar faoliyatini o‘zgartirishi mumkin. “Neyroplastiklik” cheksiz qobiliyat yoki tezkor transformatsiya va’dasi emas; o‘zgarish mashq, kontekst va vaqtga bog‘liq.",
      "Learning and experience can change activity in neural connections. Neuroplasticity is not limitless ability or a promise of rapid transformation; change depends on practice, context, and time.",
      "Обучение и опыт могут менять активность нейронных связей. Нейропластичность не означает безграничных возможностей или быстрых превращений: изменения зависят от практики, контекста и времени.",
      "학습과 경험은 신경 연결의 활동을 바꿀 수 있습니다. 신경가소성은 무한한 능력이나 빠른 변화를 보장하는 말이 아니며 연습, 맥락과 시간에 좌우됩니다.",
    ),
  },
  {
    id: "facts-working-memory",
    category: "facts",
    title: text("Ishchi xotira cheklangan", "Working memory is limited", "Рабочая память ограничена", "작업 기억은 제한적"),
    content: text(
      "Ishchi xotira bir vaqtning o‘zida faol ushlab turiladigan ma’lumotning cheklangan miqdoridir. Tashqi ro‘yxat, sarlavha va bo‘laklash ichki yukni kamaytiradi; bu “xotira hajmini oshirish” bilan bir xil emas.",
      "Working memory holds a limited amount of information actively at once. Lists, headings, and chunking reduce internal load; that is not the same as permanently expanding memory capacity.",
      "Рабочая память одновременно удерживает ограниченный объём информации. Списки, заголовки и группировка уменьшают нагрузку, но не равны постоянному увеличению её ёмкости.",
      "작업 기억은 한 번에 능동적으로 유지할 수 있는 정보량이 제한적입니다. 목록, 제목과 청킹은 부담을 줄이지만 기억 용량을 영구적으로 늘리는 것과는 다릅니다.",
    ),
  },
  {
    id: "facts-attention-filter",
    category: "facts",
    title: text("Diqqat saralab beradi", "Attention selects", "Внимание отбирает", "주의는 선택한다"),
    content: text(
      "Diqqat barcha signallarni teng qayta ishlamaydi: vazifa, maqsad va kutilmalar ayrim signallarni oldinga chiqaradi. Shu sababli “ko‘p vazifalilik” ko‘pincha bir paytda ikki chuqur ish emas, tez-tez almashishdir.",
      "Attention does not process every signal equally; goals and expectations bring some signals forward. That is why multitasking often means rapid switching rather than two deep tasks at once.",
      "Внимание не обрабатывает все сигналы одинаково: цели и ожидания выделяют одни из них. Поэтому многозадачность часто означает быстрое переключение, а не две глубокие задачи одновременно.",
      "주의는 모든 신호를 똑같이 처리하지 않고 목표와 기대에 따라 일부를 앞세웁니다. 멀티태스킹은 두 일을 깊이 하는 것보다 빠르게 전환하는 경우가 많습니다.",
    ),
  },
  {
    id: "facts-memory-reconstructive",
    category: "facts",
    title: text("Xotira qayta quriladi", "Memory is reconstructive", "Память реконструктивна", "기억은 재구성된다"),
    content: text(
      "Eslash oddiy video yozuvi emas: hozirgi savol, ishoralar va keyingi ma’lumotlar eslashga ta’sir qilishi mumkin. Muhim faktlarda manbani tekshirish va aniq ishoralarni yozish foydali ehtiyotkorlikdir.",
      "Remembering is not a simple video replay: current questions, cues, and later information can influence recall. For important facts, checking the source and recording precise cues is a useful safeguard.",
      "Воспоминание — не простое воспроизведение видео: на него могут влиять текущий вопрос, подсказки и последующая информация. Для важных фактов полезно проверять источник и записывать точные детали.",
      "기억은 영상을 그대로 재생하는 것이 아닙니다. 현재의 질문, 단서와 이후 정보가 회상에 영향을 줄 수 있습니다. 중요한 사실은 출처를 확인하고 정확한 단서를 적어 두세요.",
    ),
  },
  {
    id: "facts-sleep-consolidation",
    category: "facts",
    title: text("Uyqudagi mustahkamlash", "Sleep consolidation", "Закрепление во сне", "수면 중 공고화"),
    content: text(
      "Uyqu o‘rganilgan materialning ayrim jihatlarini mustahkamlashga yordam beradigan jarayonlar bilan bog‘liq. Natija material, uyqu va odamga qarab farq qiladi; uyquni o‘rganish vositasi sifatida emas, sog‘liqning asosiy qismi sifatida ko‘ring.",
      "Sleep is linked with processes that can support consolidation of some learned material. Effects vary by material, sleep, and person; treat sleep as a health foundation, not a shortcut for learning.",
      "Сон связан с процессами, которые могут поддерживать закрепление части изученного материала. Эффект зависит от материала, сна и человека; воспринимайте сон как основу здоровья, а не как обходной путь к обучению.",
      "수면은 배운 내용 일부의 공고화를 돕는 과정과 관련됩니다. 효과는 자료, 수면과 사람에 따라 다르므로 수면을 학습 지름길이 아니라 건강의 기반으로 보세요.",
    ),
    source: SOURCES.sleep,
  },
  {
    id: "facts-retrieval-strength",
    category: "facts",
    title: text("Qayta chaqirish kirishni kuchaytiradi", "Retrieval strengthens access", "Извлечение укрепляет доступ", "인출은 접근을 강화한다"),
    content: text(
      "Ma’lumotni xotiradan chaqirish — faqat uni tekshirish emas, keyingi chaqirish yo‘lini mashq qilishdir. Shu bilan birga, noto‘g‘ri javobni tekshirmasdan takrorlash xatoni mustahkamlashi mumkin.",
      "Retrieving information is not only a test; it rehearses a route back to the information. But repeating an unchecked wrong answer can also strengthen an error, so feedback matters.",
      "Извлечение информации — не только проверка, но и тренировка пути к ней. Однако повторение непроверенного ошибочного ответа может закрепить ошибку, поэтому важна обратная связь.",
      "정보를 인출하는 것은 시험만이 아니라 정보로 돌아가는 경로를 연습하는 일입니다. 확인하지 않은 오답을 반복하면 오류도 강화될 수 있으므로 피드백이 중요합니다.",
    ),
    source: SOURCES.retrieval,
  },
  {
    id: "facts-spacing-benefit",
    category: "facts",
    title: text("Oraliq va unutish", "Spacing and forgetting", "Интервалы и забывание", "간격과 망각"),
    content: text(
      "Oraliqli o‘rganishda keyingi chaqirish biroz qiyinlashadi, ammo shu harakat uzoqroq saqlanishga yordam berishi mumkin. Intervalni juda qisqa yoki juda qiyin qilmasdan, materialni deyarli eslay oladigan darajada sozlang.",
      "With spaced learning, later retrieval becomes a little harder, yet that effort can support longer retention. Adjust intervals so the material is effortful but still usually retrievable.",
      "При интервальном обучении последующее извлечение становится немного труднее, но это усилие может поддерживать более длительное сохранение. Настройте интервалы так, чтобы материал вспоминался с усилием, но обычно вспоминался.",
      "간격 학습에서는 나중에 떠올리기가 조금 어려워지지만 그 노력이 오래 기억하는 데 도움이 될 수 있습니다. 애써야 하지만 대체로 떠올릴 수 있는 간격으로 조정하세요.",
    ),
    source: SOURCES.spacing,
  },
  {
    id: "facts-loci-imagery",
    category: "facts",
    title: text("Fazoviy tasvir kuchli ishora bo‘lishi mumkin", "Spatial imagery can cue recall", "Пространственный образ как подсказка", "공간 이미지는 단서가 될 수 있다"),
    content: text(
      "Lokuslar usuli fazoviy tartib va jonli tasvirdan foydalanadi, shuning uchun ro‘yxatni ketma-ket qaytarishga ishora beradi. U har bir mavzu yoki odam uchun bir xil darajada qulay bo‘lishi shart emas.",
      "The method of loci uses spatial order and vivid imagery to cue a sequence. It does not have to feel equally natural for every topic or person.",
      "Метод локусов использует пространственный порядок и яркие образы как подсказки для последовательности. Он не обязан быть одинаково удобным для каждой темы или каждого человека.",
      "장소법은 공간 순서와 생생한 이미지를 사용해 순서를 떠올리는 단서를 줍니다. 모든 주제나 사람에게 똑같이 자연스러울 필요는 없습니다.",
    ),
    source: SOURCES.loci,
  },
  {
    id: "facts-exercise-brain",
    category: "facts",
    title: text("Harakat va miya", "Movement and the brain", "Движение и мозг", "움직임과 뇌"),
    content: text(
      "Aerobik faollik bo‘yicha tadqiqotlar jismoniy faollik va ayrim kognitiv ko‘rsatkichlar o‘rtasida bog‘liqlik yoki o‘zgarishlarni kuzatgan. Tadqiqot natijalarini “bitta mashq barcha qobiliyatni oshiradi” deb talqin qilish to‘g‘ri emas.",
      "Studies of aerobic activity have observed associations or changes in some cognitive measures. It would be inaccurate to turn this into a promise that one workout improves every ability.",
      "Исследования аэробной активности отмечали связи или изменения некоторых когнитивных показателей. Нельзя превращать это в обещание, что одна тренировка улучшит все способности.",
      "유산소 활동 연구에서는 일부 인지 측정치의 변화나 관련성이 관찰되었습니다. 한 번의 운동이 모든 능력을 향상시킨다고 약속하는 것은 정확하지 않습니다.",
    ),
    source: SOURCES.movement,
  },
  {
    id: "facts-dual-n-back",
    category: "facts",
    title: text("Dual n-back va transfer", "Dual n-back and transfer", "Dual n-back и перенос", "듀얼 n-back과 전이"),
    content: text(
      "Dual n-back mashqi bo‘yicha tadqiqotlarda mashq qilingan vazifaga o‘xshash, task-specific yutuqlar ba’zan ishonchliroq ko‘rinadi. Keng, boshqa qobiliyatlarga transfer esa barqaror emas; uni umumiy aqlni oshiradi deb aytish uchun ehtiyotkorlik kerak.",
      "Research on dual n-back shows task-specific gains more reliably than broad transfer to unrelated abilities. Claims that it generally raises intelligence therefore need caution.",
      "Исследования dual n-back надёжнее показывают улучшения в похожей, специфичной для задачи деятельности, чем широкий перенос на другие способности. Поэтому заявления о росте общего интеллекта требуют осторожности.",
      "듀얼 n-back 연구에서는 관련 과제의 과제 특이적 향상이 광범위한 전이보다 더 일관되게 관찰됩니다. 일반 지능을 높인다는 주장은 신중해야 합니다.",
    ),
    source: SOURCES.nback,
  },
  {
    id: "facts-expertise-patterns",
    category: "facts",
    title: text("Tajriba namunalarni tezlashtiradi", "Expertise builds patterns", "Опыт строит шаблоны", "전문성은 패턴을 만든다"),
    content: text(
      "Mutaxassis tez ko‘rayotgandek tuyulishi ko‘pincha soha ichidagi ko‘p uchraydigan mazmunli namunalarni tanish bilan bog‘liq. Bu umumiy “super xotira” emas; yangi sohada shu bilimlar bazasini vaqt bilan qurish kerak.",
      "Expert performance can look like fast memory because people recognize meaningful patterns from their domain. It is not a general super-memory; the knowledge base grows with time in that field.",
      "Быстрая работа эксперта часто связана с распознаванием знакомых смысловых шаблонов в своей области. Это не общая «сверхпамять»: базу знаний нужно постепенно строить.",
      "전문가의 빠른 수행은 분야에서 의미 있는 패턴을 알아보는 데서 비롯되는 경우가 많습니다. 일반적인 초능력 기억이 아니라 그 분야의 지식 기반을 시간에 걸쳐 쌓은 결과입니다.",
    ),
  },
  {
    id: "facts-neurotransmitter-myth",
    category: "facts",
    title: text("“Bitta kimyoviy modda” hikoyasi haddan tashqari sodda", "The one-chemical story is too simple", "История об одном веществе слишком проста", "한 가지 화학물질 이야기는 단순하다"),
    content: text(
      "Kayfiyat, diqqat va o‘rganishni bitta neyrotransmitter yoki “miya darajasi” bilan tushuntirish odatda murakkab biologiyani haddan tashqari soddalashtiradi. Qiziqarli metaforani aniq tashxis yoki davolash yo‘riqnomasi deb qabul qilmang.",
      "Explaining mood, attention, or learning through one neurotransmitter or a single “brain level” usually oversimplifies complex biology. Treat a catchy metaphor as a metaphor, not a diagnosis or treatment guide.",
      "Объяснение настроения, внимания или обучения одним нейромедиатором или «уровнем в мозге» обычно чрезмерно упрощает сложную биологию. Яркая метафора не является диагнозом или руководством по лечению.",
      "기분, 주의와 학습을 하나의 신경전달물질이나 ‘뇌 수치’로 설명하는 것은 복잡한 생물학을 지나치게 단순화합니다. 기억하기 쉬운 비유를 진단이나 치료 지침으로 받아들이지 마세요.",
    ),
  },
  {
    id: "facts-placebo-expectation",
    category: "facts",
    title: text("Kutilish tajribaga ta’sir qiladi", "Expectations shape experience", "Ожидания влияют на опыт", "기대는 경험을 바꾼다"),
    content: text(
      "Kutilish og‘riq, harakat yoki vazifani qanday his qilishimizga ta’sir qilishi mumkin, ammo bu natija “hammasi xayol” degani emas. Shaxsiy tajriba va nazoratli tadqiqot dalili bir xil savolga javob bermasligi mumkin.",
      "Expectations can influence how effort, discomfort, or a task feels, but that does not mean the outcome is imaginary. Personal experience and controlled research answer different questions.",
      "Ожидания могут влиять на то, как ощущаются усилие, дискомфорт или задача, но это не означает, что результат «выдуман». Личный опыт и контролируемое исследование отвечают на разные вопросы.",
      "기대는 노력, 불편함이나 과제가 어떻게 느껴지는지에 영향을 줄 수 있지만 결과가 상상이라는 뜻은 아닙니다. 개인 경험과 통제된 연구는 서로 다른 질문에 답합니다.",
    ),
  },
  {
    id: "facts-transfer-caution",
    category: "facts",
    title: text("Ko‘nikma transferi avtomatik emas", "Transfer is not automatic", "Перенос навыка не автоматичен", "기술 전이는 자동이 아니다"),
    content: text(
      "Bir vazifada yaxshilanish boshqa vazifaga aynan ko‘chishi shart emas. Yangi ko‘nikmani kerak bo‘ladigan vaziyatda mashq qilish, umumiy “miya mashqi”ga qaraganda maqsadga yaqinroq dalil beradi.",
      "Improvement on one task does not have to transfer to another. Practising the skill in the situation where it is needed provides more direct evidence than relying on a general brain-training promise.",
      "Улучшение одной задачи не обязано переноситься на другую. Практика навыка в нужной ситуации даёт более прямые основания, чем обещание общей тренировки мозга.",
      "한 과제의 향상이 다른 과제로 자동 전이되지는 않습니다. 필요한 상황에서 그 기술을 연습하는 것이 일반적인 두뇌 훈련 약속보다 더 직접적인 근거를 줍니다.",
    ),
    source: SOURCES.nback,
  },
  {
    id: "facts-individual-differences",
    category: "facts",
    title: text("Odamlar javobi turlicha", "People respond differently", "Люди реагируют по-разному", "사람마다 반응이 다르다"),
    content: text(
      "Bir usul bir kishiga juda qulay, boshqasiga esa zerikarli yoki samarasiz tuyulishi mumkin. Natijani kichik, xavfsiz sinov bilan kuzating va foydali strategiyani shaxsiy sharoitingizga moslang.",
      "One method may feel natural for one person and awkward or unhelpful for another. Try a small, safe experiment and adapt what works to your circumstances.",
      "Один метод может быть удобен одному человеку и не подходить другому. Проведите небольшой безопасный эксперимент и подстройте полезную стратегию под свои условия.",
      "한 방법이 어떤 사람에게는 자연스럽고 다른 사람에게는 어색하거나 도움이 안 될 수 있습니다. 작고 안전한 실험을 해 보고 자신의 상황에 맞게 조정하세요.",
    ),
  },
];

const EMPTY_BOOKMARKS: string[] = [];

const UI: Record<AppLanguage, {
  eyebrow: string;
  title: string;
  intro: string;
  private: string;
  total: string;
  tip: string;
  tipDate: string;
  saved: string;
  save: string;
  remove: string;
  next: string;
  all: string;
  empty: string;
  emptyHint: string;
  loading: string;
  storageError: string;
  retry: string;
  note: string;
  sources: string;
  savedCount: string;
  selected: string;
  memory: string;
  focus: string;
  health: string;
  facts: string;
  learnMore: string;
  bookmarkError: string;
}> = {
  uz: {
    eyebrow: "Kunlik foydali maslahatlar va faktlar",
    title: "Xotira va miya uchun amaliy bilimlar.",
    intro: "Xotira, diqqat va kognitiv salomatlik haqida kichik, amaliy va ehtiyotkor fikrlar. Bugun bittasini sinab ko‘ring — natijani kuzating, o‘zingizni baholamang.",
    private: "Shaxsiy makon",
    total: `${INSIGHTS.length} ta maslahat va fakt`,
    tip: "Bugungi maslahat",
    tipDate: "Bugun uchun tanlangan",
    saved: "Saqlanganlar",
    save: "Saqlash",
    remove: "Saqlanganlardan olib tashlash",
    next: "Yangi maslahat",
    all: "Barchasi",
    empty: "Hali saqlangan insight yo‘q.",
    emptyHint: "Yoqtirgan kartangizdagi belgi orqali uni shu yerga yig‘ing.",
    loading: "Bilimlar yuklanmoqda",
    storageError: "Saqlangan insightlarni o‘qib bo‘lmadi.",
    retry: "Qayta urinish",
    note: "Bu ta’limiy ma’lumot, tibbiy maslahat emas. Kuchsizlanish, uyqu, diqqat yoki kayfiyatdagi davomli yoki bezovta qiluvchi o‘zgarishlar bo‘lsa, malakali mutaxassis bilan gaplashing. Qo‘shimcha dorilar yoki supplementlar bo‘yicha tavsiya bermaymiz.",
    sources: "Asosiy manbalar",
    savedCount: "saqlangan",
    selected: "Tanlangan insight",
    memory: "Xotira texnikalari",
    focus: "Diqqat va Fokus",
    health: "Miya Salomatligi",
    facts: "Qiziqarli Faktlar",
    learnMore: "Manbani ko‘rish",
    bookmarkError: "Saqlab bo‘lmadi. Brauzer xotirasini tekshiring.",
  },
  en: {
    eyebrow: "Daily knowledge, practical tips & facts",
    title: "Practical knowledge for memory and mind.",
    intro: "Small, practical, careful ideas about memory, attention, and cognitive health. Try one today, observe the result, and skip the self-judgment.",
    private: "Private space",
    total: `${INSIGHTS.length} evidence-informed insights`,
    tip: "Tip of the day",
    tipDate: "Selected for today",
    saved: "Saved",
    save: "Save",
    remove: "Remove from saved",
    next: "Next insight",
    all: "All",
    empty: "No saved insights yet.",
    emptyHint: "Use the bookmark on a card to collect ideas here.",
    loading: "Loading knowledge",
    storageError: "Saved insights could not be loaded.",
    retry: "Try again",
    note: "This is educational information, not medical advice. If changes in sleep, attention, mood, or functioning persist or worry you, speak with a qualified professional. We do not recommend supplements or medicines.",
    sources: "Selected sources",
    savedCount: "saved",
    selected: "Selected insight",
    memory: "Memory techniques",
    focus: "Attention & Focus",
    health: "Brain Health",
    facts: "Curious Facts",
    learnMore: "View source",
    bookmarkError: "Could not save. Check your browser storage.",
  },
  ru: {
    eyebrow: "Полезные советы и факты на каждый день",
    title: "Практические знания о памяти и мозге.",
    intro: "Небольшие, практичные и осторожные идеи о памяти, внимании и когнитивном здоровье. Попробуйте одну сегодня, наблюдайте за результатом и не оценивайте себя.",
    private: "Личное пространство",
    total: `${INSIGHTS.length} советов и фактов`,
    tip: "Совет дня",
    tipDate: "Выбрано на сегодня",
    saved: "Сохранённые",
    save: "Сохранить",
    remove: "Убрать из сохранённых",
    next: "Новый совет",
    all: "Все",
    empty: "Сохранённых мыслей пока нет.",
    emptyHint: "Нажимайте на закладку на карточке, чтобы собрать их здесь.",
    loading: "Загрузка знаний",
    storageError: "Не удалось загрузить сохранённые мысли.",
    retry: "Повторить",
    note: "Это образовательная информация, а не медицинская рекомендация. Если изменения сна, внимания, настроения или самочувствия сохраняются или тревожат вас, поговорите с квалифицированным специалистом. Мы не рекомендуем добавки или лекарства.",
    sources: "Избранные источники",
    savedCount: "сохранено",
    selected: "Выбранная мысль",
    memory: "Техники памяти",
    focus: "Внимание и фокус",
    health: "Здоровье мозга",
    facts: "Интересные факты",
    learnMore: "Открыть источник",
    bookmarkError: "Не удалось сохранить. Проверьте хранилище браузера.",
  },
  ko: {
    eyebrow: "매일 유용한 지식과 팁",
    title: "기억과 뇌를 위한 실용 지식.",
    intro: "기억, 주의력과 인지 건강에 관한 작고 실용적이며 신중한 생각입니다. 오늘 하나를 시도하고 결과를 관찰하되 자신을 평가하지 마세요.",
    private: "개인 공간",
    total: `${INSIGHTS.length}개의 팁과 사실`,
    tip: "오늘의 팁",
    tipDate: "오늘을 위해 선택됨",
    saved: "저장됨",
    save: "저장",
    remove: "저장 목록에서 삭제",
    next: "새로운 팁",
    all: "전체",
    empty: "아직 저장한 인사이트가 없습니다.",
    emptyHint: "카드의 책갈피를 눌러 이곳에 모아 보세요.",
    loading: "지식 불러오는 중",
    storageError: "저장한 인사이트를 불러오지 못했습니다.",
    retry: "다시 시도",
    note: "이 내용은 교육 정보이며 의료 조언이 아닙니다. 수면, 주의력, 기분 또는 기능의 변화가 계속되거나 걱정된다면 자격을 갖춘 전문가와 상담하세요. 보충제나 약을 권하지 않습니다.",
    sources: "주요 출처",
    savedCount: "저장됨",
    selected: "선택한 인사이트",
    memory: "기억 기법",
    focus: "주의력과 집중",
    health: "뇌 건강",
    facts: "흥미로운 사실",
    learnMore: "출처 보기",
    bookmarkError: "저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.",
  },
};

const CATEGORY_LABELS: Record<InsightCategory, keyof typeof UI.uz> = {
  memory: "memory",
  focus: "focus",
  health: "health",
  facts: "facts",
};

function isBookmarkList(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= INSIGHTS.length
    && value.every((item) => typeof item === "string" && INSIGHTS.some((insight) => insight.id === item))
    && new Set(value).size === value.length;
}

function dateSeed(date = new Date()) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let seed = 2166136261;
  for (const char of key) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}

function categoryIcon(category: InsightCategory, size = 17) {
  if (category === "memory") return <Brain size={size} />;
  if (category === "focus") return <Focus size={size} />;
  if (category === "health") return <HeartPulse size={size} />;
  return <Lightbulb size={size} />;
}

function BookmarkButton({
  insight,
  language,
  saved,
  disabled,
  onToggle,
}: {
  insight: Insight;
  language: AppLanguage;
  saved: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const c = UI[language];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={`${saved ? c.remove : c.save}: ${insight.title[language]}`}
      className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${saved ? "bg-[#d8eade] text-[#35614f]" : "bg-[#f5edda] text-[#9a6b23] hover:bg-[#ebddb6]"}`}
      data-testid={`button-bookmark-${insight.id}`}
    >
      {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
    </button>
  );
}

export function BrainKnowledgeHub({ userId, language }: { userId: string; language: AppLanguage }) {
  const c = UI[language];
  const storage = useLocalModuleStorage(
    `kundalik-brain-knowledge-v1-${userId}`,
    EMPTY_BOOKMARKS,
    isBookmarkList,
    "Miya bilimlari",
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState(() => INSIGHTS[dateSeed() % INSIGHTS.length].id);
  const [notice, setNotice] = useState("");
  const todayInsight = INSIGHTS[dateSeed() % INSIGHTS.length];
  const savedIds = storage.value;
  const todayDate = new Intl.DateTimeFormat(
    { uz: "uz-UZ", en: "en-US", ru: "ru-RU", ko: "ko-KR" }[language],
    { dateStyle: "long" },
  ).format(new Date());

  const visibleInsights = useMemo(() => {
    if (filter === "saved") return INSIGHTS.filter((insight) => savedIds.includes(insight.id));
    if (filter === "all") return INSIGHTS;
    return INSIGHTS.filter((insight) => insight.category === filter);
  }, [filter, savedIds]);
  const selectedInsight = visibleInsights.find((insight) => insight.id === selectedId)
    ?? visibleInsights[0]
    ?? todayInsight;

  const toggleBookmark = (insight: Insight) => {
    if (storage.status !== "ready") return;
    const isSaved = savedIds.includes(insight.id);
    const next = isSaved ? savedIds.filter((id) => id !== insight.id) : [...savedIds, insight.id];
    if (storage.save(next)) {
      setNotice(isSaved ? c.remove : c.saved);
      window.setTimeout(() => setNotice(""), 2200);
    } else {
      setNotice(c.bookmarkError);
    }
  };

  const chooseNext = () => {
    const pool = visibleInsights.length > 1
      ? visibleInsights.filter((insight) => insight.id !== selectedInsight.id)
      : visibleInsights;
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setSelectedId(next.id);
    document.querySelector(`[data-testid="card-insight-${next.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const filters: Array<{ id: Filter; label: string; icon?: InsightCategory }> = [
    { id: "all", label: c.all },
    { id: "memory", label: c.memory, icon: "memory" },
    { id: "focus", label: c.focus, icon: "focus" },
    { id: "health", label: c.health, icon: "health" },
    { id: "facts", label: c.facts, icon: "facts" },
    { id: "saved", label: c.saved },
  ];

  if (storage.status === "loading") {
    return (
      <div className="space-y-5 overflow-x-hidden" data-testid="status-brain-knowledge-loading" aria-busy="true">
        <div className="skeleton h-56 rounded-[30px]" />
        <div className="skeleton h-14 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2"><div className="skeleton h-60 rounded-[24px]" /><div className="skeleton h-60 rounded-[24px]" /></div>
        <span className="sr-only">{c.loading}</span>
      </div>
    );
  }

  if (storage.status === "error") {
    return (
      <div className="rounded-[26px] border border-destructive/30 bg-destructive/5 p-8 text-center" role="alert" data-testid="status-brain-knowledge-error">
        <CircleAlert size={26} className="mx-auto text-destructive" />
        <p className="mt-3 text-[14px]">{c.storageError}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-[13px] font-semibold" data-testid="button-retry-brain-knowledge">
          <RefreshCw size={15} />{c.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7 overflow-x-hidden" data-testid="page-brain-knowledge-hub">
      <section className="relative overflow-hidden rounded-[30px] border border-[#c8d8ce] bg-[#e8f1ec] p-5 sm:p-8" data-testid="card-brain-knowledge-intro">
        <div className="pointer-events-none absolute -right-16 -top-20 size-60 rounded-full border-[24px] border-[#c4d9ca]/70" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full border-[18px] border-[#f1dfb1]/70" />
        <div className="relative max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-[#47796c]">
            <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.14em]" data-testid="status-brain-knowledge-private">
              <LockKeyhole size={13} />{c.private}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[.14em]" data-testid="text-brain-knowledge-eyebrow">{c.eyebrow}</span>
          </div>
          <h2 className="mt-5 max-w-2xl font-serif text-[clamp(2.6rem,7vw,5.6rem)] leading-[.88] tracking-[-.055em] text-[#30243f]" data-testid="text-brain-knowledge-title">{c.title}</h2>
          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-[#47796c]" data-testid="text-brain-knowledge-intro">{c.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#30243f] px-3.5 py-2.5 text-[12px] font-semibold text-[#fffaf0]" data-testid="status-brain-knowledge-count">
              <Bookmark size={15} />{savedIds.length} {c.savedCount}
            </span>
            <span className="text-[12px] text-[#47796c]" data-testid="status-brain-knowledge-total">{c.total}</span>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[26px] bg-[#30243f] p-5 text-[#fffaf0] sm:p-7" data-testid={`card-tip-of-day-${todayInsight.id}`}>
        <div className="pointer-events-none absolute -right-8 -top-16 size-44 rounded-full border-[18px] border-[#d9a441]/25" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#d9a441]">
              <Sparkles size={17} /><p className="font-mono text-[10px] uppercase tracking-[.14em]">{c.tip}</p>
            </div>
            <span className="text-[11px] text-[#d9dfd7]" data-testid="text-tip-date">{c.tipDate} · {todayDate}</span>
          </div>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-serif text-[28px] leading-tight" data-testid={`text-tip-title-${todayInsight.id}`}>{todayInsight.title[language]}</p>
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[#e9dfcf]" data-testid={`text-tip-content-${todayInsight.id}`}>{todayInsight.content[language]}</p>
            </div>
            <BookmarkButton insight={todayInsight} language={language} saved={savedIds.includes(todayInsight.id)} disabled={storage.status !== "ready"} onToggle={() => toggleBookmark(todayInsight)} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={c.eyebrow} data-testid="tabs-brain-knowledge">
        {filters.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-[12px] font-semibold transition-colors ${active ? "border-[#30243f] bg-[#30243f] text-[#fffaf0]" : "border-border bg-card text-muted-foreground hover:bg-[#f5edda] hover:text-foreground"}`}
              data-testid={`tab-brain-knowledge-${item.id}`}
            >
              {item.icon ? categoryIcon(item.icon, 14) : item.id === "saved" ? <Bookmark size={14} /> : null}
              {item.label}
              {item.id === "saved" && <span className="font-mono text-[10px] opacity-75">{savedIds.length}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3" data-testid="toolbar-brain-knowledge">
        <div className="flex items-center gap-2 text-[#47796c]">
          <Quote size={18} />
          <p className="font-serif text-[21px]" aria-live="polite" data-testid="text-selected-insight">{c.selected}: {selectedInsight.title[language]}</p>
        </div>
        <button type="button" onClick={chooseNext} disabled={!visibleInsights.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d9a441] px-4 text-[12px] font-semibold text-[#30243f] transition-colors hover:bg-[#e5b85d] disabled:opacity-50" data-testid="button-next-insight">
          <RefreshCw size={15} />{c.next}
        </button>
      </div>

      {visibleInsights.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-[#d9cba9] bg-[#f5edda] p-9 text-center" data-testid="status-brain-knowledge-empty">
          <Bookmark size={24} className="mx-auto text-[#9a6b23]" />
          <p className="mt-3 font-serif text-[25px]">{c.empty}</p>
          <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-muted-foreground">{c.emptyHint}</p>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2" data-testid="grid-brain-knowledge-insights">
          {visibleInsights.map((insight) => {
            const saved = savedIds.includes(insight.id);
            const selected = selectedInsight.id === insight.id;
            return (
              <article key={insight.id} className={`relative rounded-[24px] border p-5 transition-transform duration-200 hover:-translate-y-0.5 ${selected ? "border-[#b6d0c0] bg-[#f1f7f3] shadow-sm" : "border-border bg-card"}`} data-testid={`card-insight-${insight.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[#47796c]" data-testid={`text-category-${insight.id}`}>
                      {categoryIcon(insight.category, 15)}
                      <span className="font-mono text-[10px] uppercase tracking-[.12em]">{c[CATEGORY_LABELS[insight.category]]}</span>
                    </div>
                    <h3 className="mt-3 font-serif text-[25px] leading-tight" data-testid={`text-insight-title-${insight.id}`}>{insight.title[language]}</h3>
                  </div>
                  <BookmarkButton insight={insight} language={language} saved={saved} disabled={storage.status !== "ready"} onToggle={() => toggleBookmark(insight)} />
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground" data-testid={`text-insight-content-${insight.id}`}>{insight.content[language]}</p>
                {insight.source && (
                  <a href={insight.source.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#9a6b23] underline decoration-[#d9a441] underline-offset-4 hover:text-foreground" data-testid={`link-source-${insight.id}`}>
                    {c.learnMore}: {insight.source.label[language]}
                  </a>
                )}
                {selected && <span className="absolute bottom-5 right-5 size-1.5 rounded-full bg-[#47796c]" aria-label={c.selected} data-testid={`status-selected-${insight.id}`} />}
              </article>
            );
          })}
        </section>
      )}

      <section className="rounded-[24px] border border-[#d9cba9] bg-[#f5edda] p-5 sm:p-6" role="note" data-testid="status-brain-knowledge-disclaimer">
        <div className="flex items-start gap-3">
          <CircleAlert size={17} className="mt-0.5 shrink-0 text-[#9a6b23]" />
          <p className="text-[12px] leading-relaxed text-[#756d5e]">{c.note}</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-card p-5 sm:p-6" data-testid="section-brain-knowledge-sources">
        <div className="flex items-center gap-2 text-[#47796c]">
          <Lightbulb size={18} /><h3 className="font-serif text-[24px]">{c.sources}</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(SOURCES).map(([id, source]) => (
            <a key={id} href={source.href} target="_blank" rel="noreferrer" className="rounded-xl bg-[#f5edda] px-3 py-2 text-[11px] text-[#755b25] underline decoration-[#d9a441] underline-offset-4" data-testid={`link-reference-${id}`}>
              {source.label[language]}
            </a>
          ))}
        </div>
      </section>

      {notice && <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-[#c3ddcf] bg-[#edf6f0] px-4 py-3 text-center text-[13px] font-semibold text-[#35614f] shadow-lg" role="status" data-testid="status-brain-knowledge-notice">{notice}</div>}
    </div>
  );
}