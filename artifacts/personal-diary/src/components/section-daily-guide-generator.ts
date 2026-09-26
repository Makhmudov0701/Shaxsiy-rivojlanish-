import type { AppLanguage } from "@/lib/i18n";
import type { SectionId } from "@/components/section-motivation-content";

type LocalizedText = Record<AppLanguage, string>;
type BenefitSlot = "action" | "clarity" | "continuity";

export interface SectionDailyGuide {
  intro: string;
  benefits: [string, string, string];
}

export const SECTION_DAILY_GUIDE_POOL_SIZE = 100_000;

function localized(uz: string, en: string, ru: string, ko: string): LocalizedText {
  return { uz, en, ru, ko };
}

const guideIntroTemplates: LocalizedText[] = [
  localized("{topic}: bugun eng kichik foydali qadamingizni tanlang.", "{topic}: choose one small, useful step for today.", "{topic}: выберите сегодня один небольшой полезный шаг.", "{topic}: 오늘 실천할 작고 유용한 단계 하나를 골라보세요."),
  localized("{topic}: e’tiboringizni hozir muhim bo‘lgan jihatga qarating.", "{topic}: focus on what matters most right now.", "{topic}: сосредоточьтесь на том, что важно именно сейчас.", "{topic}: 지금 가장 중요한 것에 집중해보세요."),
  localized("{topic}: boshlash uchun mukammal paytni kutmang.", "{topic}: you do not need to wait for the perfect moment to begin.", "{topic}: не ждите идеального момента, чтобы начать.", "{topic}: 시작하기에 완벽한 순간을 기다릴 필요는 없어요."),
  localized("{topic}: bir daqiqalik aniq niyatdan boshlang.", "{topic}: begin with one clear intention for the next minute.", "{topic}: начните с одного ясного намерения на ближайшую минуту.", "{topic}: 다음 1분 동안 할 일을 분명하게 정해보세요."),
  localized("{topic}: bugun o‘zingizga qulay sur’atni tanlang.", "{topic}: choose a pace that feels manageable today.", "{topic}: выберите комфортный для себя темп на сегодня.", "{topic}: 오늘 자신에게 맞는 속도를 선택하세요."),
  localized("{topic}: bitta kichik ish bilan davomiylikni yarating.", "{topic}: build consistency through one small action.", "{topic}: поддерживайте регулярность одним небольшим действием.", "{topic}: 작은 행동 하나로 꾸준함을 만들어보세요."),
  localized("{topic}: avval hozirgi ehtiyojingizni payqang.", "{topic}: start by noticing what you need right now.", "{topic}: сначала обратите внимание на то, что вам сейчас нужно.", "{topic}: 먼저 지금 자신에게 필요한 것이 무엇인지 살펴보세요."),
  localized("{topic}: keyingi qadamni oddiy va bajariladigan qiling.", "{topic}: make your next step simple and doable.", "{topic}: сделайте следующий шаг простым и выполнимым.", "{topic}: 다음 단계를 단순하고 실천하기 쉽게 만들어보세요."),
  localized("{topic}: bugun natijadan ko‘ra jarayonga e’tibor bering.", "{topic}: give today's process more attention than the final result.", "{topic}: сегодня уделите больше внимания процессу, чем итоговому результату.", "{topic}: 오늘은 결과보다 과정을 살펴보세요."),
  localized("{topic}: o‘zingizga qisqa, sokin vaqt ajrating.", "{topic}: set aside a brief, quiet moment for yourself.", "{topic}: выделите немного спокойного времени для себя.", "{topic}: 잠시 조용히 자신에게 집중하는 시간을 가져보세요."),
  localized("{topic}: bitta fikrni aniq shakllantiring.", "{topic}: give one thought a clear shape.", "{topic}: сформулируйте одну мысль ясно и конкретно.", "{topic}: 생각 하나를 분명한 말로 정리해보세요."),
  localized("{topic}: reja yoki qaydni kundalik hayotingizga moslang.", "{topic}: shape your plan or note around your real day.", "{topic}: приспособьте план или заметку к своему обычному дню.", "{topic}: 계획이나 기록을 실제 일상에 맞춰보세요."),
  localized("{topic}: keyin yana qaytishingiz mumkin bo‘lgan kichik qadamni belgilang.", "{topic}: choose a small step you can return to later.", "{topic}: выберите небольшой шаг, к которому сможете вернуться позже.", "{topic}: 나중에 다시 이어갈 수 있는 작은 단계를 정해보세요."),
];

