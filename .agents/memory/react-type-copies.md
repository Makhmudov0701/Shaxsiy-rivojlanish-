---
name: Duplicate React type copies
description: Diagnose cross-package React ref incompatibilities when the workspace resolves multiple @types/react versions.
---

The workspace can resolve multiple `@types/react` versions, making structurally equivalent `React.Ref` types incompatible across package boundaries. Check the resolved type versions before changing runtime behavior or introducing broad dependency overrides; when the runtime contracts match, keep any type assertion scoped to the affected boundary.

**Why:** The full workspace typecheck reported “two different types with this name are unrelated” for refs across React-based dependencies, despite no runtime API mismatch.

**How to apply:** When ref or SVG prop typing fails between React dependencies, inspect pnpm’s resolved `@types/react` versions first. Prefer safe version alignment; otherwise use a narrow boundary bridge rather than broad casts throughout the component.