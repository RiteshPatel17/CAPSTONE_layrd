// src/app/api/admin/events/route.js
//
// WHY this route exists: getAllEventInquiries()/updateEventInquiryStatus()
// in admin-events.js require getSupabaseAdmin() (service role key), which
// per TRD 7.1 must only run server-side. This bridges the "use client"
// admin/events/page.jsx to that service layer safely. Same shape as
// /api/admin/products/route.js.
//
// TODO (Day 6, per TRD 20 known technical debt): add real admin role
// verification here before allowing reads/writes — same known gap
// flagged in the other admin bridge routes, not fixed today.

import { getAllEventInquiries, updateEventInquiryStatus } from "@/lib/admin-events";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEventDecisionEmail } from "@/lib/resend";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const inquiries = await getAllEventInquiries(supabaseAdmin);
    return Response.json({ inquiries });
  } catch (err) {
    console.error("/api/admin/events GET failed:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH body: { id, status, adminNote }
export async function PATCH(request) {
  const body = await request.json();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const inquiry = await updateEventInquiryStatus(
      supabaseAdmin,
      body.id,
      body.status,
      body.adminNote
    );

    // ── Notify the customer of the decision (non-blocking, per TRD 16) ──
    // WHY we fetch the auth user here instead of adding this to
    // admin-events.js: event_inquiries/profiles has no email column —
    // email only lives in auth.users, reachable only via the admin auth
    // API. This is a notification/presentation concern, not core
    // event-inquiry data logic, so it stays in the route (same separation
    // used in /api/events/route.js for fetching the customer's name).
    supabaseAdmin.auth.admin.getUserById(inquiry.customer_id)
      .then(({ data, error }) => {
        if (error || !data?.user?.email) {
          console.error("/api/admin/events: could not fetch customer email for decision notification:", error);
          return;
        }

        sendEventDecisionEmail({
          to: data.user.email,
          customerName: inquiry.profiles?.full_name || "Customer",
          eventType: inquiry.event_type,
          status: inquiry.status,
          adminNote: inquiry.admin_note,
        }).catch((err) =>
          console.error("/api/admin/events: decision email threw unexpectedly:", err)
        );
      })
      .catch((err) =>
        console.error("/api/admin/events: getUserById threw unexpectedly:", err)
      );

    return Response.json({ inquiry });
  } catch (err) {
    console.error("/api/admin/events PATCH failed:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}