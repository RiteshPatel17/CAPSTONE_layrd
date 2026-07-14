// ─────────────────────────────────────────────
// LÄYRD – AdminTable
// Consistent table wrapper with scrollable overflow.
// Usage:
//   <AdminTable headers={["Name", "Price", "Status"]}>
//     <tr>...</tr>
//   </AdminTable>
// ─────────────────────────────────────────────

export default function AdminTable({ headers, children, emptyMessage = "No records found." }) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "4px",
      overflow: "auto",
    }}>
      <table className="table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} style={{ textAlign: "center", color: "var(--color-muted)", padding: "48px 16px" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
