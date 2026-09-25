---
name: Public meme API proxy
description: Constraints for fetching public Reddit-sourced memes in the Personal Diary.
---

Do not call `meme-api.com` directly from browser code: its response did not include `Access-Control-Allow-Origin`, so browser JSON requests fail CORS. Fetch through the authenticated API server, validate HTTPS image and Reddit post URLs, and reject NSFW/spoiler entries before returning them to the client.

**Why:** Direct browser fetch is blocked by CORS, and the free endpoint can return nonexistent subreddits or posts without suitable images. `studymemes` returned 404 during verification; `ProductivityMemes`, `bookmemes`, and `wholesomememes` returned image posts.

**How to apply:** Keep external-source details behind the typed API contract. Check subreddit availability and response fields before changing the source; keep the client-side daily cache and quote fallback independent of upstream availability.