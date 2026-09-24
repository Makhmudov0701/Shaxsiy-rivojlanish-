import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const userSettingsTable = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  pinHash: text("pin_hash"),
  pinEnabled: boolean("pin_enabled").notNull().default(false),
  dailyUsageLimitEnabled: boolean("daily_usage_limit_enabled")
    .notNull()
    .default(false),
  dailyUsageLimitSeconds: integer("daily_usage_limit_seconds")
    .notNull()
    .default(7200),
  dailyUsageLanguage: text("daily_usage_language").notNull().default("uz"),
  dailyUsageTimeZone: text("daily_usage_time_zone").notNull().default("UTC"),
  dailyUsageDate: date("daily_usage_date", { mode: "string" }),
  dailyUsageSeconds: integer("daily_usage_seconds").notNull().default(0),
  dailyUsageExtensionSeconds: integer("daily_usage_extension_seconds")
    .notNull()
    .default(0),
  dailyUsageLastHeartbeatAt: timestamp("daily_usage_last_heartbeat_at", {
    withTimezone: true,
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserSettings = typeof userSettingsTable.$inferSelect;