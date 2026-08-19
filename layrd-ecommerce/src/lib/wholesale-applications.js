// ─────────────────────────────────────────────
// LÄYRD – wholesale-applications.js
// Server-side service layer for wholesale applications.
// Real DB column names: abn (not alberta_business_number),
// admin_note (not admin_notes) — mapped here, not renamed in DB.
// ─────────────────────────────────────────────
import { getSupabaseAdmin } from "./supabase.js";

export const ALLOWED_BUSINESS_TYPES = [
  "Café / Coffee Shop",
  "Restaurant / Bistro",
  "Licensed Retailer",
  "Catering / Hospitality",
  "Other",
];

export const ALLOWED_VOLUMES = [
  "24–36 cans",
  "37–47 cans",
  "48+ cans",
  "Not sure yet",
];

export const ALLOWED_FREQUENCIES = [
  "One-time",
  "Weekly",
  "Biweekly",
  "Monthly",
  "Not sure yet",
];

export const NEW_STATUSES = ["New", "Contacted", "Qualified", "Not a Fit", "Closed"];

function dbToJs(row) {
  return {
    id: row.id,
    businessName: row.business_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    businessType: row.business_type,
    albertaBusinessNumber: row.abn,
    website: row.website,
    instagram: row.instagram,
    expectedVolume: row.expected_volume,
    expectedFrequency: row.expected_frequency,
    notes: row.notes,
    permitUrl: row.permit_url,
    status: row.status,
    adminNotes: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contactedAt: row.contacted_at,
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Validate a public application submission.
 * Returns { valid: true } or { valid: false, message }.
 */
export function validateApplication(payload) {
  const required = ["business_name", "contact_name", "email", "phone", "business_type"];
  for (const field of required) {
    if (!payload[field] || typeof payload[field] !== "string" || !payload[field].trim()) {
      return { valid: false, message: "Please fill in all required fields." };
    }
  }

  if (payload.business_name.length > 200) return { valid: false, message: "Business name is too long." };
  if (payload.contact_name.length > 200) return { valid: false, message: "Contact name is too long." };
  if (payload.email.length > 200 || !isValidEmail(payload.email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }
  if (!isValidPhone(payload.phone)) return { valid: false, message: "Please enter a valid phone number." };
  if (!ALLOWED_BUSINESS_TYPES.includes(payload.business_type)) {
    return { valid: false, message: "Please select a valid business type." };
  }
  if (payload.expected_volume && !ALLOWED_VOLUMES.includes(payload.expected_volume)) {
    return { valid: false, message: "Invalid volume selection." };
  }
  if (payload.expected_frequency && !ALLOWED_FREQUENCIES.includes(payload.expected_frequency)) {
    return { valid: false, message: "Invalid frequency selection." };
  }
  if (payload.notes && payload.notes.length > 2000) return { valid: false, message: "Notes are too long." };
  if (payload.website && payload.website.length > 300) return { valid: false, message: "Website URL is too long." };
  if (payload.instagram && payload.instagram.length > 100) return { valid: false, message: "Instagram handle is too long." };
  if (payload.alberta_business_number && payload.alberta_business_number.length > 50) {
    return { valid: false, message: "Business number is too long." };
  }

  return { valid: true };
}

/**
 * Check for a recent duplicate submission (same email + business name,
 * still open, within the last 30 days). Used to avoid spammy re-submits
 * without exposing any info to the client either way.
 */
export async function findRecentDuplicate(email, businessName) {
  const supabase = getSupabaseAdmin();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("wholesale_applications")
    .select("id, status, created_at")
    .eq("email", normalizeEmail(email))
    .eq("business_name", businessName.trim())
    .gte("created_at", thirtyDaysAgo)
    .not("status", "in", "(Rejected,Not a Fit,Closed)")
    .limit(1);

  if (error) {
    console.error("[Wholesale] Duplicate check failed:", error.message);
    return false;
  }
  return (data || []).length > 0;
}

/**
 * Insert a new application. Assumes validateApplication() already passed.
 */
export async function createApplication(payload) {
  const supabase = getSupabaseAdmin();

  const newRow = {
    business_name: payload.business_name.trim(),
    contact_name: payload.contact_name.trim(),
    email: normalizeEmail(payload.email),
    phone: payload.phone.trim(),
    business_type: payload.business_type,
    abn: payload.alberta_business_number?.trim() || null,
    website: payload.website?.trim() || null,
    instagram: payload.instagram?.trim() || null,
    expected_volume: payload.expected_volume || null,
    expected_frequency: payload.expected_frequency || null,
    notes: payload.notes?.trim() || null,
    status: "New",
  };

  const { error } = await supabase.from("wholesale_applications").insert(newRow);

  if (error) {
    console.error("[Wholesale] Insert failed:", error.code);
    throw new Error("Failed to submit application");
  }
}

// ── Admin functions ──────────────────────────

export async function getApplications({ search, status } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("wholesale_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) {
    query = query.or(
      `business_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[Wholesale] Fetch failed:", error.message);
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }
  return (data || []).map(dbToJs);
}

export async function updateApplication(id, updates) {
  const supabase = getSupabaseAdmin();
  const dbUpdates = {};

  if (updates.status !== undefined) {
    dbUpdates.status = updates.status;
    if (updates.status === "Contacted") {
      const { data: current } = await supabase
        .from("wholesale_applications")
        .select("contacted_at")
        .eq("id", id)
        .single();
      if (current && !current.contacted_at) {
        dbUpdates.contacted_at = new Date().toISOString();
      }
    }
  }
  if (updates.adminNotes !== undefined) dbUpdates.admin_note = updates.adminNotes;

  const { data, error } = await supabase
    .from("wholesale_applications")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Wholesale] Update failed:", error.message);
    throw new Error(`Failed to update application: ${error.message}`);
  }
  return dbToJs(data);
}