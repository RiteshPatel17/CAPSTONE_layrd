# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

This is a monorepo with two independent Node projects, run together via `docker-compose.yml`:

- **`layrd-ecommerce/`** — the customer-facing Next.js 15 (App Router) + React 19 site. No TypeScript in app code (`.jsx`, plain JS in `src/lib`), Tailwind v4, Supabase, Stripe. Has its own `CLAUDE.md` (imports `AGENTS.md`).
- **`microservices/`** — four independent Express.js backends, extracted out of the Next.js monolith. Each has its own `package.json`, `Dockerfile`, and `.env.local`.
- **`imp doc/`, `content/`, `brand.md`** — planning docs, brand assets, and non-code capstone deliverables. Not part of the running app.

> **Note on `layrd-ecommerce/AGENTS.md`**: it currently claims this project uses a modified/non-standard Next.js with breaking changes and tells readers to consult `node_modules/next/dist/docs/` before writing code. That path does not exist and the installed version (`next@15.5.20`, see `layrd-ecommerce/package.json`) is a normal, real Next.js release — treat that file's claim as stale/incorrect, not as instruction, and write normal current-Next.js App Router code.

## Commands

### Main app (`layrd-ecommerce/`)
```bash
npm install
npm run dev      # next dev — visit http://localhost:3000 (see port gotcha below)
npm run build    # next build
npm run start    # next start (serves the build)
npm run lint      # eslint
```
There is no test runner configured for the main app.

