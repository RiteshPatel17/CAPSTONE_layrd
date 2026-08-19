"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Events (/admin/events)
// Review submitted event inquiries; approve or reject with an optional note.
// Data persists to Supabase via /api/admin/events.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";

export default function AdminEventsPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null); // the inquiry row being reviewed
  const [decision, setDecision] = useState(null); // "Approved" | "Rejected"
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function refreshInquiries() {
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setInquiries(data.inquiries || []);
    setLoading(false);
  }

  useEffect(() => {
    refreshInquiries();
  }, []);

  function openReview(inquiry, initialDecision) {
    setReviewTarget(inquiry);
    setDecision(initialDecision);
    setAdminNote(inquiry.admin_note || "");
  }

  function closeReview() {
    setReviewTarget(null);
    setDecision(null);
    setAdminNote("");
  }

  async function handleConfirmDecision() {
    setSaving(true);
    await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: reviewTarget.id,
        status: decision,
        adminNote,
      }),
    });
    await refreshInquiries();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    closeReview();
  }

  if (loading) {
    return (
      <AdminLayout title="Events" subtitle="Loading...">
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading event inquiries...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Events"
        subtitle={`${inquiries.length} event inquiries`}
      />

      {saved && (
        <div style={{
          background: "rgba(74,222,128,0.1)",
          border: "1px solid rgba(74,222,128,0.3)",
          color: "#4ade80",
          padding: "10px 16px",
          borderRadius: "4px",
          fontSize: "0.85rem",
          marginBottom: "20px",
        }}>
          ✓ Inquiry updated successfully.
        </div>
      )}

      <AdminTable
        headers={["Customer", "Event Type", "Date", "Cans", "Status", "Actions"]}
        emptyMessage="No event inquiries yet."
      >
        {inquiries.map((inq) => {
          const totalCans = (inq.core_cans || 0) + (inq.limited_cans || 0);
          // WHY the fallback chain: profiles(full_name) may be null if the
          // customer never set their name, so we fall back to a labeled
          // placeholder rather than showing a blank cell.
          const customerLabel = inq.profiles?.full_name || "Unnamed customer";

          return (
            <tr key={inq.id}>
              <td style={{ fontWeight: 500 }}>
                {customerLabel}
                {inq.profiles?.phone && (
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {inq.profiles.phone}
                  </div>
                )}
              </td>
              <td>{inq.event_type}</td>
              <td>{inq.event_date}</td>
              <td>{totalCans}</td>
              <td><StatusBadge status={inq.status} /></td>
              <td>
                {inq.status === "Pending" ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ padding: "4px 12px" }}
                      onClick={() => openReview(inq, "Approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: "4px 12px" }}
                      onClick={() => openReview(inq, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  // WHY still clickable after a decision: lets Adam view/edit
                  // his own note later without needing to change the status
                  // again — reopens the same modal with the current decision
                  // pre-selected, just to review details or tweak wording.
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "4px 12px" }}
                    onClick={() => openReview(inq, inq.status)}
                  >
                    View Note
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* ── Review Modal ── */}
      {/* WHY a custom modal instead of ConfirmModal: ConfirmModal only
          supports a static message string, not a free-text input. Adam
          needs to write an optional note explaining the approval/rejection
          (e.g. rejection reason, or approval details like deposit amount),
          which the customer will see reflected in their inquiry status. */}
      {reviewTarget && (
        <div className="overlay" onClick={closeReview}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "32px",
              width: "100%",
              maxWidth: "520px",
              animation: "fadeIn 0.2s ease both",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", margin: 0 }}>
                {decision === "Approved" ? "Approve Inquiry" : "Reject Inquiry"}
              </h4>
              <button
                onClick={closeReview}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.3rem" }}
              >
                ×
              </button>
            </div>

            {/* Inquiry summary — read-only context for the decision */}
            <div style={{ marginBottom: "20px", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <div><strong>Customer:</strong> {reviewTarget.profiles?.full_name || "Unnamed customer"}</div>
              <div><strong>Event:</strong> {reviewTarget.event_type} — {reviewTarget.event_date}</div>
              <div><strong>Cans:</strong> {(reviewTarget.core_cans || 0) + (reviewTarget.limited_cans || 0)} total
                ({reviewTarget.core_cans || 0} core, {reviewTarget.limited_cans || 0} limited)</div>
              {reviewTarget.guest_count && <div><strong>Guests:</strong> {reviewTarget.guest_count}</div>}
              {reviewTarget.notes && <div><strong>Customer notes:</strong> {reviewTarget.notes}</div>}
            </div>

            {/* Decision toggle — lets Adam change his mind before confirming,
                without closing and reopening the modal from the table row. */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                className={`btn btn-sm ${decision === "Approved" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setDecision("Approved")}
              >
                Approve
              </button>
              <button
                type="button"
                className={`btn btn-sm ${decision === "Rejected" ? "btn-danger" : "btn-outline"}`}
                onClick={() => setDecision("Rejected")}
              >
                Reject
              </button>
            </div>

            <label className="label">Admin Note (optional)</label>
            <textarea
              className="input"
              rows={4}
              value={adminNote}
              placeholder={
                decision === "Approved"
                  ? "e.g. Deposit instructions, next steps for the customer..."
                  : "e.g. Reason for rejection..."
              }
              onChange={(e) => setAdminNote(e.target.value)}
              style={{ resize: "vertical", marginBottom: "24px" }}
            />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeReview} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-sm ${decision === "Rejected" ? "btn-danger" : "btn-primary"}`}
                onClick={handleConfirmDecision}
                disabled={saving}
              >
                {saving ? "Saving..." : `Confirm ${decision}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}