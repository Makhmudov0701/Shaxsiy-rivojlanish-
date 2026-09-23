import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db, diaryEntriesTable } from "@workspace/db";
import {
  CreateDiaryEntryBody,
  CreateDiaryEntryResponse,
  DeleteDiaryEntryParams,
  GetDiaryEntryParams,
  GetDiaryEntryResponse,
  GetDiarySummaryResponse,
  ListDiaryEntriesQueryParams,
  ListDiaryEntriesResponse,
  ToggleDiaryEntryFavoriteBody,
  ToggleDiaryEntryFavoriteParams,
  ToggleDiaryEntryFavoriteResponse,
  UpdateDiaryEntryBody,
  UpdateDiaryEntryParams,
  UpdateDiaryEntryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const protectedRouter = Router();
protectedRouter.use(requireAuth);

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

protectedRouter.get("/diary/entries", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const parsed = ListDiaryEntriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, mood, favorite, from, to, sort } = parsed.data;
  const filters = [eq(diaryEntriesTable.userId, userId)];

  if (q) {
    filters.push(
      or(
        ilike(diaryEntriesTable.title, `%${q}%`),
        ilike(diaryEntriesTable.content, `%${q}%`),
      )!,
    );
  }
  if (mood) filters.push(eq(diaryEntriesTable.mood, mood));
  if (favorite !== undefined) filters.push(eq(diaryEntriesTable.favorite, favorite));
  if (from) filters.push(gte(diaryEntriesTable.entryDate, dateOnly(from)));
  if (to) filters.push(lte(diaryEntriesTable.entryDate, dateOnly(to)));

  const entries = await db
    .select()
    .from(diaryEntriesTable)
    .where(and(...filters))
    .orderBy(sort === "oldest" ? asc(diaryEntriesTable.entryDate) : desc(diaryEntriesTable.entryDate));

  res.json(ListDiaryEntriesResponse.parse(entries));
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
      tags: parsed.data.tags ?? [],
      favorite: parsed.data.favorite,
      entryDate: dateOnly(parsed.data.entryDate),
    })
    .returning();

  res.status(201).json(CreateDiaryEntryResponse.parse(entry));
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

  res.json(GetDiaryEntryResponse.parse(entry));
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

  res.json(UpdateDiaryEntryResponse.parse(entry));
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

  res.json(ToggleDiaryEntryFavoriteResponse.parse(entry));
});

router.use(protectedRouter);

export default router;