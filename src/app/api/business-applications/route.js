// ─────────────────────────────────────────────
// LÄYRD – API: Business / Wholesale Applications
// ─────────────────────────────────────────────
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase.js";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const businessName = formData.get("businessName");
    const ownerName = formData.get("ownerName");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const address = formData.get("address");
    const instagram = formData.get("instagram");
    const website = formData.get("website");
    const notes = formData.get("notes");
    const file = formData.get("file");

    // Validate required fields
    if (!businessName || !ownerName || !email || !phone || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let permitUrl = null;

    // Handle file upload if present
    if (file && typeof file === "object" && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('reseller_permits')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false
        });
        
      if (uploadError) {
        console.error("[API Wholesale] Upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload permit file" }, { status: 500 });
      }
      
      const { data: publicUrlData } = supabase
        .storage
        .from('reseller_permits')
        .getPublicUrl(fileName);
        
      permitUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("wholesale_applications")
      .insert([{
        business_name: businessName,
        contact_name: ownerName,
        email,
        phone,
        address,
        instagram: instagram || null,
        website: website || null,
        notes: notes || null,
        permit_url: permitUrl,
        business_type: "Not Specified",
        status: "Pending"
      }])
      .select()
      .single();

    if (error) {
      console.error("[API Wholesale] Insert error:", error);
      return NextResponse.json({ error: error.message || "Failed to submit application" }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data }, { status: 201 });
  } catch (error) {
    console.error("[API Wholesale] Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  // Admin only - list applications
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("wholesale_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  // Admin only - update application status
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("wholesale_applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
