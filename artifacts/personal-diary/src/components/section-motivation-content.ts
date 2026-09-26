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

export type MotivationCategory = "diary" | "focus" | "repetition" | "tasks" | "goals" | "books";

export interface SectionMotivationContent {
  id: SectionId;
  title: string;
  eyebrow: string;
  motivationLabel: string;
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
    accent: "#b89c5c",
    icon: BookOpen,
    motivationCategory: "diary",
  },
  focus: {
    id: "focus",
    title: "Diqqat va Pomodoro",
    eyebrow: "Chalg‘imasdan ishlash uchun",
    motivationLabel: "Fokus va Pomodoro",
    accent: "#c47a57",
    icon: Timer,
    motivationCategory: "focus",
  },
  goals: {
    id: "goals",
    title: "Maqsadlar",
    eyebrow: "Katta niyatlar, kichik qadamlar",
    motivationLabel: "Maqsad eslatmasi",
    accent: "#bf9a4d",
    icon: Star,
    motivationCategory: "goals",
  },
  tasks: {
    id: "tasks",
    title: "Topshiriqlar",
    eyebrow: "Rejalarni tartibga solish uchun",
    motivationLabel: "Topshiriq eslatmasi",
    accent: "#6e987a",
    icon: ListTodo,
    motivationCategory: "tasks",
  },
  books: {
    id: "books",
    title: "Kitoblar",
    eyebrow: "O‘qiganlaringizdan qolgan izlar",
    motivationLabel: "O‘qishdan qayd",
    accent: "#657fa3",
    icon: BookMarked,
    motivationCategory: "books",
  },
  repetition: {
    id: "repetition",
    title: "Takrorlash",
    eyebrow: "Bilimni uzoqroq eslab qolish uchun",
    motivationLabel: "Oraliqli takrorlash",
    accent: "#8b73aa",
    icon: Repeat2,
    motivationCategory: "repetition",
  },
  ideas: {
    id: "ideas",
    title: "G‘oyalar",
    eyebrow: "Fikrlar yo‘qolib ketmasligi uchun",
    motivationLabel: "G‘oyalarni qayd etish",
    accent: "#c29450",
    icon: Lightbulb,
    motivationCategory: "diary",
  },
  habits: {
    id: "habits",
    title: "Odatlar",
    eyebrow: "Kundalik davomiylik uchun",
    motivationLabel: "Odatlar uchun kichik qadam",
    accent: "#6e987a",
    icon: CalendarCheck2,
    motivationCategory: "tasks",
  },
  vault: {
    id: "vault",
    title: "Maxfiy jild",
    eyebrow: "Alohida kod bilan ochiladigan shaxsiy sahifalar",
    motivationLabel: "Xotirjamlik fikri",
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