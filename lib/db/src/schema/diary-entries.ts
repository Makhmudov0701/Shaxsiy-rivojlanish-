import { createInsertSchema } from "drizzle-zod";
import { boolean, date, pgEnum, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const diaryMoodEnum = pgEnum("diary_mood", [
  "peaceful",
  "happy",
  "grateful",
  "energized",
  "thoughtful",
  "sad",
  "anxious",
]);

export const diaryEntriesTable = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: diaryMoodEnum("mood").notNull(),
  weatherCondition: text("weather_condition"),
  temperatureC: real("temperature_c"),
  folder: text("folder").notNull().default("Shaxsiy"),
  tags: text("tags").array().notNull().default([]),
  favorite: boolean("favorite").notNull().default(false),
  entryDate: date("entry_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertDiaryEntrySchema = createInsertSchema(diaryEntriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type DiaryEntry = typeof diaryEntriesTable.$inferSelect;