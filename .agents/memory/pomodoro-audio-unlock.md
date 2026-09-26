---
name: Pomodoro audio unlock
description: Browser autoplay constraints for delayed Pomodoro completion sounds.
---

Create and resume the Web Audio context from the user's timer-start gesture, then reuse that context when the session completes.

**Why:** Browsers may keep an audio context suspended until user activation. A completion event runs asynchronously much later and may not be allowed to unlock audio itself.

**How to apply:** When changing FocusTodo completion sounds, preserve the start-time unlock and keep unsupported-audio handling non-fatal to the timer.