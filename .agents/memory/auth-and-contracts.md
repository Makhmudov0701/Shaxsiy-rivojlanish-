---
name: Private diary auth and contracts
description: Durable authentication and API contract decisions for this project.
---

The diary uses Replit-managed Clerk for account creation and browser sessions. The web client relies on same-origin cookies; it must not add bearer-token handling. API handlers should derive ownership from Clerk's authenticated user ID and never accept a user ID from the client.

**Why:** Diary content is private by definition, and Clerk provides the supported managed auth path without recreating local password/JWT handling.

**How to apply:** Keep protected diary routes behind the existing Clerk middleware and `requireAuth` guard. Treat `lib/api-spec/openapi.yaml` as the contract source and regenerate hooks after every endpoint change.

The installed Clerk React SDK exposes the modern custom-flow hooks as signal state: read `signIn`/`signUp` and `fetchStatus` from `useSignIn()`/`useSignUp()`, use factor methods such as `password()` and `verifications.verifyEmailCode()`, then call the resource's `finalize()`.

**Why:** The legacy `isLoaded`, `setActive`, and resource-returning mutation methods are not part of the signal hook shape and cause both type errors and incorrect completion handling.

**How to apply:** When changing the custom Uzbek auth screen, keep all Clerk error details behind a localized app message and treat a successful factor response as complete only after the corresponding future resource reports `status === 'complete'` and `finalize()` succeeds.