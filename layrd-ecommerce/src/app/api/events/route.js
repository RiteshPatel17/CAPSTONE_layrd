// ─────────────────────────────────────────────
// LÄYRD – API: Events/Private Catering (/api/events)
// POST: customer submits an inquiry AND pays a 50% deposit via Stripe
//   before admin is notified — see stripe-webhook/route.js for what
//   happens once that payment actually confirms.
// GET/PATCH: admin-only — list all inquiries / approve, reject, update.
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { EVENT_MIN_CANS, PRICES } from "../../../lib/constants.js";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { verifyAdminRequest } from "../../../lib/admin-server-auth.js";
import { createStripeCheckoutSession } from "../../../lib/stripe.js";
import { isRateLimited } from "../../../lib/rate-limit.js";
import { notifyAsync } from "../../../lib/notify.js";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`events:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })) {
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
  const { eventType, eventDate, guestCount, coreCans, limitedCans, notes } = body;

  const parsedCoreCans = parseInt(coreCans) || 0;
  const parsedLimitedCans = parseInt(limitedCans) || 0;
  const totalCans = parsedCoreCans + parsedLimitedCans;
  if (totalCans < EVENT_MIN_CANS) {
    return NextResponse.json({ error: `Minimum ${EVENT_MIN_CANS} cans required for events` }, { status: 400 });
  }

  // Estimated total and deposit are computed server-side from fixed public
  // per-can prices — never trust a client-submitted total for anything a
  // payment amount is based on.
  const estimatedTotal = parsedCoreCans * PRICES.eventCorePerCan + parsedLimitedCans * PRICES.eventLimitedPerCan;
  const depositAmount = Math.round(estimatedTotal * 50) / 100; // 50%, rounded to cents

  const { data: inquiryData, error: inquiryError } = await supabase
    .from("event_inquiries")
    .insert([{
      customer_id: user.id,
      event_type: eventType,
      event_date: eventDate,
      guest_count: parseInt(guestCount) || null,
      core_cans: parsedCoreCans,
      limited_cans: parsedLimitedCans,
      notes: notes || null,
      status: "Pending",
      estimated_total: estimatedTotal,
      deposit_amount: depositAmount,
      deposit_paid: false,
    }])
    .select()
    .single();

  if (inquiryError) {
    console.error("[API Events] Failed to create inquiry:", inquiryError);
    return NextResponse.json({ error: inquiryError.message || "Failed to submit inquiry" }, { status: 500 });
  }

  const inquiryId = inquiryData.id;

  // Admin is intentionally NOT notified here — only once the deposit
  // payment actually confirms via the Stripe webhook (see
  // /api/stripe-webhook). An inquiry no one has paid a deposit toward
  // shouldn't show up as "a booking" for admin to review yet.
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const session = await createStripeCheckoutSession({
      lineItems: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Event Deposit (50%) — ${eventType} on ${eventDate}`,
          },
          unit_amount: Math.round(depositAmount * 100),
        },
        quantity: 1,
      }],
      successUrl: `${baseUrl}/events?booked=1`,
      cancelUrl: `${baseUrl}/events`,
      customerEmail: user.email,
      metadata: { eventInquiryId: inquiryId },
    });

    if (session?.id) {
      await supabase.from("event_inquiries").update({ stripe_session_id: session.id }).eq("id", inquiryId);
    }

    return NextResponse.json({ url: session.url }, { status: 201 });
  } catch (stripeErr) {
    console.error("[API Events] Stripe session creation failed:", stripeErr);
    return NextResponse.json({ error: "Failed to start deposit payment. Please try again." }, { status: 500 });
  }
}

export async function GET(request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // Resolve each inquiry's customer_id (Auth user id) to a real name/email
    // for the admin UI — event_inquiries has no name/email column of its
    // own, which is why this previously always showed "Customer details
    // unavailable" (the admin page had a literal "backend handoff
    // required" placeholder — this is that handoff).
    const withCustomers = await Promise.all(
      (data || []).map(async (inquiry) => {
        const contact = await getCustomerContact(supabase, inquiry.customer_id);
        return {
          ...inquiry,
          customerName: contact?.name || null,
          customerEmail: contact?.email || null,
        };
      })
    );

    return NextResponse.json(withCustomers);
  } catch (error) {
    console.error("[API Events] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Look up a customer's real email + display name via their Supabase Auth
 * user id. event_inquiries only stores customer_id (uuid) — there is no
 * customer_email column, so this is the only reliable source.
 */
async function getCustomerContact(supabase, customerId) {
  if (!customerId) return null;
  const { data, error } = await supabase.auth.admin.getUserById(customerId);
  if (error || !data?.user) return null;
  return {
    email: data.user.email,
    name: data.user.user_metadata?.full_name || data.user.email,
  };
}

export async function PATCH(request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const body = await request.json();
    const { id, status, adminNote, depositPaid, depositAmount } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const { data: existingData } = await supabase
      .from("event_inquiries")
      .select("status, customer_id")
      .eq("id", id)
      .single();

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (adminNote !== undefined) updates.admin_note = adminNote;
    if (depositPaid !== undefined) updates.deposit_paid = depositPaid;
    if (depositAmount !== undefined) updates.deposit_amount = depositAmount;

    const { data, error } = await supabase
      .from("event_inquiries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[API Events] Update error:", error);
      return NextResponse.json({ error: error.message || "Failed to update event inquiry" }, { status: 500 });
    }

    // Trigger status-change emails only if status actually changed
    if (status !== undefined && existingData?.status !== status) {
      const contact = await getCustomerContact(supabase, data.customer_id);

      if (contact?.email) {
        if (status === "Approved") {
          notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/event-approved`, {
            to: contact.email,
            inquiryId: data.id,
            customerName: contact.name,
            depositAmount: data.deposit_amount || 0,
          }, { label: "Events: event-approved" });
        } else if (status === "Rejected") {
          notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/event-rejected`, {
            to: contact.email,
            inquiryId: data.id,
            customerName: contact.name,
            adminNote: data.admin_note || '',
          }, { label: "Events: event-rejected" });
        }
      } else {
        console.error("[API Events] Could not resolve customer email for inquiry", data.id);
      }
    }

    // Cascade: since label design unlocks on deposit payment rather than
    // waiting for admin approval, a customer may have already generated/
    // submitted labels for an event that admin now rejects. Decline any of
    // those that aren't already Approved, so nothing is left in limbo.
    if (status === "Rejected" && existingData?.status !== "Rejected") {
      const { error: cascadeError } = await supabase
        .from("ai_label_requests")
        .update({ status: "Rejected", updated_at: new Date().toISOString() })
        .eq("event_inquiry_id", id)
        .in("status", ["Draft", "Pending", "Revision Requested"]);

      if (cascadeError) {
        console.error("[API Events] Failed to cascade-decline labels for rejected event:", cascadeError);
      }
    }

    return NextResponse.json({ success: true, inquiry: data });
  } catch (error) {
    console.error("[API Events] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}