# ACAMS Site (Next.js)

This package hosts the hardened authentication, executive verification tooling, invite flows, and public navigation shell that flank the richer Vite `professional-app`.

## Prerequisites

1. Copy `.env.example` to `.env.local` (or `.env`) and set **`AUTH_SECRET`** to a non-empty random string; optional SMTP knobs; Postgres `DATABASE_URL` when leaving SQLite behind. `NEXTAUTH_SECRET` is still read as a fallback alias (see `auth.config.ts`).
2. Install deps: `npm install`
3. Generate schema + SQLite dev DB: `npx prisma migrate dev --name init_auth`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js in dev mode (webpack; default) |
| `npm run dev:turbo` | Same with Turbopack (`next dev --turbopack`) — see note below |
| `npm run build` | `prisma generate` then production build |
| `npm run start` | Serve the production bundle |
| `npm test` | Run Vitest suite (`tests/**/*.test.ts`) |
| `npm run db:seed` | Seed executives + synthetic pending students |

## Authentication & verification

Auth.js beta (`next-auth@5`) runs alongside Prisma (`better-sqlite3` locally, Postgres via `DATABASE_URL`).

### Dev bundler (webpack vs Turbopack)

`npm run dev` uses the classic webpack dev server by default. Some setups combining **Turbopack** with **Auth.js / `@auth/core`** have hit flaky deep-merge behavior during HMR; the codebase already avoids retaining nested session objects on the client, but webpack remains the reliable default. For Turbopack anyway, use `npm run dev:turbo`. See upstream discussions in [Auth.js](https://github.com/nextauthjs/next-auth) and [Next.js Turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack) issue threads if you need to cross-check.

### Email allowlist & invites

Self-serve signups MUST match `ALLOWED_SIGNUP_DOMAIN` (default `crimson.ua.edu`) on both clients and `/app/_actions` server checks. Invite links accept arbitrary email domains via single-use hashed tokens capped by `INVITE_TTL_HOURS`.

### Roles & statuses

JWT sessions last **7 days** and hydrate `role` + `status` from Prisma each refresh (`auth.config.ts` callbacks). `UNVERIFIED` users can authenticate but gated member routes (`/member/*`) explain the Crimson executive bottleneck. Exec surfaces (`/exec/*`) additionally require verified `EXEC` accounts — enforced directly in `app/exec/layout.tsx` (not middleware-only).

### Email providers & SMTP

SMTP creds hydrate both custom mailers (`lib/email.ts`) and Auth.js nodemailers. Omit SMTP hosts to route everything through console logging (`[email:dev] …` markers).

### Auditing & security notes

Audit rows persist `SIGNUP`, `INVITE_CREATED`, `INVITE_ACCEPTED`, `VERIFY_APPROVE`, `VERIFY_REJECT`, and `INVITE_REVOKED` events with structured JSON payloads. Invite tokens persist only SHA-256 digests (`lib/invite-token.ts`). `@upstash/ratelimit` augments brute-force throttles whenever REST credentials exist; otherwise the in-memory shim documents the Redis TODO.

TODO (spec-deferred):

- Dedicated password reset issuance + OTP/TOTP pillars on `User`.
- Middleware-level IP reputation + device binding.

## Seeded accounts

Running `npm run db:seed` provisions:

| Email | Password | Purpose |
| --- | --- | --- |
| exec.demo@crimson.ua.edu | `ChangeMe!2026` | Verified executive |
| student{1..3}@crimson.ua.edu | `Pending!2026` | Sample `UNVERIFIED` queue |

## Related packages

Marketing depth (portfolio dashboards, pipelines, recruiters tools) intentionally remains in `/professional-app/src` until data contracts converge.
