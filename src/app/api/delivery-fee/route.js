// ─────────────────────────────────────────────
// LÄYRD – API: Delivery Fee (/api/delivery-fee)
// Calculates delivery fee based on customer address
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { getDeliveryDistance as calculateDeliveryFeeLocalFallback } from "../../../lib/maps.js";
import { getDeliveryFee } from "../../../lib/pricing.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const microserviceUrl = process.env.DELIVERY_SERVICE_URL;
    const internalKey = process.env.INTERNAL_SERVICE_KEY;
    let useFallback = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const msRes = await fetch(`${microserviceUrl}/api/delivery-fee?address=${encodeURIComponent(address)}`, {
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
      const distanceData = await calculateDeliveryFeeLocalFallback(address);

      if (!distanceData.isWithinCalgary) {
        return NextResponse.json({
          isWithinCalgary: false,
          distanceKm: distanceData.distanceKm,
          fee: 0,
          message: "Outside Calgary – pickup only",
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
