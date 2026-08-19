// ─────────────────────────────────────────────
// LÄYRD – API: Address Autocomplete (/api/address-autocomplete)
// Proxies live address suggestions from delivery-fee-service as the
// customer types their delivery address at checkout.
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { isRateLimited } from "../../../lib/rate-limit.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text || text.trim().length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`address-autocomplete:${ip}`, { limit: 40, windowMs: 60 * 1000 })) {
    return NextResponse.json({ suggestions: [] }, { status: 429 });
  }

  try {
    const microserviceUrl = process.env.DELIVERY_SERVICE_URL;
    const internalKey = process.env.INTERNAL_SERVICE_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const msRes = await fetch(`${microserviceUrl}/api/address-autocomplete?text=${encodeURIComponent(text)}`, {
      headers: {
        'x-internal-key': internalKey
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!msRes.ok) {
      throw new Error(`Microservice responded with ${msRes.status}`);
    }

    const data = await msRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.warn("[WARNING] address-autocomplete unreachable:", error.message);
    // Silent fallback — customer can still type their full address manually,
    // and the delivery fee will still calculate once they click away.
    return NextResponse.json({ suggestions: [] });
  }
}