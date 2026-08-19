# Pre-Launch Requirements Tracker

1. **Rate Limiting** — ✅ Done 2026-08-18
   - Added per-IP in-memory rate limiting to the 3 microservices that had none (`delivery-fee-service` 100/min, `notifications-service` 30/min, `promo-code-service` 60/min — `ai-label-service` already had its own, finer-grained per-user version). Also added it to the two main-app routes that trigger real email sends with no prior limiting: `/api/contact` (5/10min/IP) and `/api/events` (5/hour/IP), matching the existing `isRateLimited` pattern already used by `/api/delivery-fee`, `/api/address-autocomplete`, and `/api/business-applications`.
   - Note: rate limiting at the microservice layer is keyed by IP but is a backstop, not the primary defense — requests arrive there proxied through the main app, so the IP seen is normally the main app's own address, not the end customer's. Real per-customer throttling happens at the main-app layer, which sees the actual client IP.
2. **NOTIFICATION_TEST_MODE**
   - `NOTIFICATION_TEST_MODE=true` must be removed or set to `false` in `notifications-service/.env.local` to allow real admin emails to send.
3. **INTERNAL_SERVICE_KEY Rotation** — ✅ Done 2026-08-18
   - Rotated to a new 64-char random hex value, updated identically across all 5 `.env.local` files (main app + 4 microservices). Old key had been exposed in a chat session while debugging Resend, which is what triggered this.
4. **Dead anthropic.js** — ✅ Done 2026-08-18
   - Deleted `layrd-ecommerce/src/lib/anthropic.js`. Confirmed unused first (no imports anywhere in the codebase), then confirmed lint still passes with 0 errors after removal.
5. **Stale Docker Containers on Port 3000**
   - An unrelated old microservices experiment (order-service, product-service, payment-service, etc.) is squatting on port 3000. Must be permanently stopped/removed (`docker rm`) before any future dev session, or document that the main app must always run on a non-3000 port (e.g. 3010) until resolved.
6. **Open CORS on all 4 microservices** — ✅ Done 2026-08-18
   - Removed `cors()` entirely from `ai-label-service`, `delivery-fee-service`, `notifications-service`, `promo-code-service` (was `app.use(cors())` with no origin restriction). These services are only ever called server-to-server by the main app, which proxies every client-facing request — a browser has no legitimate reason to call them directly and can't supply the `x-internal-key` header anyway. With CORS off, a cross-origin browser request now fails at the preflight stage. Verified: all 4 still boot and serve requests correctly (smoke-tested `promo-code-service`), lint/syntax clean on all 4.
