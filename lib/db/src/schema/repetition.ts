import { createInsertSchema } from "drizzle-zod";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const repetitionRatingEnum = pgEnum("repetition_rating", [
  "again",
  "hard",
  "good",
  "easy",
]);

export const repetitionDecksTable = pgTable(
  "repetition_decks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("repetition_decks_user_id_idx").on(table.userId),
    uniqueIndex("repetition_decks_user_name_idx").on(table.userId, table.name),
  ],
);

export const repetitionCardsTable = pgTable(
  "repetition_cards",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    deckId: integer("deck_id")
      .notNull()
      .references(() => repetitionDecksTable.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    intervalDays: integer("interval_days").notNull().default(0),
    easeFactor: real("ease_factor").notNull().default(2.5),
    repetitions: integer("repetitions").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    learnedAt: timestamp("learned_at", { withTimezone: true }),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("repetition_cards_user_due_idx").on(table.userId, table.dueAt),
    index("repetition_cards_deck_id_idx").on(table.deckId),
  ],
);

export const repetitionReviewLogsTable = pgTable(
  "repetition_review_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    cardId: integer("card_id")
      .notNull()
      .references(() => repetitionCardsTable.id, { onDelete: "cascade" }),
    rating: repetitionRatingEnum("rating").notNull(),
    reviewedOn: date("reviewed_on", { mode: "string" }).notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("repetition_review_logs_user_day_idx").on(table.userId, table.reviewedOn),
  ],
);

export const insertRepetitionDeckSchema = createInsertSchema(repetitionDecksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRepetitionDeck = z.infer<typeof insertRepetitionDeckSchema>;
export type RepetitionDeck = typeof repetitionDecksTable.$inferSelect;

export const insertRepetitionCardSchema = createInsertSchema(repetitionCardsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRepetitionCard = z.infer<typeof insertRepetitionCardSchema>;
export type RepetitionCard = typeof repetitionCardsTable.$inferSelect;

export const insertRepetitionReviewLogSchema = createInsertSchema(repetitionReviewLogsTable).omit({
  id: true,
  reviewedAt: true,
});
export type InsertRepetitionReviewLog = z.infer<typeof insertRepetitionReviewLogSchema>;
export type RepetitionReviewLog = typeof repetitionReviewLogsTable.$inferSelect;