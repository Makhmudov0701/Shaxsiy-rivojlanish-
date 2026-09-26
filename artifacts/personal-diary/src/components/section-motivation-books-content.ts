import type { AppLanguage } from "@/lib/i18n";

export type BooksLocalizedText = Record<AppLanguage, string>;

function localized(uz: string, en: string, ru: string, ko: string): BooksLocalizedText {
  return { uz, en, ru, ko };
}

export const booksMotivationTemplates = {
  emojis: ["📚", "🔖", "💡", "🪶", "🌱", "🔍", "📖", "🧠"],
  openers: [
    localized("Har kuni o‘qilgan bir necha sahifa fikrlash doirangizni kengaytiradi.", "A few pages read each day can widen the way you think.", "Несколько страниц в день могут расширить ваш взгляд на мир.", "매일 몇 쪽을 읽는 습관은 사고의 폭을 넓혀 줍니다."),
    localized("Kitob bilan o‘tkazilgan sokin vaqt yangi bilimga eshik ochadi.", "Quiet time with a book opens a door to new knowledge.", "Спокойное время с книгой открывает путь к новым знаниям.", "책과 함께하는 고요한 시간은 새로운 지식으로 가는 문을 열어 줍니다."),
    localized("Yaxshi kitob savol berish va chuqurroq o‘ylashga undaydi.", "A good book invites you to ask better questions and think more deeply.", "Хорошая книга побуждает задавать лучшие вопросы и думать глубже.", "좋은 책은 더 나은 질문을 던지고 깊이 생각하게 합니다."),
    localized("Bugungi o‘qish ertangi tushunchangiz uchun poydevor bo‘lishi mumkin.", "Today's reading can become the foundation of tomorrow's understanding.", "Сегодняшнее чтение может стать основой завтрашнего понимания.", "오늘의 독서는 내일의 이해를 세우는 토대가 될 수 있습니다."),
    localized("Har bir bob dunyoni boshqa bir nuqtai nazardan ko‘rsatadi.", "Each chapter can show the world from another point of view.", "Каждая глава может показать мир с другой точки зрения.", "각 장은 세상을 새로운 관점에서 보여 줄 수 있습니다."),
    localized("Kitob o‘qish ma’lumot olishdan tashqari, ma’nolarni bog‘lash san’atidir.", "Reading is more than receiving information; it is the art of connecting meaning.", "Чтение — это не только получение информации, но и искусство связывать смыслы.", "독서는 정보를 받는 일 이상으로, 의미를 연결하는 과정입니다."),
    localized("Bir sahifaga diqqat bilan qarash shoshilinch o‘qishdan ko‘proq narsani beradi.", "Giving one page your full attention can give you more than rushing through many.", "Внимание к одной странице может дать больше, чем поспешное чтение многих.", "한 페이지에 온전히 집중하면 많은 페이지를 서두르는 것보다 더 많이 얻을 수 있습니다."),
    localized("Kitobdagi g‘oya hayotingizdagi tanish savolga yangi javob berishi mumkin.", "An idea in a book may offer a new answer to a familiar question in your life.", "Идея из книги может по-новому ответить на знакомый жизненный вопрос.", "책 속의 생각은 삶에서 익숙한 질문에 새로운 답을 줄 수 있습니다."),
    localized("Muntazam o‘qish bilimni bir martalik taassurotdan doimiy tushunchaga aylantiradi.", "Regular reading turns a passing impression into lasting understanding.", "Регулярное чтение превращает мимолетное впечатление в устойчивое понимание.", "꾸준한 독서는 순간의 인상을 오래가는 이해로 바꿔 줍니다."),
    localized("Kitobni sekin o‘qish uning nozik ma’nolarini sezishga yordam beradi.", "Reading slowly helps you notice a book's finer meanings.", "Медленное чтение помогает заметить тонкие смыслы книги.", "천천히 읽으면 책의 섬세한 의미를 발견할 수 있습니다."),
    localized("Har bir muallif sizni o‘zingiznikidan farqli tajriba bilan tanishtiradi.", "Every author introduces you to an experience different from your own.", "Каждый автор знакомит вас с опытом, отличным от вашего.", "모든 작가는 나와 다른 경험을 만나게 해 줍니다."),
    localized("O‘qilgan fikrni hayot bilan solishtirish kitobni yanada jonlantiradi.", "Comparing an idea with life makes a book come alive.", "Сопоставление идеи с жизнью оживляет книгу.", "읽은 생각을 삶과 비교하면 책이 더 생생해집니다."),
    localized("Kitobdagi dalilni tekshirish faol va tahliliy o‘qishni kuchaytiradi.", "Examining a book's evidence strengthens active, analytical reading.", "Проверка аргументов книги развивает активное и аналитическое чтение.", "책의 근거를 살펴보면 능동적이고 분석적인 독서가 깊어집니다."),
    localized("O‘qish odati kichik kundalik uchrashuvlardan quriladi.", "A reading habit is built through small daily encounters with books.", "Привычка к чтению складывается из небольших ежедневных встреч с книгой.", "독서 습관은 매일 책과 만나는 작은 시간들로 만들어집니다."),
    localized("Yangi bob siz hali o‘ylab ko‘rmagan imkoniyatni ochishi mumkin.", "A new chapter may reveal a possibility you have not considered.", "Новая глава может открыть возможность, о которой вы не думали.", "새로운 장은 생각해 보지 못한 가능성을 보여 줄 수 있습니다."),
    localized("Kitob bilan suhbat qilish uchun uning fikrlariga diqqat bilan quloq tuting.", "To converse with a book, listen closely to its ideas.", "Чтобы вести диалог с книгой, внимательно прислушивайтесь к ее мыслям.", "책과 대화하려면 책의 생각에 주의 깊게 귀 기울여 보세요."),
    localized("O‘qish xotirani emas, avvalo anglashni maqsad qilganda chuqurlashadi.", "Reading deepens when understanding, not mere recall, is the aim.", "Чтение становится глубже, когда целью является понимание, а не простое запоминание.", "단순한 암기보다 이해를 목표로 할 때 독서는 더 깊어집니다."),
    localized("Bir kitobdan olingan aniq saboq kundalik tanlovni o‘zgartirishi mumkin.", "One clear lesson from a book can change an everyday choice.", "Один ясный урок из книги может изменить повседневный выбор.", "책에서 얻은 한 가지 분명한 교훈이 일상의 선택을 바꿀 수 있습니다."),
    localized("Kitoblar boshqa davrlar va odamlar bilan fikriy uchrashuvdir.", "Books are thoughtful encounters with other times and people.", "Книги — это вдумчивые встречи с другими эпохами и людьми.", "책은 다른 시대와 사람들을 만나는 사려 깊은 기회입니다."),
    localized("O‘qishdagi davomiylik bilimni asta-sekin, ammo ishonchli yig‘adi.", "Consistency in reading gathers knowledge slowly but surely.", "Регулярность в чтении постепенно, но надежно накапливает знания.", "꾸준히 읽으면 지식이 느리지만 확실하게 쌓입니다."),
  ],
  wisdoms: [
    localized("Kitobdagi asosiy fikrni o‘z so‘zingiz bilan aytish uni chuqurroq anglashga yordam beradi.", "Explaining a book's main idea in your own words deepens understanding.", "Пересказ главной мысли книги своими словами углубляет понимание.", "책의 핵심 생각을 자신의 말로 설명하면 이해가 깊어집니다."),
    localized("Faol o‘qish matnni shunchaki ko‘rish emas, uning dalillarini tekshirishdir.", "Active reading is not just seeing words; it is examining their arguments.", "Активное чтение — это не просто видеть слова, а проверять их аргументы.", "능동적 독서는 글자를 보는 데 그치지 않고 주장을 살펴보는 일입니다."),
    localized("Savol bilan o‘qilgan bob ko‘proq esda qoladi.", "A chapter read with a question in mind is more likely to stay with you.", "Глава, прочитанная с вопросом, лучше запоминается.", "질문을 품고 읽은 장은 더 오래 기억에 남습니다."),
    localized("Muhim jumlani belgilash keyinroq g‘oyaga qaytishni osonlashtiradi.", "Marking an important sentence makes it easier to return to the idea later.", "Отметка важного предложения облегчает возвращение к мысли позже.", "중요한 문장을 표시하면 나중에 그 생각으로 돌아가기 쉽습니다."),
    localized("Bir nechta manbani solishtirish tushunchani yanada ishonchli qiladi.", "Comparing several sources makes understanding more reliable.", "Сравнение нескольких источников делает понимание надежнее.", "여러 자료를 비교하면 이해가 더 탄탄해집니다."),
    localized("Muallifning fikri bilan rozi bo‘lmaslik ham tahliliy o‘qishning bir qismidir.", "Disagreeing with an author can also be part of analytical reading.", "Несогласие с автором тоже может быть частью аналитического чтения.", "저자의 생각에 동의하지 않는 것도 분석적 독서의 일부입니다."),
    localized("O‘qilgan bilim uni boshqa vaziyatda qo‘llaganda mustahkamlanadi.", "Knowledge from reading grows stronger when applied in another situation.", "Знания из книги укрепляются, когда применяются в другой ситуации.", "읽은 지식은 다른 상황에 적용할 때 더 단단해집니다."),
    localized("Badiiy asar boshqa insonning ichki dunyosini tasavvur qilishni o‘rgatadi.", "Literature teaches you to imagine another person's inner world.", "Литература учит представлять внутренний мир другого человека.", "문학은 다른 사람의 내면을 상상하는 법을 가르쳐 줍니다."),
    localized("Ilmiy kitob sabab va natijani aniqroq ko‘rishga yordam beradi.", "A nonfiction book can help you see cause and effect more clearly.", "Научно-популярная книга помогает яснее увидеть причины и следствия.", "비문학 책은 원인과 결과를 더 분명히 보게 합니다."),
    localized("O‘qish tezligi mazmunni anglashdan muhimroq emas.", "Reading speed matters less than understanding the meaning.", "Скорость чтения не важнее понимания смысла.", "읽는 속도보다 내용의 의미를 이해하는 일이 중요합니다."),
    localized("Har bir kitobdan hamma narsani emas, eng muhimini olib chiqish kifoya.", "You do not need to take everything from a book; its most important insight is enough.", "Не обязательно уносить из книги все; достаточно главного понимания.", "책에서 모든 것을 가져올 필요는 없고 가장 중요한 통찰이면 충분합니다."),
    localized("Qayta o‘qish avval ko‘zdan qochgan bog‘lanishlarni ko‘rsatadi.", "Rereading reveals connections you may have missed before.", "Повторное чтение показывает связи, которые раньше могли ускользнуть.", "다시 읽으면 처음에 놓친 연결을 발견할 수 있습니다."),
    localized("Kitobdagi misolni o‘z tajribangiz bilan bog‘lash bilimni jonlantiradi.", "Connecting a book's example with your experience brings knowledge to life.", "Связь примера из книги с собственным опытом оживляет знания.", "책의 사례를 자신의 경험과 연결하면 지식이 살아납니다."),
    localized("Yaxshi savol ko‘pincha tayyor javobdan uzoqroq fikrlashga olib boradi.", "A good question often leads thinking farther than a ready answer.", "Хороший вопрос часто ведет мысль дальше готового ответа.", "좋은 질문은 완성된 답보다 더 멀리 생각하게 합니다."),
    localized("O‘qishdan keyingi qisqa mulohaza bilimni faol xotiraga o‘tkazadi.", "A short reflection after reading moves knowledge into active memory.", "Короткое размышление после чтения переводит знания в активную память.", "독서 후 짧게 돌아보면 지식이 능동적 기억으로 옮겨갑니다."),
    localized("Kitobdan olingan saboq amaliy tanlovga aylanganda o‘z qadrini ko‘rsatadi.", "A lesson from a book shows its value when it becomes a practical choice.", "Урок книги раскрывает ценность, когда превращается в практический выбор.", "책의 교훈은 실제 선택이 될 때 가치를 보여 줍니다."),
    localized("Turli mualliflarni o‘qish bitta masalaga bir nechta ko‘z bilan qarashni o‘rgatadi.", "Reading different authors teaches you to see one subject through several eyes.", "Чтение разных авторов учит смотреть на один предмет несколькими взглядами.", "다양한 작가를 읽으면 하나의 주제를 여러 시선으로 볼 수 있습니다."),
    localized("Tushunarsiz joyni belgilash o‘qishni to‘xtatish emas, chuqurroq izlanishga boshlashdir.", "Marking an unclear passage is not stopping; it is beginning deeper inquiry.", "Отметить непонятное место — не остановиться, а начать более глубокий поиск.", "이해되지 않는 부분을 표시하는 것은 멈춤이 아니라 더 깊이 탐구하는 시작입니다."),
    localized("Kitobning tuzilishini kuzatish muallif qanday fikr yuritganini ochib beradi.", "Following a book's structure reveals how the author developed the idea.", "Наблюдение за структурой книги показывает ход мысли автора.", "책의 구성을 따라가면 저자가 생각을 전개한 방식을 알 수 있습니다."),
    localized("Bir fikrni hayotda sinab ko‘rish kitob bilan o‘quvchi orasida ko‘prik quradi.", "Trying one idea in life builds a bridge between a book and its reader.", "Проверка одной идеи в жизни строит мост между книгой и читателем.", "한 가지 생각을 삶에서 시도하면 책과 독자 사이에 다리가 놓입니다."),
    localized("O‘qilganlarni boshqaga tushuntirish o‘z tushunchangizdagi bo‘shliqni ko‘rsatadi.", "Explaining what you read to someone reveals gaps in your understanding.", "Объяснение прочитанного другому человеку показывает пробелы в понимании.", "읽은 내용을 다른 사람에게 설명하면 이해의 빈틈이 드러납니다."),
    localized("Har kuni ozgina o‘qish katta kitoblarni ham yaqinlashtiradi.", "A little reading each day makes even large books approachable.", "Небольшое чтение каждый день приближает даже большие книги.", "매일 조금씩 읽으면 두꺼운 책도 가까워집니다."),
    localized("Kitobning g‘oyasi vaqt o‘tishi bilan yangi ma’no kasb etishi mumkin.", "A book's idea can take on new meaning over time.", "Идея книги со временем может обрести новый смысл.", "책의 생각은 시간이 지나며 새로운 의미를 얻을 수 있습니다."),
    localized("O‘qish odati e’tibor, tasavvur va mulohazani birga tarbiyalaydi.", "A reading habit develops attention, imagination, and reflection together.", "Привычка читать одновременно развивает внимание, воображение и размышление.", "독서 습관은 집중력과 상상력, 성찰을 함께 키웁니다."),
    localized("Kitobni yopgandan keyin qolgan savol uning sizga ta’sir qilganidan dalolat beradi.", "The question that remains after closing a book shows that it has worked on you.", "Вопрос, оставшийся после книги, показывает, что она вас затронула.", "책을 덮은 뒤 남는 질문은 책이 내게 영향을 주었다는 증거입니다."),
  ],
  actions: [
    localized("Bugun kitobdan bir necha sahifa diqqat bilan o‘qing.", "Read a few pages of a book with full attention today.", "Сегодня внимательно прочитайте несколько страниц книги.", "오늘 책을 몇 쪽이라도 온전히 집중해서 읽어 보세요."),
    localized("O‘qishdan oldin bobga bitta savol bering.", "Ask the chapter one question before you begin reading.", "Перед чтением задайте главе один вопрос.", "읽기 전에 그 장에 질문 하나를 던져 보세요."),
    localized("Asosiy fikrni bir jumlada o‘z so‘zingiz bilan ayting.", "State the main idea in one sentence of your own.", "Сформулируйте главную мысль одним предложением своими словами.", "핵심 생각을 자신의 말로 한 문장으로 말해 보세요."),
    localized("Muhim dalil yoki jumlani belgilab qo‘ying.", "Mark one important piece of evidence or sentence.", "Отметьте один важный аргумент или фрагмент.", "중요한 근거나 문장 하나를 표시해 보세요."),
    localized("O‘qigan g‘oyangizni tanish hayotiy vaziyat bilan bog‘lang.", "Connect the idea you read with a familiar life situation.", "Свяжите прочитанную идею со знакомой жизненной ситуацией.", "읽은 생각을 익숙한 삶의 상황과 연결해 보세요."),
    localized("Bir paragrafni sekin qayta o‘qib, yashirin ma’nosini izlang.", "Reread one paragraph slowly and look for its deeper meaning.", "Медленно перечитайте один абзац и найдите его глубокий смысл.", "한 문단을 천천히 다시 읽으며 깊은 의미를 찾아보세요."),
    localized("Muallifning asosiy da’vosini o‘z savolingiz bilan tekshiring.", "Test the author's main claim with a question of your own.", "Проверьте главный тезис автора собственным вопросом.", "자신의 질문으로 저자의 핵심 주장을 점검해 보세요."),
    localized("O‘qilgan bobdan bitta amaliy saboq tanlang.", "Choose one practical lesson from the chapter.", "Выберите один практический урок из главы.", "읽은 장에서 실천할 교훈 하나를 골라 보세요."),
    localized("Bugungi o‘qishni kamida o‘n daqiqa davom ettiring.", "Continue today's reading for at least ten minutes.", "Продолжайте сегодняшнее чтение хотя бы десять минут.", "오늘 독서를 최소 10분 더 이어 가 보세요."),
    localized("O‘qigan fikringizni boshqa bir kitobdagi g‘oya bilan solishtiring.", "Compare the idea you read with one from another book.", "Сравните прочитанную мысль с идеей из другой книги.", "읽은 생각을 다른 책의 생각과 비교해 보세요."),
    localized("Tushunarsiz joyga belgi qo‘yib, keyinroq izlaning.", "Mark an unclear passage and investigate it later.", "Отметьте непонятное место и изучите его позже.", "이해되지 않는 부분을 표시하고 나중에 찾아보세요."),
    localized("Bir qahramon yoki muallif qarorini uning sababi bilan tahlil qiling.", "Analyze a character's or author's choice and its reason.", "Проанализируйте решение героя или автора и его причину.", "인물이나 저자의 선택과 그 이유를 분석해 보세요."),
    localized("O‘qiganingizni bir kishiga qisqa qilib tushuntirib bering.", "Explain what you read briefly to someone.", "Кратко объясните прочитанное другому человеку.", "읽은 내용을 누군가에게 짧게 설명해 보세요."),
    localized("Kitobdagi bitta fikrni kundalik hayotda sinab ko‘ring.", "Try one idea from the book in everyday life.", "Попробуйте одну идею из книги в повседневной жизни.", "책의 생각 하나를 일상에서 실천해 보세요."),
    localized("Bob oxirida esda qolgan uchta tushunchani sanang.", "Name three ideas you remember at the end of the chapter.", "В конце главы назовите три понятия, которые запомнили.", "장을 마친 뒤 기억에 남은 개념 세 가지를 떠올려 보세요."),
    localized("Kitobning tuzilishi keyingi fikrga qanday olib borishini kuzating.", "Notice how the book's structure leads to its next idea.", "Заметьте, как структура книги ведет к следующей мысли.", "책의 구성이 다음 생각으로 어떻게 이어지는지 살펴보세요."),
    localized("O‘qishdan keyin qolgan eng muhim savolni saqlab qo‘ying.", "Keep the most important question that remains after reading.", "Сохраните самый важный вопрос, оставшийся после чтения.", "읽고 난 뒤 남은 가장 중요한 질문을 간직해 보세요."),
    localized("Bugun o‘qigan sahifangizdan hayotingizga mos bir xulosa chiqaring.", "Draw one life-relevant conclusion from today's pages.", "Сделайте вывод для жизни из сегодняшних страниц.", "오늘 읽은 페이지에서 삶에 맞는 결론 하나를 이끌어 내세요."),
    localized("Keyingi o‘qishda tekshirmoqchi bo‘lgan g‘oyani belgilang.", "Mark an idea you want to examine in your next reading session.", "Отметьте идею, которую хотите проверить при следующем чтении.", "다음 독서에서 살펴보고 싶은 생각을 표시해 두세요."),
    localized("Kitobni yopishdan oldin mazmunini o‘z so‘zingiz bilan umumlashtiring.", "Summarize the book's passage in your own words before closing it.", "Перед тем как закрыть книгу, перескажите прочитанное своими словами.", "책을 덮기 전에 내용을 자신의 말로 요약해 보세요."),
  ],
} satisfies {
  emojis: readonly string[];
  openers: readonly BooksLocalizedText[];
  wisdoms: readonly BooksLocalizedText[];
  actions: readonly BooksLocalizedText[];
};