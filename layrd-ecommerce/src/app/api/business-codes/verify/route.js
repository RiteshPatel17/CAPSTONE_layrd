import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase.js";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Missing verification code." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const supabase = getSupabaseAdmin();
    // Check if code exists, is unused, and not expired
    const { data: bCode, error } = await supabase
      .from("business_codes")
      .select("*")
      .eq("code", cleanCode)
      .single();

    if (error || !bCode) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    if (bCode.is_used) {
      return NextResponse.json({ error: "This code has already been used." }, { status: 400 });
    }

    const now = new Date();
    const expiry = new Date(bCode.expires_at);
    if (now > expiry) {
      return NextResponse.json({ error: "This code has expired." }, { status: 400 });
    }

    // Mark as used
    await supabase
      .from("business_codes")
      .update({ is_used: true })
      .eq("id", bCode.id);

    // Give them a cookie to mark them as a wholesale session (e.g. valid for 30 days)
    const cookieStore = await cookies();
    cookieStore.set("layrd_wholesale_session", bCode.business_name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({ success: true, businessName: bCode.business_name });
  } catch (err) {
    console.error("[Verify Code Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
