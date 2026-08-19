// ─────────────────────────────────────────────
// LÄYRD – inventory-options.js
// Plain constants + calculateStock() helper.
// Kept separate from admin-inventory.js because that file
// is "use server" and can only export async functions.
// ─────────────────────────────────────────────

export const STOCK_THRESHOLD_LOW = 5;
export const STOCK_THRESHOLD_OUT = 0;

// Flavour + category are no longer a separately-maintained constant list —
// the Add Batch dropdown now pulls real flavours straight from the product
// catalog (see admin/inventory/page.jsx's refreshData), so it can't drift
// from what products actually exist/are named. Size is still a small, fixed
// set of physical can sizes.
export const BATCH_SIZES = ["150ml", "250ml", "330ml"];

/**
 * Calculate available stock per flavour+size+category.
 * availableStock = totalQtyProduced - totalCommittedQuantity
 *
 * Grouping key is case-insensitive on flavour, kept as a safety net even
 * now that the Add Batch dropdown is sourced from real products: committed
 * quantities come from order_items.flavour, a snapshot of whatever a
 * product was literally named at checkout time, which could still drift
 * from a product's *current* name if it's renamed later. Without this,
 * that would silently split into two permanent, never-reconciling stock
 * rows for the same real flavour.
 */
export function calculateStock(batches, orderItems) {
  const normalize = (flavour, size, category) =>
    `${(flavour || "").trim().toLowerCase()}||${size}||${category}`;

  // Preferred display casing per key — batches (from the controlled admin
  // dropdown) win over whatever a product happened to be named at checkout.
  const displayByKey = {};
  function rememberDisplay(key, flavour, size, category) {
    if (!displayByKey[key]) displayByKey[key] = { flavour, size, category };
  }

  const producedMap = {};
  for (const b of batches) {
    const key = normalize(b.flavour, b.size, b.category);
    producedMap[key] = (producedMap[key] || 0) + b.qtyProduced;
    rememberDisplay(key, b.flavour, b.size, b.category);
  }

  const committedMap = {};
  for (const item of orderItems) {
    const key = normalize(item.flavour, item.size, item.category);
    committedMap[key] = (committedMap[key] || 0) + item.quantity;
    rememberDisplay(key, item.flavour, item.size, item.category);
  }

  const allKeys = new Set([...Object.keys(producedMap), ...Object.keys(committedMap)]);
  const summary = [];

  for (const key of allKeys) {
    const { flavour, size, category } = displayByKey[key];
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