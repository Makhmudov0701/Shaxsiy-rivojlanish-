import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db, diaryDailyStickersTable, diaryEntriesTable, diaryPhotosTable } from "@workspace/db";
import {
  DownloadDiaryBackupResponse,
  ExportDiaryQueryParams,
  ExportDiaryResponse,
  RestoreDiaryBackupBody,
  RestoreDiaryBackupResponse,
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

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

const MAX_BACKUP_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
const ALLOWED_BACKUP_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function cleanBackupFileName(value: string): string {
  return decodeURIComponent(value).replace(/[\\/:*?"<>|]/g, "-").trim().slice(0, 180) || "surat";
}

type ExportQuery = {
  format: "json" | "pdf";
  id?: number;
  q?: string;
  from?: Date;
  to?: Date;
  tag?: string;
};

async function listExportEntries(userId: string, query: ExportQuery) {
  const filters = [eq(diaryEntriesTable.userId, userId)];
  if (query.id) filters.push(eq(diaryEntriesTable.id, query.id));
  const normalizedQuery = query.q?.trim().replace(/^#+/, "");
  if (normalizedQuery) {
    filters.push(
      or(
        ilike(diaryEntriesTable.title, `%${normalizedQuery}%`),
        ilike(diaryEntriesTable.content, `%${normalizedQuery}%`),
        sql`EXISTS (
          SELECT 1 FROM unnest(${diaryEntriesTable.tags}) AS diary_tag
          WHERE diary_tag ILIKE ${`%${normalizedQuery}%`}
        )`,
      )!,
    );
  }
  if (query.tag) {
    const tag = query.tag.trim().replace(/^#+/, "");
    filters.push(
      sql`EXISTS (
        SELECT 1 FROM unnest(${diaryEntriesTable.tags}) AS diary_tag
        WHERE diary_tag ILIKE ${tag}
      )`,
    );
  }
  if (query.from) filters.push(gte(diaryEntriesTable.entryDate, dateOnly(query.from)));
  if (query.to) filters.push(lte(diaryEntriesTable.entryDate, dateOnly(query.to)));

  const entries = await db
    .select()
    .from(diaryEntriesTable)
    .where(and(...filters))
    .orderBy(desc(diaryEntriesTable.entryDate));
  const photos = entries.length
    ? await db
        .select({
          id: diaryPhotosTable.id,
          entryId: diaryPhotosTable.entryId,
          fileName: diaryPhotosTable.fileName,
          contentType: diaryPhotosTable.contentType,
          size: diaryPhotosTable.size,
          createdAt: diaryPhotosTable.createdAt,
        })
        .from(diaryPhotosTable)
        .where(and(eq(diaryPhotosTable.userId, userId), inArray(diaryPhotosTable.entryId, entries.map((entry) => entry.id))))
    : [];
  const byEntry = new Map<number, typeof photos>();
  for (const photo of photos) byEntry.set(photo.entryId, [...(byEntry.get(photo.entryId) ?? []), photo]);
  return entries.map((entry) => ({
    ...entry,
    photos: (byEntry.get(entry.id) ?? []).map((photo) => ({ ...photo, url: `/api/diary/photos/${photo.id}` })),
  }));
}

async function listBackupEntries(userId: string) {
  const entries = await db
    .select()
    .from(diaryEntriesTable)
    .where(eq(diaryEntriesTable.userId, userId))
    .orderBy(desc(diaryEntriesTable.entryDate), desc(diaryEntriesTable.id));
  const photos = entries.length
    ? await db
        .select()
        .from(diaryPhotosTable)
        .where(and(eq(diaryPhotosTable.userId, userId), inArray(diaryPhotosTable.entryId, entries.map((entry) => entry.id))))
    : [];
  const byEntry = new Map<number, typeof photos>();
  for (const photo of photos) byEntry.set(photo.entryId, [...(byEntry.get(photo.entryId) ?? []), photo]);

  return entries.map((entry) => ({
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    weatherCondition: entry.weatherCondition,
    temperatureC: entry.temperatureC,
    folder: entry.folder,
    tags: entry.tags,
    favorite: entry.favorite,
    entryDate: entry.entryDate,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    photos: (byEntry.get(entry.id) ?? []).map((photo) => ({
      fileName: photo.fileName,
      contentType: photo.contentType,
      size: photo.size,
      data: photo.data.toString("base64"),
    })),
  }));
}

function decodeBackupEntries(entries: ReturnType<typeof RestoreDiaryBackupBody.parse>["entries"]) {
  let totalBytes = 0;
  return entries.map((entry) => ({
    ...entry,
    photos: entry.photos.map((photo) => {
      if (!ALLOWED_BACKUP_TYPES.has(photo.contentType)) {
        throw new Error("Zaxira ichida qo‘llab-quvvatlanmaydigan surat turi bor.");
      }
      if (photo.size > MAX_BACKUP_PHOTO_BYTES || photo.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(photo.data)) {
        throw new Error("Zaxira ichidagi surat ma’lumotlari noto‘g‘ri.");
      }
      const data = Buffer.from(photo.data, "base64");
      if (data.length !== photo.size) {
        throw new Error("Zaxira ichidagi surat hajmi mos kelmaydi.");
      }
      totalBytes += data.length;
      if (totalBytes > MAX_BACKUP_BYTES) {
        throw new Error("Zaxira fayli juda katta.");
      }
      return { ...photo, fileName: cleanBackupFileName(photo.fileName), data };
    }),
  }));
}

function pdfSafe(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[‘’ʻʼ]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

function pdfRichText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[*-]\s+/gm, "• ")
    .replace(/^>\s+/gm, "❝ ")
    .replace(/[*_~]/g, "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(value: string, width = 88): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function makePdf(entries: Awaited<ReturnType<typeof listExportEntries>>): Buffer {
  const lines = [
    "SHAXSIY KUNDALIK",
    `Eksport: ${new Date().toISOString().slice(0, 10)}`,
    "",
    ...entries.flatMap((entry) => [
      `${entry.entryDate}  ${entry.title}`,
      `Toifa: ${entry.folder}  Kayfiyat: ${entry.mood}  Teglar: ${entry.tags.map((tag) => `#${tag}`).join(" ") || "-"}`,
      ...wrap(pdfRichText(entry.content)),
      entry.photos.length ? `[${entry.photos.length} ta surat biriktirilgan]` : "",
      "",
    ]),
  ];
  const pageLines = 45;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / pageLines)) }, (_, index) =>
    lines.slice(index * pageLines, (index + 1) * pageLines),
  );
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  const kids = pageObjectIds.map((id) => `${id} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  for (const [index, page] of pages.entries()) {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    const commands = [
      "BT",
      "/F1 16 Tf",
      "50 790 Td",
      `(${pdfSafe(page[0] ?? "SHAXSIY KUNDALIK")}) Tj`,
      "/F1 10 Tf",
      "0 -24 Td",
      ...page.slice(1).flatMap((line) => [`(${pdfSafe(line)}) Tj`, "0 -16 Td"]),
      "ET",
    ].join("\n");
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(commands, "latin1")} >>\nstream\n${commands}\nendstream`);
  }

  let output = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(output, "latin1"));
    output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(output, "latin1");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(output, "latin1");
}

