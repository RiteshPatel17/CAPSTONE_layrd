// ─────────────────────────────────────────────
// LÄYRD – API: AI Label Generation (/api/ai-labels)
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import crypto from "crypto";

function getMockSuggestions({ tone, eventType, customerName, eventDate }) {
  const mock = {
    Elegant: [
      `With grace and love, crafted for ${customerName || "you"}`,
      `A moment of pure indulgence – ${eventType || "your special day"}`,
      `Handcrafted with care. A LÄYRD creation.`,
    ],
    Romantic: [
      `Sweet moments, sweeter memories`,
      `Made with love for ${customerName || "someone special"}`,
      `Because love deserves the finest layer`,
    ],
    Playful: [
      `Let's get LÄYRD! 🎉 ${eventType || "Party time"}`,
      `Life is short – eat the cheesecake first!`,
      `Happy ${eventType || "celebrations"} from LÄYRD 🎂`,
    ],
    Luxury: [
      `Excellence. Crafted. LÄYRD.`,
      `For those who appreciate the extraordinary`,
      `A boutique creation, exclusively for ${customerName || "you"}`,
    ],
    Minimal: [
      customerName || "LÄYRD",
      `${eventDate || "2026"} · Calgary`,
      `Handcrafted desserts`,
    ],
    Birthday: [
      `Happy Birthday, ${customerName || "Legend"}! 🎂`,
      `Another year of being absolutely fabulous! 🎉`,
      `Birthday calories don't count – especially LÄYRD ones!`,
    ],
    Wedding: [
      `${customerName || "Together forever"} – A sweet beginning 💍`,
      `As you begin forever together… indulge in the layers`,
      `Celebrating love, one can at a time`,
    ],
    Corporate: [
      `With compliments from ${customerName || "our team"}`,
      `Celebrating excellence – ${eventType || "your team"}`,
      `Thank you. A LÄYRD experience.`,
    ],
  };
  return mock[tone] ?? mock["Elegant"];
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  
  // Quick sanity check (no need for Next.js to parse JWT, microservice handles it)
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const internalKey = process.env.INTERNAL_SERVICE_KEY;
  const serviceUrl = process.env.AI_LABEL_SERVICE_URL;

  if (!serviceUrl || !internalKey) {
    console.error("[API AI Labels] Missing microservice configuration");
    return NextResponse.json({ error: "Internal server configuration error" }, { status: 500 });
  }

  try {
    // 2.5s timeout wrapper
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${serviceUrl}/api/ai-labels`, {
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

    // If microservice returns 401 or 403, pass it through exactly
    if (res.status === 401 || res.status === 403) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    // If 400 or other expected errors, pass them through
    if (!res.ok && res.status !== 500) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.error || "Bad Request" }, { status: res.status });
    }

    // If it's a 500 from the microservice, we will throw an error and catch it below for fallback
    if (!res.ok) {
      throw new Error(`Microservice responded with status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    // Timeout or fetch error (service down/unreachable or 500)
    console.error("[API AI Labels] Microservice unavailable, falling back:", error.message);
    
    // If the action was 'submit', we can't fall back (only DB saves). 
    if (body.action === "submit") {
      return NextResponse.json({ error: "Service temporarily unavailable. Please try again later." }, { status: 503 });
    }

    // If 'generate', fallback to mock suggestions
    return NextResponse.json({
      suggestions: getMockSuggestions({ 
        tone: body.tone, 
        eventType: body.eventType, 
        customerName: body.customerName, 
        eventDate: body.eventDate 
      })
    });
  }
}

export async function GET(request) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("layrd_admin_session")?.value;
  
  const supabase = getSupabaseAdmin();
  let isAdmin = false;
  let customerId = null;

  // 1. Check if it's an admin (via cookie)
  if (adminToken) {
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("session_token", adminToken)
      .single();
    if (admin) {
      isAdmin = true;
    }
  }

  // 2. If not admin, verify customer Bearer token
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
      .select("*, event_inquiries!inner(customer_id, event_date, status)")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      // If not admin, only get their own labels
      query = query.eq("event_inquiries.customer_id", customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API AI Labels] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch label requests" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  // Admin: Update label status
  const cookieStore = await cookies();
  const token = cookieStore.get("layrd_admin_session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized - No admin session" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
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
    const { id, status, adminNotes } = body;
    
    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check existing status to prevent duplicate emails
    const { data: existingData } = await supabase
      .from("ai_label_requests")
      .select("status")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("ai_label_requests")
      .update({
        status,
        admin_note: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("[API AI Labels] Update error:", error);
      return NextResponse.json({ error: "Failed to update label request" }, { status: 500 });
    }
    // Trigger emails for approved/revision status only if it transitioned
    if (existingData?.status !== status) {
      if (status === "Approved") {
        fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/label-approved`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_KEY },
          body: JSON.stringify({
            to: 'test@example.com', // Placeholder
            customerName: data.customer_name_on_label || "Customer",
            generatedText: data.generated_text || ""
          })
        }).catch(err => console.error("[API AI Labels] Label Approved Email Error:", err));
      } else if (status === "Revision Needed") {
        fetch(`${process.env.NOTIFICATIONS_SERVICE_URL}/api/emails/label-revision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_KEY },
          body: JSON.stringify({
            to: 'test@example.com', // Placeholder
            customerName: data.customer_name_on_label || "Customer",
            adminNote: adminNotes || ''
          })
        }).catch(err => console.error("[API AI Labels] Label Revision Email Error:", err));
      }
    } // Close if (existingData?.status !== status)
    
    return NextResponse.json({ success: true, submission: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
