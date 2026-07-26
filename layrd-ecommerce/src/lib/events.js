// src/lib/events.js
//
// WHY this file exists (mirrors src/lib/orders.js's shape, per TRD 4.3
// service layer pattern): all event-inquiry business logic lives here,
// not in the API route or the page component. This is the ONLY file
// that talks to Supabase for event_inquiries.
//
// KEY DIFFERENCE vs orders.js: orders support guest checkout (no identity
// check needed — customer_id can be null). Event inquiries REQUIRE a real,
// verified logged-in user (event_inquiries.customer_id is NOT NULL, and
// the RLS insert policy is `auth.uid() = customer_id`). Since we use the
// service-role client here (which BYPASSES RLS), WE are responsible for
// enforcing that identity check ourselves — RLS won't catch a mistake.

import { supabase, getSupabaseAdmin } from "./supabase";
import { EVENT_MIN_CANS, EVENT_MIN_NOTICE_DAYS } from "./constants";

// ─────────────────────────────────────────────────────────────
// Identity verification
// ─────────────────────────────────────────────────────────────

// Verifies a Supabase access token (sent from the client in the
// Authorization header) and returns the REAL, server-verified user.
// Returns null if the token is missing, expired, or invalid.
//
// WHY we don't just trust a `customerId` field in the request body:
// anyone could put any UUID there. This call round-trips to Supabase
// Auth to confirm the token is genuine and get the user it actually
// belongs to — that's the only trustworthy source of identity here.
export async function verifyUser(accessToken) {
  if (!accessToken) return null;
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}

// ─────────────────────────────────────────────────────────────
// Business-day math (for the 5-business-day minimum notice rule)
// ─────────────────────────────────────────────────────────────

// Adds `count` BUSINESS days (skips Sat/Sun) to today's date and
// returns it at midnight, for a clean date-only comparison.
// WHY not just `+5 days`: a naive +5 calendar days on a Thursday would
// land on a Tuesday, silently only giving ~3 business days of notice.
function addBusinessDays(count) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  let added = 0;
  while (added < count) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) added++;
  }
  return date;
}

// ─────────────────────────────────────────────────────────────
// Validation (mirrors what the /events form already enforces client-side —
// per TRD 16, API routes must NOT trust client-side validation alone)
// ─────────────────────────────────────────────────────────────

export function validateEventInput(body) {
  const { eventType, eventDate, coreCans, limitedCans } = body;

  if (!eventType || typeof eventType !== "string") {
    return "Event type is required.";
  }

  if (!eventDate) {
    return "Event date is required.";
  }

  const parsedDate = new Date(eventDate);
  if (isNaN(parsedDate.getTime())) {
    return "Event date is invalid.";
  }
  parsedDate.setHours(0, 0, 0, 0);

  const earliestAllowed = addBusinessDays(EVENT_MIN_NOTICE_DAYS);
  if (parsedDate < earliestAllowed) {
    return `Event date must be at least ${EVENT_MIN_NOTICE_DAYS} business days from today.`;
  }

  const core = parseInt(coreCans, 10) || 0;
  const limited = parseInt(limitedCans, 10) || 0;

  if (core < 0 || limited < 0) {
    return "Can counts cannot be negative.";
  }

  const totalCans = core + limited;
  if (totalCans < EVENT_MIN_CANS) {
    return `Minimum order is ${EVENT_MIN_CANS} cans (you have ${totalCans}).`;
  }

  return null; // no error — input is valid
}

// ─────────────────────────────────────────────────────────────
// Create the event inquiry (Supabase insert)
// ─────────────────────────────────────────────────────────────

// customerId is the SERVER-VERIFIED user id from verifyUser() —
// never take this from the request body.
export async function createEventInquiry(body, customerId) {
  const admin = getSupabaseAdmin();

  const core = parseInt(body.coreCans, 10) || 0;
  const limited = parseInt(body.limitedCans, 10) || 0;

  const { data, error } = await admin
    .from("event_inquiries")
    .insert({
      customer_id: customerId,
      event_type: body.eventType,
      event_date: body.eventDate,
      guest_count: body.guestCount ? parseInt(body.guestCount, 10) : null,
      core_cans: core,
      limited_cans: limited,
      notes: body.notes || null,
      // status defaults to 'Pending' per the table's DEFAULT — no need to set it
    })
    .select()
    .single();

  if (error) {
    console.error("createEventInquiry: Supabase insert failed:", error);
    return { inquiry: null, error: error.message };
  }

  return { inquiry: data, error: null };
}