// ─────────────────────────────────────────────
// LÄYRD – API: Contact form (/api/contact)
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase.js";


export async function POST(request) {
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

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

  try {
    await fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_KEY },
      body: JSON.stringify({ name, email, subject, message })
    });
  } catch (err) {
    console.error("[API Contact] Email error:", err);
  }

  return NextResponse.json({ success: true, message: "Message received. We'll be in touch soon!" });
}
