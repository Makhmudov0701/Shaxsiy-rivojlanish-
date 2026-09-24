import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userSettingsTable } from "@workspace/db";
import {
  GetActiveTimeLimitResponse,
  GetDiarySettingsResponse,
  HeartbeatActiveTimeBody,
  HeartbeatActiveTimeResponse,
  OverrideActiveTimeLimitBody,
  OverrideActiveTimeLimitResponse,
  RemoveDiaryPinResponse,
  SetDiaryPinBody,
  SetDiaryPinResponse,
  UpdateActiveTimeLimitBody,
  UpdateActiveTimeLimitResponse,
  VerifyDiaryPinBody,
  VerifyDiaryPinResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const protectedRouter = Router();
protectedRouter.use(requireAuth);

const MAX_HEARTBEAT_SECONDS = 15;
const EXTENSION_SECONDS = 15 * 60;
const PIN_MAX_FAILURES = 5;
const PIN_LOCK_MILLISECONDS = 10 * 60 * 1000;
const pinAttempts = new Map<string, { failures: number; lockedUntil: number }>();

function userIdFrom(res: { locals: { userId?: string } }): string {
  const userId = res.locals.userId;
  if (!userId) throw new Error("Missing authenticated user");
  return userId;
}

function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const [, salt, expected] = stored.split("$");
  if (!salt || !expected) return false;
  const actual = scryptSync(pin, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

function isPinLocked(userId: string): boolean {
  const attempt = pinAttempts.get(userId);
  if (!attempt) return false;
  if (attempt.lockedUntil > 0 && attempt.lockedUntil <= Date.now()) {
    pinAttempts.delete(userId);
    return false;
  }
  return attempt.lockedUntil > Date.now();
}

function recordPinFailure(userId: string): void {
  const current = pinAttempts.get(userId);
  const failures = (current?.failures ?? 0) + 1;
  pinAttempts.set(userId, {
    failures: failures >= PIN_MAX_FAILURES ? 0 : failures,
    lockedUntil:
      failures >= PIN_MAX_FAILURES ? Date.now() + PIN_LOCK_MILLISECONDS : 0,
  });
}

function clearPinFailures(userId: string): void {
  pinAttempts.delete(userId);
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function localDateInTimeZone(timeZone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function activeTimeResponse(
  row: typeof userSettingsTable.$inferSelect,
  today: string,
) {
  const usedSeconds = row.dailyUsageDate === today ? row.dailyUsageSeconds : 0;
  const extensionSeconds =
    row.dailyUsageDate === today ? row.dailyUsageExtensionSeconds : 0;
  const effectiveLimitSeconds =
    row.dailyUsageLimitSeconds + extensionSeconds;

  return {
    enabled: row.dailyUsageLimitEnabled,
    limitSeconds: row.dailyUsageLimitSeconds,
    usedSeconds,
    extensionSeconds,
    effectiveLimitSeconds,
    remainingSeconds: Math.max(0, effectiveLimitSeconds - usedSeconds),
    locked:
      row.dailyUsageLimitEnabled && usedSeconds >= effectiveLimitSeconds,
    language: row.dailyUsageLanguage as "uz" | "ru" | "en" | "ko",
    pinEnabled: row.pinEnabled,
    timeZone: row.dailyUsageTimeZone,
    today,
  };
}

async function getActiveTimeState(
  userId: string,
  timeZone: string,
  recordHeartbeat: boolean,
) {
  const now = new Date();
  const today = localDateInTimeZone(timeZone, now);

  return db.transaction(async (tx) => {
    await tx
      .insert(userSettingsTable)
      .values({ userId })
      .onConflictDoNothing();
    const [stored] = await tx
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .for("update");

    if (!stored) throw new Error("Unable to load active-time settings");

    const sameDay = stored.dailyUsageDate === today;
    const usedBeforeHeartbeat = sameDay ? stored.dailyUsageSeconds : 0;
    const extensionSeconds = sameDay
      ? stored.dailyUsageExtensionSeconds
      : 0;
    let usedSeconds = usedBeforeHeartbeat;
    let lastHeartbeatAt = sameDay
      ? stored.dailyUsageLastHeartbeatAt
      : null;

    if (recordHeartbeat && stored.dailyUsageLimitEnabled) {
      const elapsedSeconds = lastHeartbeatAt
        ? Math.floor(
            Math.max(0, now.getTime() - lastHeartbeatAt.getTime()) / 1000,
          )
        : 0;
      usedSeconds = Math.min(
        stored.dailyUsageLimitSeconds + extensionSeconds,
        usedBeforeHeartbeat + Math.min(MAX_HEARTBEAT_SECONDS, elapsedSeconds),
      );
      lastHeartbeatAt = now;
    } else if (!stored.dailyUsageLimitEnabled || !sameDay) {
      lastHeartbeatAt = null;
    }

    const [updated] = await tx
      .update(userSettingsTable)
      .set({
        dailyUsageTimeZone: timeZone,
        dailyUsageDate: today,
        dailyUsageSeconds: usedSeconds,
        dailyUsageExtensionSeconds: extensionSeconds,
        dailyUsageLastHeartbeatAt: lastHeartbeatAt,
        updatedAt: now,
      })
      .where(eq(userSettingsTable.userId, userId))
      .returning();

    return activeTimeResponse(updated, today);
  });
}

async function getSettings(userId: string) {
  const [settings] = await db
    .select({ pinEnabled: userSettingsTable.pinEnabled })
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));
  return { pinEnabled: settings?.pinEnabled ?? false };
}

protectedRouter.get("/diary/settings", async (_req, res): Promise<void> => {
  res.json(GetDiarySettingsResponse.parse(await getSettings(userIdFrom(res))));
});

protectedRouter.put("/diary/settings/pin", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const parsed = SetDiaryPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "PIN kodi aynan 4 ta raqamdan iborat bo‘lishi kerak." });
    return;
  }

  const [settings] = await db
    .insert(userSettingsTable)
    .values({ userId, pinHash: hashPin(parsed.data.pin), pinEnabled: true })
    .onConflictDoUpdate({
      target: userSettingsTable.userId,
      set: { pinHash: hashPin(parsed.data.pin), pinEnabled: true, updatedAt: new Date() },
    })
    .returning({ pinEnabled: userSettingsTable.pinEnabled });

  clearPinFailures(userId);
  res.json(SetDiaryPinResponse.parse(settings));
});

