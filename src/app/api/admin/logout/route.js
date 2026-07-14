import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("layrd_admin_session")?.value;

    if (token) {
      // Invalidate in database
      await supabaseAdmin
        .from("admin_users")
        .update({ session_token: null })
        .eq("session_token", token);
      
      // Delete cookie
      cookieStore.delete("layrd_admin_session");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Logout] Error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
