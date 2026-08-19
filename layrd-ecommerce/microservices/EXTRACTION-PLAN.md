# LÄYRD E-Commerce Microservices Extraction Plan

## Architecture Decisions
- **Microservices Framework:** Standardized on Express (not Next.js) for every microservice (delivery-fee-service, promo-code-service, notifications-service, and ai-label-service). These are pure JSON API services with no React/Next.js-specific features (no SSR, file-based page routing, or client/server components). Express is lighter, faster to cold-start, and keeps all microservices consistent with each other. This includes services using Supabase JWT and Gemini SDKs.
- **Proxy Pattern:** The main Next.js app's local API routes act as secure server-side proxies to the microservices. This prevents exposing `INTERNAL_SERVICE_KEY` in the client browser bundle.

## Phase 1: delivery-fee-service
STATUS: DONE

**Objective**: Extract delivery fee calculation (Maps API/fallback logic) into a pure function microservice.

**Environment Variables Moving**: 
- `OPENROUTESERVICE_API_KEY` (and the commented `#GOOGLE_MAPS_API_KEY`)
  - Currently in: `.env.local`, `src/lib/maps.js`
- `INTERNAL_SERVICE_KEY`
  - Must be identical in main app's `.env.local` and microservice's `.env.local`
- New var needed in main app: `DELIVERY_SERVICE_URL`

**Main App Files Touched**:
- `src/lib/maps.js`
- `src/app/api/delivery-fee/route.js`
- `src/app/checkout/page.jsx` *(Note: Intentionally unmodified. The local Next.js API route acts as a secure server-side proxy to the microservice to prevent exposing INTERNAL_SERVICE_KEY in the client browser bundle.)*
- `.env.local`

**Execution Steps**:
- [x] 1. COPY `src/lib/maps.js` and routing logic to `/microservices/delivery-fee-service` (at project root). Generate `INTERNAL_SERVICE_KEY` and add to both `.env.local` files.
- [x] 2. BUILD the microservice independently and test with manual curl/fetch to verify expected shape. Verify that the `x-internal-key` header is checked and rejects missing/mismatched keys with 401.
- [x] 3. UPDATE main app's cart/checkout calling code to call `DELIVERY_SERVICE_URL` instead of local logic.
- [x] 4. TEST the main app end-to-end for delivery fee calculation.
- [x] 5. KEEP local fallback function (`calculateDeliveryFeeLocalFallback`), implement try/catch + timeout wrapper (2.5s) around microservice call. On failure, log warning and use fallback. Test failure path by pointing service URL at an invalid port to confirm fallback triggers correctly.
- [x] 6. RUN `npm run build` on the main app to ensure successful compilation.

---

## Phase 2: promo-code-service
STATUS: DONE

**Objective**: Extract promo code validation and times_used increment logic. Admin CRUD stays in main app.

**Environment Variables Moving**:
- `INTERNAL_SERVICE_KEY`
  - Must be identical in main app's `.env.local` and microservice's `.env.local`
- New var needed in main app: `PROMO_SERVICE_URL`

**Main App Files Touched**:
- `src/lib/pricing.js` (validation logic)
- `src/app/api/promo/route.js`
- `src/app/checkout/page.jsx`
- `src/app/cart/page.jsx`
- `src/components/cart/CartSidebar.jsx`
- `.env.local`

**Execution Steps**:
- [x] 1. COPY validation logic and Supabase RPC creation (atomic increment of `times_used`) into `/microservices/promo-code-service`. Generate `INTERNAL_SERVICE_KEY` and add to both `.env.local` files. Write the Postgres RPC via Supabase SQL editor and save the SQL into a version-controlled migration file at `/microservices/promo-code-service/migrations/001_increment_promo_usage.sql` with a descriptive comment header.
- [x] 2. BUILD the microservice independently and test with manual curl/fetch to verify expected shape (`{ valid, type, value, discount, message }`). Verify that the `x-internal-key` header is checked and rejects missing/mismatched keys with 401.
- [x] 3. UPDATE main app's calling code (cart/checkout) to call `PROMO_SERVICE_URL` instead of direct DB lookup. (Keep `getCartTotals` in `pricing.js`).
- [x] 4. TEST the main app end-to-end for promo code application.
- [x] 5. KEEP local fallback function (`validatePromoLocalFallback`), implement try/catch + timeout wrapper (2.5s) around microservice call. On failure, log warning and use fallback. Test failure path by pointing service URL at an invalid port to confirm fallback triggers correctly.
- [x] 6. RUN `npm run build` on the main app to ensure successful compilation.

