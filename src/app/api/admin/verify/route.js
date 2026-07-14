import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("layrd_admin_session")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "No session" }, { status: 401 });
    }

    // 1. Fetch admin user by session token
    const { data: admin, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("session_token", token)
      .single();

    if (error || !admin) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // 2. Check inactivity (60 minutes)
    const lastActive = new Date(admin.last_active_at).getTime();
    const now = Date.now();
    const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 60 minutes

    if (now - lastActive > INACTIVITY_LIMIT_MS) {
      // Invalidate session
      await supabaseAdmin.from("admin_users").update({ session_token: null }).eq("id", admin.id);
      cookieStore.delete("layrd_admin_session");
      return NextResponse.json({ success: false, error: "Session expired due to inactivity" }, { status: 401 });
    }

    // 3. Update last active timestamp
    await supabaseAdmin
      .from("admin_users")
      .update({ last_active_at: new Date(now).toISOString() })
      .eq("id", admin.id);

    return NextResponse.json({ success: true, identifier: admin.username });
  } catch (err) {
    console.error("[Admin Verify] Error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
