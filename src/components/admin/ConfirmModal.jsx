"use client";
// ─────────────────────────────────────────────
// LÄYRD – ConfirmModal
// "Are you sure?" confirmation dialog.
// Usage:
//   <ConfirmModal
//     open={showDelete}
//     title="Delete Product"
//     message="This cannot be undone."
//     confirmLabel="Delete"
//     danger
//     onConfirm={handleDelete}
//     onCancel={() => setShowDelete(false)}
//   />
// ─────────────────────────────────────────────
import { useEffect } from "react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-primary)",
          border: "1px solid var(--border-soft)",
          borderRadius: "4px",
          padding: "32px",
          width: "100%",
          maxWidth: "420px",
          animation: "fadeIn 0.2s ease both",
          boxShadow: "0 16px 48px rgba(14,14,14,0.16)",
        }}
      >
        <h4 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>
          {title}
        </h4>
        {message && (
          <p style={{ fontSize: "20px", color: "var(--text-secondary)", marginBottom: "28px", margin: "0 0 28px" }}>
            {message}
          </p>
        )}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}