import { customType, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { diaryEntriesTable } from "./diary-entries";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const diaryPhotosTable = pgTable("diary_photos", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id")
    .notNull()
    .references(() => diaryEntriesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DiaryPhoto = typeof diaryPhotosTable.$inferSelect;