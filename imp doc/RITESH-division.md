# LÄYRD Capstone — Your Part: Backend + Infrastructure

Hey Ritesh — this is your file list and talking points for the presentation. You own the API layer, auth/security, payments, the database, three of the four microservices, and project infra/config.

## Your files

### API routes
```
src/app/api/checkout/route.js
src/app/api/stripe-webhook/route.js
src/app/api/orders/route.js
src/app/api/products/route.js
src/app/api/promo/route.js
src/app/api/contact/route.js
src/app/api/events/route.js
src/app/api/settings/route.js
src/app/api/site-images/route.js
src/app/api/delivery-fee/route.js
src/app/api/address-autocomplete/route.js
src/app/api/business-applications/route.js
src/app/api/business-codes/route.js
src/app/api/business-codes/verify/route.js
src/app/api/admin/dashboard/route.js
src/app/api/admin/contact-messages/route.js
src/app/api/admin/promo-codes/route.js
src/app/api/admin/upload-product-image/route.js
src/app/api/admin/wholesale/route.js
```

### Core backend logic
```
src/lib/auth.js
src/lib/admin-server-auth.js   (joint w/ Shivang — see below)
src/lib/stripe.js
src/lib/supabase.js
src/lib/pricing.js
src/lib/product-mapper.js
src/lib/product-options.js
src/lib/order-items-options.js
src/lib/inventory-options.js
src/lib/settings-helpers.js
src/lib/rate-limit.js
src/lib/constants.js
src/lib/contact-messages.js
src/lib/maps.js
src/lib/wholesale-applications.js
src/lib/wholesale-application-client.js
```

### Database
```
supabase/schema.sql
supabase/migrations/20260722_wholesale_applications_transition.sql
supabase/migrations/20260723_wholesale_contact_siteimages.sql
supabase/migrations/20260724_orders_user_id.sql
supabase/migrations/20260724_wholesale_hero_site_image.sql
supabase/migrations/20260725_event_deposit_payment.sql
```

### Other microservices
```
microservices/delivery-fee-service/  (index.js, package.json)
microservices/promo-code-service/    (index.js, find-promo.js, test-webhook.js, package.json, migrations/*.sql ×2)
microservices/notifications-service/ (index.js, test-endpoints.js, package.json)
microservices/README.md
microservices/EXTRACTION-PLAN.md
microservices/PRE-LAUNCH-REQUIREMENTS.md
```

### Project config/infra (shared setup — you present it)
```
package.json, package-lock.json
next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs, next-env.d.ts
README.md, AGENTS.md, CLAUDE.md, PHASES.md, .gitignore
```

**Total: 46 files** — note `schema.json` was dropped from anyone's list; it's essentially empty/broken (10 bytes of near-nothing), not real content. Fix or delete it before submission so it doesn't raise a question nobody can answer.

### Joint file (with Shivang)
```
src/lib/admin-server-auth.js
```
You own the actual `requireAdmin()` / `verifyAdminRequest()` logic here — Shivang presents how the admin UI calls it. You should be ready to explain this file in depth since it's the core of admin access control.

---

## Talking points for your section (this is the meatiest part — you have the most defensible security story)

- **One login system, not two**: there used to be a separate admin login with its own cookie/session table. That's gone — now an "admin" is just a Supabase Auth user whose `profiles.role = "admin"`. Explain `getAuthHeader()` → Bearer token → `supabase.auth.getUser(token)` → role check.
- **Checkout is your strongest example — walk through it in full**:
  1. Client submits cart + totals for *display only*.
  2. Server re-derives every price from the database/fixed definitions — nothing from the client is trusted for the actual charge.
  3. Promo code is re-validated server-side (active, not expired, under usage cap, meets minimum order — this check didn't originally exist).
  4. Stripe Checkout Session is created with **one line item** equal to the server-verified total (not per-item) — deliberate, because Stripe can't represent a negative discount line, and this guarantees the actual charge matches `order.total` exactly.
  5. Stripe webhook (`/api/stripe-webhook`) — not the redirect — is what actually marks payment as `Paid`. It's idempotent and signature-verified.
- **A real bug you fixed**: `verifyStripeWebhook()` used to silently return a fake empty event if `STRIPE_WEBHOOK_SECRET` wasn't configured — meaning a real payment could succeed on Stripe's side while your app never found out, and the order stayed stuck "Unpaid" with no visible error. Now it throws loudly instead. This is a great "we found and fixed a real production risk" story.
- **Microservice pattern**: browser never talks to a microservice directly — every call goes browser → Next.js API route (adds a shared `x-internal-key` header) → microservice. This keeps microservice URLs and the shared secret entirely server-side.
- **Fallback logic**: `delivery-fee-service` and `promo-code-service` both have a local fallback copy of their core logic in the main app — if the microservice times out, checkout still completes using the local copy instead of failing the customer.
- **Known trade-off, good for Q&A**: delivery fee is clamped server-side to a $0–$30 range but not independently re-verified against the actual address on every order — a deliberate, bounded scope call, unlike the item-pricing gap which is fully closed.

## If asked "who built X" and it's not on your list
Storefront pages are Aaryan's. Admin panel UI and both AI studio pages are Shivang's — but the Server Actions those pages call (`admin-products.js` etc.) are your joint work with Shivang, so you may get pulled into that conversation too.
