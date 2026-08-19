# LÄYRD — Capstone Final Submission

**LÄYRD** is a Calgary boutique dessert brand selling handcrafted cheesecakes and tiramisus in 250ml cans, plus espresso shots. This repository is the full-stack e-commerce platform built for the client, delivered as our team's Capstone project.

- **Tagline:** Cake in a Can | Espresso Shots
- **Contact:** info@layrd.org · 403-399-3903 · @l.a.y.r.d
- **Pickup location:** Pineridge NE, Calgary, AB

**Live deployment:** `[live URL here]`

---

## What's in this repository

```
layrd-21-7/
├── layrd-ecommerce/     — Customer-facing Next.js 16 (App Router) + React 19 site
├── microservices/       — 4 independent Express.js backend services
├── content/             — Brand assets (logo, business cards, product info, FAQs)
├── imp doc/             — Planning & requirements docs (PRD, TRD, DB schema, user flow, team task breakdown)
├── brand.md             — Brand voice/style reference
├── docker-compose.yml   — One-command local Docker setup for the full stack
└── CLAUDE.md            — Architecture reference (originally written for AI coding assistants, but a solid technical overview for any developer picking up this project)
```

The main site (`layrd-ecommerce/`) never talks to third-party APIs (Stripe, Resend, Google Gemini, OpenRouteService, Supabase directly) — it proxies through the 4 microservices, each responsible for one concern (delivery fee calculation, promo code validation, transactional email, AI label generation). See `CLAUDE.md` for the full architecture and `microservices/README.md` for the contract each service exposes.

## Getting the project running

### 1. Environment variables

Every one of the 5 services (main app + 4 microservices) needs its own `.env.local`, based on that folder's `.env.example`:

```bash
cp layrd-ecommerce/.env.example layrd-ecommerce/.env.local
cp microservices/delivery-fee-service/.env.example microservices/delivery-fee-service/.env.local
cp microservices/promo-code-service/.env.example microservices/promo-code-service/.env.local
cp microservices/notifications-service/.env.example microservices/notifications-service/.env.local
cp microservices/ai-label-service/.env.example microservices/ai-label-service/.env.local
```

Then fill in real API keys in each. `INTERNAL_SERVICE_KEY` must be **identical** across all 5 files — it's the shared secret that lets the main app and microservices trust each other.

Third-party accounts needed: Supabase (database/auth), Stripe (payments), Resend (transactional email — see the domain verification note in `CLAUDE.md`), Google AI Studio (Gemini, for AI label generation), OpenRouteService (delivery distance calculation).

### 2. Install dependencies

```bash
cd layrd-ecommerce && npm install
cd ../microservices/delivery-fee-service && npm install
cd ../promo-code-service && npm install
cd ../notifications-service && npm install
cd ../ai-label-service && npm install
```

### 3. Set up the database

Run `layrd-ecommerce/supabase/schema.sql` in your Supabase project's SQL Editor, then every file in `layrd-ecommerce/supabase/migrations/` in order, then the migration files in `microservices/promo-code-service/migrations/` and `microservices/ai-label-service/migrations/`.

### 4. Run everything

**Option A — Docker Compose (one command, recommended):**
```bash
docker compose up --build
```

**Option B — five terminals, run each manually:**
```bash
# Terminal 1
cd microservices/delivery-fee-service && npm start
# Terminal 2
cd microservices/promo-code-service && node index.js
# Terminal 3
cd microservices/notifications-service && node index.js
# Terminal 4
cd microservices/ai-label-service && node index.js
# Terminal 5
cd layrd-ecommerce && npm run dev
```

Visit **http://localhost:3000** (or `http://localhost:3010` — see the port-3000 gotcha noted in `CLAUDE.md`).

### 5. Stripe webhook (for local testing of paid orders)

Order-confirmation emails for card payments only fire once Stripe's webhook confirms payment — locally, that needs the [Stripe CLI](https://stripe.com/docs/stripe-cli) forwarding events to your machine:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook
```
Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET` in `layrd-ecommerce/.env.local`.

## More documentation

- [`layrd-ecommerce/README.md`](layrd-ecommerce/README.md) — main app structure, page/route map, promo codes for testing, developer task split
- [`microservices/README.md`](microservices/README.md) — per-service endpoints, env vars, and the internal-key/proxy contract
- [`CLAUDE.md`](CLAUDE.md) — architecture deep-dive (auth model, Stripe webhook flow, proxy-with-fallback pattern)
- [`imp doc/`](imp%20doc/) — original planning docs: PRD, TRD, database schema reference, user flow, UX/UI brief

## Project status

Built for and delivered to the LÄYRD client as a working, end-to-end e-commerce platform: browsing, cart, checkout with Stripe payments, delivery fee + promo code calculation, order/event/wholesale management for the client, AI-assisted custom label generation for private events, and transactional email for every customer touchpoint.
