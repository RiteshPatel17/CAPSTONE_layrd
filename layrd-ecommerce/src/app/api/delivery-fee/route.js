// src/app/api/delivery-fee/route.js
//
// WHY this route exists (per TRD 12, PRD FR-05, API spec):
// /checkout needs to convert a customer-typed address into a real distance
// and delivery fee. The actual distance/geocoding logic lives in maps.js,
// and fee-tier math lives in pricing.js (per TRD 4.3 service layer pattern)
// — this route's ONLY job is to call both and shape the response into what
// checkout/page.jsx expects: { distanceKm, fee, isWithinCalgary, isMock? }

import { getDeliveryDistance } from "@/lib/maps";
import { getDeliveryFee } from "@/lib/pricing";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  // WHY validate here rather than trusting the client: even though
  // checkout/page.jsx already checks `!address.trim()` before calling this,
  // API routes should never assume the caller validated correctly — someone
  // could hit this endpoint directly with no address param.
  if (!address || !address.trim()) {
    return Response.json(
      { error: "Missing required 'address' query parameter" },
      { status: 400 }
    );
  }

  try {
    // getDeliveryDistance() already has its OWN internal try/catch and mock
    // fallback (per TRD 11.3) — if OpenRouteService fails or the address
    // can't be geocoded, it returns the mock 8km result instead of throwing.
    // So this call itself should essentially never throw.
    const { distanceKm, durationMin, isWithinCalgary, isMock } =
      await getDeliveryDistance(address);

    // getDeliveryFee() reads from pricing.js's in-memory settings cache
    // (loaded once via loadPricingSettings() in Providers.jsx on app start)
    const fee = getDeliveryFee(distanceKm);

    return Response.json({
      distanceKm,
      durationMin,
      fee,
      isWithinCalgary,
      isMock: isMock || false,
    });
  } catch (err) {
    // WHY this catch still exists despite maps.js already having its own:
    // defensive layering — if something unexpected happens (e.g. pricing.js
    // settings cache is somehow in a bad state), we still don't want to
    // send a raw 500 with a stack trace to the client. Log server-side,
    // return a clean error to the frontend instead.
    console.error("/api/delivery-fee: unexpected error:", err.message);
    return Response.json(
      { error: "Failed to calculate delivery fee" },
      { status: 500 }
    );
  }
}