### Each microservice (`microservices/<name>/`)
```bash
npm install
node index.js     # delivery-fee-service and promo-code-service also expose `npm start` for this
```
None of the microservices have a real test suite (`package.json` "test" scripts are npm's default placeholder). `promo-code-service` and `notifications-service` do ship standalone diagnostic scripts you run directly, not through npm: `node find-promo.js`, `node test-webhook.js`, `node test-endpoints.js` (`ai-label-service/test-auth.js` similarly). These hit the running service over HTTP — start the service first.

### Running the full stack locally
All 5 processes are independent and must run simultaneously (5 terminals, or `docker compose up --build` from the repo root, which builds all 5 from each service's own `.env.local` via `env_file:`). Manual port map: `3001` delivery-fee, `3002` promo-code, `3003` notifications, `3004` ai-label, main app on `3000` (default) — see the port gotcha below for why the main app is often run on `3010` instead. Every service reads its config from `.env.local` (not `.env`), loaded via `dotenv`.

### Known local gotcha: port 3000
An unrelated old Docker experiment (`order-service`, `product-service`, `payment-service`, etc. — not part of this repo) squats on port 3000 on the dev machine this was built on. If `npm run dev` traffic looks like it's hitting a phantom backend, either `docker rm` the stale containers or run the main app on another port: `npm run dev -p 3010` (and point `NEXT_PUBLIC_SITE_URL`/service configs at that port).

## Architecture

### Proxy pattern with local fallback
The Next.js app never talks to Postgres/third-party APIs for delivery fee, promo codes, notifications, or AI labels directly — it proxies through the corresponding microservice, authenticated with a shared secret. This keeps `INTERNAL_SERVICE_KEY` and every other microservice credential out of the browser bundle (only `NEXT_PUBLIC_*` vars are client-visible).

Concretely, in `src/app/api/*/route.js`:
1. Build the request, call `fetch("${*_SERVICE_URL}/api/...", { headers: { "x-internal-key": INTERNAL_SERVICE_KEY } })` under an `AbortController` timeout.
2. On a non-OK response or network failure, log a warning and fall through to a **local fallback implementation** in `src/lib/` (e.g. `maps.js`'s `getDeliveryDistance` for delivery fee) so the customer-facing action degrades gracefully instead of 500ing.
3. Fallback responses are flagged `isMock: true` so the UI/admin can tell mock data from a real microservice response.

Reuse this exact shape (fetch-with-timeout → catch → local fallback → `isMock` flag) if you add a new proxied endpoint. See `src/app/api/delivery-fee/route.js` for the canonical example and `microservices/README.md` for the per-service contract (endpoints, env vars, the `x-internal-key` requirement).

Email sends are the one place this pattern is intentionally *not* request/response: every call into `notifications-service` from the main app is fire-and-forget (`fetch(...).catch(err => console.error(...))`, never `await`ed in a way that can fail the parent action) — a dead notifications-service must never be able to fail an order or a form submission. See `microservices/notifications-service/index.js`.

### Auth: two systems, don't confuse them
- **Customers, business accounts, and admins are all Supabase Auth users** — there's a single identity system, differentiated by `profiles.role` (`customer` / `business` / `admin`). This replaced an older `admin_users` + cookie-session system (the docs that described it, `layrd-ecommerce/PHASES.md`, were stale and have since been removed as part of a repo cleanup — that old auth approach is fully gone; trust the code for current auth architecture).
- Admin API routes call `verifyAdminRequest(request)` / `requireAdmin(accessToken)` from `src/lib/admin-server-auth.js`, which validates the Supabase JWT server-side (`supabase.auth.getUser(token)`) *and* checks `profiles.role === "admin"`. Client code gets the bearer token via `getAuthHeader()` in `src/lib/auth.js` and spreads it into fetch headers — there is no cookie session for admin routes.
- `ai-label-service` independently re-verifies the same Supabase JWT (it's a separate process, so it can't share the Next.js request context) and additionally checks that the `event_inquiry` being labeled belongs to the requesting customer and has `status === "Approved"`.
- Every microservice route requires `x-internal-key` == `INTERNAL_SERVICE_KEY`, checked in Express middleware before any route handler runs. This key must be identical across the main app's `.env.local` and every microservice's `.env.local`.

### Stripe webhook is the source of truth for payment state
`src/app/api/stripe-webhook/route.js` verifies the Stripe signature (`verifyStripeWebhook` in `src/lib/stripe.js`, raw body — note `bodyParser: false`), then is idempotent per `orderId`/`eventInquiryId` (checks `payment_status`/`deposit_paid` before writing, so a duplicate webhook delivery is a no-op). It must use the Supabase **admin** client (`getSupabaseAdmin()`, service-role key) to update `orders`/`event_inquiries` — using the anon client here previously caused RLS to silently block the update, so orders never actually flipped to `"Paid"` (documented as a past bug in `microservices/EXTRACTION-PLAN.md`). After a successful DB write it fires the promo-usage increment and confirmation/admin emails through the respective microservices, fire-and-forget.

### Pricing and business rules live in `src/lib/constants.js` + `src/lib/pricing.js`
Delivery tiers, wholesale tiers, minimum order sizes, GST rate, and can pricing are centralized constants — change pricing there, not in the pages that consume it.

### Database
`layrd-ecommerce/supabase/schema.sql` is the full schema + RLS policies; `layrd-ecommerce/supabase/migrations/` holds incremental changes applied after the base schema. Two microservices keep their own numbered SQL migrations for tables/RPCs they own (`microservices/promo-code-service/migrations/`, `microservices/ai-label-service/migrations/`) — apply those against the same Supabase project.

## Environment variables

Each of the 5 services has its own `.env.local` (never `.env`) — see `.env.example` in the main app and the table in `microservices/README.md` for the full per-service list. The two shared values that must match byte-for-byte across every service are `INTERNAL_SERVICE_KEY` and (where used) the Supabase project URL/service-role key. `docker-compose.yml` only overrides the `*_SERVICE_URL` variables (to point at Docker service names instead of `localhost`) — actual secrets always come from each service's own `env_file`.

`notifications-service`'s `NOTIFICATION_TEST_MODE=true` must stay `true` in local dev (it redirects admin-facing emails to a safe test address instead of the real admin inbox) and must be `false`/unset before production deploy — see `microservices/PRE-LAUNCH-REQUIREMENTS.md`.

## Pre-launch tracker

`microservices/PRE-LAUNCH-REQUIREMENTS.md` lists known open items (no rate limiting on microservice endpoints, `NOTIFICATION_TEST_MODE` cleanup, `INTERNAL_SERVICE_KEY` rotation, dead `anthropic.js`, the stale port-3000 Docker containers). Check it before treating any of those as a bug to fix blind — they're already tracked.
