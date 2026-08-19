// ─────────────────────────────────────────────
// LÄYRD – EmptyState
// Shown when a table or section has no data yet.
// Usage: <EmptyState icon="📦" title="No batches yet" message="Add a batch to get started." />
// ─────────────────────────────────────────────

export default function EmptyState({ icon = "📭", title = "Nothing here yet", message, action }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px",
      textAlign: "center",
      gap: "12px",
    }}>
      <span style={{ fontSize: "3rem", opacity: 0.4 }}>{icon}</span>
      <h4 style={{
        fontFamily: "'Cormorant Garamond', serif",
        color: "var(--color-sand)",
        fontWeight: 500,
        fontSize: "1.2rem",
      }}>
        {title}
      </h4>
      {message && (
        <p style={{ fontSize: "0.85rem", color: "var(--color-muted)", maxWidth: "320px", margin: 0 }}>
          {message}
        </p>
      )}
      {action && <div style={{ marginTop: "8px" }}>{action}</div>}
    </div>
  );
}
