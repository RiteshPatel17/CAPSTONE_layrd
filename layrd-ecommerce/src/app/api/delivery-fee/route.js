// ─────────────────────────────────────────────
// LÄYRD – API: Delivery Fee (/api/delivery-fee)
// Calculates delivery fee based on customer address, or lat/lon
// coordinates when the address was picked from autocomplete.
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { getDeliveryDistance as calculateDeliveryFeeLocalFallback } from "../../../lib/maps.js";
import { getDeliveryFee } from "../../../lib/pricing.js";
import { isRateLimited } from "../../../lib/rate-limit.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const label = searchParams.get("label");

  if (!address && !(lat && lon)) {
    return NextResponse.json({ error: "Address or coordinates are required" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`delivery-fee:${ip}`, { limit: 20, windowMs: 60 * 1000 })) {
    return NextResponse.json({ error: "Too many requests, please slow down." }, { status: 429 });
  }

  try {
    const microserviceUrl = process.env.DELIVERY_SERVICE_URL;
    const internalKey = process.env.INTERNAL_SERVICE_KEY;
    let useFallback = false;

    const qs = new URLSearchParams();
    if (address) qs.set("address", address);
    if (lat && lon) {
      qs.set("lat", lat);
      qs.set("lon", lon);
    }
    if (label) qs.set("label", label);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const msRes = await fetch(`${microserviceUrl}/api/delivery-fee?${qs.toString()}`, {
        headers: {
          'x-internal-key': internalKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!msRes.ok) {
        throw new Error(`Microservice responded with ${msRes.status}`);
      }

      const msData = await msRes.json();
      return NextResponse.json(msData);
    } catch (msError) {
      console.warn(`[WARNING] delivery-fee-service unreachable, using local fallback. Error: ${msError.message}`);
      useFallback = true;
    }

    if (useFallback) {
      // Local fallback only understands full address text, so use whichever
      // text we have (typed address, or the label of the selected suggestion).
      const fallbackAddress = address || label || "";
      const distanceData = await calculateDeliveryFeeLocalFallback(fallbackAddress);

      if (!distanceData.isWithinCalgary) {
        return NextResponse.json({
          isWithinCalgary: false,
          distanceKm: distanceData.distanceKm,
          fee: 0,
          message: distanceData.message || "Outside Calgary – pickup only",
        });
      }

      const fee = getDeliveryFee(distanceData.distanceKm);

      return NextResponse.json({
        isWithinCalgary: true,
        distanceKm: distanceData.distanceKm,
        durationMin: distanceData.durationMin,
        fee,
        isMock: distanceData.isMock || false,
      });
    }

  } catch (error) {
    console.error("Delivery fee error:", error);
    return NextResponse.json({ error: "Failed to calculate delivery fee" }, { status: 500 });
  }
}