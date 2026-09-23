import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userSettingsTable } from "@workspace/db";
import {
  GetDiarySettingsResponse,
  RemoveDiaryPinResponse,
  SetDiaryPinBody,
  SetDiaryPinResponse,
  VerifyDiaryPinBody,
  VerifyDiaryPinResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const protectedRouter = Router();
protectedRouter.use(requireAuth);

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

  res.json(SetDiaryPinResponse.parse(settings));
});

protectedRouter.delete("/diary/settings/pin", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  await db
    .insert(userSettingsTable)
    .values({ userId, pinHash: null, pinEnabled: false })
    .onConflictDoUpdate({
      target: userSettingsTable.userId,
      set: { pinHash: null, pinEnabled: false, updatedAt: new Date() },
    });
  res.json(RemoveDiaryPinResponse.parse({ pinEnabled: false }));
});

protectedRouter.post("/diary/settings/pin/verify", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const parsed = VerifyDiaryPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "PIN kodi aynan 4 ta raqamdan iborat bo‘lishi kerak." });
    return;
  }
  const [settings] = await db
    .select({ pinEnabled: userSettingsTable.pinEnabled, pinHash: userSettingsTable.pinHash })
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));
  res.json(VerifyDiaryPinResponse.parse({
    verified: Boolean(settings?.pinEnabled && verifyPin(parsed.data.pin, settings.pinHash)),
  }));
});

router.use(protectedRouter);

export default router;