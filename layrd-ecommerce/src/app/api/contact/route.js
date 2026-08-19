// ─────────────────────────────────────────────
// LÄYRD – API: Contact form (/api/contact)
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { isRateLimited } from "../../../lib/rate-limit.js";
import { notifyAsync } from "../../../lib/notify.js";


export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many requests, please slow down." }, { status: 429 });
  }

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
  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("contact_messages")
    .insert([{
      name,
      email,
      subject: subject || null,
      message,
      is_read: false
    }]);

  if (error) {
    console.error("[API Contact] Failed to save message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // Fire-and-forget, matching the rest of the app: a dead notifications-service
  // should never fail the customer-facing "message received" response. Was
  // previously awaited in a try/catch that still wouldn't have caught a
  // non-2xx response (fetch() only rejects on network-level errors) — see
  // notify.js for why that matters.
  notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/contact`, {
    name, email, subject, message
  }, { label: "Contact" });

  return NextResponse.json({ success: true, message: "Message received. We'll be in touch soon!" });
}
