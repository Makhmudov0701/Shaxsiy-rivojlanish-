---
name: Remote ambience audio
description: Browser playback constraints and licensing rules for streamed ambience sources.
---

Many Mixkit direct audio streams do not send `Access-Control-Allow-Origin`. Native HTML audio can play these cross-origin sources, but JavaScript cannot fetch or route them through a `MediaElementAudioSourceNode` without CORS. Use native audio element volume changes for fades and crossfades; reserve Web Audio for generated sound or sources that explicitly allow CORS.

Mixkit's Free Sound Effects License permits commercial and non-commercial end products and public performance on web platforms, but prohibits redistributing an item on its own. Its Free Stock Music License permits web, podcast, and ad use, but excludes CDs/DVDs, video games, and TV/radio broadcasts. Recheck the license if the delivery format or source changes.

Freesound tracks may have different licenses per upload. Confirm the license on each sound page before adding it. For CC BY sources, show the original sound title, creator, source page, and license link in the app; do not treat a preview URL as evidence of a particular license.

**Why:** Direct CDN playback avoids copying assets into the project and works without exposing cross-origin audio data to Web Audio. Mixkit and Freesound licenses differ by asset and allowed delivery context.

**How to apply:** For ambient audio in a web app, stream from the original source with native audio elements and element-volume ramps, retain source and license links, display full attribution for CC BY assets, and avoid repackaging files as standalone downloads.