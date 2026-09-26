import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";
import {
  db,
  repetitionCardsTable,
  repetitionDecksTable,
  repetitionReviewLogsTable,
} from "@workspace/db";
import {
  CreateRepetitionCardBody,
  CreateRepetitionCardResponse,
  CreateRepetitionDeckBody,
  CreateRepetitionDeckResponse,
  DeleteRepetitionCardParams,
  DeleteRepetitionDeckParams,
  GetRepetitionStatsQueryParams,
  GetRepetitionStatsResponse,
  ListRepetitionCardsResponse,
  ListRepetitionDecksResponse,
  ReviewRepetitionCardBody,
  ReviewRepetitionCardParams,
  ReviewRepetitionCardResponse,
  UpdateRepetitionCardBody,
  UpdateRepetitionCardParams,
  UpdateRepetitionCardResponse,
  UpdateRepetitionDeckBody,
  UpdateRepetitionDeckParams,
  UpdateRepetitionDeckResponse,
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

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error
    && (error as { code?: string }).code === "23505";
}

function normalizedDeckName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function toLocalDate(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculateStreak(reviewDates: string[], today: string): number {
  const dates = new Set(reviewDates);
  let cursor = dates.has(today) ? today : shiftDate(today, -1);
  if (!dates.has(cursor)) return 0;

  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

function cardSelection() {
  return {
    id: repetitionCardsTable.id,
    deckId: repetitionCardsTable.deckId,
    deckName: repetitionDecksTable.name,
    front: repetitionCardsTable.front,
    back: repetitionCardsTable.back,
    pronunciation: repetitionCardsTable.pronunciation,
    exampleSentence: repetitionCardsTable.exampleSentence,
    dueAt: repetitionCardsTable.dueAt,
    intervalDays: repetitionCardsTable.intervalDays,
    easeFactor: repetitionCardsTable.easeFactor,
    repetitions: repetitionCardsTable.repetitions,
    lapses: repetitionCardsTable.lapses,
    learnedAt: repetitionCardsTable.learnedAt,
    lastReviewedAt: repetitionCardsTable.lastReviewedAt,
    createdAt: repetitionCardsTable.createdAt,
    updatedAt: repetitionCardsTable.updatedAt,
  };
}

async function getUserCard(userId: string, id: number) {
  const [card] = await db
    .select(cardSelection())
    .from(repetitionCardsTable)
    .innerJoin(
      repetitionDecksTable,
      and(
        eq(repetitionDecksTable.id, repetitionCardsTable.deckId),
        eq(repetitionDecksTable.userId, userId),
      ),
    )
    .where(and(eq(repetitionCardsTable.id, id), eq(repetitionCardsTable.userId, userId)))
    .limit(1);
  return card;
}

protectedRouter.get("/repetition/decks", async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const decks = await db
    .select({
      id: repetitionDecksTable.id,
      name: repetitionDecksTable.name,
      createdAt: repetitionDecksTable.createdAt,
      updatedAt: repetitionDecksTable.updatedAt,
    })
    .from(repetitionDecksTable)
    .where(eq(repetitionDecksTable.userId, userId))
    .orderBy(asc(repetitionDecksTable.name));

  res.json(ListRepetitionDecksResponse.parse(decks));
});

protectedRouter.post("/repetition/decks", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const body = CreateRepetitionDeckBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const name = normalizedDeckName(body.data.name);
  if (!name) {
    res.status(400).json({ error: "To‘plam nomini kiriting." });
    return;
  }

  const [duplicate] = await db
    .select({ id: repetitionDecksTable.id })
    .from(repetitionDecksTable)
    .where(and(
      eq(repetitionDecksTable.userId, userId),
      sql`lower(${repetitionDecksTable.name}) = lower(${name})`,
    ))
    .limit(1);
  if (duplicate) {
    res.status(409).json({ error: "Bu nomdagi to‘plam allaqachon bor." });
    return;
  }

  try {
    const [deck] = await db
      .insert(repetitionDecksTable)
      .values({ userId, name })
      .returning({
        id: repetitionDecksTable.id,
        name: repetitionDecksTable.name,
        createdAt: repetitionDecksTable.createdAt,
        updatedAt: repetitionDecksTable.updatedAt,
      });
    res.status(201).json(CreateRepetitionDeckResponse.parse(deck));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Bu nomdagi to‘plam allaqachon bor." });
      return;
    }
    throw error;
  }
});

