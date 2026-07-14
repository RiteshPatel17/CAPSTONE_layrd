"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin AI Labels (/admin/ai-labels)
// Lists all customer label submissions and lets Adam approve / reject.
// Data is stored in localStorage (replace with Supabase ai_label_requests table).
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const STATUS_COLORS = {
  Pending: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  text: "#fbbf24" },
  Approved: { bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.30)",  text: "#4ade80" },
  Rejected: { bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.30)", text: "#f87171" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "20px",
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
    }}>
      {status}
    </span>
  );
}

export default function AdminAILabelsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState("all"); // all | pending | approved | rejected
  const [expandedId, setExpandedId] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    try {
      const res = await fetch("/api/ai-labels");
      const data = await res.json();
      const mapped = data.map(d => ({
        id: d.id,
        eventId: d.event_inquiry_id,
        eventType: d.event_type,
        eventDate: d.event_inquiries?.event_date || "Unknown",
        tone: d.tone,
        labelText: d.generated_text,
        customerName: d.event_inquiries?.customer_name || "Customer",
        submittedAt: d.created_at,
        status: d.status,
        adminNote: d.admin_note
      }));
      setSubmissions(mapped);
    } catch {
      setSubmissions([]);
    }
    setLoading(false);
  }

  async function updateStatus(id, newStatus) {
    try {
      const res = await fetch("/api/ai-labels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, adminNotes: actionNote }),
      });
      if (res.ok) {
        // Optimistic update
        setSubmissions(submissions.map(s => 
          s.id === id 
            ? { ...s, status: newStatus, adminNote: actionNote, reviewedAt: new Date().toISOString() } 
            : s
        ));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
    setExpandedId(null);
    setActionNote("");
  }

  function deleteSubmission(id) {
    // Soft delete not supported by the API yet, so just hide locally
    const updated = submissions.filter((s) => s.id !== id);
    setSubmissions(updated);
  }

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === (filter === "pending" ? "Pending" : filter === "approved" ? "Approved" : "Rejected"));

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === "Pending").length,
    approved: submissions.filter((s) => s.status === "Approved").length,
    rejected: submissions.filter((s) => s.status === "Rejected").length,
  };

  const FILTERS = ["all", "pending", "approved", "rejected"];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="AI Label Submissions"
        subtitle="Review and approve customer-generated label copy"
      />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px",
              borderRadius: "4px",
              border: `1px solid ${filter === f ? "var(--accent)" : "var(--border-soft)"}`,
              background: filter === f ? "rgba(184,155,94,0.12)" : "var(--surface)",
              color: filter === f ? "var(--accent)" : "var(--text-muted)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              textTransform: "capitalize",
              letterSpacing: "0.05em",
              transition: "all 0.15s",
            }}
          >
            {f} {counts[f] > 0 && <span style={{ opacity: 0.7 }}>({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 24px",
          border: "1px dashed var(--border-soft)", borderRadius: "6px",
          color: "var(--text-muted)",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🏷️</div>
          <p style={{ fontWeight: 600, marginBottom: "4px", color: "var(--text-main)" }}>
            No {filter === "all" ? "" : filter} submissions yet
          </p>
          <p style={{ fontSize: "0.85rem" }}>
            Customers submit label copy from the{" "}
            <a href="/ai-label-studio" target="_blank" style={{ color: "var(--accent)" }}>
              AI Label Studio
            </a>
            .
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((s) => (
            <div
              key={s.id}
              style={{
                background: "var(--surface)",
                border: `1px solid ${expandedId === s.id ? "var(--accent)" : "var(--border-soft)"}`,
                borderRadius: "6px",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* Row header */}
              <div
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "16px",
                  alignItems: "center",
                  padding: "16px 20px",
                  cursor: "pointer",
                }}
              >
                {/* Label text + meta */}
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.05rem",
                    color: "var(--text-main)",
                    fontStyle: "italic",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    "{s.labelText}"
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    <strong style={{ color: "var(--text-main)" }}>{s.customerName}</strong>
                    {" · "}{s.eventType}{" · "}{s.tone} tone
                    {" · "}{new Date(s.submittedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* ID */}
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace", flexShrink: 0 }}>
                  {s.id}
                </span>

                {/* Status */}
                <StatusBadge status={s.status} />

                {/* Chevron */}
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", flexShrink: 0 }}>
                  {expandedId === s.id ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded review panel */}
              {expandedId === s.id && (
                <div style={{
                  borderTop: "1px solid var(--border-soft)",
                  padding: "20px 20px 20px",
                  background: "var(--bg-soft)",
                }}>
                  {/* Label preview */}
                  <div style={{
                    padding: "20px 24px", marginBottom: "16px",
                    background: "#111", border: "1px solid var(--border-soft)",
                    borderRadius: "4px", textAlign: "center",
                  }}>
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                      Label Preview
                    </p>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem",
                      color: "#F7F3EA", fontStyle: "italic", lineHeight: 1.4,
                    }}>
                      {s.labelText}
                    </p>
                    <div style={{ width: "40px", height: "1px", background: "var(--accent)", margin: "12px auto 0" }} />
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#77736B", marginTop: "8px" }}>
                      LÄYRD · Calgary
                    </p>
                  </div>

                  {/* Details */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px", marginBottom: "16px",
                  }}>
                    {[
                      ["Event ID", s.eventId],
                      ["Event Type", s.eventType],
                      ["Event Date", s.eventDate],
                      ["Tone", s.tone],
                      ["Customer", s.customerName],
                      ["Submitted", new Date(s.submittedAt).toLocaleString("en-CA")],
                    ].map(([label, val]) => (
                      <div key={label} style={{
                        background: "var(--surface)", border: "1px solid var(--border-soft)",
                        borderRadius: "4px", padding: "10px 14px",
                      }}>
                        <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>{label}</p>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 500 }}>{val || "—"}</p>
                      </div>
                    ))}
                  </div>

                  {/* Admin note input */}
                  {s.status === "Pending" && (
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Note to customer (optional)
                      </label>
                      <input
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="e.g. Approved! We'll print this on your cans."
                        style={{
                          width: "100%", padding: "8px 12px",
                          background: "var(--surface)", border: "1px solid var(--border-soft)",
                          borderRadius: "4px", color: "var(--text-main)",
                          fontSize: "0.85rem", fontFamily: "'Inter', sans-serif",
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}

                  {/* Admin note display (already reviewed) */}
                  {s.status !== "Pending" && s.adminNote && (
                    <div style={{
                      marginBottom: "14px", padding: "10px 14px",
                      background: "var(--surface)", border: "1px solid var(--border-soft)",
                      borderRadius: "4px", fontSize: "0.85rem", color: "var(--text-muted)",
                    }}>
                      <strong style={{ color: "var(--text-main)" }}>Admin note: </strong>{s.adminNote}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {s.status === "Pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(s.id, "Approved")}
                          style={{
                            padding: "8px 20px", borderRadius: "4px",
                            background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.4)",
                            color: "#4ade80", fontSize: "0.82rem", fontWeight: 600,
                            cursor: "pointer", fontFamily: "'Inter', sans-serif",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.22)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.12)"}
                        >
                          ✓ Approve Label
                        </button>
                        <button
                          onClick={() => updateStatus(s.id, "Rejected")}
                          style={{
                            padding: "8px 20px", borderRadius: "4px",
                            background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.35)",
                            color: "#f87171", fontSize: "0.82rem", fontWeight: 600,
                            cursor: "pointer", fontFamily: "'Inter', sans-serif",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(248,113,113,0.20)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(248,113,113,0.10)"}
                        >
                          ✕ Reject Label
                        </button>
                      </>
                    )}
                    {s.status !== "Pending" && (
                      <button
                        onClick={() => updateStatus(s.id, "Pending")}
                        style={{
                          padding: "8px 16px", borderRadius: "4px",
                          background: "var(--surface)", border: "1px solid var(--border-soft)",
                          color: "var(--text-muted)", fontSize: "0.78rem",
                          cursor: "pointer", fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        ↩ Reset to Pending
                      </button>
                    )}
                    <button
                      onClick={() => deleteSubmission(s.id)}
                      style={{
                        padding: "8px 14px", borderRadius: "4px",
                        background: "transparent", border: "1px solid var(--border-soft)",
                        color: "var(--text-muted)", fontSize: "0.78rem",
                        cursor: "pointer", fontFamily: "'Inter', sans-serif",
                        marginLeft: "auto",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
