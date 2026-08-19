// ─────────────────────────────────────────────
// LÄYRD – API: AI Label Generation (/api/ai-labels)
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import { verifyAdminRequest } from "../../../lib/admin-server-auth.js";
import { notifyAsync } from "../../../lib/notify.js";
import crypto from "crypto";

// Every suggestion is capped at 3 words to match the hard limit enforced
// on submission — anything longer won't fit the label's circular frame.
// Kept in sync with the identical set in microservices/ai-label-service.
function getMockSuggestions({ tone, customerName }) {
  const firstName = (customerName || "").split(" ")[0];
  const mock = {
    Elegant: ["Crafted With Grace", "Simply Elegant", firstName ? `For ${firstName}` : "For You"],
    Romantic: ["Sweetly Yours", "Made With Love", "Forever Sweet"],
    Playful: ["Let's Get LÄYRD", "Cheers To This", "Sweet Celebration"],
    Luxury: ["Pure Indulgence", "Crafted Excellence", "Simply Exquisite"],
    Minimal: [firstName || "LÄYRD", "Calgary Made", "Handcrafted Layers"],
    Birthday: [firstName ? `Happy Birthday ${firstName}` : "Happy Birthday", "Another Sweet Year", "Sweet Birthday Wishes"],
    Wedding: ["A Sweet Beginning", "Together Forever", "Love, Layered"],
    Corporate: ["With Compliments", "Celebrating Excellence", "LÄYRD Thank You"],
  };
  return mock[tone] ?? mock["Elegant"];
}

/**
 * Verifies the event exists, belongs to this customer, has a confirmed
 * deposit, and isn't Rejected/Cancelled/Completed. Label design unlocks as
 * soon as the deposit is paid — it does NOT wait for admin to approve the
 * event, so customers can start designing while their request is still
 * under review. If admin later rejects the event, any labels submitted
 * during that window get cascade-declined (see events/route.js PATCH).
 * This is the actual security gate — nothing in the Label Studio should
 * be reachable without passing this, regardless of what the UI shows.
 */
