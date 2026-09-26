---
name: JSX localization transform
description: Avoid overlapping source edits when a JSX expression contains nested JSX.
---

Do not wrap a JSX child expression in a localization component when its expression already contains JSX. Visit and localize the nested JSX descendants independently.

**Why:** Wrapping both a conditional JSX parent and its child expressions created overlapping AST edits that emitted malformed JSX during Vite production builds, despite typecheck passing.

**How to apply:** Before adding an expression-level transform, detect nested JSX elements/fragments and skip the outer wrapper; validate the production build as well as TypeScript.