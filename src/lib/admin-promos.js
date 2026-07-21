export async function getPromoCodes() {
  try {
    const res = await fetch("/api/admin/promo-codes");
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
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
  // Assuming we implement DELETE method in the API or just rely on PATCH is_active for soft delete?
  // Let's implement DELETE in route.js later if needed. For now, hitting DELETE.
  try {
    const res = await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    return json.success;
  } catch (err) {
    console.error("Error deleting promo code:", err);
    return false;
  }
}
