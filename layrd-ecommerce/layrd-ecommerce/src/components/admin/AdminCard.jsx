// ─────────────────────────────────────────────
// LÄYRD – AdminCard
// Stat card for dashboard overview.
// Usage: <AdminCard label="Total Orders" value="128" change="+12" up={true} icon={<TrendingUp />} />
// ─────────────────────────────────────────────

export default function AdminCard({ label, value, change, up, icon }) {
  const changeColor =
    up === true ? "#16a34a" : up === false ? "#dc2626" : "var(--text-secondary)";

  return (
    <div style={{
      background: "var(--surface-primary)",
      border: "1px solid var(--border-soft)",
      borderRadius: "4px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(184,155,94,0.4)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(184,155,94,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-soft)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          margin: 0,
        }}>
          {label}
        </p>
        {icon && (
          <span style={{ color: "var(--accent-primary)", opacity: 0.7, display: "flex" }}>
            {icon}
          </span>
        )}
      </div>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "2.4rem",
        fontWeight: 600,
        color: "var(--text-primary)",
        lineHeight: 1,
        margin: 0,
      }}>
        {value}
      </p>
      {change && (
        <p style={{ fontSize: "0.78rem", color: changeColor, margin: 0 }}>
          {change}
        </p>
      )}
    </div>
  );
}