const benefitDetails: Record<BenefitSlot, LocalizedText[]> = {
  action: [
    localized("boshlash mumkin bo‘lgan eng yaqin qadamni ko‘rsatadi.", "makes the next step easier to see and begin.", "помогает яснее увидеть следующий шаг и приступить к нему.", "다음 단계를 더 쉽게 떠올리고 시작하도록 도와줍니다."),
    localized("katta niyatni bajariladigan qismga ajratadi.", "breaks a larger intention into a doable part.", "помогает разделить большое намерение на выполнимые части.", "큰 목표를 실천할 수 있는 작은 부분으로 나눠줍니다."),
    localized("qayerdan boshlashni tanlashni yengillashtiradi.", "makes it easier to decide where to start.", "облегчает выбор точки, с которой можно начать.", "어디서 시작할지 더 쉽게 정하도록 도와줍니다."),
    localized("ortiqcha murakkablikni kamaytiradi.", "reduces unnecessary complexity.", "помогает убрать лишнюю сложность.", "불필요한 복잡함을 줄여줍니다."),
    localized("ishga qaytish uchun sodda yo‘l beradi.", "offers a simple way to return to the task.", "дает простой способ вернуться к делу.", "하던 일로 다시 돌아갈 수 있는 간단한 방법을 알려줍니다."),
    localized("e’tiborni hozir boshqarishingiz mumkin bo‘lgan narsaga yo‘naltiradi.", "directs attention toward what you can influence now.", "направляет внимание на то, на что вы можете повлиять сейчас.", "지금 내가 바꿀 수 있는 것에 집중하도록 도와줍니다."),
    localized("vaqt va kuchni muhim tomonga sarflashga yordam beradi.", "helps you spend time and energy on what matters.", "помогает уделять время и силы тому, что действительно важно.", "시간과 에너지를 중요한 일에 쓰도록 도와줍니다."),
    localized("birdaniga ko‘p ishni zimmanizga olmaslikka ko‘maklashadi.", "helps you avoid taking on too much at once.", "помогает не брать на себя слишком много сразу.", "한 번에 너무 많은 일을 맡지 않도록 도와줍니다."),
    localized("niyatni amaliy harakatga bog‘laydi.", "connects an intention with a practical action.", "связывает намерение с конкретным действием.", "마음속 계획을 실제 행동으로 이어줍니다."),
    localized("mukammal sharoitni kutmasdan boshlashni osonlashtiradi.", "makes it easier to begin without waiting for perfect conditions.", "помогает начать, не дожидаясь идеальных условий.", "완벽한 조건을 기다리지 않고 시작하도록 도와줍니다."),
    localized("keyingi qarorni osonroq qabul qilishga yordam beradi.", "makes the next decision easier to make.", "помогает легче принять следующее решение.", "다음 결정을 더 쉽게 내릴 수 있도록 도와줍니다."),
    localized("ishni ko‘rinadigan va boshqariladigan bo‘lakka ajratadi.", "turns the work into a visible, manageable part.", "помогает разделить дело на понятные и управляемые части.", "해야 할 일을 눈에 보이고 다루기 쉬운 부분으로 나눠줍니다."),
    localized("ish hajmini bugungi imkoniyatingizga moslashtiradi.", "helps fit the amount of work to your capacity today.", "помогает соотнести объем дела с вашими сегодняшними силами.", "오늘 감당할 수 있는 만큼으로 할 일을 조정하도록 도와줍니다."),
    localized("muhim va shoshilinch ishlarni farqlashga yordam beradi.", "helps distinguish important work from urgent distractions.", "помогает отличить важное дело от срочных отвлечений.", "중요한 일과 급하지만 덜 중요한 일을 구분하도록 도와줍니다."),
    localized("bitta aniq qadam bilan harakatni boshlaydi.", "gets things moving with one clear action.", "помогает начать движение с одного понятного действия.", "분명한 행동 하나로 시작할 수 있도록 도와줍니다."),
    localized("ortiqcha bosimni kamaytirib, barqaror marom yaratadi.", "reduces pressure and supports a steadier pace.", "снижает давление и помогает сохранять ровный темп.", "부담을 줄이고 안정적인 속도를 유지하도록 도와줍니다."),
    localized("xayoldagi rejani yozilgan qadamga aylantiradi.", "turns an idea in your mind into a written next step.", "превращает план в голове в записанный следующий шаг.", "머릿속 계획을 적어둔 다음 단계로 바꿔줍니다."),
    localized("chalg‘ituvchi mayda qarorlarni kamaytiradi.", "reduces small decisions that can distract you.", "уменьшает количество мелких решений, которые отвлекают.", "집중을 흐트러뜨리는 사소한 결정을 줄여줍니다."),
    localized("boshlashga to‘sqinlik qilayotgan noaniqlikni kamaytiradi.", "reduces uncertainty that can make it hard to start.", "уменьшает неопределенность, из-за которой бывает трудно начать.", "시작을 어렵게 만드는 막연함을 줄여줍니다."),
    localized("bugun bajarishingiz mumkin bo‘lgan ishni ajratib beradi.", "helps identify what you can realistically do today.", "помогает выделить то, что реально сделать сегодня.", "오늘 실제로 할 수 있는 일을 구분하도록 도와줍니다."),
  ],
  clarity: [
    localized("qaydlarni keyin topib, ularga qaytishni osonlashtiradi.", "makes it easier to find and revisit your notes later.", "помогает позже найти заметки и вернуться к ним.", "나중에 기록을 찾아 다시 살펴보기 쉽게 해줍니다."),
    localized("fikrlaringizni bir joyga jamlashga yordam beradi.", "helps bring your thoughts together in one place.", "помогает собрать мысли в одном месте.", "생각을 한곳에 모아 정리하도록 도와줍니다."),
    localized("nima muhimligini aniqroq ko‘rishga yordam beradi.", "helps you see more clearly what matters.", "помогает яснее увидеть, что для вас важно.", "무엇이 중요한지 더 분명하게 살펴보도록 도와줍니다."),
    localized("takrorlanayotgan holatlarni payqashni osonlashtiradi.", "makes recurring patterns easier to notice.", "помогает замечать повторяющиеся закономерности.", "반복되는 흐름을 알아차리기 쉽게 해줍니다."),
    localized("qaror uchun kerakli ma’lumotni esda saqlashga yordam beradi.", "helps keep useful information available for later decisions.", "помогает сохранить полезную информацию для будущих решений.", "나중에 결정할 때 필요한 정보를 기억하기 쉽게 해줍니다."),
    localized("chalkash fikrlarni tartibliroq ko‘rib chiqishga imkon beradi.", "gives you a clearer way to review tangled thoughts.", "помогает спокойнее разобрать запутанные мысли.", "복잡한 생각을 더 차분하게 정리할 수 있게 해줍니다."),
    localized("reja va natija orasidagi bog‘liqlikni ko‘rsatadi.", "shows how your plan connects with the outcome.", "помогает увидеть связь между планом и результатом.", "계획과 결과가 어떻게 이어지는지 보여줍니다."),
    localized("kerakli narsani yodda saqlash yukini kamaytiradi.", "reduces the effort of keeping everything in mind.", "снижает нагрузку от необходимости помнить обо всем.", "모든 것을 머릿속에 기억해야 하는 부담을 줄여줍니다."),
    localized("nimalar foyda berayotganini solishtirishga yordam beradi.", "helps you compare what is working for you.", "помогает сравнить, что именно приносит пользу.", "무엇이 도움이 되는지 비교해볼 수 있게 해줍니다."),
    localized("keyinroq qayerdan davom etishni eslatadi.", "reminds you where to pick things up later.", "напоминает, с чего продолжить в следующий раз.", "나중에 어디서부터 이어갈지 기억하게 해줍니다."),
    localized("muhim tafsilotlarning yo‘qolib ketish ehtimolini kamaytiradi.", "makes important details less likely to get lost.", "помогает не потерять важные подробности.", "중요한 세부 내용이 사라지지 않도록 도와줍니다."),
    localized("fikrni dalil va taxmindan ajratishga yordam beradi.", "helps separate what you know from what you assume.", "помогает отделить факты от предположений.", "확인된 사실과 추측을 구분하도록 도와줍니다."),
    localized("bir nechta imkoniyatni xotirjam ko‘rib chiqishga yordam beradi.", "helps you consider several options more calmly.", "помогает спокойнее рассмотреть несколько вариантов.", "여러 선택지를 차분하게 살펴보도록 도와줍니다."),
    localized("qayd etilgan ma’lumotdan kerakli paytda foydalanishni yengillashtiradi.", "makes recorded information easier to use when you need it.", "помогает использовать записанную информацию в нужный момент.", "적어둔 정보를 필요할 때 활용하기 쉽게 해줍니다."),
    localized("bugungi kuzatuvni oldingi kunlar bilan bog‘laydi.", "connects today's observations with earlier ones.", "связывает сегодняшние наблюдения с предыдущими.", "오늘의 관찰을 이전 기록과 연결해줍니다."),
    localized("xotiradan taxmin qilish o‘rniga yozuvga tayanish imkonini beradi.", "lets you rely on a record instead of guesswork.", "позволяет опираться на записи, а не на догадки.", "짐작하는 대신 기록을 참고할 수 있게 해줍니다."),
    localized("e’tibor talab qilayotgan jihatlarni ko‘rinadigan qiladi.", "makes the areas needing attention more visible.", "помогает заметить то, что требует внимания.", "관심이 필요한 부분을 눈에 보이게 해줍니다."),
    localized("ma’lumotni qisqa va tushunarli shaklda saqlashga yordam beradi.", "helps keep information brief and understandable.", "помогает сохранять информацию кратко и понятно.", "정보를 짧고 이해하기 쉽게 남기도록 도와줍니다."),
    localized("mavzular orasidagi o‘xshashlik va farqlarni ko‘rsatadi.", "helps reveal similarities and differences between topics.", "помогает увидеть сходства и различия между темами.", "주제 사이의 공통점과 차이점을 살펴보도록 도와줍니다."),
    localized("keyingi mulohazani aniqroq qilish uchun asos beradi.", "gives you a clearer starting point for later reflection.", "дает более ясную основу для дальнейших размышлений.", "나중에 돌아볼 때 더 분명한 출발점을 마련해줍니다."),
  ],
  continuity: [
    localized("kichik yutuqlarni ko‘rib, davom etishga undaydi.", "helps you notice small wins and keep going.", "помогает замечать небольшие успехи и продолжать.", "작은 성취를 발견하고 계속 이어가도록 도와줍니다."),
    localized("muntazamlikni mukammallikdan ustun qo‘yishga yordam beradi.", "helps you value consistency over perfection.", "помогает ценить регулярность, а не стремиться к идеалу.", "완벽함보다 꾸준함을 중요하게 여기도록 도와줍니다."),
    localized("band kunlarda ham qaytish uchun qulay yo‘l qoldiradi.", "leaves an easy way to return on busy days.", "оставляет простой способ вернуться даже в загруженный день.", "바쁜 날에도 다시 이어갈 수 있는 쉬운 방법을 남겨줍니다."),
    localized("oldinga siljishni vaqt o‘tishi bilan ko‘rishga yordam beradi.", "helps you see progress over time.", "помогает со временем замечать свой прогресс.", "시간이 지나면서 발전을 확인하도록 도와줍니다."),
    localized("qayta boshlashni tabiiy va bosimsiz qiladi.", "makes it feel natural to begin again without pressure.", "помогает возвращаться к делу без лишнего давления.", "부담 없이 다시 시작할 수 있도록 도와줍니다."),
    localized("odatni hayotingizga mos sur’atda davom ettirishga ko‘maklashadi.", "supports a pace you can sustain in everyday life.", "помогает поддерживать темп, который подходит вашей повседневной жизни.", "일상에서 지속할 수 있는 속도를 찾도록 도와줍니다."),
    localized("keyingi safar uchun kichik tayanch yaratadi.", "creates a small anchor for your next session.", "создает небольшую опору для следующего раза.", "다음에도 이어갈 수 있는 작은 기준점을 만들어줍니다."),
    localized("sa’y-harakatni ko‘rinadigan qilib, ishonchni mustahkamlaydi.", "makes your effort visible and builds confidence.", "делает ваши усилия заметными и укрепляет уверенность.", "노력을 눈에 보이게 해 자신감을 키워줍니다."),
    localized("bir kun o‘tkazib yuborilganda ham davom etishga imkon beradi.", "lets you continue even after missing a day.", "помогает продолжить, даже если один день был пропущен.", "하루를 놓치더라도 다시 이어갈 수 있게 해줍니다."),
    localized("katta o‘zgarishlarni mayda amallardan qurishga yordam beradi.", "helps build meaningful change from small actions.", "помогает создавать значимые перемены из небольших действий.", "작은 행동을 쌓아 의미 있는 변화를 만들도록 도와줍니다."),
    localized("o‘zingizga mos usulni topish uchun joy qoldiradi.", "leaves room to find an approach that suits you.", "оставляет возможность найти подходящий именно вам способ.", "자신에게 맞는 방법을 찾아갈 여지를 줍니다."),
    localized("kundalik tartibga ortiqcha bosim qo‘shmaydi.", "fits into a routine without adding unnecessary pressure.", "вписывается в распорядок без лишнего давления.", "일상에 불필요한 부담을 더하지 않고 자리 잡도록 도와줍니다."),
    localized("har safar qaytishni osonlashtiradigan tanish marom yaratadi.", "builds a familiar rhythm that makes each return easier.", "создает привычный ритм, к которому легче возвращаться.", "다시 시작하기 쉬운 익숙한 흐름을 만들어줍니다."),
    localized("bugungi kichik harakatni ertangi qadam bilan bog‘laydi.", "connects today's small action with tomorrow's next step.", "связывает сегодняшнее небольшое действие со следующим шагом завтра.", "오늘의 작은 행동을 내일의 다음 단계와 이어줍니다."),
    localized("o‘zgarish sur’atini o‘zingizga moslashga imkon beradi.", "lets you adjust the pace of change to your needs.", "позволяет выбрать подходящий вам темп перемен.", "변화의 속도를 자신에게 맞게 조절하도록 도와줍니다."),
    localized("muntazam qaytish orqali tajriba to‘plashga yordam beradi.", "helps you build experience through regular returns.", "помогает накапливать опыт благодаря регулярному возвращению.", "꾸준히 돌아보며 경험을 쌓도록 도와줍니다."),
    localized("reja o‘zgarsa ham yangi qadam tanlashni osonlashtiradi.", "makes it easier to choose a new step when plans change.", "помогает выбрать новый шаг, если планы меняются.", "계획이 바뀌어도 새로운 단계를 정하기 쉽게 해줍니다."),
    localized("bajarilgan ishni e’tirof etib, yangi kuch beradi.", "recognizes completed work and gives you momentum.", "помогает отметить сделанное и обрести новый импульс.", "해낸 일을 인정하고 다시 힘을 내도록 도와줍니다."),
    localized("o‘zingizga qulay vaqt va usulni tanlashga imkon beradi.", "lets you choose a time and method that work for you.", "позволяет выбрать удобное для вас время и способ.", "자신에게 맞는 시간과 방법을 선택할 수 있게 해줍니다."),
    localized("qisqa mashqni uzoq muddatli odatga aylantirishga yordam beradi.", "helps a short practice grow into a lasting habit.", "помогает превратить короткую практику в устойчивую привычку.", "짧은 실천을 오래가는 습관으로 키우도록 도와줍니다."),
  ],
};

