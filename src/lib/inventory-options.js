// ─────────────────────────────────────────────
// LÄYRD – inventory-options.js
// Plain constants + calculateStock() helper.
// Kept separate from admin-inventory.js because that file
// is "use server" and can only export async functions.
// ─────────────────────────────────────────────

export const STOCK_THRESHOLD_LOW = 5;
export const STOCK_THRESHOLD_OUT = 0;

export const BATCH_FLAVOURS = [
  "Lotus Cheesecake",
  "Oreo Cheesecake",
  "Classic Tiramisu",
  "Bueno Cheesecake",
  "Matcha Cheesecake",
  "Pistachio Tiramisu",
];
export const BATCH_SIZES      = ["150ml", "250ml", "330ml"];
export const BATCH_CATEGORIES = ["cake", "espresso"];

/**
 * Calculate available stock per flavour+size+category.
 * availableStock = totalQtyProduced - totalCommittedQuantity
 */
export function calculateStock(batches, orderItems) {
  const producedMap = {};
  for (const b of batches) {
    const key = `${b.flavour}||${b.size}||${b.category}`;
    producedMap[key] = (producedMap[key] || 0) + b.qtyProduced;
  }

  const committedMap = {};
  for (const item of orderItems) {
    const key = `${item.flavour}||${item.size}||${item.category}`;
    committedMap[key] = (committedMap[key] || 0) + item.quantity;
  }

  const allKeys = new Set([...Object.keys(producedMap), ...Object.keys(committedMap)]);
  const summary = [];

  for (const key of allKeys) {
    const [flavour, size, category] = key.split("||");
    const totalProduced  = producedMap[key]  || 0;
    const committed      = committedMap[key] || 0;
    const available      = Math.max(0, totalProduced - committed);

    let status = "OK";
    if (available <= STOCK_THRESHOLD_OUT) status = "Out";
    else if (available <= STOCK_THRESHOLD_LOW) status = "Low";

    summary.push({ flavour, size, category, totalProduced, committed, available, status });
  }

  return summary.sort((a, b) => {
    const order = { Out: 0, Low: 1, OK: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.flavour.localeCompare(b.flavour);
  });
}