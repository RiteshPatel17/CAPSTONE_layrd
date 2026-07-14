import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to verify admin session
async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("layrd_admin_session")?.value;
  if (!token) return null;
  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("session_token", token)
    .single();
  return admin;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, promoCodes: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { code, type, value, min_order_amount, max_uses, expires_at } = body;

    const { data, error } = await supabaseAdmin
      .from("promo_codes")
      .insert([{
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        min_order_amount: min_order_amount ? parseFloat(min_order_amount) : null,
        max_uses: max_uses ? parseInt(max_uses, 10) : null,
        expires_at: expires_at || null,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, promoCode: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, is_active } = await request.json();

    const { data, error } = await supabaseAdmin
      .from("promo_codes")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, promoCode: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();

    const { error } = await supabaseAdmin
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