interface SectionGuideContext {
  topic: LocalizedText;
  benefitLabels: [LocalizedText, LocalizedText, LocalizedText];
}

const sectionGuideContexts: Record<SectionId, SectionGuideContext> = {
  diary: {
    topic: localized("Kundalik yozuvi", "A diary entry", "Запись в дневнике", "일기 기록"),
    benefitLabels: [
      localized("Hislarni anglash", "Understanding feelings", "Понимание чувств", "감정 이해하기"),
      localized("Fikrlarni tartiblash", "Organizing thoughts", "Упорядочивание мыслей", "생각 정리하기"),
      localized("O‘zgarishni kuzatish", "Noticing change", "Отслеживание перемен", "변화 살펴보기"),
    ],
  },
  focus: {
    topic: localized("Diqqat mashg‘uloti", "A focus session", "Сеанс концентрации", "집중 시간"),
    benefitLabels: [
      localized("Bitta vazifaga diqqat", "Focus on one task", "Внимание к одной задаче", "한 가지 일에 집중하기"),
      localized("Rejalangan tanaffus", "Planned breaks", "Запланированные перерывы", "휴식 계획하기"),
      localized("Ishdagi siljish", "Progress at work", "Продвижение в работе", "일의 진전 확인하기"),
    ],
  },
  goals: {
    topic: localized("Maqsad sari qadam", "A step toward a goal", "Шаг к цели", "목표를 향한 한 걸음"),
    benefitLabels: [
      localized("Kichik marralar", "Small milestones", "Небольшие этапы", "작은 이정표"),
      localized("Aniq yo‘nalish", "A clear direction", "Понятное направление", "분명한 방향"),
      localized("Maqsadga siljish", "Progress toward a goal", "Продвижение к цели", "목표를 향한 진전"),
    ],
  },
  tasks: {
    topic: localized("Bugungi vazifalar", "Today's tasks", "Задачи на сегодня", "오늘의 할 일"),
    benefitLabels: [
      localized("Muhim ishlar", "Priority tasks", "Приоритетные задачи", "우선순위 정하기"),
      localized("Yengilroq reja", "A manageable plan", "Удобный план", "실행 가능한 계획"),
      localized("Bajarilgan ishlar", "Completed tasks", "Выполненные задачи", "완료한 일 확인하기"),
    ],
  },
  books: {
    topic: localized("O‘qish qaydi", "A reading note", "Заметка о чтении", "독서 기록"),
    benefitLabels: [
      localized("Muhim fikrlar", "Key ideas", "Важные мысли", "핵심 생각"),
      localized("O‘qilganlarni eslash", "Remembering what you read", "Запоминание прочитанного", "읽은 내용 기억하기"),
      localized("Bilimni qo‘llash", "Putting ideas into practice", "Применение идей", "생각을 실천하기"),
    ],
  },
  repetition: {
    topic: localized("Takrorlash mashqi", "A review session", "Сеанс повторения", "복습 시간"),
    benefitLabels: [
      localized("Faol eslash", "Active recall", "Активное вспоминание", "능동적으로 떠올리기"),
      localized("Muntazam takror", "Regular review", "Регулярное повторение", "꾸준한 복습"),
      localized("Uzoq muddatli xotira", "Long-term memory", "Долговременная память", "장기 기억"),
    ],
  },
  ideas: {
    topic: localized("G‘oya qaydi", "An idea note", "Заметка об идее", "아이디어 메모"),
    benefitLabels: [
      localized("Fikrni saqlash", "Capturing an idea", "Сохранение идеи", "아이디어 기록하기"),
      localized("Bog‘lanishlarni ko‘rish", "Finding connections", "Поиск связей", "연결점 발견하기"),
      localized("Sinab ko‘rish", "Testing an idea", "Проверка идеи", "아이디어 실험하기"),
    ],
  },
  habits: {
    topic: localized("Odat kuzatuvi", "A habit check-in", "Отслеживание привычки", "습관 점검"),
    benefitLabels: [
      localized("Muntazamlik", "Consistency", "Регулярность", "꾸준함"),
      localized("Odatni anglash", "Understanding a habit", "Понимание привычки", "습관 이해하기"),
      localized("Kichik yutuqlar", "Small wins", "Небольшие успехи", "작은 성취"),
    ],
  },
  vault: {
    topic: localized("Maxfiy qayd", "A private note", "Личная заметка", "비밀 메모"),
    benefitLabels: [
      localized("Shaxsiylik", "Privacy", "Конфиденциальность", "개인 정보 보호"),
      localized("Tartibli qaydlar", "Organized notes", "Порядок в заметках", "정리된 메모"),
      localized("Keyin topish", "Finding it later", "Поиск заметки позже", "나중에 다시 찾기"),
    ],
  },
};

