// src/app/api/events/route.js
//
// WHY this route is thin (per TRD 4.3 service layer pattern): all real
// logic lives in src/lib/events.js. This route's job is: verify identity →
// validate input → call createEventInquiry() → notify Adam → shape the
// HTTP response. Same shape as /api/orders/route.js.

import { verifyUser, validateEventInput, createEventInquiry } from "@/lib/events";
import { getProfile } from "@/lib/auth";
import { sendEventInquiryNotification } from "@/lib/resend";

export async function POST(request) {
  // ── Step 1: Verify identity ──────────────────────────────────────
  // WHY we require a real Bearer token here (unlike /api/orders, which
  // allows guest checkout): event_inquiries.customer_id is NOT NULL in
  // the schema, and submitting one is a login-gated action per PRD FR-08.
  // We never trust a customerId sent in the request body — only a
  // server-verified token proves who's actually making this request.
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const user = await verifyUser(token);
  if (!user) {
    return Response.json(
      { error: "You must be logged in to submit an event inquiry." },
      { status: 401 }
    );
  }

  // ── Step 2: Validate input ───────────────────────────────────────
  const body = await request.json();
  const validationError = validateEventInput(body);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  // ── Step 3: Create the inquiry ───────────────────────────────────
  // customerId comes from the VERIFIED token (user.id), never from body.
  const { inquiry, error } = await createEventInquiry(body, user.id);
  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  // ── Step 4: Notify Adam (non-blocking, per TRD 16) ───────────────
  // WHY we fetch the profile here rather than in events.js: events.js is
  // pure data-layer logic for event_inquiries; fetching a profiles row
  // for an email's display text is presentation concern, not core
  // business logic, so it stays in the route (same separation orders.js
  // uses — it doesn't know about email content either).
  const profile = await getProfile(user.id);
  const customerName = profile?.full_name || user.email || "Customer";
  const totalCans = (inquiry.core_cans || 0) + (inquiry.limited_cans || 0);

  // WHY not awaited in a blocking way: per TRD 16, email failures must
  // never block or fail the response the customer is waiting on. The
  // .catch is a safety net in case something unexpected still throws,
  // even though sendEventInquiryNotification already catches internally.
  sendEventInquiryNotification({
    inquiryId: inquiry.id,
    customerName,
    eventDate: inquiry.event_date,
    canCount: totalCans,
  }).catch((err) =>
    console.error("/api/events: notification email threw unexpectedly:", err)
  );

  return Response.json(
    { success: true, inquiryId: inquiry.id },
    { status: 201 }
  );
}

export async function GET(request) {
  // TODO (next step — Admin Events page): verify admin role via session,
  // then return all event inquiries from Supabase for /admin/events.
  return Response.json({ message: "TODO: Return event inquiries from Supabase (admin only)" });
}