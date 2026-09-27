---
name: Diary weather privacy
description: Privacy limits for location-based weather lookups in diary entries.
---

Diary-entry weather lookup remains user-triggered; the dashboard may request geolocation on load when the user asks for automatic current weather. Send coordinates only to weather or reverse-geocoding services; never persist latitude or longitude.

**Why:** The diary needs current weather, not a retained location history; precise coordinates are sensitive. Automatic dashboard lookup is a distinct behavior the user explicitly requested, with a fallback city when permission is unavailable.

**How to apply:** Keep entry-form lookup behind its explicit action. For an explicitly requested dashboard widget, allow the browser permission request on load, use a fallback city when needed, and keep coordinates in memory only for current weather refreshes. Ask before adding location history or background tracking.