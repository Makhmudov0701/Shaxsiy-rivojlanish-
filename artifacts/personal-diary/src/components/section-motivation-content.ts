import {
  BookMarked,
  BookOpen,
  CalendarCheck2,
  Lightbulb,
  ListTodo,
  LockKeyhole,
  Repeat2,
  Star,
  Timer,
  type LucideIcon,
} from "lucide-react";

export type SectionId =
  | "diary"
  | "focus"
  | "goals"
  | "tasks"
  | "books"
  | "repetition"
  | "ideas"
  | "habits"
  | "vault";

export interface SectionMotivationContent {
  id: SectionId;
  title: string;
  eyebrow: string;
  purpose: string;
  benefits: string[];
  accent: string;
  icon: LucideIcon;
  quotes: string[];
}

export const sectionMotivationContent: Record<SectionId, SectionMotivationContent> = {
  diary: {
    id: "diary",
    title: "Kundalik",
    eyebrow: "Fikrlar va kayfiyat uchun shaxsiy makon",
    purpose: "Kun voqealari, fikrlar va kayfiyatni yozib boring — o‘zingizni yaxshiroq tushunishga yordam beradi.",
    benefits: [
      "Fikrlarni yozib, xotirangizga biroz joy oching.",
      "Kayfiyat va odatlaringizni vaqt davomida kuzating.",
      "Muhim voqea va g‘oyalarni keyin oson toping.",
    ],
    accent: "#b89c5c",
    icon: BookOpen,
    quotes: [
      "Mukammal jumla shart emas. Haqiqiy jumla kifoya.",
      "Bugun bitta satr yozdingizmi? Ertangi o‘zingizga iz qoldirdingiz.",
      "Xotira: “keyin eslayman”. Kundalik: “men shu yerdaman”.",
      "Bir satr ham tartibsiz fikrlarni safga tizishi mumkin.",
    ],
  },
  focus: {
    id: "focus",
    title: "Diqqat va Pomodoro",
    eyebrow: "Chalg‘imasdan ishlash uchun",
    purpose: "Vazifani taymer bilan qisqa diqqat davrlariga ajrating va tanaffuslarni rejalang.",
    benefits: [
      "Katta ishni boshlash osonroq bo‘lgan kichik bo‘laklarga ajrating.",
      "Diqqat davrlari va dam olishni muvozanatlang.",
      "Taymer yonidagi vazifalar ro‘yxati bilan nimaga kirishayotganingizni unutmang.",
    ],
    accent: "#c47a57",
    icon: Timer,
    quotes: [
      "25 daqiqa diqqat. 25 ta yangi tab emas.",
      "Tanaffus — dangasalik emas. Miyaga qayta yuklanish oynasi.",
      "Katta ish ham “faqat besh daqiqa”dan boshlanadi.",
      "Telefon jim, taymer yurdi. Endi sizning navbatingiz.",
    ],
  },
  goals: {
    id: "goals",
    title: "Maqsadlar",
    eyebrow: "Katta niyatlar, kichik qadamlar",
    purpose: "Uzoq muddatli maqsadlarni aniq qadamlar va kuzatib boriladigan marralarga aylantiring.",
    benefits: [
      "Nimani va nima uchun xohlayotganingizni aniqlashtiring.",
      "Katta maqsadni bajarish mumkin bo‘lgan bosqichlarga bo‘ling.",
      "Qancha yo‘l bosganingizni ko‘rib, keyingi qadamni tanlang.",
    ],
    accent: "#bf9a4d",
    icon: Star,
    quotes: [
      "Maqsad xarita. Birinchi kichik qadam esa — yo‘lga chiqish.",
      "Sekin yurish ham oldinga yurish. Orqaga aylanmasangiz bo‘ldi.",
      "Kelajakdagi siz bugungi kichik qadamingiz uchun rahmat aytadi.",
      "Katta reja qo‘rqitsa, uning eng kichik qismini bajaring.",
    ],
  },
  tasks: {
    id: "tasks",
    title: "Topshiriqlar",
    eyebrow: "Rejalarni tartibga solish uchun",
    purpose: "Kundalik ishlarni toifalarga ajrating, muddat qo‘ying va bajarilganlarini kuzating.",
    benefits: [
      "Muhim va keyinroq qilinadigan ishlarni ajrating.",
      "Muddatlarni bir joyda ko‘rib, rejangizni aniqlashtiring.",
      "Bajarilgan belgilari bilan o‘z yutug‘ingizni ko‘ring.",
    ],
    accent: "#6e987a",
    icon: ListTodo,
    quotes: [
      "Reja: o‘n ikkita band. Bugun: bittasi. Baribir oldinga.",
      "“Bajarildi” degan bitta belgi ham kayfiyatni ko‘taradi.",
      "Vazifani kichraytiring — boshlash ham kichrayadi.",
      "Ro‘yxat sizni hukm qilmaydi. Faqat navbatni eslatadi.",
    ],
  },
  books: {
    id: "books",
    title: "Kitoblar",
    eyebrow: "O‘qiganlaringizdan qolgan izlar",
    purpose: "O‘qiyotgan kitoblaringiz, taassurotlaringiz va esda qolgan fikrlarni bir joyda saqlang.",
    benefits: [
      "O‘qish rejangizni kuzatib boring.",
      "Sevimli iqtibos va fikrlarni yo‘qotmang.",
      "Vaqt o‘tib o‘qiganlaringizni eslab, qayta ko‘rib chiqing.",
    ],
    accent: "#657fa3",
    icon: BookMarked,
    quotes: [
      "Bir sahifa ham kitobni yopiq qoldirishdan ko‘proq.",
      "Kitobning eng yaxshi joyi? Keyingi sahifasi ham bor.",
      "O‘qiganingiz yoddan chiqishi mumkin. Qayd esa qoladi.",
      "Bugun bir necha sahifa. Ertaga yangi fikr.",
    ],
  },
  repetition: {
    id: "repetition",
    title: "Takrorlash",
    eyebrow: "Bilimni uzoqroq eslab qolish uchun",
    purpose: "Kartalarni vaqtida takrorlab, o‘rgangan ma’lumotni xotirada mustahkamlang.",
    benefits: [
      "Qaysi kartalarni bugun ko‘rish kerakligini biling.",
      "Oraliqli takrorlash orqali eslab qolishni mashq qiling.",
      "O‘sishingiz va takrorlash maromingizni kuzating.",
    ],
    accent: "#8b73aa",
    icon: Repeat2,
    quotes: [
      "Kartani eslay olmasangiz, yutqazmadingiz — mashq topdingiz.",
      "Miya: “bilaman”. Takrorlash: “unda eslab ko‘r-chi”.",
      "Besh daqiqa takrorlash — ertangi o‘zingizga sovg‘a.",
      "Bugun eslagan bir narsa ertaga ham siz bilan qoladi.",
    ],
  },
  ideas: {
    id: "ideas",
    title: "G‘oyalar",
    eyebrow: "Fikrlar yo‘qolib ketmasligi uchun",
    purpose: "Kutilmagan fikr va ilhomlarni keyin ko‘rib chiqish uchun tezda yozib qo‘ying.",
    benefits: [
      "G‘oya kelganda uni tezda saqlab qo‘ying.",
      "Fikrlarni mavzu bo‘yicha tartiblang.",
      "Saqlangan g‘oyalarga qaytib, keyingi qadamni tanlang.",
    ],
    accent: "#c29450",
    icon: Lightbulb,
    quotes: [
      "Yaxshi g‘oyalar ko‘pincha “buni unutmayman” degan joyda yo‘qoladi.",
      "G‘oya kichik bo‘lishi mumkin. Qayd esa katta ishni boshlaydi.",
      "Miyangizga hamma narsani eslab yurish shart emas — yozib qo‘ying.",
      "Bugungi tasodifiy fikr ertangi eng yaxshi reja bo‘lishi mumkin.",
    ],
  },
  habits: {
    id: "habits",
    title: "Odatlar",
    eyebrow: "Kundalik davomiylik uchun",
    purpose: "O‘zingiz uchun muhim odatlarni belgilang va ularni muntazam bajarishni kuzating.",
    benefits: [
      "Yangi odatni aniq va bajarish mumkin bo‘lgan qiling.",
      "Davomiylikni ko‘rib, kichik yutuqlarni qadrlang.",
      "Bir kun o‘tib ketsa ham, qaytadan boshlashni osonlashtiring.",
    ],
    accent: "#6e987a",
    icon: CalendarCheck2,
    quotes: [
      "Odatlar: kichik ishlar, katta taassurot qoldiradigan natija.",
      "Bir kun o‘tib ketdi? Davomiylik uzilmadi — siz yana qaytdingiz.",
      "Mukammal marom shart emas. Qayta boshlash ham mahorat.",
      "Ikki daqiqa bugun — ertangi odatga qo‘yilgan poydevor.",
    ],
  },
  vault: {
    id: "vault",
    title: "Maxfiy jild",
    eyebrow: "Alohida kod bilan ochiladigan shaxsiy sahifalar",
    purpose: "Maxfiy qaydlarni kundalikdan alohida, faqat o‘zingiz biladigan kod bilan ochiladigan sahifalarda saqlang.",
    benefits: [
      "Maxfiy qaydlarni kundalik yozuvlaridan ajrating.",
      "Sahifalarni o‘zingiz tanlagan kod bilan himoyalang.",
      "Shaxsiy yozuvlaringizni bir joyda tartiblang.",
    ],
    accent: "#7c739b",
    icon: LockKeyhole,
    quotes: [
      "Tartibli joy — xotirjam bosh.",
      "Kerakli qaydni topish uchun xotirani titkilash shart emas.",
      "Ba’zi narsalar faqat o‘zingiz uchun yoziladi. Bu ham yetarli.",
      "Kichik tartib — keyinroq kamroq qidiruv.",
    ],
  },
};

const routeSections: Record<string, SectionId> = {
  "/user-portal": "diary",
  "/pomodoro": "focus",
  "/goals": "goals",
  "/tasks": "tasks",
  "/books": "books",
  "/repetition": "repetition",
  "/ideas": "ideas",
  "/habits": "habits",
  "/vault": "vault",
};

export function sectionIdForPath(pathname: string): SectionId | null {
  return routeSections[pathname] ?? null;
}