protectedRouter.delete("/diary/settings/pin", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const [settings] = await db
    .select({ dailyUsageLimitEnabled: userSettingsTable.dailyUsageLimitEnabled })
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));
  if (settings?.dailyUsageLimitEnabled) {
    res.status(409).json({
      error: "Turn off the daily usage limit before removing its PIN.",
    });
    return;
  }

  await db
    .insert(userSettingsTable)
    .values({ userId, pinHash: null, pinEnabled: false })
    .onConflictDoUpdate({
      target: userSettingsTable.userId,
      set: { pinHash: null, pinEnabled: false, updatedAt: new Date() },
    });
  clearPinFailures(userId);
  res.json(RemoveDiaryPinResponse.parse({ pinEnabled: false }));
});

protectedRouter.post("/diary/settings/pin/verify", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const parsed = VerifyDiaryPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "PIN kodi aynan 4 ta raqamdan iborat bo‘lishi kerak." });
    return;
  }
  if (isPinLocked(userId)) {
    res.status(429).json({ error: "Too many incorrect PIN attempts. Try again later." });
    return;
  }
  const [settings] = await db
    .select({ pinEnabled: userSettingsTable.pinEnabled, pinHash: userSettingsTable.pinHash })
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));
  const verified = Boolean(
    settings?.pinEnabled && verifyPin(parsed.data.pin, settings.pinHash),
  );
  if (verified) clearPinFailures(userId);
  else recordPinFailure(userId);
  res.json(VerifyDiaryPinResponse.parse({
    verified,
  }));
});

protectedRouter.get("/diary/active-time", async (req, res): Promise<void> => {
  const timeZone = req.query.timeZone;
  if (
    typeof timeZone !== "string" ||
    timeZone.length > 64 ||
    !isValidTimeZone(timeZone)
  ) {
    res.status(400).json({ error: "A valid time zone is required." });
    return;
  }
  const state = await getActiveTimeState(
    userIdFrom(res),
    timeZone,
    false,
  );
  res.json(GetActiveTimeLimitResponse.parse(state));
});

