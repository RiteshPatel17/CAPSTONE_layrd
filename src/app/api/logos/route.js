// ─────────────────────────────────────────────
// LÄYRD – API: AI Label Generation (/api/ai-labels)
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateLabelSuggestions } from "../../../lib/gemini.js";
import { getSupabaseAdmin } from "../../../lib/supabase.js";
import crypto from "crypto";

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
  const { action, eventInquiryId, tone, eventType, editedText, customerName, notes } = body;

  // Route 1: Save a final submission
  if (action === "submit") {
    if (!eventInquiryId) {
      return NextResponse.json({ error: "eventInquiryId is required" }, { status: 400 });
    }

    // Verify the user owns this event inquiry
    const { data: existingEvent, error: evtCheckErr } = await supabase
      .from("event_inquiries")
      .select("id, customer_id")
      .eq("id", eventInquiryId)
      .single();

    if (evtCheckErr || !existingEvent || existingEvent.customer_id !== user.id) {
      return NextResponse.json({ error: "Invalid event inquiry" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("ai_label_requests")
      .insert([{
        event_inquiry_id: eventInquiryId,
        customer_id: user.id,
        tone: tone,
        event_type: eventType,
        customer_name_on_label: customerName || null,
        generated_text: editedText,
        status: "Pending"
      }])
      .select()
      .single();

    if (error) {
      console.error("[API AI Labels] Submit error:", error);
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, submission: data });
  }

  // Route 2: Generate suggestions via Gemini
  if (!tone) {
    return NextResponse.json({ error: "Tone is required" }, { status: 400 });
  }

  try {
    const suggestions = await generateLabelSuggestions({
      tone,
      eventType,
      customerName,
      notes,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[API AI Labels] Generate error:", error);
    return NextResponse.json({ error: "Failed to generate labels" }, { status: 500 });
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
    
    const { data, error } = await supabase
      .from("ai_label_requests")
      .update({ status: status, admin_note: adminNotes })
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      console.error("[API AI Labels] Update error:", error);
      return NextResponse.json({ error: "Failed to update label request" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, submission: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
