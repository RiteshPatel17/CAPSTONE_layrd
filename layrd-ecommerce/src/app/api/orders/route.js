// ─────────────────────────────────────────────
// LÄYRD – API: Orders (/api/orders)
// GET: admin gets all orders; a logged-in customer gets only their own.
// Order creation happens in /api/checkout, not here.
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { verifyAdminRequest } from "../../../lib/admin-server-auth.js";

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    const adminUser = await verifyAdminRequest(request);

    let query = supabase
      .from("orders")
      .select(`*, order_items (*)`)
      .order("created_at", { ascending: false });

    if (!adminUser) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split('Bearer ')[1];
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API Orders] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
