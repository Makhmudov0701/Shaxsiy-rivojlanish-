import type { AppLanguage } from "@/lib/i18n";
import type { SectionId } from "@/components/section-motivation-content";

export type SectionGuideKind = "tip" | "reflection" | "habit" | "benefit" | "prompt";

export interface SectionGuideItem {
  kind: SectionGuideKind;
  text: Record<AppLanguage, string>;
}

function guide(
  kind: SectionGuideKind,
  uz: string,
  en: string,
  ru: string,
  ko: string,
): SectionGuideItem {
  return { kind, text: { uz, en, ru, ko } };
}

export const sectionDailyGuides: Record<SectionId, SectionGuideItem[]> = {
  diary: [
    guide("tip", "Yozishni bugungi bitta aniq lahzadan boshlang.", "Start with one specific moment from today.", "Начните с одного конкретного момента сегодняшнего дня.", "오늘의 구체적인 순간 하나부터 적어보세요."),
    guide("reflection", "Bugun qaysi his ko‘proq sezildi va unga nima sabab bo‘ldi?", "Which feeling stood out today, and what may have caused it?", "Какое чувство сегодня было самым заметным и что могло его вызвать?", "오늘 가장 두드러진 감정은 무엇이고, 무엇이 그 감정을 일으켰나요?"),
    guide("habit", "Kechqurun ikki daqiqa ajrating: bir voqea, bir his, bir fikr.", "Set aside two minutes tonight: one event, one feeling, one thought.", "Выделите вечером две минуты: одно событие, одно чувство, одна мысль.", "오늘 저녁 2분 동안 사건 하나, 감정 하나, 생각 하나를 적어보세요."),
    guide("benefit", "Qisqa qaydlar vaqt o‘tib kayfiyat va odatlaringizdagi naqshlarni ko‘rsatadi.", "Short notes reveal patterns in your moods and habits over time.", "Короткие записи со временем показывают закономерности в настроении и привычках.", "짧은 기록은 시간이 지나면서 기분과 습관의 흐름을 보여줍니다."),
    guide("prompt", "Bugun o‘zingiz haqingizda nimani payqadingiz?", "What did you notice about yourself today?", "Что вы сегодня заметили в себе?", "오늘 자신에 대해 무엇을 발견했나요?"),
  ],
  focus: [
    guide("tip", "Taymerni yoqishdan oldin bitta aniq vazifani tanlang.", "Choose one specific task before starting the timer.", "Перед запуском таймера выберите одну конкретную задачу.", "타이머를 시작하기 전에 구체적인 작업 하나를 고르세요."),
    guide("reflection", "Bugun qaysi chalg‘ituvchi narsa diqqatingizni ko‘proq bo‘ldi?", "What distracted you most today?", "Что сегодня сильнее всего отвлекало вас?", "오늘 무엇이 가장 집중을 방해했나요?"),
    guide("habit", "Har diqqat davri oldidan telefonni chetga qo‘yib, ish joyini tayyorlang.", "Before each focus session, set your phone aside and prepare your workspace.", "Перед каждым периодом концентрации отложите телефон и подготовьте рабочее место.", "집중 시간을 시작하기 전에 휴대전화를 치우고 작업 공간을 정리하세요."),
    guide("benefit", "Qisqa diqqat davrlari boshlashni osonlashtirib, tanaffuslarni rejalashga yordam beradi.", "Short focus sessions make it easier to begin and plan breaks.", "Короткие периоды концентрации помогают легче начать и запланировать отдых.", "짧은 집중 시간은 시작을 쉽게 하고 휴식 계획을 세우도록 도와줍니다."),
    guide("prompt", "Keyingi 25 daqiqada yakunlash mumkin bo‘lgan qadam qaysi?", "What step can you finish in the next 25 minutes?", "Какой шаг можно завершить за следующие 25 минут?", "앞으로 25분 안에 끝낼 수 있는 단계는 무엇인가요?"),
  ],
  goals: [
    guide("tip", "Maqsadingizni bugun bajarish mumkin bo‘lgan eng kichik qadamga aylantiring.", "Turn your goal into the smallest step you can take today.", "Превратите цель в самый маленький шаг, который можно сделать сегодня.", "목표를 오늘 실천할 수 있는 가장 작은 단계로 나눠보세요."),
    guide("reflection", "Hafta oxiriga borib, qanday natija oldinga siljiganingizni ko‘rsatadi?", "By the end of the week, what result would show you made progress?", "Какой результат к концу недели покажет, что вы продвинулись вперед?", "이번 주가 끝날 때 어떤 결과가 있으면 진전했다고 느낄까요?"),
    guide("habit", "Maqsad ustida haftada bir marta bir vaqtda ishlashni rejalang.", "Schedule a regular time each week to work on your goal.", "Выделите постоянное время раз в неделю для работы над целью.", "매주 같은 시간에 목표를 위한 시간을 정해보세요."),
    guide("benefit", "Oraliq marralar katta maqsaddagi yutuqni ko‘rinadigan qiladi.", "Milestones make progress toward a big goal easier to see.", "Промежуточные этапы помогают видеть продвижение к большой цели.", "중간 목표는 큰 목표를 향한 진전을 눈에 보이게 해줍니다."),
    guide("prompt", "Bugun qaysi maqsad e’tiboringizga loyiq va nima uchun?", "Which goal deserves your attention today, and why?", "Какая цель сегодня заслуживает вашего внимания и почему?", "오늘 어떤 목표에 집중하고 싶으며, 그 이유는 무엇인가요?"),
  ],
  tasks: [
    guide("tip", "Bugungi ro‘yxatdan eng muhim uch vazifani ajrating.", "Pick the three most important tasks from today's list.", "Выберите три самые важные задачи из сегодняшнего списка.", "오늘 할 일 목록에서 가장 중요한 세 가지를 골라보세요."),
    guide("reflection", "Qaysi ishni keyinga qoldirish yoki soddalashtirish mumkin?", "Which task could be postponed or made simpler?", "Какую задачу можно отложить или упростить?", "어떤 작업을 미루거나 더 간단하게 만들 수 있을까요?"),
    guide("habit", "Ertalab rejangizni ko‘rib chiqing, kechqurun bajarilganlarini belgilang.", "Review your plan in the morning and mark completed tasks in the evening.", "Утром просмотрите план, а вечером отметьте выполненные задачи.", "아침에 계획을 확인하고 저녁에 완료한 일을 표시하세요."),
    guide("benefit", "Muddat va ustuvorliklar hammasini yodda saqlash yukini kamaytiradi.", "Due dates and priorities reduce the effort of keeping everything in mind.", "Сроки и приоритеты помогают не держать все задачи в памяти.", "기한과 우선순위를 정하면 모든 일을 기억해야 하는 부담이 줄어듭니다."),
    guide("prompt", "O‘n daqiqadan kam vaqtda boshlashingiz mumkin bo‘lgan ish qaysi?", "Which task can you start in less than ten minutes?", "Какую задачу можно начать менее чем за десять минут?", "10분 안에 시작할 수 있는 작업은 무엇인가요?"),
  ],
  books: [
    guide("tip", "O‘qishni to‘xtatgach, sahifa raqami bilan bitta fikrni yozib qo‘ying.", "After reading, note one idea and its page number.", "После чтения запишите одну мысль и номер страницы.", "읽기를 마친 뒤 기억하고 싶은 생각 하나와 페이지 번호를 적어보세요."),
    guide("reflection", "O‘qiganingizdan qaysi fikr qarashingizni o‘zgartirdi?", "Which idea from your reading changed your perspective?", "Какая мысль из прочитанного изменила ваш взгляд?", "읽은 내용 중 어떤 생각이 관점을 바꾸었나요?"),
    guide("habit", "Har kuni mavjud odatingizdan keyin besh sahifa o‘qishni sinab ko‘ring.", "Try reading five pages after a routine you already have.", "Попробуйте читать по пять страниц после привычного ежедневного дела.", "이미 하고 있는 일과를 마친 뒤 매일 다섯 페이지를 읽어보세요."),
    guide("benefit", "Qisqa qaydlar o‘qiganlaringizni keyinroq eslashni osonlashtiradi.", "Brief notes make it easier to recall what you read later.", "Короткие заметки помогают позже вспомнить прочитанное.", "짧은 메모는 나중에 읽은 내용을 떠올리는 데 도움이 됩니다."),
    guide("prompt", "Kitobdagi qaysi fikrni bugun amalda sinab ko‘rasiz?", "Which idea from a book will you try today?", "Какую мысль из книги вы попробуете применить сегодня?", "책에서 읽은 어떤 생각을 오늘 실천해볼까요?"),
  ],
  repetition: [
    guide("tip", "Javobni ko‘rishdan avval kartani o‘zingiz eslab aytishga urinib ko‘ring.", "Try recalling the answer before revealing it on the card.", "Попробуйте вспомнить ответ до того, как откроете его на карточке.", "카드의 답을 확인하기 전에 먼저 떠올려보세요."),
    guide("reflection", "Qaysi karta qiyin bo‘ldi va unga nima to‘sqinlik qildi?", "Which card felt difficult, and what made it challenging?", "Какая карточка оказалась сложной и почему?", "어떤 카드가 어려웠고, 무엇 때문에 어려웠나요?"),
    guide("habit", "Har kuni bitta qisqa takrorlash mashg‘ulotini rejalang.", "Plan one short review session each day.", "Запланируйте один короткий повтор каждый день.", "매일 짧은 복습 시간을 한 번 정해보세요."),
    guide("benefit", "Oraliqli takrorlash ma’lumotni uzoq muddat xotirada mustahkamlaydi.", "Spaced reviews help strengthen long-term memory.", "Повторение с интервалами помогает закрепить знания надолго.", "간격을 둔 복습은 정보를 장기 기억에 저장하는 데 도움이 됩니다."),
    guide("prompt", "Bugun qayta ko‘rishingiz kerak bo‘lgan uchta karta qaysi?", "Which three cards should you review today?", "Какие три карточки стоит повторить сегодня?", "오늘 다시 볼 카드 세 장은 무엇인가요?"),
  ],
  ideas: [
    guide("tip", "Yangi fikrni baholashdan oldin, xom holida yozib qo‘ying.", "Capture a new idea before judging or editing it.", "Запишите новую идею как есть, прежде чем оценивать или редактировать ее.", "새로운 생각을 평가하거나 다듬기 전에 그대로 적어두세요."),
    guide("reflection", "Bu fikr qaysi muammo yoki ehtiyojga javob beradi?", "What problem or need could this idea address?", "На какую проблему или потребность может ответить эта идея?", "이 생각은 어떤 문제나 필요를 해결할 수 있나요?"),
    guide("habit", "Haftada bir marta saqlangan g‘oyalaringizga qaytib chiqing.", "Set aside time once a week to revisit saved ideas.", "Раз в неделю возвращайтесь к сохраненным идеям.", "일주일에 한 번 저장한 아이디어를 다시 살펴보세요."),
    guide("benefit", "G‘oyalarni mavzu bo‘yicha guruhlash ular orasidagi bog‘liqlikni ko‘rsatadi.", "Grouping ideas by topic can reveal connections between them.", "Группировка идей по темам помогает увидеть связи между ними.", "아이디어를 주제별로 묶으면 서로의 연결점을 발견할 수 있습니다."),
    guide("prompt", "Bu fikrni tekshirish uchun qanday kichik sinov qilishingiz mumkin?", "What small experiment could help you test this idea?", "Какой небольшой эксперимент поможет проверить эту идею?", "이 아이디어를 확인하기 위해 어떤 작은 실험을 해볼 수 있을까요?"),
  ],
  habits: [
    guide("tip", "Yangi odatni allaqachon bajaradigan ishingizga bog‘lang.", "Attach a new habit to something you already do.", "Привяжите новую привычку к тому, что вы уже делаете.", "새로운 습관을 이미 하고 있는 일과 연결해보세요."),
    guide("reflection", "Bugun odatni bajarishni nima osonlashtirdi yoki qiyinlashtirdi?", "What made your habit easier or harder today?", "Что сегодня облегчило или усложнило выполнение привычки?", "오늘 습관을 실천하기 쉽게 하거나 어렵게 만든 것은 무엇인가요?"),
    guide("habit", "Odatning ikki daqiqada bajariladigan eng sodda ko‘rinishidan boshlang.", "Start with the simplest version of the habit that takes two minutes.", "Начните с самого простого варианта привычки, который занимает две минуты.", "2분 안에 할 수 있는 가장 간단한 형태부터 시작하세요."),
    guide("benefit", "Kuzatuv mukammallikni emas, davomiylikni ko‘rishga yordam beradi.", "Tracking helps you notice consistency, not just perfection.", "Отслеживание помогает замечать регулярность, а не только идеальное выполнение.", "기록은 완벽함보다 꾸준함을 알아보도록 도와줍니다."),
    guide("prompt", "Bugun o‘zingizni kichik yutuq uchun qanday rag‘batlantirasiz?", "How will you acknowledge a small win today?", "Как вы отметите небольшую победу сегодня?", "오늘 작은 성취를 어떻게 스스로 격려할까요?"),
  ],
  vault: [
    guide("tip", "Keyin topish oson bo‘lishi uchun maxfiy qaydga aniq sarlavha bering.", "Give a private note a clear title so it is easier to find later.", "Дайте личной заметке понятный заголовок, чтобы позже ее было легче найти.", "나중에 쉽게 찾을 수 있도록 비밀 메모에 알아보기 쉬운 제목을 붙이세요."),
    guide("reflection", "Bu qaydni kelajakda qaysi kalit so‘z bilan izlaysiz?", "What keyword will help you find this note later?", "По какому ключевому слову вы будете искать эту заметку позже?", "나중에 이 메모를 찾을 때 어떤 검색어를 사용하면 좋을까요?"),
    guide("habit", "Saqlashdan oldin sarlavha va maxfiylik darajasini tekshiring.", "Before saving, check the title and privacy level of the note.", "Перед сохранением проверьте заголовок и уровень конфиденциальности заметки.", "저장하기 전에 메모 제목과 공개 범위를 확인하세요."),
    guide("benefit", "Alohida maxfiy qaydlar shaxsiy fikrlarni kundalikdan ajratib turadi.", "A separate private space keeps personal notes apart from your diary.", "Отдельное личное хранилище помогает отделить заметки от дневника.", "별도의 비밀 공간은 개인 메모를 일기와 분리해 보관하도록 도와줍니다."),
    guide("prompt", "Bu yozuvni qaysi mavzu ostida topmoqchisiz?", "Under which topic would you like to find this note?", "По какой теме вы хотели бы найти эту заметку?", "이 기록을 어떤 주제 아래에서 찾고 싶나요?"),
  ],
};

export const sectionGuideHeading: Record<AppLanguage, string> = {
  uz: "BUGUNGI BO‘LIM YO‘RIQNOMASI",
  en: "TODAY’S SECTION GUIDE",
  ru: "СОВЕТ ДНЯ ДЛЯ РАЗДЕЛА",
  ko: "오늘의 섹션 가이드",
};

export const sectionGuideKindLabels: Record<AppLanguage, Record<SectionGuideKind, string>> = {
  uz: { tip: "Maslahat", reflection: "Mulohaza", habit: "Odat", benefit: "Foydasi", prompt: "Bugungi savol" },
  en: { tip: "Tip", reflection: "Reflection", habit: "Habit", benefit: "Benefit", prompt: "Daily prompt" },
  ru: { tip: "Совет", reflection: "Размышление", habit: "Привычка", benefit: "Польза", prompt: "Вопрос дня" },
  ko: { tip: "팁", reflection: "돌아보기", habit: "습관", benefit: "효과", prompt: "오늘의 질문" },
};