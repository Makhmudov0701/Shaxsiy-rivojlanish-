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

export type MotivationCategory = "diary" | "focus" | "repetition" | "tasks";

export interface SectionMotivationContent {
  id: SectionId;
  title: string;
  eyebrow: string;
  motivationLabel: string;
  purpose: string;
  benefits: string[];
  accent: string;
  icon: LucideIcon;
  motivationCategory: MotivationCategory;
}

export const sectionMotivationContent: Record<SectionId, SectionMotivationContent> = {
  diary: {
    id: "diary",
    title: "Kundalik",
    eyebrow: "Fikrlar va kayfiyat uchun shaxsiy makon",
    motivationLabel: "Kundalik fikri",
    purpose: "Kun voqealari, fikrlar va kayfiyatni yozib boring — o‘zingizni yaxshiroq tushunishga yordam beradi.",
    benefits: [
      "Fikrlarni yozib, xotirangizga biroz joy oching.",
      "Kayfiyat va odatlaringizni vaqt davomida kuzating.",
      "Muhim voqea va g‘oyalarni keyin oson toping.",
    ],
    accent: "#b89c5c",
    icon: BookOpen,
    motivationCategory: "diary",
  },
  focus: {
    id: "focus",
    title: "Diqqat va Pomodoro",
    eyebrow: "Chalg‘imasdan ishlash uchun",
    motivationLabel: "Fokus va Pomodoro",
    purpose: "Vazifani taymer bilan qisqa diqqat davrlariga ajrating va tanaffuslarni rejalang.",
    benefits: [
      "Katta ishni boshlash osonroq bo‘lgan kichik bo‘laklarga ajrating.",
      "Diqqat davrlari va dam olishni muvozanatlang.",
      "Taymer yonidagi vazifalar ro‘yxati bilan nimaga kirishayotganingizni unutmang.",
    ],
    accent: "#c47a57",
    icon: Timer,
    motivationCategory: "focus",
  },
  goals: {
    id: "goals",
    title: "Maqsadlar",
    eyebrow: "Katta niyatlar, kichik qadamlar",
    motivationLabel: "Maqsad eslatmasi",
    purpose: "Uzoq muddatli maqsadlarni aniq qadamlar va kuzatib boriladigan marralarga aylantiring.",
    benefits: [
      "Nimani va nima uchun xohlayotganingizni aniqlashtiring.",
      "Katta maqsadni bajarish mumkin bo‘lgan bosqichlarga bo‘ling.",
      "Qancha yo‘l bosganingizni ko‘rib, keyingi qadamni tanlang.",
    ],
    accent: "#bf9a4d",
    icon: Star,
    motivationCategory: "tasks",
  },
  tasks: {
    id: "tasks",
    title: "Topshiriqlar",
    eyebrow: "Rejalarni tartibga solish uchun",
    motivationLabel: "Topshiriq eslatmasi",
    purpose: "Kundalik ishlarni toifalarga ajrating, muddat qo‘ying va bajarilganlarini kuzating.",
    benefits: [
      "Muhim va keyinroq qilinadigan ishlarni ajrating.",
      "Muddatlarni bir joyda ko‘rib, rejangizni aniqlashtiring.",
      "Bajarilgan belgilari bilan o‘z yutug‘ingizni ko‘ring.",
    ],
    accent: "#6e987a",
    icon: ListTodo,
    motivationCategory: "tasks",
  },
  books: {
    id: "books",
    title: "Kitoblar",
    eyebrow: "O‘qiganlaringizdan qolgan izlar",
    motivationLabel: "O‘qishdan qayd",
    purpose: "O‘qiyotgan kitoblaringiz, taassurotlaringiz va esda qolgan fikrlarni bir joyda saqlang.",
    benefits: [
      "O‘qish rejangizni kuzatib boring.",
      "Sevimli iqtibos va fikrlarni yo‘qotmang.",
      "Vaqt o‘tib o‘qiganlaringizni eslab, qayta ko‘rib chiqing.",
    ],
    accent: "#657fa3",
    icon: BookMarked,
    motivationCategory: "diary",
  },
  repetition: {
    id: "repetition",
    title: "Takrorlash",
    eyebrow: "Bilimni uzoqroq eslab qolish uchun",
    motivationLabel: "Oraliqli takrorlash",
    purpose: "Kartalarni vaqtida takrorlab, o‘rgangan ma’lumotni xotirada mustahkamlang.",
    benefits: [
      "Qaysi kartalarni bugun ko‘rish kerakligini biling.",
      "Oraliqli takrorlash orqali eslab qolishni mashq qiling.",
      "O‘sishingiz va takrorlash maromingizni kuzating.",
    ],
    accent: "#8b73aa",
    icon: Repeat2,
    motivationCategory: "repetition",
  },
  ideas: {
    id: "ideas",
    title: "G‘oyalar",
    eyebrow: "Fikrlar yo‘qolib ketmasligi uchun",
    motivationLabel: "G‘oyalarni qayd etish",
    purpose: "Kutilmagan fikr va ilhomlarni keyin ko‘rib chiqish uchun tezda yozib qo‘ying.",
    benefits: [
      "G‘oya kelganda uni tezda saqlab qo‘ying.",
      "Fikrlarni mavzu bo‘yicha tartiblang.",
      "Saqlangan g‘oyalarga qaytib, keyingi qadamni tanlang.",
    ],
    accent: "#c29450",
    icon: Lightbulb,
    motivationCategory: "diary",
  },
  habits: {
    id: "habits",
    title: "Odatlar",
    eyebrow: "Kundalik davomiylik uchun",
    motivationLabel: "Odatlar uchun kichik qadam",
    purpose: "O‘zingiz uchun muhim odatlarni belgilang va ularni muntazam bajarishni kuzating.",
    benefits: [
      "Yangi odatni aniq va bajarish mumkin bo‘lgan qiling.",
      "Davomiylikni ko‘rib, kichik yutuqlarni qadrlang.",
      "Bir kun o‘tib ketsa ham, qaytadan boshlashni osonlashtiring.",
    ],
    accent: "#6e987a",
    icon: CalendarCheck2,
    motivationCategory: "tasks",
  },
  vault: {
    id: "vault",
    title: "Maxfiy jild",
    eyebrow: "Alohida kod bilan ochiladigan shaxsiy sahifalar",
    motivationLabel: "Xotirjamlik fikri",
    purpose: "Maxfiy qaydlarni kundalikdan alohida, faqat o‘zingiz biladigan kod bilan ochiladigan sahifalarda saqlang.",
    benefits: [
      "Maxfiy qaydlarni kundalik yozuvlaridan ajrating.",
      "Sahifalarni o‘zingiz tanlagan kod bilan himoyalang.",
      "Shaxsiy yozuvlaringizni bir joyda tartiblang.",
    ],
    accent: "#7c739b",
    icon: LockKeyhole,
    motivationCategory: "diary",
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