protectedRouter.patch("/repetition/decks/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = UpdateRepetitionDeckParams.safeParse(req.params);
  const body = UpdateRepetitionDeckBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const name = normalizedDeckName(body.data.name);
  if (!name) {
    res.status(400).json({ error: "To‘plam nomini kiriting." });
    return;
  }
  const [duplicate] = await db
    .select({ id: repetitionDecksTable.id })
    .from(repetitionDecksTable)
    .where(and(
      eq(repetitionDecksTable.userId, userId),
      ne(repetitionDecksTable.id, params.data.id),
      sql`lower(${repetitionDecksTable.name}) = lower(${name})`,
    ))
    .limit(1);
  if (duplicate) {
    res.status(409).json({ error: "Bu nomdagi to‘plam allaqachon bor." });
    return;
  }

  try {
    const [deck] = await db
      .update(repetitionDecksTable)
      .set({ name })
      .where(and(
        eq(repetitionDecksTable.id, params.data.id),
        eq(repetitionDecksTable.userId, userId),
      ))
      .returning({
        id: repetitionDecksTable.id,
        name: repetitionDecksTable.name,
        createdAt: repetitionDecksTable.createdAt,
        updatedAt: repetitionDecksTable.updatedAt,
      });
    if (!deck) {
      res.status(404).json({ error: "To‘plam topilmadi." });
      return;
    }
    res.json(UpdateRepetitionDeckResponse.parse(deck));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ error: "Bu nomdagi to‘plam allaqachon bor." });
      return;
    }
    throw error;
  }
});

protectedRouter.delete("/repetition/decks/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = DeleteRepetitionDeckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deck] = await db
    .delete(repetitionDecksTable)
    .where(and(
      eq(repetitionDecksTable.id, params.data.id),
      eq(repetitionDecksTable.userId, userId),
    ))
    .returning({ id: repetitionDecksTable.id });
  if (!deck) {
    res.status(404).json({ error: "To‘plam topilmadi." });
    return;
  }
  res.sendStatus(204);
});

protectedRouter.get("/repetition/cards", async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const cards = await db
    .select(cardSelection())
    .from(repetitionCardsTable)
    .innerJoin(
      repetitionDecksTable,
      and(
        eq(repetitionDecksTable.id, repetitionCardsTable.deckId),
        eq(repetitionDecksTable.userId, userId),
      ),
    )
    .where(eq(repetitionCardsTable.userId, userId))
    .orderBy(asc(repetitionCardsTable.dueAt), desc(repetitionCardsTable.updatedAt));

  res.json(ListRepetitionCardsResponse.parse(cards));
});

protectedRouter.post("/repetition/cards", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const body = CreateRepetitionCardBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [deck] = await db
    .select({ id: repetitionDecksTable.id })
    .from(repetitionDecksTable)
    .where(and(
      eq(repetitionDecksTable.id, body.data.deckId),
      eq(repetitionDecksTable.userId, userId),
    ))
    .limit(1);
  if (!deck) {
    res.status(404).json({ error: "To‘plam topilmadi." });
    return;
  }

  const [created] = await db
    .insert(repetitionCardsTable)
    .values({
      userId,
      deckId: body.data.deckId,
      front: body.data.front.trim(),
      back: body.data.back.trim(),
      pronunciation: body.data.pronunciation?.trim() || null,
      exampleSentence: body.data.exampleSentence?.trim() || null,
    })
    .returning({ id: repetitionCardsTable.id });
  const card = created ? await getUserCard(userId, created.id) : undefined;
  res.status(201).json(CreateRepetitionCardResponse.parse(card));
});

protectedRouter.patch("/repetition/cards/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = UpdateRepetitionCardParams.safeParse(req.params);
  const body = UpdateRepetitionCardBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [deck] = await db
    .select({ id: repetitionDecksTable.id })
    .from(repetitionDecksTable)
    .where(and(
      eq(repetitionDecksTable.id, body.data.deckId),
      eq(repetitionDecksTable.userId, userId),
    ))
    .limit(1);
  if (!deck) {
    res.status(404).json({ error: "To‘plam topilmadi." });
    return;
  }

  const [updated] = await db
    .update(repetitionCardsTable)
    .set({
      deckId: body.data.deckId,
      front: body.data.front.trim(),
      back: body.data.back.trim(),
      ...(body.data.pronunciation !== undefined
        ? { pronunciation: body.data.pronunciation?.trim() || null }
        : {}),
      ...(body.data.exampleSentence !== undefined
        ? { exampleSentence: body.data.exampleSentence?.trim() || null }
        : {}),
    })
    .where(and(
      eq(repetitionCardsTable.id, params.data.id),
      eq(repetitionCardsTable.userId, userId),
    ))
    .returning({ id: repetitionCardsTable.id });
  if (!updated) {
    res.status(404).json({ error: "Kartochka topilmadi." });
    return;
  }
  const card = await getUserCard(userId, updated.id);
  res.json(UpdateRepetitionCardResponse.parse(card));
});

protectedRouter.delete("/repetition/cards/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = DeleteRepetitionCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [card] = await db
    .delete(repetitionCardsTable)
    .where(and(
      eq(repetitionCardsTable.id, params.data.id),
      eq(repetitionCardsTable.userId, userId),
    ))
    .returning({ id: repetitionCardsTable.id });
  if (!card) {
    res.status(404).json({ error: "Kartochka topilmadi." });
    return;
  }
  res.sendStatus(204);
});