export const sectionGuideHeading: LocalizedText = {
  uz: "BUGUNGI BO‘LIM YO‘RIQNOMASI",
  en: "TODAY’S SECTION GUIDE",
  ru: "СОВЕТ ДНЯ ДЛЯ РАЗДЕЛА",
  ko: "오늘의 섹션 가이드",
};

export const sectionGuideBenefitsHeading: LocalizedText = {
  uz: "FOYDASI",
  en: "BENEFITS",
  ru: "ПОЛЬЗА",
  ko: "기대 효과",
};

export const sectionGuideFooterLabel: LocalizedText = {
  uz: "YO‘RIQNOMASI",
  en: "GUIDE",
  ru: "РУКОВОДСТВО",
  ko: "가이드",
};

export const sectionCardControls: Record<
  AppLanguage,
  { collapse: string; expand: string; nextQuote: string; nextQuoteAriaLabel: string }
> = {
  uz: {
    collapse: "Yig‘ish",
    expand: "Ochish",
    nextQuote: "Keyingisi",
    nextQuoteAriaLabel: "Keyingi motivatsion fikrni ko‘rsatish",
  },
  en: {
    collapse: "Collapse",
    expand: "Expand",
    nextQuote: "Next",
    nextQuoteAriaLabel: "Show the next motivational thought",
  },
  ru: {
    collapse: "Свернуть",
    expand: "Развернуть",
    nextQuote: "Далее",
    nextQuoteAriaLabel: "Показать следующую мотивационную мысль",
  },
  ko: {
    collapse: "접기",
    expand: "펼치기",
    nextQuote: "다음",
    nextQuoteAriaLabel: "다음 동기 부여 문구 보기",
  },
};

