# LÄYRD Microservices

This directory contains the four extracted backend microservices for the LÄYRD ecommerce platform. These services were decoupled from the main Next.js monolith to improve modularity, independent scaling, and fault tolerance.

---

## Architecture & Conventions

- **Framework**: All microservices use **Express.js** (not Next.js) for lightweight, fast cold-starts and consistency across services.
- **API Gateway**: The main Next.js app acts as a proxy. All client requests go to Next.js, which forwards to the relevant microservice with:
  1. `x-internal-key` header — a shared secret (`INTERNAL_SERVICE_KEY`) that prevents direct external access to microservices.
  2. `Authorization: Bearer <token>` header — forwarded when the microservice needs to verify a Supabase JWT (only `ai-label-service`).
- **Resilience**: Every proxy route in the main app implements a timeout + graceful local fallback. If a microservice is unreachable, the main app returns a degraded-but-functional response instead of a 500 error. Fallbacks are flagged with `isMock: true` in responses.

---

## Services

### 1. `delivery-fee-service` — Port 3001

**Purpose**: Calculates the driving distance from the store's pickup address to the customer's delivery address (via OpenRouteService geocoding API), and returns a fee based on internal pricing rules.

**Endpoints**:
- `GET /api/delivery-fee?address=<customer_address>` — Returns `{ isWithinCalgary, distanceKm, durationMin, fee, isMock }`

**Environment Variables** (`.env.local`):
| Variable | Description |
|---|---|
| `OPENROUTESERVICE_API_KEY` | OpenRouteService API key for geocoding/routing |
| `PICKUP_ORIGIN_ADDRESS` | Store origin address (e.g. `336 Pinewind Close NE, Calgary, AB`) |
| `INTERNAL_SERVICE_KEY` | Shared secret for internal request authentication |

---

### 2. `promo-code-service` — Port 3002

**Purpose**: Validates promo codes against the Supabase `promo_codes` table and increments usage counts securely (only at order placement, not at cart entry).

**Endpoints**:
- `GET /api/promo?code=<CODE>&orderTotal=<amount>` — Validates a code and returns discount details
- `POST /api/promo/increment` — Increments the `times_used` counter for a code (called only on successful order)

**Environment Variables** (`.env.local`):
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS for secure server-side reads) |
| `INTERNAL_SERVICE_KEY` | Shared secret for internal request authentication |

---

### 3. `notifications-service` — Port 3003

**Purpose**: Centralized email dispatcher using Resend. Handles all transactional emails for the platform: order confirmations, admin order alerts, event inquiry updates, label approvals, business code emails, and contact form submissions.

**Endpoints**:
- `POST /api/emails/order-confirmation` — Customer order confirmation
- `POST /api/emails/new-order-admin` — Admin alert for new orders
- `POST /api/emails/event-approved` — Customer alert for approved event inquiry
- `POST /api/emails/event-rejected` — Customer alert for rejected event inquiry
- `POST /api/emails/business-code` — Sends business discount code to customer
- `POST /api/emails/label-approved` — Customer alert for approved label request
- `POST /api/emails/label-revision` — Customer alert when label needs revision
- `POST /api/emails/contact` — Forwards contact form messages to admin

**Environment Variables** (`.env.local`):
| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for sending emails |
| `ADMIN_EMAIL` | Real admin inbox (e.g. `info@layrd.org`) |
| `INTERNAL_SERVICE_KEY` | Shared secret for internal request authentication |
| `NOTIFICATION_TEST_MODE` | **See warning below** |

> [!WARNING]
> **`NOTIFICATION_TEST_MODE=true` must be set in local `.env.local` during development.**
> When `true`, all admin-facing emails (`new-order-admin`, `event-inquiry`, `contact`) redirect to a safe test address instead of the real admin inbox, preventing test emails from reaching Adam's live inbox. This variable **must be removed or set to `false`** before production deployment. It is currently set to `true` in the local `.env.local` for `notifications-service`.

---

### 4. `ai-label-service` — Port 3004

**Purpose**: Generates custom label text suggestions using Google Gemini and saves final label submissions to the `ai_label_requests` Supabase table. Enforces both event approval status and customer ownership as server-side security checks.

**Endpoints**:
- `POST /api/ai-labels` with `{ action: "generate", eventInquiryId, tone, eventType, customerName, notes }` — Generates Gemini suggestions
- `POST /api/ai-labels` with `{ action: "submit", eventInquiryId, tone, eventType, editedText, customerName }` — Saves final label request to DB

**Security**: Every request requires a valid Supabase JWT (`Authorization: Bearer <token>`). The service verifies:
1. The token is cryptographically valid (not expired/forged).
2. The `event_inquiry` exists and belongs to the requesting user (`customer_id` match).
3. The `event_inquiry.status` is `"Approved"` — labels cannot be generated or submitted for pending or rejected events.

**Environment Variables** (`.env.local`):
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for database writes |
| `INTERNAL_SERVICE_KEY` | Shared secret for internal request authentication |

---

## Running Locally

All services must run simultaneously alongside the main Next.js app. Open five terminal tabs:

```bash
# Tab 1 — Delivery Fee Service
cd microservices/delivery-fee-service
npm start

# Tab 2 — Promo Code Service
cd microservices/promo-code-service
node index.js

# Tab 3 — Notifications Service
cd microservices/notifications-service
node index.js

# Tab 4 — AI Label Service
cd microservices/ai-label-service
node index.js

# Tab 5 — Main Next.js App
cd layrd-ecommerce
npm run dev
```

Port assignments: `3001` delivery | `3002` promo | `3003` notifications | `3004` ai-labels | `3010` (or default `3000`) main app.

---

## Known Limitations (Pre-Launch)

| Issue | Status |
|---|---|
| No rate limiting on any microservice endpoint | Open — must be addressed before production launch |
| `delivery-fee-service` proxy timeout is 12s (matches real ORS API latency) | Acceptable for current load; revisit for production caching |
| Contact form emails in `notifications-service` are not templated (plain text) | Low priority cosmetic item |
