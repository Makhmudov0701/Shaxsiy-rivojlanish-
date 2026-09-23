import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db, diaryEntriesTable, diaryPhotosTable } from "@workspace/db";
import { ExportDiaryQueryParams, ExportDiaryResponse } from "@workspace/api-zod";
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

type ExportQuery = {
  format: "json" | "pdf";
  q?: string;
  from?: Date;
  to?: Date;
  tag?: string;
};

async function listExportEntries(userId: string, query: ExportQuery) {
  const filters = [eq(diaryEntriesTable.userId, userId)];
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

function pdfSafe(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[‘’ʻʼ]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");
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
      `Kayfiyat: ${entry.mood}  Teglar: ${entry.tags.map((tag) => `#${tag}`).join(" ") || "-"}`,
      ...wrap(entry.content),
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

router.use(protectedRouter);

export default router;