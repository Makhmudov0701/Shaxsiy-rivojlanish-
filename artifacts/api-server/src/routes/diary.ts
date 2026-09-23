import express, { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db, diaryEntriesTable, diaryPhotosTable } from "@workspace/db";
import {
  CreateDiaryEntryBody,
  CreateDiaryEntryResponse,
  DeleteDiaryEntryParams,
  GetDiaryEntryParams,
  GetDiaryPhotoParams,
  GetDiaryEntryResponse,
  GetDiarySummaryResponse,
  GetDiaryWeeklySummaryResponse,
  ListDiaryEntriesQueryParams,
  ListDiaryEntriesResponse,
  ToggleDiaryEntryFavoriteBody,
  ToggleDiaryEntryFavoriteParams,
  ToggleDiaryEntryFavoriteResponse,
  UploadDiaryPhotoHeader,
  UploadDiaryPhotoParams,
  UploadDiaryPhotoResponse,
  DeleteDiaryPhotoParams,
  UpdateDiaryEntryBody,
  UpdateDiaryEntryParams,
  UpdateDiaryEntryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const protectedRouter = Router();
protectedRouter.use(requireAuth);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function userIdFrom(res: { locals: { userId?: string } }): string {
  const userId = res.locals.userId;
  if (!userId) {
    throw new Error("Missing authenticated user");
  }
  return userId;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  let cursor = new Date(`${uniqueDates[0]}T00:00:00.000Z`);

  for (const value of uniqueDates) {
    const current = new Date(`${value}T00:00:00.000Z`);
    const difference = Math.round((cursor.getTime() - current.getTime()) / 86_400_000);
    if (difference > 1) break;
    streak += 1;
    cursor = current;
  }

  return streak;
}

const moodLabels: Record<string, string> = {
  peaceful: "tinch",
  happy: "a’lo",
  grateful: "minnatdor",
  energized: "g‘ayratli",
  thoughtful: "o‘ylangan",
  sad: "xafa",
  anxious: "xavotirli",
};

function shiftedUtcDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateOnly(date);
}

function buildWeeklyReflection(
  entryCount: number,
  activeDays: number,
  topMoods: Array<{ mood: string; count: number }>,
) {
  if (entryCount === 0) {
    return {
      summary:
        "Bu hafta kundaligingizda yangi yozuv ko‘rinmadi. O‘zingizga bosim bermang — sokin qaytish ham yaxshi boshlanishdir.",
      insight:
        "Keyingi hafta birgina rost jumla yozishning o‘zi ichki ovozingizga joy berishi mumkin.",
    };
  }

  const moodPhrase = topMoods
    .map((item) => `${moodLabels[item.mood] ?? item.mood} (${item.count} ta)`)
    .join(" va ");
  const dayPhrase = `${activeDays} ${activeDays === 1 ? "kun" : "kun davomida"}`;

  return {
    summary: `Bu hafta ${entryCount} ta yozuv qoldirdingiz va ${dayPhrase} o‘zingizga vaqt ajratdingiz. Kundaligingizda ${moodPhrase} kayfiyatlar ko‘proq sezildi.`,
    insight: `O‘zingizni kuzatib borayotganingiz muhim odat. ${moodLabels[topMoods[0]?.mood] ?? "turli"} kayfiyatni nomlay olishingiz ichki ehtiyojlaringizga e’tibor berayotganingizni ko‘rsatadi.`,
  };
}

async function addPhotoMetadata<T extends { id: number }>(userId: string, entries: T[]) {
  if (entries.length === 0) return entries.map((entry) => ({ ...entry, photos: [] }));

  const photos = await db
    .select({
      id: diaryPhotosTable.id,
      entryId: diaryPhotosTable.entryId,
      fileName: diaryPhotosTable.fileName,
      contentType: diaryPhotosTable.contentType,
      size: diaryPhotosTable.size,
      createdAt: diaryPhotosTable.createdAt,
    })
    .from(diaryPhotosTable)
    .where(
      and(
        eq(diaryPhotosTable.userId, userId),
        inArray(diaryPhotosTable.entryId, entries.map((entry) => entry.id)),
      ),
    );

  const byEntry = new Map<number, typeof photos>();
  for (const photo of photos) {
    const current = byEntry.get(photo.entryId) ?? [];
    current.push(photo);
    byEntry.set(photo.entryId, current);
  }

  return entries.map((entry) => ({
    ...entry,
    photos: (byEntry.get(entry.id) ?? []).map((photo) => ({
      ...photo,
      url: `/api/diary/photos/${photo.id}`,
    })),
  }));
}

function photoContentType(value: string | undefined): string {
  return value?.split(";", 1)[0].trim().toLowerCase() ?? "";
}

