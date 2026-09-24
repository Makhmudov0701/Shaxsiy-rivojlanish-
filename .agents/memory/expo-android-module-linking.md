---
name: Expo Android local module linking
description: A local Expo module can appear in discovery without resolving into an Android Gradle project.
---

For local Expo Android modules, `expo-module.config.json` is not sufficient evidence that the native code will be linked. Include an Android library Gradle build file with the Expo module Gradle plugin, then verify that `expo-modules-autolinking resolve --platform android --project-root . modules` includes the module and that Expo Android prebuild succeeds. The `search` command alone can report a module whose Android project is still incomplete.

**Why:** A local module was visible in discovery but absent from Android resolution until its `android/build.gradle` existed.

**How to apply:** When adding or changing a local native module, verify the resolved Android project before relying on the generated app manifest or JavaScript bridge.