*(Note: During Phase 2 testing, a pre-existing production bug was found and fixed in `api/stripe-webhook/route.js`. The original webhook was using the `anon` Supabase client instead of the admin service role, meaning Stripe orders were never actually being marked as "Paid" due to RLS blocking the update, and it violated a schema constraint by trying to set `payment_status: "paid"` instead of `"Paid"`. This has been fixed.)*

---

## Phase 3: notifications-service
STATUS: DONE

**Objective**: Extract email notification sending logic and HTML templates.

**Environment Variables Moving**:
- `RESEND_API_KEY`
  - Currently in: `.env.local`, `src/lib/resend.js`
- `ADMIN_EMAIL`
  - Currently in: `.env.local`, `src/lib/resend.js`
- `INTERNAL_SERVICE_KEY`
  - Must be identical in main app's `.env.local` and microservice's `.env.local`
- New var needed in main app: `NOTIFICATIONS_SERVICE_URL`

**Main App Files Touched**:
- `src/lib/resend.js`
- `src/app/api/stripe-webhook/route.js` (Call site: order confirmation, admin new order)
- `src/app/api/orders/route.js` (Call site: order confirmation, admin new order)
- `src/app/api/checkout/route.js` (Call site: order confirmation)
- `src/app/api/events/route.js` (Call site: event inquiry)
- `src/app/api/contact/route.js` (Call site: contact form)
- `src/app/api/ai-labels/route.js` (Call site: missing label_approved/label_revision emails to be added)
- `.env.local`

**Execution Steps**:
- [x] 1. COPY HTML templates and functions from `src/lib/resend.js` to `/microservices/notifications-service`. (Create missing templates for event_approved/rejected and label_approved/revision). Generate `INTERNAL_SERVICE_KEY` and add to both `.env.local` files.
- [x] 2. BUILD the microservice independently and test with manual curl/fetch for each type. Verify that the `x-internal-key` header is checked and rejects missing/mismatched keys with 401.
- [x] 3. UPDATE main app's call sites to fetch POST to `NOTIFICATIONS_SERVICE_URL` (non-blocking try/catch). Rename `resend.js` to `.bak`. Update call sites one at a time and test.
- [x] 4. TEST the main app end-to-end (checkout, event inquiry, contact form, ai labels) to verify email triggers.
- [x] 5. DELETE the deprecated `resend.js.bak` and remove `RESEND_API_KEY`, `ADMIN_EMAIL` from main app's `.env.local`.
- [x] 6. RUN `npm run build` on the main app to ensure successful compilation.

---

## Phase 4: ai-label-service
STATUS: DONE *(Confirmed via code inspection after session loss)*

**Objective**: Extract Gemini label generation and submission logic.

**Environment Variables Moving**:
- `GEMINI_API_KEY`
  - Currently in: `.env.local`, `src/lib/gemini.js`
- `INTERNAL_SERVICE_KEY`
  - Must be identical in main app's `.env.local` and microservice's `.env.local`
- New var needed in main app: `AI_LABEL_SERVICE_URL`

**Main App Files Touched**:
- `src/lib/gemini.js`
- `src/app/api/ai-labels/route.js`
- `src/app/ai-label-studio/page.jsx`
- `.env.local`

