---
name: Diary weather privacy
description: Privacy limits for location-based weather lookups in diary entries.
---

Weather lookup should start only after an explicit user action. Save the mapped condition and Celsius temperature with the authenticated diary entry; never persist latitude or longitude.

**Why:** The diary needs current weather, not a retained location history; precise coordinates are sensitive.

**How to apply:** Keep geolocation permission prompts user-triggered and pass coordinates only to the weather provider. Ask before adding location history or background tracking.