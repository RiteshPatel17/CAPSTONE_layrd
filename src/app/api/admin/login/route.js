import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: "Identifier and password required" }, { status: 400 });
    }

    // 1. Fetch admin user by username OR email
    const { data: admin, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .single();

    if (error || !admin) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // 2. Simple password check
    if (admin.password !== password) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Generate Session Token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // 4. Save token and last active timestamp to DB
    const { error: updateError } = await supabaseAdmin
      .from("admin_users")
      .update({
        session_token: sessionToken,
        last_active_at: new Date().toISOString()
      })
      .eq("id", admin.id);

    if (updateError) {
      console.error("[Admin Login] DB Update Error:", JSON.stringify(updateError));
      console.error("[Admin Login] Hint: Have you run 'ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_token TEXT, ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;' in Supabase?");
      return NextResponse.json({ success: false, error: `Failed to establish session: ${updateError.message}` }, { status: 500 });
    }

    // 5. Set HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set("layrd_admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours max lifetime of the cookie, backend checks 60 min inactivity
      path: "/",
    });

    return NextResponse.json({ success: true, identifier: admin.username });
  } catch (err) {
    console.error("[Admin Login] Error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
