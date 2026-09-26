---
name: Diary quote localization
description: Preserve localized source quotes and predictable daily and manual rotation behavior.
---

Translate the quote's template fragments rather than replacing the rotation with a smaller set of sample quotes.

Daily motivation is seeded from the local `YYYY-MM-DD` and user/section category, with consecutive-day collisions resolved. Manual cycling traverses the full pool before repeating.

**Why:** Substituting sample quotes can make the displayed text no longer correspond to the original quote selected by its rotation index. Independent random picks can also repeat too soon, while a date collision would defeat the daily refresh.

**How to apply:** Preserve source-matched quote fragments and the daily/manual rotation guarantees when expanding or localizing the quote pools.