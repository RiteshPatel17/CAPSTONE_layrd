import { getAuthHeader } from "@/lib/auth";

export async function getPromoCodes() {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch("/api/admin/promo-codes", { headers: { ...authHeader } });
    const json = await res.json();
    if (json.success) return json.promoCodes;
    console.error("Error fetching promo codes:", json.error);
    return [];
  } catch (err) {
    console.error("Error fetching promo codes:", err);
    return [];
  }
}

export async function createPromoCode(promoData) {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(promoData)
    });
    const json = await res.json();
    if (json.success) return { data: json.promoCode };
    return { error: json.error };
  } catch (err) {
    console.error("Error creating promo code:", err);
    return { error: err.message };
  }
}

export async function togglePromoCodeStatus(id, isActive) {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ id, is_active: isActive })
    });
    const json = await res.json();
    if (json.success) return json.promoCode;
    console.error("Error toggling promo status:", json.error);
    return null;
  } catch (err) {
    console.error("Error toggling promo status:", err);
    return null;
  }
}

export async function deletePromoCode(id) {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    return json.success;
  } catch (err) {
    console.error("Error deleting promo code:", err);
    return false;
  }
}