function cleanFileName(value: string): string {
  const decoded = decodeURIComponent(value).replace(/[\\/:*?"<>|]/g, "-").trim();
  return decoded.slice(0, 180) || "surat";
}

protectedRouter.get("/diary/summary", async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const entries = await db
    .select({
      entryDate: diaryEntriesTable.entryDate,
      favorite: diaryEntriesTable.favorite,
      mood: diaryEntriesTable.mood,
    })
    .from(diaryEntriesTable)
    .where(eq(diaryEntriesTable.userId, userId))
    .orderBy(desc(diaryEntriesTable.entryDate));

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const latestMood = entries[0]?.mood ?? null;
  const summary = {
    totalEntries: entries.length,
    thisMonth: entries.filter((entry) => entry.entryDate.startsWith(currentMonth)).length,
    writingStreak: calculateStreak(entries.map((entry) => entry.entryDate)),
    favoriteCount: entries.filter((entry) => entry.favorite).length,
    latestMood,
  };

  res.json(GetDiarySummaryResponse.parse(summary));
});

protectedRouter.get("/diary/weekly-summary", async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const weekEnd = dateOnly(new Date());
  const weekStart = shiftedUtcDate(weekEnd, -6);
  const entries = await db
    .select({
      entryDate: diaryEntriesTable.entryDate,
      mood: diaryEntriesTable.mood,
    })
    .from(diaryEntriesTable)
    .where(
      and(
        eq(diaryEntriesTable.userId, userId),
        gte(diaryEntriesTable.entryDate, weekStart),
        lte(diaryEntriesTable.entryDate, weekEnd),
      ),
    )
    .orderBy(desc(diaryEntriesTable.entryDate));

  const activeDays = new Set(entries.map((entry) => entry.entryDate)).size;
  const moodCounts = new Map<string, number>();
  for (const entry of entries) {
    moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1);
  }
  const topMoods = [...moodCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 2)
    .map(([mood, count]) => ({ mood, count }));
  const reflection = buildWeeklyReflection(entries.length, activeDays, topMoods);

  res.json(
    GetDiaryWeeklySummaryResponse.parse({
      weekStart,
      weekEnd,
      entryCount: entries.length,
      activeDays,
      topMoods,
      ...reflection,
    }),
  );
});

protectedRouter.get("/diary/entries", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const parsed = ListDiaryEntriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, mood, folder, favorite, from, to, sort } = parsed.data;
  const filters = [eq(diaryEntriesTable.userId, userId)];

  if (q) {
    const normalizedQuery = q.trim().replace(/^#+/, "");
    filters.push(
      or(
        ilike(diaryEntriesTable.title, `%${q}%`),
        ilike(diaryEntriesTable.content, `%${q}%`),
        sql`EXISTS (
          SELECT 1 FROM unnest(${diaryEntriesTable.tags}) AS diary_tag
          WHERE diary_tag ILIKE ${`%${normalizedQuery}%`}
        )`,
      )!,
    );
  }
  if (mood) filters.push(eq(diaryEntriesTable.mood, mood));
  if (folder) filters.push(eq(diaryEntriesTable.folder, folder.trim()));
  if (favorite !== undefined) filters.push(eq(diaryEntriesTable.favorite, favorite));
  if (from) filters.push(gte(diaryEntriesTable.entryDate, dateOnly(from)));
  if (to) filters.push(lte(diaryEntriesTable.entryDate, dateOnly(to)));

  const entries = await db
    .select()
    .from(diaryEntriesTable)
    .where(and(...filters))
    .orderBy(sort === "oldest" ? asc(diaryEntriesTable.entryDate) : desc(diaryEntriesTable.entryDate));

  res.json(ListDiaryEntriesResponse.parse(await addPhotoMetadata(userId, entries)));
});

protectedRouter.post("/diary/entries", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const parsed = CreateDiaryEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(diaryEntriesTable)
    .values({
      userId,
      title: parsed.data.title,
      content: parsed.data.content,
      mood: parsed.data.mood,
      folder: parsed.data.folder,
      tags: parsed.data.tags ?? [],
      favorite: parsed.data.favorite,
      entryDate: dateOnly(parsed.data.entryDate),
    })
    .returning();

  res.status(201).json(CreateDiaryEntryResponse.parse((await addPhotoMetadata(userId, entry ? [entry] : []))[0]));
});

protectedRouter.get("/diary/entries/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = GetDiaryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .select()
    .from(diaryEntriesTable)
    .where(and(eq(diaryEntriesTable.id, params.data.id), eq(diaryEntriesTable.userId, userId)));

  if (!entry) {
    res.status(404).json({ error: "Diary entry not found" });
    return;
  }

  res.json(GetDiaryEntryResponse.parse((await addPhotoMetadata(userId, [entry]))[0]));
});