protectedRouter.post("/repetition/cards/:id/review", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = ReviewRepetitionCardParams.safeParse(req.params);
  const body = ReviewRepetitionCardBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const current = await getUserCard(userId, params.data.id);
  if (!current) {
    res.status(404).json({ error: "Kartochka topilmadi." });
    return;
  }

  const now = new Date();
  let reviewedOn: string;
  try {
    reviewedOn = toLocalDate(now, body.data.timeZone);
  } catch {
    res.status(400).json({ error: "Vaqt mintaqasi noto‘g‘ri." });
    return;
  }

  const quality = { again: 1, hard: 3, good: 4, easy: 5 }[body.data.rating];
  const easeFactor = Math.max(
    1.3,
    Math.min(
      3.5,
      current.easeFactor
        + 0.1
        - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    ),
  );
  const intervalDays = (() => {
    if (body.data.rating === "again") return 0;
    if (body.data.rating === "hard") {
      return current.repetitions === 0
        ? 1
        : Math.max(1, Math.round(current.intervalDays * 1.2));
    }
    if (body.data.rating === "good") {
      if (current.repetitions === 0) return 3;
      if (current.repetitions === 1) return 6;
      return Math.max(3, Math.round(current.intervalDays * easeFactor));
    }
    if (current.repetitions === 0) return 5;
    return Math.max(5, Math.round(current.intervalDays * (easeFactor + 0.3)));
  })();
  const dueAt = new Date(
    now.getTime() + (body.data.rating === "again" ? 60_000 : intervalDays * 86_400_000),
  );

  const updated = await db.transaction(async (transaction) => {
    const [card] = await transaction
      .update(repetitionCardsTable)
      .set({
        dueAt,
        intervalDays,
        easeFactor,
        repetitions: body.data.rating === "again" ? 0 : current.repetitions + 1,
        lapses: body.data.rating === "again" ? current.lapses + 1 : current.lapses,
        learnedAt: current.learnedAt ?? (body.data.rating === "again" ? null : now),
        lastReviewedAt: now,
      })
      .where(and(
        eq(repetitionCardsTable.id, current.id),
        eq(repetitionCardsTable.userId, userId),
      ))
      .returning({ id: repetitionCardsTable.id });
    if (!card) return undefined;

    await transaction.insert(repetitionReviewLogsTable).values({
      userId,
      cardId: card.id,
      rating: body.data.rating,
      reviewedOn,
    });
    return card;
  });

  if (!updated) {
    res.status(404).json({ error: "Kartochka topilmadi." });
    return;
  }
  res.json(ReviewRepetitionCardResponse.parse(await getUserCard(userId, updated.id)));
});

protectedRouter.get("/repetition/stats", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const query = GetRepetitionStatsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let today: string;
  try {
    today = toLocalDate(new Date(), query.data.timeZone);
  } catch {
    res.status(400).json({ error: "Vaqt mintaqasi noto‘g‘ri." });
    return;
  }

  const cards = await db
    .select({
      dueAt: repetitionCardsTable.dueAt,
      learnedAt: repetitionCardsTable.learnedAt,
    })
    .from(repetitionCardsTable)
    .where(eq(repetitionCardsTable.userId, userId));
  const reviewDays = await db
    .selectDistinct({ reviewedOn: repetitionReviewLogsTable.reviewedOn })
    .from(repetitionReviewLogsTable)
    .where(eq(repetitionReviewLogsTable.userId, userId))
    .orderBy(desc(repetitionReviewLogsTable.reviewedOn))
    .limit(5000);
  const [year, month, day] = today.split("-").map(Number);
  const activityStart = new Date(Date.UTC(year, month - 1, day - 364))
    .toISOString()
    .slice(0, 10);
  const reviewActivity = await db
    .select({
      reviewedOn: repetitionReviewLogsTable.reviewedOn,
      count: sql<number>`count(*)::int`,
    })
    .from(repetitionReviewLogsTable)
    .where(and(
      eq(repetitionReviewLogsTable.userId, userId),
      gte(repetitionReviewLogsTable.reviewedOn, activityStart),
    ))
    .groupBy(repetitionReviewLogsTable.reviewedOn)
    .orderBy(asc(repetitionReviewLogsTable.reviewedOn));

  res.json(GetRepetitionStatsResponse.parse({
    cardsDueToday: cards.filter((card) => toLocalDate(card.dueAt, query.data.timeZone) <= today).length,
    totalCards: cards.length,
    totalLearned: cards.filter((card) => card.learnedAt !== null).length,
    dailyStreak: calculateStreak(reviewDays.map((day) => day.reviewedOn), today),
    reviewActivity,
  }));
});

router.use(protectedRouter);

export default router;