protectedRouter.put("/diary/active-time", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const parsed = UpdateActiveTimeLimitBody.safeParse(req.body);
  if (!parsed.success || !isValidTimeZone(parsed.data.timeZone)) {
    res.status(400).json({ error: "The daily limit settings are invalid." });
    return;
  }

  const now = new Date();
  const today = localDateInTimeZone(parsed.data.timeZone, now);
  const result = await db.transaction(async (tx) => {
    await tx
      .insert(userSettingsTable)
      .values({ userId })
      .onConflictDoNothing();
    const [stored] = await tx
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .for("update");
    if (!stored) throw new Error("Unable to load active-time settings");
    if (parsed.data.enabled && !stored.pinEnabled) return null;

    const sameDay = stored.dailyUsageDate === today;
    const [updated] = await tx
      .update(userSettingsTable)
      .set({
        dailyUsageLimitEnabled: parsed.data.enabled,
        dailyUsageLimitSeconds: parsed.data.limitSeconds,
        dailyUsageLanguage: parsed.data.language,
        dailyUsageTimeZone: parsed.data.timeZone,
        dailyUsageDate: today,
        dailyUsageSeconds: sameDay ? stored.dailyUsageSeconds : 0,
        dailyUsageExtensionSeconds: sameDay
          ? stored.dailyUsageExtensionSeconds
          : 0,
        dailyUsageLastHeartbeatAt: null,
        updatedAt: now,
      })
      .where(eq(userSettingsTable.userId, userId))
      .returning();
    return activeTimeResponse(updated, today);
  });

  if (!result) {
    res.status(409).json({
      error: "Enable a PIN before turning on the daily limit.",
    });
    return;
  }
  res.json(UpdateActiveTimeLimitResponse.parse(result));
});

protectedRouter.post("/diary/active-time", async (req, res): Promise<void> => {
  const parsed = HeartbeatActiveTimeBody.safeParse(req.body);
  if (!parsed.success || !isValidTimeZone(parsed.data.timeZone)) {
    res.status(400).json({ error: "A valid time zone is required." });
    return;
  }
  const state = await getActiveTimeState(
    userIdFrom(res),
    parsed.data.timeZone,
    true,
  );
  res.json(HeartbeatActiveTimeResponse.parse(state));
});

protectedRouter.post(
  "/diary/active-time/override",
  async (req, res): Promise<void> => {
    const userId = userIdFrom(res);
    const parsed = OverrideActiveTimeLimitBody.safeParse(req.body);
    if (!parsed.success || !isValidTimeZone(parsed.data.timeZone)) {
      res.status(400).json({ error: "The PIN or time zone is invalid." });
      return;
    }
    if (isPinLocked(userId)) {
      res.status(429).json({
        error: "Too many incorrect PIN attempts. Try again later.",
      });
      return;
    }

    const now = new Date();
    const today = localDateInTimeZone(parsed.data.timeZone, now);
    const result = await db.transaction(async (tx) => {
      await tx
        .insert(userSettingsTable)
        .values({ userId })
        .onConflictDoNothing();
      const [stored] = await tx
        .select()
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, userId))
        .for("update");
      if (!stored) throw new Error("Unable to load active-time settings");
      if (!stored.pinEnabled || !verifyPin(parsed.data.pin, stored.pinHash)) {
        return { invalidPin: true as const };
      }
      if (!stored.dailyUsageLimitEnabled) {
        return { limitDisabled: true as const };
      }

      const sameDay = stored.dailyUsageDate === today;
      const currentUsage = sameDay ? stored.dailyUsageSeconds : 0;
      const currentExtension = sameDay
        ? stored.dailyUsageExtensionSeconds
        : 0;
      if (
        currentUsage <
        stored.dailyUsageLimitSeconds + currentExtension
      ) {
        return { limitNotReached: true as const };
      }

      const [updated] = await tx
        .update(userSettingsTable)
        .set({
          dailyUsageTimeZone: parsed.data.timeZone,
          dailyUsageDate: today,
          dailyUsageSeconds:
            parsed.data.action === "reset" ? 0 : currentUsage,
          dailyUsageExtensionSeconds:
            parsed.data.action === "extend"
              ? currentExtension + EXTENSION_SECONDS
              : 0,
          dailyUsageLastHeartbeatAt: now,
          updatedAt: now,
        })
        .where(eq(userSettingsTable.userId, userId))
        .returning();
      return { state: activeTimeResponse(updated, today) };
    });

    if ("invalidPin" in result) {
      recordPinFailure(userId);
      res.status(403).json({
        error: "The supplied PIN is incorrect or not configured.",
      });
      return;
    }
    if ("limitDisabled" in result || "limitNotReached" in result) {
      res.status(409).json({ error: "The daily usage limit is not locked." });
      return;
    }

    clearPinFailures(userId);
    res.json(OverrideActiveTimeLimitResponse.parse(result.state));
  },
);

router.use(protectedRouter);

export default router;