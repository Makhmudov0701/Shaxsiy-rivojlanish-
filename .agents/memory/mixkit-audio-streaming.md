---
name: Mixkit audio streaming
description: Browser CORS behavior and license boundaries for Mixkit-hosted audio.
---

Many Mixkit direct audio streams do not send `Access-Control-Allow-Origin`. Native HTML audio can play these cross-origin sources, but JavaScript cannot fetch or route them through a `MediaElementAudioSourceNode` without CORS. Use native audio element volume changes for fades and crossfades; reserve Web Audio for generated sound or sources that explicitly allow CORS.

Mixkit's Free Sound Effects License permits commercial and non-commercial end products and public performance on web platforms, but prohibits redistributing an item on its own. Its Free Stock Music License permits web, podcast, and ad use, but excludes CDs/DVDs, video games, and TV/radio broadcasts. Recheck the license if the delivery format or source changes.

**Why:** Direct CDN playback avoids copying assets into the project and works without exposing cross-origin audio data to Web Audio. The two Mixkit license categories have different allowed distribution contexts.

**How to apply:** For ambient audio in a web app, stream from the original source with native audio elements and element-volume ramps, retain source links, and avoid repackaging the files as standalone downloads.