---
name: Active-time heartbeat boundaries
description: Foreground-to-background transitions and capped heartbeat accrual.
---

When an app becomes hidden or backgrounded, submit a closing heartbeat and freeze the local timer projection. Otherwise, the server's elapsed-time cap can still charge part of the suspended interval when the app resumes.

**Why:** The API infers active time from the gap between heartbeats. A resume-only heartbeat cannot distinguish active use from a long background pause.

**How to apply:** Keep browser visibility and native AppState transitions closing the interval on loss of foreground, and prevent local timer projection from advancing while inactive.