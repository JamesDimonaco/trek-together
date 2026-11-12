# TrekTogether

A trek logbook plus per-city and per-country chat, posts and "looking for company" requests for outdoor travellers. Guests can chat without an account; Clerk accounts add DMs, profiles and treks. Live at https://www.trektogether.app.

## Stack and commands

Next.js 16 (App Router, `proxy.ts` not middleware), React 19, Convex, Clerk, Tailwind 4, shadcn/ui, Sonner, Resend + React Email, posthog-js, Google Maps geocoding. pnpm only (the package is still named `trail-meet`).

- `pnpm dev` · `pnpm build` · `pnpm start` · `pnpm lint`
- `pnpm test`: vitest over `tests/*.test.ts` (edge runtime, `convex-test`).
- `npx convex dev` runs the dev backend. Run `npx convex codegen` after schema changes, before building.
- `convex/schema.ts` is the source of truth for tables. Read it; don't trust a copy.

## Where things live

- **Identity:** personal (`cvx personal`).
- **Hosting:** Vercel project `trek-together` (personal team). Merging to `main` deploys production. `vercel.json` runs `pnpm build:vercel`, which runs `npx convex deploy` first on production builds, so a merge also deploys Convex prod.
- **Convex:** dev `quixotic-scorpion-92` (what `.env.local` points at), prod `quick-porcupine-248`.
- **PostHog:** project 261197 (US). Query with `phog personal 261197 "<HogQL>"` via `zsh -ic`. The PostHog MCP is Dama-only and can't see it.
- **Env (Next):** `.env` / `.env.local`: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_CLERK_SIGN_{IN,UP}_URL` and fallback redirects, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
- **Env (Convex, dev and prod):** `RESEND_API_KEY`, `APP_URL`, `FOUNDER_ALERT_EMAIL`, `EMAIL_FROM` (optional), `CLERK_JWT_ISSUER_DOMAIN`.

## How it works

- **Auth:** `proxy.ts` runs Clerk. Add every new public route to its `isPublicRoute` matcher. Still check auth in Convex functions.
- **Guests:** a guest has no Convex user id in cookies (for a guest, `COOKIE_NAMES.USER_ID` in `lib/utils/session.ts` holds the sessionId). Mutations a guest can call take optional `sessionId`/`username` and resolve them with `resolveActor` / `getOrCreateGuestUser` (`convex/lib/guests.ts`).
- **Email:** Convex mutations call `notifyUser` / `notifyFounder` in `convex/lib/notify.ts` (consent check, cooldown via `notification_log`, unsubscribe token). They schedule `notifications:deliver`, which calls the Resend HTTP API. `notifyUser` writes the log row before scheduling, so an empty `notification_log` means it was never reached.
- **Blocking:** filter blocked users in queries, not in the UI.
- **Analytics:** call `analytics.<event>()` from `lib/analytics.ts`, not posthog directly.

## Reading prod data

- Convex: `npx convex data <table> --prod --limit 500`. Without `--prod` you read dev.
- PostHog: keep windows to about 30 days; 90-day `$exception` scans time out.
- Most traffic is bots. Single-pageview `$direct` visitors on Chrome/Windows are crawlers (about 98% of visitors). Real referred traffic is bing, google and chatgpt, in the low tens a month. Never quote raw visitor counts.
- The `$exception` "Object Not Found Matching Id:N, MethodName:update, ParamCount:4" is an Outlook SafeLinks scanner, not a bug. Direct hits on `/chat/*/requests/*` are the same scanners following email links.

## Gotchas

- `ctx.auth.getUserIdentity()` has returned null here (Clerk's `convex` JWT template wasn't set up). `convex/posts.ts` checks the caller with `authenticateCaller(ctx, userId)` instead. Test before relying on identity.
- Radix dialogs in a loading state still need `<DialogTitle className="sr-only">`.