protectedRouter.patch("/diary/entries/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = UpdateDiaryEntryParams.safeParse(req.params);
  const body = UpdateDiaryEntryBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { entryDate, ...rest } = body.data;
  const changes = entryDate ? { ...rest, entryDate: dateOnly(entryDate) } : rest;
  const [entry] = await db
    .update(diaryEntriesTable)
    .set(changes)
    .where(and(eq(diaryEntriesTable.id, params.data.id), eq(diaryEntriesTable.userId, userId)))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Diary entry not found" });
    return;
  }

  res.json(UpdateDiaryEntryResponse.parse((await addPhotoMetadata(userId, [entry]))[0]));
});

protectedRouter.delete("/diary/entries/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = DeleteDiaryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(diaryEntriesTable)
    .where(and(eq(diaryEntriesTable.id, params.data.id), eq(diaryEntriesTable.userId, userId)))
    .returning({ id: diaryEntriesTable.id });

  if (!entry) {
    res.status(404).json({ error: "Diary entry not found" });
    return;
  }

  res.sendStatus(204);
});

protectedRouter.patch("/diary/entries/:id/favorite", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = ToggleDiaryEntryFavoriteParams.safeParse(req.params);
  const body = ToggleDiaryEntryFavoriteBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [entry] = await db
    .update(diaryEntriesTable)
    .set({ favorite: body.data.favorite })
    .where(and(eq(diaryEntriesTable.id, params.data.id), eq(diaryEntriesTable.userId, userId)))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Diary entry not found" });
    return;
  }

  res.json(ToggleDiaryEntryFavoriteResponse.parse((await addPhotoMetadata(userId, [entry]))[0]));
});

protectedRouter.post(
  "/diary/entries/:id/photos",
  express.raw({ type: ["application/octet-stream", "image/*"], limit: MAX_PHOTO_BYTES }),
  async (req, res): Promise<void> => {
    const userId = userIdFrom(res);
    const params = UploadDiaryPhotoParams.safeParse(req.params);
    const headers = UploadDiaryPhotoHeader.safeParse({
      "X-File-Name": req.header("X-File-Name") ?? "",
    });
    if (!params.success || !headers.success) {
      res.status(400).json({ error: "Rasm ma’lumotlarini tekshiring." });
      return;
    }

    const contentType = photoContentType(req.header("content-type"));
    if (!ALLOWED_PHOTO_TYPES.has(contentType)) {
      res.status(400).json({ error: "Faqat JPG, PNG, WEBP yoki GIF rasmlarini yuklash mumkin." });
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > MAX_PHOTO_BYTES) {
      res.status(400).json({ error: "Rasm hajmi 5 MB dan oshmasligi kerak." });
      return;
    }

    const [entry] = await db
      .select({ id: diaryEntriesTable.id })
      .from(diaryEntriesTable)
      .where(and(eq(diaryEntriesTable.id, params.data.id), eq(diaryEntriesTable.userId, userId)));
    if (!entry) {
      res.status(404).json({ error: "Yozuv topilmadi." });
      return;
    }

    const [photo] = await db
      .insert(diaryPhotosTable)
      .values({
        entryId: entry.id,
        userId,
        fileName: cleanFileName(headers.data["X-File-Name"]),
        contentType,
        size: req.body.length,
        data: req.body,
      })
      .returning({
        id: diaryPhotosTable.id,
        entryId: diaryPhotosTable.entryId,
        fileName: diaryPhotosTable.fileName,
        contentType: diaryPhotosTable.contentType,
        size: diaryPhotosTable.size,
        createdAt: diaryPhotosTable.createdAt,
      });

    res.status(201).json(
      UploadDiaryPhotoResponse.parse({
        ...photo,
        url: `/api/diary/photos/${photo.id}`,
      }),
    );
  },
);

protectedRouter.get("/diary/photos/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = GetDiaryPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [photo] = await db
    .select()
    .from(diaryPhotosTable)
    .where(and(eq(diaryPhotosTable.id, params.data.id), eq(diaryPhotosTable.userId, userId)));
  if (!photo) {
    res.status(404).json({ error: "Rasm topilmadi." });
    return;
  }

  res.setHeader("Content-Type", photo.contentType);
  res.setHeader("Content-Length", photo.size);
  res.setHeader("Content-Disposition", `inline; filename="${photo.fileName.replace(/"/g, "")}"`);
  res.send(photo.data);
});

protectedRouter.delete("/diary/photos/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = DeleteDiaryPhotoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [photo] = await db
    .delete(diaryPhotosTable)
    .where(and(eq(diaryPhotosTable.id, params.data.id), eq(diaryPhotosTable.userId, userId)))
    .returning({ id: diaryPhotosTable.id });
  if (!photo) {
    res.status(404).json({ error: "Rasm topilmadi." });
    return;
  }
  res.sendStatus(204);
});

router.use(protectedRouter);

export default router;