async function checkEventEligibility(supabase, eventInquiryId, customerId) {
  const { data: event, error } = await supabase
    .from("event_inquiries")
    .select("id, customer_id, status, deposit_paid")
    .eq("id", eventInquiryId)
    .single();

  if (error || !event) {
    return { eligible: false, reason: "Event not found." };
  }
  if (event.customer_id !== customerId) {
    return { eligible: false, reason: "This event does not belong to you." };
  }
  if (["Rejected", "Cancelled", "Completed"].includes(event.status)) {
    return { eligible: false, reason: "This event is no longer eligible for label design." };
  }
  if (!event.deposit_paid) {
    return { eligible: false, reason: "A deposit must be confirmed before designing labels." };
  }
  return { eligible: true };
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Actions tied to a specific event must pass the eligibility gate.
  // "preview" is pure text formatting with no event association, so it's exempt.
  const supabase = getSupabaseAdmin();
  let authenticatedUser = null;

  if (body.eventInquiryId && (body.action === "generate" || body.action === "submit" || body.action === "save_draft")) {
    const token = authHeader.split('Bearer ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    authenticatedUser = user;

    const eligibility = await checkEventEligibility(supabase, body.eventInquiryId, user.id);
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 403 });
    }
  }

  // Draft save/update — pure persistence, handled entirely here, no
  // microservice call needed. Lets the customer's in-progress edits
  // survive a page refresh instead of living only in React state.
  if (body.action === "save_draft") {
    const { labelId, eventInquiryId, tone, eventType, customerName, editedText } = body;

    try {
      if (labelId) {
        // Updating an existing draft — only allowed while it's still
        // Draft or Revision Requested (not once Pending/Approved/Rejected).
        const { data: existing, error: fetchError } = await supabase
          .from("ai_label_requests")
          .select("id, customer_id, status")
          .eq("id", labelId)
          .single();

        if (fetchError || !existing) {
          return NextResponse.json({ error: "Draft not found." }, { status: 404 });
        }
        if (existing.customer_id !== authenticatedUser.id) {
          return NextResponse.json({ error: "This draft does not belong to you." }, { status: 403 });
        }
        if (!["Draft", "Revision Requested"].includes(existing.status)) {
          return NextResponse.json({ error: "This label can no longer be edited." }, { status: 403 });
        }

        const { data, error } = await supabase
          .from("ai_label_requests")
          .update({
            tone, event_type: eventType, customer_name_on_label: customerName,
            generated_text: editedText, updated_at: new Date().toISOString(),
          })
          .eq("id", labelId)
          .select()
          .single();

        if (error) return NextResponse.json({ error: "Failed to save draft." }, { status: 500 });
        return NextResponse.json({ success: true, draft: data });
      } else {
        // Creating a brand new draft row.
        const { data, error } = await supabase
          .from("ai_label_requests")
          .insert({
            event_inquiry_id: eventInquiryId,
            customer_id: authenticatedUser.id,
            tone, event_type: eventType, customer_name_on_label: customerName,
            generated_text: editedText, status: "Draft",
          })
          .select()
          .single();

        if (error) return NextResponse.json({ error: "Failed to save draft." }, { status: 500 });
        return NextResponse.json({ success: true, draft: data });
      }
    } catch (err) {
      console.error("[API AI Labels] save_draft error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  const internalKey = process.env.INTERNAL_SERVICE_KEY;
  const serviceUrl = process.env.AI_LABEL_SERVICE_URL;

  if (!serviceUrl || !internalKey) {
    console.error("[API AI Labels] Missing microservice configuration");
    return NextResponse.json({ error: "Internal server configuration error" }, { status: 500 });
  }

  // "preview" is a distinct, lightweight microservice endpoint (renders an
  // image with no eventInquiryId/DB write involved) — it was previously
  // being forwarded to the main generate/submit endpoint instead, which
  // always rejected it for missing eventInquiryId and left the live preview
  // permanently blank.
  const microserviceRoute = body.action === "preview" ? "/api/ai-labels/preview-image" : "/api/ai-labels";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${serviceUrl}${microserviceRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': internalKey,
        'Authorization': authHeader
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }
    if (!res.ok && res.status !== 500) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.error || "Bad Request" }, { status: res.status });
    }
    if (!res.ok) {
      throw new Error(`Microservice responded with status ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[API AI Labels] Microservice unavailable, falling back:", error.message);
    if (body.action === "submit") {
      return NextResponse.json({ error: "Service temporarily unavailable. Please try again later." }, { status: 503 });
    }
    if (body.action === "preview") {
      return NextResponse.json({ error: "Preview temporarily unavailable" }, { status: 503 });
    }
    return NextResponse.json({
      suggestions: getMockSuggestions({ tone: body.tone, customerName: body.customerName })
    });
  }
}

export async function GET(request) {
  const supabase = getSupabaseAdmin();
  const adminUser = await verifyAdminRequest(request);
  const isAdmin = !!adminUser;
  let customerId = null;

  if (!isAdmin) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    customerId = user.id;
  }

  try {
    let query = supabase
      .from("ai_label_requests")
      .select("*, event_inquiries(customer_id, event_date, status, core_cans, limited_cans)")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[API AI Labels] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch label requests" }, { status: 500 });
    }

    // Defensive filter — don't rely solely on the query-level filter above
    // for a customer's data isolation. ai_label_requests has its own
    // customer_id column, so this is a cheap, reliable second check.
    const scoped = isAdmin ? (data || []) : (data || []).filter((row) => row.customer_id === customerId);

    const withUrls = await Promise.all(scoped.map(async (row) => {
      if (!row.label_image_path) return { ...row, label_image_url: null };
      const { data: signed } = await supabase.storage
        .from("label-artwork")
        .createSignedUrl(row.label_image_path, 60 * 60);
      return { ...row, label_image_url: signed?.signedUrl || null };
    }));

    return NextResponse.json(withUrls);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const adminUser = await verifyAdminRequest(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized - Invalid admin session" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();

  try {
    const body = await request.json();
    const { id, status, adminNotes, quantity, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    if (action === "regenerate_image") {
      const internalKey = process.env.INTERNAL_SERVICE_KEY;
      const serviceUrl = process.env.AI_LABEL_SERVICE_URL;
      if (!serviceUrl || !internalKey) {
        return NextResponse.json({ error: "Internal server configuration error" }, { status: 500 });
      }
      const res = await fetch(`${serviceUrl}/api/ai-labels/regenerate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": internalKey,
          "Authorization": request.headers.get("authorization") || "",
        },
        body: JSON.stringify({ labelId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data.error || "Failed to regenerate image" }, { status: res.status });
      }
      return NextResponse.json(data);
    }

    if (quantity !== undefined && status === undefined) {
      const { data, error } = await supabase
        .from("ai_label_requests")
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: "Failed to update quantity" }, { status: 500 });
      return NextResponse.json({ success: true, submission: data });
    }

    if (!status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: existingData } = await supabase
      .from("ai_label_requests")
      .select("status")
      .eq("id", id)
      .single();

    const updatePayload = {
      status,
      admin_note: adminNotes || null,
      updated_at: new Date().toISOString(),
    };
    if (quantity !== undefined) updatePayload.quantity = quantity;

    const { data, error } = await supabase
      .from("ai_label_requests")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[API AI Labels] Update error:", error);
      return NextResponse.json({ error: "Failed to update label request" }, { status: 500 });
    }

    if (existingData?.status !== status) {
      const { data: userData } = await supabase.auth.admin.getUserById(data.customer_id);
      const customerEmail = userData?.user?.email;

      if (customerEmail) {
        if (status === "Approved") {
          notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/label-approved`, {
            to: customerEmail,
            customerName: data.customer_name_on_label || "Customer",
            generatedText: data.generated_text || ""
          }, { label: "AI Labels: label-approved" });
        } else if (status === "Revision Requested") {
          notifyAsync(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/label-revision`, {
            to: customerEmail,
            customerName: data.customer_name_on_label || "Customer",
            adminNote: adminNotes || ''
          }, { label: "AI Labels: label-revision" });
        }
      } else {
        console.error("[API AI Labels] Could not resolve customer email for label", data.id);
      }
    }

    return NextResponse.json({ success: true, submission: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}