---
name: Diary quote localization
description: Preserve localized motivation quotes and date-seeded section guides across supported languages.
---

Translate the quote's template fragments rather than replacing the rotation with a smaller set of sample quotes.

Daily motivation and section guides use the local `YYYY-MM-DD` plus the user and section/category for selection, with adjacent-day collisions resolved. Keep guide pools separate from quote pools, and store every guide item in all four app languages.

**Why:** Replacing source-matched quotes breaks their rotation; random selection can repeat too soon. A guide's language should change its wording, not which item is selected that day.

**How to apply:** Preserve the daily date-seed guarantees, full-pool manual quote cycle, source-matched quote fragments, and explicit translations when editing motivation or section-guide content.

Section-guide benefit pools are position-sensitive: keep action, clarity, and continuity text aligned with their displayed labels. Pool-size checks alone cannot detect a semantically mismatched benefit.

**Why:** Reusing one section-specific detail bank across different headings can still produce a valid 100,000-entry pool while showing the wrong benefit under a heading.

**How to apply:** Keep separate localized benefit variants for each displayed position and inspect generated examples in all supported languages alongside count and uniqueness checks.