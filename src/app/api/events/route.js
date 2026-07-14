// ─────────────────────────────────────────────
// LÄYRD – API: Events/Private Catering (/api/events)
// ─────────────────────────────────────────────
import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EVENT_MIN_CANS } from "../../../lib/constants.js";
import { sendEventInquiryNotification } from "../../../lib/resend.js";
import { getSupabaseAdmin } from "../../../lib/supabase.js";

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split('Bearer ')[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { eventType, eventDate, guestCount, coreCans, limitedCans, notes } = body;

  const totalCans = (parseInt(coreCans) || 0) + (parseInt(limitedCans) || 0);
  if (totalCans < EVENT_MIN_CANS) {
    return NextResponse.json({ error: `Minimum ${EVENT_MIN_CANS} cans required for events` }, { status: 400 });
  }

  const { data: inquiryData, error: inquiryError } = await supabase
    .from("event_inquiries")
    .insert([{
      customer_id: user.id,
      event_type: eventType,
      event_date: eventDate,
      guest_count: parseInt(guestCount) || null,
      core_cans: parseInt(coreCans) || 0,
      limited_cans: parseInt(limitedCans) || 0,
      notes: notes || null,
      status: "Pending"
    }])
    .select()
    .single();

  if (inquiryError) {
    console.error("[API Events] Failed to create inquiry:", inquiryError);
    return NextResponse.json({ error: inquiryError.message || "Failed to submit inquiry", details: inquiryError }, { status: 500 });
  }

  const inquiryId = inquiryData.inquiry_number;

  try {
    await sendEventInquiryNotification({
      inquiryId,
      customerName: user.email,
      eventDate,
      canCount: totalCans,
    });
  } catch (emailErr) {
    console.error("[API Events] Email error:", emailErr);
  }

  return NextResponse.json({ success: true, inquiryId, message: "Inquiry submitted. Adam will review and respond within 24 hours." }, { status: 201 });
}

export async function GET(request) {
  // Admin only – return all event inquiries from Supabase
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("event_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API Events] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch event inquiries" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  // Admin only: Update event inquiry status
  const cookieStore = await cookies();
  const token = cookieStore.get("layrd_admin_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized - No admin session" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Verify admin session from DB
  const { data: admin, error: adminErr } = await supabase
    .from("admin_users")
    .select("id")
    .eq("session_token", token)
    .single();

  if (adminErr || !admin) {
    return NextResponse.json({ error: "Unauthorized - Invalid admin session" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("event_inquiries")
      .update({ status: status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[API Events] Update error:", error);
      return NextResponse.json({ error: error.message || "Failed to update event inquiry" }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiry: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