protectedRouter.get("/diary/export", async (req, res): Promise<void> => {
  const parsed = ExportDiaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Eksport parametrlarini tekshiring." });
    return;
  }
  const entries = await listExportEntries(userIdFrom(res), parsed.data);
  if (parsed.data.id && entries.length === 0) {
    res.status(404).json({ error: "Yozuv topilmadi." });
    return;
  }
  if (parsed.data.format === "json") {
    const payload = ExportDiaryResponse.parse({ exportedAt: new Date(), entries });
    res.setHeader("Content-Disposition", 'attachment; filename="shaxsiy-kundalik.json"');
    res.json(payload);
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="shaxsiy-kundalik.pdf"');
  res.send(makePdf(entries));
});

protectedRouter.get("/diary/backup", async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const backup = {
    version: 1,
    exportedAt: new Date(),
    entries: await listBackupEntries(userId),
    dailyStickers: (await db
      .select()
      .from(diaryDailyStickersTable)
      .where(eq(diaryDailyStickersTable.userId, userId)))
      .map(({ stickerDate, sticker, createdAt, updatedAt }) => ({ date: stickerDate, sticker, createdAt, updatedAt })),
  };
  res.setHeader("Content-Disposition", 'attachment; filename="shaxsiy-kundalik-zaxira.json"');
  res.json(DownloadDiaryBackupResponse.parse(backup));
});

protectedRouter.post("/diary/backup/restore", async (req, res): Promise<void> => {
  const parsed = RestoreDiaryBackupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Zaxira fayli formati noto‘g‘ri yoki to‘liq emas." });
    return;
  }

  let entries;
  try {
    entries = decodeBackupEntries(parsed.data.entries);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Zaxira faylini tekshirib bo‘lmadi." });
    return;
  }

  const userId = userIdFrom(res);
  let photosRestored = 0;
  await db.transaction(async (tx) => {
    await tx.delete(diaryDailyStickersTable).where(eq(diaryDailyStickersTable.userId, userId));
    await tx.delete(diaryPhotosTable).where(eq(diaryPhotosTable.userId, userId));
    await tx.delete(diaryEntriesTable).where(eq(diaryEntriesTable.userId, userId));

    for (const entry of entries) {
      const [restoredEntry] = await tx
        .insert(diaryEntriesTable)
        .values({
          userId,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          weatherCondition: entry.weatherCondition ?? null,
          temperatureC: entry.temperatureC ?? null,
          folder: entry.folder,
          tags: entry.tags,
          favorite: entry.favorite,
          entryDate: dateOnly(entry.entryDate),
          ...(entry.createdAt ? { createdAt: entry.createdAt } : {}),
          ...(entry.updatedAt ? { updatedAt: entry.updatedAt } : {}),
        })
        .returning({ id: diaryEntriesTable.id });

      if (!restoredEntry) throw new Error("Yozuvni tiklab bo‘lmadi.");
      for (const photo of entry.photos) {
        await tx.insert(diaryPhotosTable).values({
          entryId: restoredEntry.id,
          userId,
          fileName: photo.fileName,
          contentType: photo.contentType,
          size: photo.size,
          data: photo.data,
        });
        photosRestored += 1;
      }
    }
    for (const sticker of parsed.data.dailyStickers ?? []) {
      await tx.insert(diaryDailyStickersTable).values({
        userId,
        stickerDate: dateOnly(sticker.date),
        sticker: sticker.sticker,
        ...(sticker.createdAt ? { createdAt: sticker.createdAt } : {}),
        ...(sticker.updatedAt ? { updatedAt: sticker.updatedAt } : {}),
      });
    }
  });

  res.json(
    RestoreDiaryBackupResponse.parse({
      entriesRestored: entries.length,
      photosRestored,
    }),
  );
});

router.use(protectedRouter);

export default router;