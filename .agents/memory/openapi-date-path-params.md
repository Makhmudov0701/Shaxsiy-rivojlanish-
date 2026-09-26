---
name: OpenAPI date path parameters
description: Generator behavior and validation strategy for date-only route parameters.
---

Keep date-only path parameters as `type: string` with a `YYYY-MM-DD` pattern in the OpenAPI contract. With this workspace's current Orval configuration, `format: date` can generate a server-side Zod `Date` validator, but Express always supplies route parameters as strings. The handler should validate that the string is a real calendar date before passing it to the database.

**Why:** The generated React client correctly sends date strings, while an automatically generated `z.date()` rejects those same Express path strings before the route handler can use them.

**How to apply:** Use a string pattern for path params, regenerate both client and server schemas after contract changes, verify the generated Zod type, and keep `format: date` for request/response fields only where the configured coercion is appropriate.