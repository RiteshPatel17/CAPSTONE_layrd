import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { BUSINESS_CODE_EXPIRY_HOURS } from "../../../lib/constants.js";

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "LAYRD-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request) {
  // Admin only
  try {
    const { businessName } = await request.json();

    if (!businessName) {
      return NextResponse.json({ error: "Missing business name" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const code = generateCode();
    
    const expiryHours = BUSINESS_CODE_EXPIRY_HOURS || 48;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const { data, error } = await supabase
      .from("business_codes")
      .insert([{
        code,
        business_name: businessName,
        is_used: false,
        expires_at: expiresAt.toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error("[API Business Codes] Insert error:", error);
      return NextResponse.json({ error: error.message || "Failed to generate code" }, { status: 500 });
    }

    return NextResponse.json({ success: true, code: data }, { status: 201 });
  } catch (error) {
    console.error("[API Business Codes] Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  // Admin only
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("business_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
