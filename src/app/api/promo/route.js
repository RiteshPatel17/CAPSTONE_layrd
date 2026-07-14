import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code")?.trim();

  if (!rawCode) {
    return NextResponse.json({ error: "Missing promo code" }, { status: 400 });
  }

  try {
    // Try exact match first (handles case-sensitive codes)
    let { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", rawCode)
      .single();

    // If no exact match, try uppercase (handles case-insensitive codes)
    if (error || !promo) {
      const upperCode = rawCode.toUpperCase();
      const { data: promoUpper, error: upperError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", upperCode)
        .single();
      
      // Only use the uppercase match if the code is NOT case-sensitive
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

    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
    }

    return NextResponse.json({
      code: promo.code,
      type: promo.type, // 'percentage', 'fixed', 'free_delivery'
      value: parseFloat(promo.value),
      min_order_amount: promo.min_order_amount ? parseFloat(promo.min_order_amount) : null
    });
  } catch (err) {
    console.error("[Promo API] Error validating code:", err);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
