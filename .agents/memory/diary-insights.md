---
name: Diary insights scope
description: Product decision for calendar and mood analytics data scope.
---

Calendar and mood analytics should represent the user's complete private diary, not the currently filtered list view.

**Why:** Search, mood, favorites, and date filters are for finding cards; applying them implicitly to long-term insights can make monthly patterns look incomplete or misleading.

**How to apply:** Use the authenticated unfiltered entries query for calendar and analytics surfaces. Keep list-view filters local to the entries tab unless the user explicitly asks for filtered insights.