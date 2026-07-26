# Pre-Launch Requirements Tracker

1. **Rate Limiting**
   - Must implement rate limiting on all microservice endpoints before production launch.
2. **NOTIFICATION_TEST_MODE**
   - `NOTIFICATION_TEST_MODE=true` must be removed or set to `false` in `notifications-service/.env.local` to allow real admin emails to send.
3. **INTERNAL_SERVICE_KEY Rotation**
   - Rotate the shared internal service keys before production launch to ensure security.
4. **Dead anthropic.js**
   - Clean up or remove the unused `anthropic.js` file now that Gemini is fully implemented for AI labels.
5. **Stale Docker Containers on Port 3000**
   - An unrelated old microservices experiment (order-service, product-service, payment-service, etc.) is squatting on port 3000. Must be permanently stopped/removed (`docker rm`) before any future dev session, or document that the main app must always run on a non-3000 port (e.g. 3010) until resolved.
