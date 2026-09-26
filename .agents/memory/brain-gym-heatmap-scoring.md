---
name: Brain Gym heatmap scoring
description: Product decision for showing exercise scores in the activity heatmap.
---

Show Brain Gym correct/possible totals in the selected day's tooltip and accessible label, but keep heatmap color intensity based on activity volume rather than score quality.

**Why:** Different Brain Gym difficulties have different possible-point totals, so using raw scores to color days would mix exercise difficulty and performance into the activity-volume signal.

**How to apply:** When adding new Brain Gym score details, preserve completion-based intensity and expose score totals as a separate daily metric.