const benefitVariantCount = benefitDetails.action.length;
const guideCombinationCapacity = guideIntroTemplates.length * benefitVariantCount ** 3;

if (
  guideIntroTemplates.length !== 13
  || Object.values(benefitDetails).some((variants) => variants.length !== benefitVariantCount)
  || guideCombinationCapacity < SECTION_DAILY_GUIDE_POOL_SIZE
) {
  throw new Error("Section guide templates must produce at least 100,000 combinations.");
}

export function generateSectionDailyGuide(
  sectionId: SectionId,
  index: number,
  language: AppLanguage,
): SectionDailyGuide {
  const safeIndex = ((Math.floor(index) % SECTION_DAILY_GUIDE_POOL_SIZE) + SECTION_DAILY_GUIDE_POOL_SIZE) % SECTION_DAILY_GUIDE_POOL_SIZE;
  const context = sectionGuideContexts[sectionId];
  const introIndex = safeIndex % guideIntroTemplates.length;
  const actionIndex = Math.floor(safeIndex / guideIntroTemplates.length) % benefitVariantCount;
  const clarityIndex = Math.floor(safeIndex / (guideIntroTemplates.length * benefitVariantCount)) % benefitVariantCount;
  const continuityIndex = Math.floor(safeIndex / (guideIntroTemplates.length * benefitVariantCount ** 2)) % benefitVariantCount;
  const intro = guideIntroTemplates[introIndex][language].replace("{topic}", context.topic[language]);

  return {
    intro,
    benefits: [
      `${context.benefitLabels[0][language]}: ${benefitDetails.action[actionIndex][language]}`,
      `${context.benefitLabels[1][language]}: ${benefitDetails.clarity[clarityIndex][language]}`,
      `${context.benefitLabels[2][language]}: ${benefitDetails.continuity[continuityIndex][language]}`,
    ],
  };
}