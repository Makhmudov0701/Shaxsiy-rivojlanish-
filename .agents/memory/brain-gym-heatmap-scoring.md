---
name: Brain Gym history and heatmap
description: Preserve historical exercise records and keep activity-volume heatmap semantics.
---

Historical Brain Gym exercise completions remain available to profile and calendar analytics after the interactive games are replaced. New knowledge-hub bookmarks use a separate per-user store; do not repurpose or overwrite the completion records.

Show historical Brain Gym correct/possible totals in the selected day's tooltip and accessible label, but keep heatmap color intensity based on activity volume rather than score quality.

**Why:** The profile and heatmap still read completion history, and different exercise difficulties have different possible-point totals. Deleting or reusing those records would lose history or mix performance with activity volume.

**How to apply:** Keep legacy completions intact until all consumers are intentionally migrated. Store new knowledge-hub state separately, and expose historical score totals as a daily detail rather than heatmap intensity.