import { Router, type IRouter } from "express";
import {
  FetchMotivationMemeBody,
  FetchMotivationMemeResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const protectedRouter = Router();
protectedRouter.use(requireAuth);

type MotivationSectionId =
  | "diary"
  | "focus"
  | "goals"
  | "tasks"
  | "books"
  | "repetition"
  | "ideas"
  | "habits"
  | "vault";

type MotivationMeme = {
  imageUrl: string;
  title: string;
  postUrl: string;
  subreddit: string;
};

const subredditBySection: Record<MotivationSectionId, string> = {
  diary: "wholesomememes",
  focus: "ProductivityMemes",
  goals: "ProductivityMemes",
  tasks: "ProductivityMemes",
  books: "bookmemes",
  repetition: "ProductivityMemes",
  ideas: "wholesomememes",
  habits: "ProductivityMemes",
  vault: "wholesomememes",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function httpsUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function imageUrl(value: unknown): string | null {
  const url = httpsUrl(value);
  if (!url || !/\.(?:jpe?g|png|webp|gif)$/i.test(url.pathname)) return null;
  return url.toString();
}

function redditPostUrl(value: unknown): string | null {
  const url = httpsUrl(value);
  if (!url || !["redd.it", "reddit.com", "www.reddit.com"].includes(url.hostname.toLowerCase())) {
    return null;
  }
  return url.toString();
}

function normalizeMeme(value: unknown, requestedSubreddit: string): MotivationMeme | null {
  if (!isRecord(value) || value.nsfw === true || value.spoiler === true) return null;

  const previews = Array.isArray(value.preview) ? value.preview : [];
  const preview640 = previews.find((candidate) => {
    const url = httpsUrl(candidate);
    return url?.searchParams.get("width") === "640" && imageUrl(candidate) !== null;
  });
  const previewImages = previews
    .map(imageUrl)
    .filter((candidate): candidate is string => candidate !== null);
  const selectedImage = (preview640 ? imageUrl(preview640) : null)
    ?? previewImages.at(-1)
    ?? imageUrl(value.url)
    ?? null;
  const postUrl = redditPostUrl(value.postLink);
  if (!selectedImage || !postUrl) return null;

  const title = typeof value.title === "string" && value.title.trim()
    ? value.title.trim().slice(0, 240)
    : "Bugungi motivatsiya";
  const subreddit = typeof value.subreddit === "string" && value.subreddit.trim()
    ? value.subreddit.trim().slice(0, 80)
    : requestedSubreddit;

  return { imageUrl: selectedImage, title, postUrl, subreddit };
}

async function fetchFromSubreddit(subreddit: string): Promise<MotivationMeme> {
  const response = await fetch(`https://meme-api.com/gimme/${encodeURIComponent(subreddit)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`Meme source returned ${response.status}`);

  const meme = normalizeMeme(await response.json(), subreddit);
  if (!meme) throw new Error("Meme source returned no safe image");
  return meme;
}

protectedRouter.post("/motivation/meme", async (req, res): Promise<void> => {
  const body = FetchMotivationMemeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const primarySubreddit = subredditBySection[body.data.sectionId];
  const fallbackSubreddit = primarySubreddit === "wholesomememes"
    ? "ProductivityMemes"
    : "wholesomememes";
  const candidates = [primarySubreddit, fallbackSubreddit];

  for (const subreddit of candidates) {
    try {
      const meme = FetchMotivationMemeResponse.parse(await fetchFromSubreddit(subreddit));
      res.json(meme);
      return;
    } catch (error) {
      req.log.warn({ err: error, subreddit }, "Could not fetch a suitable motivation meme");
    }
  }

  res.status(502).json({ error: "Motivatsion rasmni hozircha yuklab bo‘lmadi." });
});

router.use(protectedRouter);

export default router;