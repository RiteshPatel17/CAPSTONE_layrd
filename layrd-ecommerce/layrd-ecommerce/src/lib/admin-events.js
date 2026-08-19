import { supabase } from './supabase';

// Fetch a logged-in customer's OWN event inquiries.
// WHY the plain `supabase` client is fine here (not supabaseAdmin): the
// "own read" RLS policy on event_inquiries (auth.uid() = customer_id)
// naturally restricts this to only the current user's rows — no need for
// the service role. Kept here for potential future use on a customer
// account/order-history page; not used by the admin panel.
export async function getMyEventInquiries() {
  const { data, error } = await supabase
    .from('event_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyEventInquiries error:', error);
    return [];
  }
  return data;
}

// --- ADMIN-ONLY FUNCTIONS BELOW ---
// Same pattern as admin-products.js: these require the SERVICE ROLE client
// (bypasses RLS), because the "own read" RLS policy on event_inquiries
// would otherwise hide every customer's inquiry from Adam (he has no
// inquiries of his own — he needs to see everyone's). These must ONLY
// ever be called from Next.js API routes, never from a "use client"
// component — hence supabaseAdmin is passed in explicitly, not imported
// directly here, matching admin-products.js's convention.

// Fetch every event inquiry, for the admin dashboard.
// WHY the embedded `profiles` select: event_inquiries only stores
// customer_id (a UUID) — there's no denormalized customer name/phone the
// way orders.js stores customer_name/email directly. Since customer_id is
// a FK to profiles(id), Supabase lets us embed the related profile row in
// the same query (works here because supabaseAdmin bypasses RLS — a plain
// client would be blocked by profiles' "own row" policy for any profile
// that isn't the currently logged-in user).
export async function getAllEventInquiries(supabaseAdmin) {
  const { data, error } = await supabaseAdmin
    .from('event_inquiries')
    .select('*, profiles(full_name, phone)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Approve or reject an inquiry, with Adam's optional note.
// WHY a single function for both instead of separate approve()/reject():
// the only difference is which status string gets written — keeping this
// as one function with a `status` param avoids duplicating the same
// Supabase update call twice for no real benefit.
export async function updateEventInquiryStatus(supabaseAdmin, id, status, adminNote) {
  if (!["Approved", "Rejected"].includes(status)) {
    throw new Error(`Invalid status "${status}" — must be "Approved" or "Rejected".`);
  }

  const { data, error } = await supabaseAdmin
    .from('event_inquiries')
    .update({ status, admin_note: adminNote || null })
    .eq('id', id)
    .select('*, profiles(full_name, phone)')
    .single();

  if (error) throw error;
  return data;
}