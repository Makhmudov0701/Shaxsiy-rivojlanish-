import { createInsertSchema } from "drizzle-zod";
import {
  date,
  boolean,
  index,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const taskCategoryEnum = pgEnum("task_category", [
  "important",
  "this_week",
  "this_month",
  "this_year",
  "free_time",
]);

export const tasksTable = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    category: taskCategoryEnum("category").notNull(),
    dueDate: date("due_date", { mode: "string" }),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_user_category_idx").on(table.userId, table.category),
    index("tasks_user_completed_idx").on(table.userId, table.completed),
    index("tasks_user_due_date_idx").on(table.userId, table.dueDate),
  ],
);

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;