**Execution Steps**:
- [x] 1. COPY `gemini.js`, `api/ai-labels/route.js` and prompt/fallback logic into `/microservices/ai-label-service`. Include Supabase JWT verification logic. Generate `INTERNAL_SERVICE_KEY` and add to both `.env.local` files.
- [x] 2. BUILD the microservice independently and test with manual curl/fetch passing a valid Supabase JWT. Verify that the `x-internal-key` header is checked and rejects missing/mismatched keys with 401.
- [x] 3. UPDATE main app's AI label studio page (or fetch calls) to call `AI_LABEL_SERVICE_URL` with the Supabase session's access token as a Bearer token. Rename old routes to `.bak`.
- [x] 4. TEST the main app end-to-end for label generation and submission. Ensure no errors shown to customers.
- [x] 5. DELETE the deprecated `.bak` files and remove `GEMINI_API_KEY` fully from the main app.
- [x] 6. RUN `npm run build` on the main app to ensure successful compilation.

---

## Phase 5: wholesale-service (ON STANDBY)
STATUS: NOT STARTED *(Build ONLY if explicitly requested)*

**Objective**: Extract wholesale applications, business code verification, and tiered pricing.

**Environment Variables Moving**:
- `INTERNAL_SERVICE_KEY`
  - Must be identical in main app's `.env.local` and microservice's `.env.local`
- New var needed in main app: `WHOLESALE_SERVICE_URL`

**Main App Files Touched**:
- `src/lib/pricing.js` (wholesale pricing logic)
- Relevant business application, code verification, checkout pricing pages.

**Execution Steps**:
- [ ] 1. COPY relevant business logic and Supabase service-role access (to update `profiles.role`) into `/microservices/wholesale-service`. Generate `INTERNAL_SERVICE_KEY` and add to both `.env.local` files.
- [ ] 2. BUILD the microservice independently and test with manual curl/fetch. Verify that the `x-internal-key` header is checked and rejects missing/mismatched keys with 401.
- [ ] 3. UPDATE main app to call `GET /api/wholesale-price`, `POST /api/apply`, `POST /api/verify-code`. Keep original files as `.bak`.
- [ ] 4. TEST the main app end-to-end under normal and slow-network conditions.
- [ ] 5. DELETE the deprecated `.bak` files.
- [ ] 6. RUN `npm run build` on the main app to ensure successful compilation.

---

## Final Verification
STATUS: NOT STARTED

- [ ] RUN `npm run build` on the main app.
- [ ] Manually click through: shop -> cart -> checkout with delivery fee + promo code -> confirmation.
- [ ] Check notification logs.
- [ ] Complete event inquiry flow.
- [ ] Complete AI label studio flow.
- [ ] (If Phase 5 done) Complete wholesale flow.
- [ ] Write `/microservices/README.md` documenting each service (function, env vars, ports e.g., 3001-3005).

---

## Post-Extraction Bug Fixes
During manual post-extraction verification, the following bugs were found and resolved:

1. **Event inquiry submission returning 400 with "Minimum 50 cans"**
   - **Root Cause**: A stale Docker container (from an unrelated old microservices experiment) was squatting on port 3000, intercepting requests meant for the live Next.js dev server.
   - **Fix Applied**: No code fix needed. Resolved by explicitly running the Next.js dev server on a different port (`npm run dev -p 3010`) to bypass Docker.

2. **AI Label Studio "Generate" button failing with 400 "eventInquiryId is required"**
   - **Root Cause**: The frontend payload in `src/app/ai-label-studio/page.jsx`'s `handleGenerate()` function omitted `eventInquiryId`, which the `ai-label-service` strictly requires for security validation.
   - **Fix Applied**: Added `eventInquiryId: selectedEventId` and `action: "generate"` to the request payload in `page.jsx`.

3. **Admin "Approve Label" failing with 500 "Could not find the updated_at column"**
   - **Root Cause**: The `ai_label_requests` table was missing the `updated_at` column referenced by the `ai-label-service` PATCH handler.
   - **Fix Applied**: Created SQL migration `/microservices/ai-label-service/migrations/001_add_updated_at.sql` to add `updated_at TIMESTAMPTZ DEFAULT NOW()` to the table.
