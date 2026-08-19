// ─────────────────────────────────────────────
// LÄYRD – order-items-options.js
// Plain constants for order item status logic.
// Kept separate from admin-order-items.js because that file
// is "use server" and can only export async functions.
// ─────────────────────────────────────────────
export const COMMITTED_STATUSES = [
  "New",
  "Paid",
  "Pending Payment",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Completed",
];

export const EXCLUDED_STATUSES = ["Cancelled", "Refunded"];