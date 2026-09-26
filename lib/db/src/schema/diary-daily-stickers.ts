import { createInsertSchema } from "drizzle-zod";
import { date, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const diaryDailyStickerEnum = pgEnum("diary_daily_sticker", [
  "productive",
  "study",
  "calm",
  "busy",
  "happy",
  "creative",
  "rest",
  "social",
]);

export const diaryDailyStickersTable = pgTable(
  "diary_daily_stickers",
  {
    userId: text("user_id").notNull(),
    stickerDate: date("sticker_date", { mode: "string" }).notNull(),
    sticker: diaryDailyStickerEnum("sticker").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("diary_daily_stickers_user_date_idx").on(table.userId, table.stickerDate)],
);

export const insertDiaryDailyStickerSchema = createInsertSchema(diaryDailyStickersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertDiaryDailySticker = z.infer<typeof insertDiaryDailyStickerSchema>;
export type DiaryDailySticker = typeof diaryDailyStickersTable.$inferSelect;