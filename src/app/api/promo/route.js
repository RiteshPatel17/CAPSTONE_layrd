import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code")?.trim();

  if (!rawCode) {
    return NextResponse.json({ error: "Missing promo code" }, { status: 400 });
  }

  try {
    const microserviceUrl = process.env.PROMO_SERVICE_URL;
    const internalKey = process.env.INTERNAL_SERVICE_KEY;
    let useFallback = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const msRes = await fetch(`${microserviceUrl}/api/promo?code=${encodeURIComponent(rawCode)}`, {
        headers: {
          'x-internal-key': internalKey
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!msRes.ok) {
        // If 404 or 400, pass it through directly, it's a valid validation failure
        if (msRes.status === 404 || msRes.status === 400) {
           const msData = await msRes.json();
           return NextResponse.json(msData, { status: msRes.status });
        }
        throw new Error(`Microservice responded with ${msRes.status}`);
      }

      const msData = await msRes.json();
      return NextResponse.json(msData);
    } catch (msError) {
      console.warn(`[WARNING] promo-code-service unreachable, using local fallback. Error: ${msError.message}`);
      useFallback = true;
    }

    if (useFallback) {
      // Try exact match first
      let { data: promo, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", rawCode)
        .single();

      // If no exact match, try uppercase (case-insensitive)
      if (error || !promo) {
        const upperCode = rawCode.toUpperCase();
        const { data: promoUpper, error: upperError } = await supabase
          .from("promo_codes")
          .select("*")
          .eq("code", upperCode)
          .single();
        
        if (!upperError && promoUpper && !promoUpper.case_sensitive) {
          promo = promoUpper;
          error = null;
        }
      }

      if (error || !promo) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
      }

      if (!promo.is_active) {
        return NextResponse.json({ error: "Promo code is no longer active" }, { status: 400 });
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
      }

      if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
        return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
      }

      return NextResponse.json({
        valid: true,
        code: promo.code,
        type: promo.type,
        value: parseFloat(promo.value),
        discount: parseFloat(promo.value),
        min_order_amount: promo.min_order_amount ? parseFloat(promo.min_order_amount) : null,
        message: "Valid promo code"
      });
    }

  } catch (err) {
    console.error("[Promo API] Error validating code:", err);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
