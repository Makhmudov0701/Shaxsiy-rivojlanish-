import type { AppLanguage } from "@/lib/i18n";

type LocalizedText = Record<AppLanguage, string>;

function localized(uz: string, en: string, ru: string, ko: string): LocalizedText {
  return { uz, en, ru, ko };
}

export const goalsMotivationTemplates = {
  emojis: ["🧭", "🌱", "🏔️", "🎯", "📈", "🪜", "✨", "🗺️"],
  openers: [
    localized("Mazmunli maqsad yo‘lingizga ma’no beradi.", "A meaningful goal gives your path a sense of purpose.", "Осмысленная цель придаёт вашему пути направление и смысл.", "의미 있는 목표는 나아갈 방향과 이유를 선명하게 해줍니다."),
    localized("Maqsadni tanlash — nimaga vaqt berishingizni tanlashdir.", "Choosing a goal means choosing what deserves your time.", "Выбрать цель — значит выбрать, чему вы отдаёте своё время.", "목표를 정한다는 것은 무엇에 시간을 쓸지 정하는 일입니다."),
    localized("Katta niyat aniq marralarga bo‘linganda yaqinlashadi.", "A large intention comes closer when divided into clear milestones.", "Большое намерение становится ближе, когда его разделяют на ясные этапы.", "큰 뜻은 분명한 이정표로 나눌 때 현실에 가까워집니다."),
    localized("Bugungi kichik siljish uzoq yo‘lning bir qismidir.", "Today's small advance is part of a long journey.", "Сегодняшнее небольшое продвижение — часть долгого пути.", "오늘의 작은 전진도 긴 여정의 일부입니다."),
    localized("Maqsadlar istakni kuzatiladigan yo‘lga aylantiradi.", "Goals turn a wish into a path you can track.", "Цели превращают желание в путь, за которым можно следить.", "목표는 바람을 추적할 수 있는 길로 바꿔줍니다."),
    localized("Siz uchun muhim bo‘lgan natijani aniq tasavvur qiling.", "Picture clearly the outcome that truly matters to you.", "Ясно представьте результат, который действительно важен для вас.", "자신에게 정말 중요한 결과를 선명하게 그려보세요."),
    localized("Har bir bosqich katta maqsadga dalil bo‘lib xizmat qiladi.", "Each milestone is evidence that a larger goal is taking shape.", "Каждый этап показывает, что большая цель обретает форму.", "각 이정표는 큰 목표가 현실이 되어 가고 있다는 증거입니다."),
    localized("Yo‘nalish aniq bo‘lsa, sekin qadam ham oldinga borishdir.", "When the direction is clear, even a slow step is progress.", "Когда направление ясно, даже медленный шаг — это продвижение.", "방향이 분명하다면 느린 걸음도 전진입니다."),
    localized("Maqsadga sodiqlik har kuni bir xil tezlikni talab qilmaydi.", "Commitment to a goal does not require the same pace every day.", "Верность цели не требует одинакового темпа каждый день.", "목표에 대한 헌신은 매일 같은 속도를 요구하지 않습니다."),
    localized("Natijani kutishdan oldin yo‘lni o‘lchashni o‘rganing.", "Learn to measure the journey before waiting for the result.", "Учитесь оценивать путь, а не только ждать результата.", "결과를 기다리기 전에 여정을 측정하는 법을 배워보세요."),
    localized("Maqsadning kuchi uning siz uchun nega muhimligida.", "A goal's strength comes from why it matters to you.", "Сила цели — в том, почему она важна именно вам.", "목표의 힘은 그것이 나에게 왜 중요한지에서 나옵니다."),
    localized("Reja o‘zgarsa, maqsadga eltuvchi yangi yo‘l topish mumkin.", "When a plan changes, you can find a new route to the goal.", "Если план меняется, к цели можно найти новый путь.", "계획이 바뀌어도 목표로 가는 새 길을 찾을 수 있습니다."),
    localized("Maqsadni o‘lchash o‘sishni taxmin emas, kuzatuvga aylantiradi.", "Measuring a goal turns growth from a guess into something observable.", "Измерение цели превращает рост из догадки в наблюдаемый процесс.", "목표를 측정하면 성장은 추측이 아니라 관찰할 수 있는 과정이 됩니다."),
    localized("To‘siq yo‘l tugaganini emas, usulni qayta ko‘rish kerakligini bildiradi.", "An obstacle may call for a new method, not the end of the journey.", "Препятствие может означать необходимость нового способа, а не конец пути.", "장애물은 여정의 끝이 아니라 방법을 바꿀 때임을 알려줄 수 있습니다."),
    localized("Maqsad sari yo‘l sizni ham o‘zgartirib boradi.", "The path toward a goal changes you as well.", "Путь к цели меняет и вас самих.", "목표로 가는 길은 나 자신도 변화시킵니다."),
    localized("Har bir qayta urinish tajribani boyitadi.", "Every attempt adds to your experience.", "Каждая новая попытка обогащает ваш опыт.", "다시 시도할 때마다 경험이 쌓입니다."),
    localized("Erishilgan marralarni ko‘rish davom etish uchun kuch beradi.", "Seeing the milestones you have reached gives you strength to continue.", "Осознание пройденных этапов даёт силы продолжать.", "지나온 이정표를 돌아보면 계속 나아갈 힘이 생깁니다."),
    localized("Bugungi tanlov ertangi natijaning boshlanishi bo‘lishi mumkin.", "Today's choice can be the beginning of tomorrow's result.", "Сегодняшний выбор может стать началом завтрашнего результата.", "오늘의 선택이 내일의 결과를 시작하게 할 수 있습니다."),
    localized("Maqsad sari ishonch aniq dalillar bilan mustahkamlanadi.", "Confidence toward a goal grows through clear evidence.", "Уверенность на пути к цели укрепляется конкретными свидетельствами.", "목표를 향한 자신감은 분명한 증거를 통해 자랍니다."),
    localized("Yakuniy manzilni ko‘ring, ammo keyingi marraga xizmat qiling.", "Keep the destination in view, but serve the next milestone.", "Держите в поле зрения конечную цель, но работайте ради следующего этапа.", "최종 목적지는 바라보되 다음 이정표에 집중하세요."),
  ],
  wisdoms: [
    localized("Mazmunli maqsad sizning qadriyatlaringiz bilan bog‘langan bo‘ladi.", "A meaningful goal is connected to your values.", "Осмысленная цель связана с вашими ценностями.", "의미 있는 목표는 자신의 가치와 연결되어 있습니다."),
    localized("Maqsadni aniq yozish noaniq istakni yo‘nalishga aylantiradi.", "Writing a goal clearly turns a vague wish into direction.", "Чёткая запись цели превращает расплывчатое желание в направление.", "목표를 분명히 적으면 막연한 바람이 방향으로 바뀝니다."),
    localized("Katta maqsadni bosqichlarga bo‘lish qo‘rquvni boshqariladigan qiladi.", "Breaking a large goal into stages makes it manageable.", "Разделение большой цели на этапы делает её управляемой.", "큰 목표를 단계로 나누면 감당할 수 있는 일이 됩니다."),
    localized("O‘lchanadigan belgi taraqqiyotni ko‘zga ko‘rinadigan qiladi.", "A measurable marker makes progress visible.", "Измеримый показатель делает прогресс заметным.", "측정 가능한 기준은 발전을 눈에 보이게 합니다."),
    localized("Marralar natijadan tashqari jarayonni ham qadrlashga yordam beradi.", "Milestones help you value the process as well as the result.", "Этапы помогают ценить не только результат, но и процесс.", "이정표는 결과뿐 아니라 과정도 소중히 여기게 합니다."),
    localized("Muvaffaqiyatni faqat yakun bilan o‘lchash yo‘lni yashiradi.", "Measuring success only by the finish hides the journey.", "Если измерять успех только финишем, путь остаётся незаметным.", "성공을 결승점으로만 재면 여정이 보이지 않습니다."),
    localized("Barqaror qadamlar keskin, qisqa urinishlardan ko‘ra ishonchliroq.", "Steady steps are more reliable than intense, brief efforts.", "Последовательные шаги надёжнее резких кратких усилий.", "꾸준한 걸음은 강렬하지만 짧은 노력보다 더 믿음직합니다."),
    localized("Orqaga chekinish ba’zan kuch to‘plash va yo‘nalishni tekshirishdir.", "Stepping back can be a way to recover and check your direction.", "Отступить иногда значит восстановить силы и проверить направление.", "잠시 물러나는 것은 회복하고 방향을 점검하는 방법일 수 있습니다."),
    localized("Natija kutilgandek bo‘lmasa, u keyingi qaror uchun ma’lumot beradi.", "When a result differs from expectation, it informs the next decision.", "Неожиданный результат даёт сведения для следующего решения.", "결과가 예상과 다르면 다음 결정을 위한 정보가 됩니다."),
    localized("Xato maqsadni bekor qilmaydi; yondashuvni takomillashtiradi.", "A mistake does not cancel the goal; it improves the approach.", "Ошибка не отменяет цель, а помогает улучшить подход.", "실수는 목표를 없애지 않고 접근법을 다듬게 합니다."),
    localized("Kuzatuvlar rejaning qaysi qismi ishlayotganini ko‘rsatadi.", "Observations show which part of a plan is working.", "Наблюдения показывают, какая часть плана работает.", "관찰은 계획의 어느 부분이 효과적인지 보여줍니다."),
    localized("Maqsadni qayta ko‘rib chiqish taslim bo‘lish emas, ongli tanlovdir.", "Revising a goal is not giving up; it is a conscious choice.", "Пересмотреть цель — не значит сдаться, это осознанный выбор.", "목표를 다시 살피는 것은 포기가 아니라 의식적인 선택입니다."),
    localized("Yo‘nalish saqlansa, tezlikning vaqtincha pasayishi mag‘lubiyat emas.", "If direction remains, a temporary slowdown is not defeat.", "Если направление сохраняется, временное замедление не является поражением.", "방향을 잃지 않았다면 잠시 느려지는 것은 패배가 아닙니다."),
    localized("Kichik yakunlar ishonchni katta va’dalardan ko‘ra ko‘proq quradi.", "Small completions build confidence more than grand promises.", "Маленькие завершения укрепляют уверенность сильнее громких обещаний.", "작은 완료가 거창한 약속보다 자신감을 더 키웁니다."),
    localized("O‘zgarishlarni qayd etish ko‘rinmas mehnatni tan olishdir.", "Recording changes is a way to recognize invisible effort.", "Фиксировать изменения — значит замечать невидимый труд.", "변화를 기록하는 것은 보이지 않던 노력을 인정하는 일입니다."),
    localized("Bir bosqich tugashi keyingi bosqich uchun joy ochadi.", "Completing one stage creates room for the next.", "Завершение одного этапа открывает место для следующего.", "한 단계를 끝내면 다음 단계를 위한 자리가 생깁니다."),
    localized("Maqsadning sababi yodda bo‘lsa, qiyin paytda tanlov osonlashadi.", "Remembering why a goal matters makes hard choices easier.", "Память о смысле цели облегчает выбор в трудные моменты.", "목표의 이유를 기억하면 힘든 순간의 선택이 쉬워집니다."),
    localized("Qayta boshlash ham maqsad sari sodiqlikning bir ko‘rinishi.", "Beginning again is also a form of commitment to a goal.", "Начать снова — тоже форма верности цели.", "다시 시작하는 것도 목표에 대한 헌신입니다."),
    localized("Taqqoslashdan ko‘ra, avvalgi holatingiz bilan o‘sishni o‘lchang.", "Measure growth against your earlier self rather than against others.", "Измеряйте рост относительно себя прежнего, а не других.", "다른 사람보다 이전의 나와 비교해 성장을 측정하세요."),
    localized("Maqsadga mos bo‘lmagan ishni qisqartirish ham oldinga qadamdir.", "Removing work that does not serve the goal is also progress.", "Сократить то, что не служит цели, — тоже шаг вперёд.", "목표에 도움이 되지 않는 일을 덜어내는 것도 전진입니다."),
    localized("Muddat yo‘nalish beradi, ammo mazmunli sabab davomiylikni saqlaydi.", "A deadline gives direction, but meaning sustains commitment.", "Срок задаёт направление, а смысл поддерживает постоянство.", "기한은 방향을 주고 의미는 꾸준함을 지켜줍니다."),
    localized("Rejaning moslashuvchanligi qadriyatlarni saqlab qolishga yordam beradi.", "A flexible plan helps preserve what matters.", "Гибкий план помогает сохранить главное.", "유연한 계획은 중요한 가치를 지키게 해줍니다."),
    localized("Har bir natija keyingi tajriba uchun boshlang‘ich nuqtadir.", "Every result is a starting point for the next experiment.", "Каждый результат — отправная точка для следующего опыта.", "모든 결과는 다음 시도를 위한 출발점입니다."),
    localized("Sabr kutish emas, natija bo‘lmaganda ham yo‘lni davom ettirishdir.", "Patience is continuing the path even before results appear.", "Терпение — это продолжать путь, даже когда результата ещё нет.", "인내는 결과가 아직 없어도 길을 계속 가는 것입니다."),
    localized("O‘rganilgan saboq maqsadga sarflangan kuchni ma’noli qiladi.", "A lesson learned gives meaning to the effort spent on a goal.", "Усвоенный урок придаёт смысл усилиям, вложенным в цель.", "배운 교훈은 목표에 들인 노력에 의미를 더합니다."),
  ],
  actions: [
    localized("Siz uchun eng muhim maqsadni bitta aniq jumlada yozing.", "Write your most meaningful goal in one clear sentence.", "Запишите самую важную для вас цель одним ясным предложением.", "가장 의미 있는 목표를 한 문장으로 분명히 적어보세요."),
    localized("Maqsadingizni uchta o‘lchanadigan marraga ajrating.", "Divide your goal into three measurable milestones.", "Разделите цель на три измеримых этапа.", "목표를 측정 가능한 세 가지 이정표로 나눠보세요."),
    localized("Keyingi marraga yetganingizni qanday bilishingizni belgilang.", "Define how you will know you have reached the next milestone.", "Определите, как вы поймёте, что достигли следующего этапа.", "다음 이정표에 도달했는지 알 수 있는 기준을 정해보세요."),
    localized("Bugungi qadamni yakuniy natija bilan bog‘lab yozing.", "Write how today's step connects to the final result.", "Запишите, как сегодняшний шаг связан с конечным результатом.", "오늘의 걸음이 최종 결과와 어떻게 이어지는지 적어보세요."),
    localized("Maqsadingiz siz uchun nega muhimligini uch jumlada ifodalang.", "Explain in three sentences why this goal matters to you.", "В трёх предложениях объясните, почему эта цель важна для вас.", "이 목표가 왜 중요한지 세 문장으로 설명해보세요."),
    localized("Bugungi siljishni oldingi holatingiz bilan solishtirib qayd eting.", "Record today's progress against where you started.", "Запишите сегодняшний прогресс по сравнению с началом.", "오늘의 발전을 출발점과 비교해 기록해보세요."),
    localized("Erishilgan marralarni sanab, keyingi bosqichni tanlang.", "List the milestones you have reached and choose the next one.", "Перечислите пройденные этапы и выберите следующий.", "도달한 이정표를 적고 다음 단계를 선택하세요."),
    localized("Reja ishlamagan bir joyni topib, yangi usul yozing.", "Find one part of the plan that failed and write a new approach.", "Найдите место, где план не сработал, и запишите новый подход.", "계획이 잘 되지 않은 부분을 찾아 새 방법을 적어보세요."),
    localized("Maqsad sari haftalik kuzatuv uchun bitta ko‘rsatkich tanlang.", "Choose one measure for weekly progress toward your goal.", "Выберите один показатель для еженедельного отслеживания пути к цели.", "목표를 향한 주간 진행을 측정할 지표 하나를 정하세요."),
    localized("Keyingi marrani bajarish uchun kerakli birinchi amalni belgilang.", "Identify the first action needed for the next milestone.", "Определите первое действие для достижения следующего этапа.", "다음 이정표에 필요한 첫 행동을 정해보세요."),
    localized("To‘siq chiqqanda sinab ko‘radigan muqobil yo‘lni yozing.", "Write an alternative route to try when an obstacle appears.", "Запишите запасной путь, который попробуете при препятствии.", "장애물이 생겼을 때 시도할 대안을 적어보세요."),
    localized("Bugun maqsadingizga xizmat qilmaydigan bitta ishni qisqartiring.", "Remove one thing today that does not serve your goal.", "Сегодня уберите одно дело, которое не помогает вашей цели.", "오늘 목표에 도움이 되지 않는 일 하나를 덜어내세요."),
    localized("Natijangizdan nimani o‘rganganingizni bitta jumlada yozing.", "Write one sentence about what your result taught you.", "Одним предложением запишите, чему научил вас результат.", "결과에서 무엇을 배웠는지 한 문장으로 적어보세요."),
    localized("Orqaga ketgandek tuyulgan joydan qayta boshlash qadamini tanlang.", "Choose one step to restart from where you felt stuck.", "Выберите шаг, с которого начнёте снова там, где застряли.", "막힌 지점에서 다시 시작할 한 걸음을 선택하세요."),
    localized("Maqsad yo‘lingizdagi kichik yutuqni bugun e’tirof eting.", "Acknowledge one small win on your path today.", "Сегодня признайте одну небольшую победу на пути к цели.", "오늘 목표를 향한 작은 성취 하나를 인정해보세요."),
    localized("Yakuniy maqsadni ko‘rib, keyingi yetarlicha kichik marrani belgilang.", "Look at the final goal and set the next small enough milestone.", "Посмотрите на конечную цель и поставьте следующий посильный этап.", "최종 목표를 보고 다음의 충분히 작은 이정표를 정해보세요."),
    localized("Bir haftadan keyin qaysi dalil o‘sishni ko‘rsatishini yozing.", "Write what evidence would show growth one week from now.", "Запишите, какие свидетельства покажут рост через неделю.", "일주일 뒤 어떤 증거가 성장을 보여줄지 적어보세요."),
    localized("Maqsadga mos kelmay qolgan reja qismini ongli ravishda yangilang.", "Consciously revise the part of the plan that no longer fits the goal.", "Осознанно обновите часть плана, которая больше не подходит цели.", "목표에 더 이상 맞지 않는 계획 부분을 의식적으로 수정하세요."),
    localized("Bugungi harakatdan keyin o‘zingizga bitta tahlil savolini bering.", "Ask yourself one reflection question after today's effort.", "После сегодняшнего усилия задайте себе один вопрос для анализа.", "오늘의 노력 뒤에 스스로에게 돌아볼 질문 하나를 던져보세요."),
    localized("Keyingi qadamni aniq muddat va muvaffaqiyat belgisi bilan yozing.", "Write the next step with a clear time and success marker.", "Запишите следующий шаг с точным сроком и признаком успеха.", "다음 행동을 분명한 시간과 성공 기준과 함께 적어보세요."),
  ],
} satisfies {
  emojis: readonly string[];
  openers: readonly LocalizedText[];
  wisdoms: readonly LocalizedText[];
  actions: readonly LocalizedText[];
};
