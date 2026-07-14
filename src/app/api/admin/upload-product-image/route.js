import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

    // Upload to product_images bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('product_images')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("[Product Image Upload Error]:", uploadError);
      return NextResponse.json({ error: "Failed to upload image to storage" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('product_images')
      .getPublicUrl(uploadData.path);

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error("[Product Upload Handler Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
