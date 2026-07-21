// ─────────────────────────────────────────────
// LÄYRD – StatusBadge
// Maps a status string to the correct badge class.
// Usage: <StatusBadge status="Ready for Pickup" />
// ─────────────────────────────────────────────

const STATUS_MAP = {
  // Order statuses
  "New":              "badge-gold",
  "Paid":             "badge-green",
  "Pending Payment":  "badge-gold",
  "Preparing":        "badge-gray",
  "Ready for Pickup": "badge-green",
  "Out for Delivery": "badge-gold",
  "Completed":        "badge-gray",
  "Cancelled":        "badge-red",
  "Refunded":         "badge-red",

  // Product statuses
  "Available":        "badge-green",
  "Sold Out":         "badge-red",
  "Coming Soon":      "badge-gold",
  "Hidden":           "badge-gray",

  // Inventory
  "Low":              "badge-red",
  "OK":               "badge-green",

  // Misc
  "core":             "badge-gray",
  "limited":          "badge-gold",
  "Active":           "badge-green",
  "Inactive":         "badge-gray",
  "Pending":          "badge-gold",
  "Approved":         "badge-green",
  "Rejected":         "badge-red",
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || "badge-gray";
  return (
    <span className={`badge ${cls}`}>{status}</span>
  );
}