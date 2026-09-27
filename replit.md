# Personal Diary

A private, calm writing space for capturing, searching, and revisiting daily diary entries.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Database env: `EXTERNAL_DATABASE_URL` optionally overrides `DATABASE_URL` for an external PostgreSQL provider such as Supabase. Keep the connection string in Replit Secrets or the Render service environment, never in the repository.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/personal-diary` — React + Vite client with the public landing page, Clerk sign-in/sign-up, diary workspace, and entry editor.
- `artifacts/api-server/src/routes/diary.ts` — authenticated diary CRUD and summary endpoints.
- `artifacts/api-server/src/middlewares/auth.ts` — Clerk session guard for private API routes.
- `lib/api-spec/openapi.yaml` — source of truth for diary API contracts and generated hooks.
- `lib/db/src/schema/diary-entries.ts` — Drizzle schema for user-owned diary entries.
- `artifacts/personal-diary/src/index.css` — shared “ink garden” visual theme and Clerk layer ordering.

## Architecture decisions

- Clerk browser sessions use same-origin cookies; the web client does not attach bearer tokens.
- Every diary query is scoped to the authenticated Clerk user ID on the server.
- The database package uses `EXTERNAL_DATABASE_URL` when set and otherwise falls back to the platform-provided `DATABASE_URL`.
- OpenAPI codegen owns the shared request/response types used by both the API and the React client.
- Calendar dates are stored as PostgreSQL `date` values so diary days are not shifted by timezone conversion.

## Product

- Unauthenticated visitors see a public landing page and can start sign-in or sign-up.
- Authenticated users can create, view, search, filter, favorite, edit, and delete diary entries.
- The diary workspace shows entry totals, monthly volume, writing streak, favorites, and the latest mood.
- Entries support a title, longer-form content, mood, calendar date, tags, and favorite state.

## User preferences

- Keep the experience personal and inviting; it should not become a clinical admin panel.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using generated types.
- After changing `lib/db/src/schema`, run `pnpm --filter @workspace/db run push` in development.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
