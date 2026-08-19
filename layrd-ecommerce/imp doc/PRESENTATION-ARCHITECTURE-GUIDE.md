# LÄYRD — Architecture & Security Walkthrough
### (Reference for the technical presentation)

This is a plain-language explanation of how the whole system fits together, written so you can study it and speak to any part of it confidently. It covers what each piece does, *why* it's built the way it is, and the security decisions made along the way.

---

## 1. The big picture

LÄYRD is two things working together:

1. **`layrd-ecommerce`** — a Next.js 15 (App Router) web app. This is the actual website: the storefront, cart, checkout, customer account pages, and the whole admin panel. It talks to Supabase (Postgres database + Auth + file storage) directly.

2. **`microservices/`** — four small, independent Express.js services, each doing one focused job:
   - **`delivery-fee-service`** (port 3001) — distance/fee calculation + address autocomplete
   - **`promo-code-service`** (port 3002) — promo code validation and redemption
   - **`notifications-service`** (port 3003) — every email the app sends, via Resend
   - **`ai-label-service`** (port 3004) — AI-assisted custom label generation for events

**Why split into microservices at all?** Each one was deliberately *extracted* out of the main app (this is documented in the team's own `microservices/EXTRACTION-PLAN.md`). The reasoning: each service owns one external API key (OpenRouteService, Resend, Gemini) and one focused slice of business logic, so that logic exists in exactly one place — no matter what ends up calling it later — and each piece can be redeployed or scaled on its own.

**The proxy pattern.** The browser never talks to a microservice directly. Every microservice call goes: **browser → Next.js API route → microservice**. The Next.js route is a thin "proxy" that adds a secret header and forwards the request. This matters because it means the microservices' URLs and their shared secret key never appear in anything the browser downloads — they stay entirely server-side.

**The shared internal key.** All four microservices check for a header called `x-internal-key` on every request, and reject anything that doesn't match their `INTERNAL_SERVICE_KEY` environment variable. This proves "this call came from our own backend," but it does *not* prove which specific customer or admin is making the request — that's a separate check, described in section 3.

**Fallback logic.** `delivery-fee-service` and `promo-code-service` both have an identical-logic copy of their core function living inside the main Next.js app (`src/lib/maps.js` and part of `src/app/api/promo/route.js`). If the microservice doesn't respond within a few seconds, the Next.js route quietly falls back to its own local copy of the logic instead of failing the customer's request. `notifications-service` and `ai-label-service` don't have this fallback — if they're down, the specific action they support (sending an email, generating a label) is skipped, but it never blocks the customer's core action (placing an order, submitting an inquiry) from succeeding.

---

## 2. Data layer: Supabase

Supabase provides three things to this app:

- **Postgres database** — every table (`orders`, `order_items`, `products`, `event_inquiries`, `wholesale_applications`, `ai_label_requests`, `promo_codes`, `profiles`, `settings`, `contact_messages`, `site_images`, `faqs`, `business_codes`) lives here.
- **Auth** — handles login/signup/password reset. One identity system for everyone: customers and admins are both just rows in `profiles`, distinguished by a `role` column (`"customer"` vs `"admin"`).
- **Storage** — product photos, custom label images, and site images (hero banners etc.) are stored here and served via public/signed URLs.

**Two kinds of Supabase client** (in `src/lib/supabase.js`):
- The **anon client** (`supabase`) — used in the browser. Respects Row Level Security (RLS) rules configured on each table.
- The **admin client** (`getSupabaseAdmin()`) — used only in server-side code (API routes, Server Actions). Uses the *service role key*, which bypasses RLS entirely. This is why every function that calls `getSupabaseAdmin()` must do its own permission check in code — there's no database-level safety net once you're using this client.

A note worth knowing for Q&A: `supabase/schema.sql` (the checked-in baseline schema) has drifted out of sync with the *actual* live database in a few places — we found this the hard way when `orders.user_id` was referenced in code but didn't actually exist yet on the live table, requiring a migration to add it. The `supabase/migrations/` folder holds the incremental changes that were actually applied, and is the more trustworthy source for "what does the live database really look like" than the original schema file.

---

## 3. Authentication & Authorization

**One login system for everyone.** There used to be two separate systems — a customer login via Supabase Auth, and a completely separate admin login using its own cookie/session table (`admin_users`, `layrd_admin_session`). That old admin system was removed entirely this session. Now there's exactly one: Supabase Auth. An "admin" is just a customer account whose `profiles.role` happens to be `"admin"`.

**How a request proves who it's from:**
- The browser holds a Supabase session token (a JWT) after login.
- `getAuthHeader()` (`src/lib/auth.js`) reads that token and returns `{ Authorization: "Bearer <token>" }` to attach to any `fetch()` call.
- On the server, an API route reads that header and calls `supabase.auth.getUser(token)` to resolve it back to a real user — this is what `verifyAdminRequest()` and `requireAdmin()` (`src/lib/admin-server-auth.js`) do, additionally checking `profiles.role === "admin"` for admin-only actions.
- **Server Actions are a special case.** Next.js Server Actions (used throughout the admin panel — `admin-products.js`, `admin-settings.js`, etc.) don't receive an `Authorization` header the way API routes do. So the *calling page* fetches its own session token client-side and passes it in explicitly as the first argument to every admin Server Action, which then calls `requireAdmin(accessToken)` itself. This pattern is documented directly in `admin-server-auth.js`.

**Why this matters for the presentation:** a real vulnerability found and fixed this session was that several admin Server Actions (`admin-products.js`, `admin-settings.js`, `admin-faq.js`, `admin-site-images.js`) had **no permission check at all** — they used the service-role client directly, meaning literally anyone could call them (Server Actions are invokable directly by their action ID regardless of which page renders them, so "the page has a login screen" doesn't protect the action itself). Every one of these now calls `requireAdmin()` before doing anything.

**Login gate on the storefront.** Checkout and the contact form require a logged-in account (previously guest checkout was allowed). This is enforced in *two* places, and both matter:
- **Client-side**, `AuthGateModal` (`src/components/auth/AuthGateModal.jsx`) pops up a login/signup form the moment someone tries to check out or send a message while logged out — this is the UX layer.
- **Server-side**, `/api/checkout` and `/api/contact` both reject any request with no valid Bearer token, full stop. This is the layer that actually matters for security — the modal alone would just be a suggestion; a request sent directly to the API without going through the UI is still blocked.

**Admin panel route protection** is enforced by `AdminAuthGuard` (client-side redirect if not an admin) *and* independently by every single admin API route/Server Action checking `requireAdmin()` again. The client-side guard is a UX nicety (no flash of admin content before redirecting); the server-side check is what actually prevents unauthorized access even if someone bypassed the UI.

---

## 4. The checkout & payment flow (the most complex, most security-sensitive part)

This is the flow most worth being able to explain in detail, because it's where real money changes hands and where the most significant hardening happened this session.

**Step by step:**

1. Customer browses, adds items to cart (`CartContext.jsx` — cart state persisted to `localStorage`, separate from anything auth-related).
2. Customer clicks "Checkout." If not logged in, `AuthGateModal` blocks them until they log in or sign up.
3. On `/checkout`, the customer fills in contact info, picks pickup or delivery (delivery triggers a live address autocomplete + distance/fee lookup via `delivery-fee-service`), picks a date/time, optionally applies a promo code, and submits.
4. The frontend POSTs to `/api/checkout` with a Bearer token, the cart items, and the totals it computed for display purposes.
5. **Here's the important part:** the server does *not* trust any of the pricing the client sent. Instead (`src/app/api/checkout/route.js`):
   - Every item's price is **re-derived from the authoritative source** — real products are looked up fresh from the `products` table by `id`; espresso multi-packs are matched against fixed price definitions; bundle prices are checked against the finite set of legitimate prices for that bundle size (base price + 0..N limited-flavour premiums). If a submitted price can't be verified this way, the order is rejected.
   - The promo code, if any, is **re-validated entirely server-side** against the `promo_codes` table — active, not expired, under its usage cap, *and* meets its minimum order amount (a check that didn't exist anywhere in the system before this session).
   - Subtotal, discount, GST, and total are all **recomputed server-side** from these verified numbers and the live GST rate from Settings. The client's numbers are only ever used for the on-screen preview.
6. The order is inserted into `orders` with these server-verified numbers, tagged with `user_id` (so it shows up in the customer's own order history later) and `status: "Pending Payment"` for Stripe orders.
7. **For Stripe payments:** a Checkout Session is created with a single line item equal to the server-verified total (not one line item per cart item — this is a deliberate choice: Stripe Checkout can't represent a negative "discount" line item, and proportionally scaling each item's price to reflect a discount would reintroduce rounding drift; one verified total guarantees the actual Stripe charge exactly matches what's stored as `order.total`, with zero room for a tampered client total to slip through).
8. Customer pays on Stripe's hosted page, then gets redirected back to `/confirmation?order=<id>`.
9. **Stripe sends a webhook** (`/api/stripe-webhook`) confirming payment — this is what actually flips `payment_status` to `"Paid"`, not the redirect itself. The webhook is idempotent (checks if the order is already marked Paid before processing, so a duplicate webhook delivery from Stripe doesn't double-process anything) and its signature is cryptographically verified (`verifyStripeWebhook` in `src/lib/stripe.js` — this used to silently accept unsigned/fake events if misconfigured; now it throws loudly instead).
10. `/confirmation` clears the cart the moment it loads with a real order id — not before, so if someone abandons payment on Stripe's page and comes back, their cart is still intact.

**A bug this session actually found and fixed in this exact flow:** `verifyStripeWebhook()` used to silently return a fake, empty webhook event whenever `STRIPE_WEBHOOK_SECRET` wasn't configured — meaning a real payment could complete on Stripe's side while the app never found out and the order stayed stuck on "Unpaid" forever, with no error visible anywhere. It now throws a clear error instead, so a misconfiguration is loud, not silent.

---

## 5. Admin panel

Every admin page (`src/app/admin/**`) is wrapped in `<AdminLayout>`, which itself wraps everything in `<AdminAuthGuard>`. Data operations mostly go through **Server Actions** (plain async functions marked `"use server"`, imported and called directly from the page component) rather than hand-written API routes — e.g. `admin-products.js`, `admin-orders.js`, `admin-settings.js`. Each of these functions takes the caller's access token as an argument and calls `requireAdmin()` before touching the database.

A few admin features (`business-codes`, `promo-codes`, `wholesale`, `upload-product-image`) use actual API routes instead of Server Actions, mainly because they need custom HTTP semantics (file uploads, specific status codes). These use the same `requireAdmin()`/`verifyAdminRequest()` check, just called from a `route.js` instead of a Server Action.

---

## 6. Notifications (email)

Every email in the system funnels through `notifications-service`. The main app never talks to Resend directly — it calls this microservice, which is the only place the Resend API key exists. Each email type is its own route (`/api/emails/order-confirmation`, `/api/emails/event-approved`, `/api/emails/wholesale-inquiry`, etc.), and the main app fires these as "fire and forget" — the customer's actual action (placing an order, submitting a form) has already succeeded before the email is attempted, so a dead notifications-service can never block or fail something a customer is waiting on.

**Flows currently wired up:**
- Order placed → confirmation email to customer + new-order alert to admin
- Event/wholesale/AI-label inquiry submitted → alert to admin
- Admin approves/rejects/updates any of the above → status email to the customer

---

## 7. Key security decisions made this session (good presentation material)

| Area | Before | After |
|---|---|---|
| Admin auth | Two separate systems (Supabase Auth for customers, a custom cookie table for admins) | One system — admin is just a `profiles.role` |
| Checkout pricing | Trusted whatever the client submitted | Every price re-derived server-side from the database/fixed definitions |
| Promo codes | No server-side minimum-order check anywhere; usage cap had a race condition | Minimum-order enforced server-side; usage cap check-and-increment is now one atomic DB operation |
| Stripe webhook | Silently accepted unsigned events if misconfigured | Throws loudly on misconfiguration |
| Several admin actions (`products`, `settings`, `faq`, `site-images`) | No permission check at all | All require `requireAdmin()` |
| Guest checkout | Allowed | Login required, enforced both client-side (UX) and server-side (the part that actually matters) |
| Delivery fee outage fallback | Returned a *random* distance (1–30km), directly setting the fee charged | Fixed, predictable estimate instead |
| Internal secrets | A microservice's shared internal key was hardcoded in a test script | Loaded from environment, script refuses to run without it |

---

## 8. Known trade-offs / good Q&A answers

- **Delivery fee is still partly client-trusted at checkout** — it's clamped server-side to a $0–$30 range (matching the real fee tiers) but not independently re-verified against the actual address on every order. This was a deliberate scope call: the exposure is small and bounded, versus the unbounded item-pricing issue that *was* fully closed.
- **The four microservices all share one internal key** rather than each having its own per-caller identity system. This is simple and was a fine tradeoff for a project at this stage; a more mature setup might use per-service credentials or mTLS.
- **The bundle-pricing verification checks that a submitted price is *one of the legitimate values* for that bundle size**, rather than fully reconstructing which specific flavours were chosen — full reconstruction isn't reliably possible because flavour IDs can contain hyphens, the same character used to separate parts of the bundle's own ID. This still fully closes the "make up your own price" gap; it just doesn't re-verify the exact flavour composition.
