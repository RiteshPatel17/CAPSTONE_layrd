"use server";
import { getSupabaseAdmin } from "./supabase.js";

export async function getSiteImages() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("site_images").select("*");
  if (error) {
    console.error("[Site Images] Error fetching:", error);
    throw new Error(`Failed to fetch site images: ${error.message}`);
  }
  const map = {};
  (data || []).forEach((row) => { map[row.key] = row.image_url; });
  return map;
}

export async function updateSiteImage(key, file) {
  const supabase = getSupabaseAdmin();

  const ext = file.name.split(".").pop();
  const filename = `site-${key}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(uploadData.path);

  const { error } = await supabase
    .from("site_images")
    .upsert({ key, image_url: publicUrl, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(`Failed to save image: ${error.message}`);
  }

  return publicUrl;
}