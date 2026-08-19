import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase.js";
import { verifyAdminRequest } from "../../../../lib/admin-server-auth.js";

export async function GET(request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
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
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { code, type, value, min_order_amount, max_uses, expires_at } = body;

    const { data, error } = await supabase
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
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    const { id, is_active } = await request.json();

    const { data, error } = await supabase
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
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    const { id } = await request.json();

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}