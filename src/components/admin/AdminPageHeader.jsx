// ─────────────────────────────────────────────
// LÄYRD – AdminPageHeader
// Title, subtitle, and optional right-side actions for admin pages.
// Usage:
//   <AdminPageHeader
//     title="Products"
//     subtitle="Manage your product catalogue"
//     action={<button className="btn btn-primary btn-sm">+ Add</button>}
//   />
// ─────────────────────────────────────────────

export default function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: "32px",
    }}>
      <div>
        <h2 style={{
          marginBottom: "4px",
          fontSize: "32px", /* Simplified fixed size for admin header */
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: "16px", margin: 0 }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
