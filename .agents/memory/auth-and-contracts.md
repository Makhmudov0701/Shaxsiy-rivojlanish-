---
name: Private diary auth and contracts
description: Durable authentication and API contract decisions for this project.
---

The diary uses Replit-managed Clerk for account creation and browser sessions. The web client relies on same-origin cookies; it must not add bearer-token handling. API handlers should derive ownership from Clerk's authenticated user ID and never accept a user ID from the client.

**Why:** Diary content is private by definition, and Clerk provides the supported managed auth path without recreating local password/JWT handling.

**How to apply:** Keep protected diary routes behind the existing Clerk middleware and `requireAuth` guard. Treat `lib/api-spec/openapi.yaml` as the contract source and regenerate hooks after every endpoint change.