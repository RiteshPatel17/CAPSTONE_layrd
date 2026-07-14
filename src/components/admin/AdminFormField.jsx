// ─────────────────────────────────────────────
// LÄYRD – AdminFormField
// Label + input/select/textarea wrapper for admin forms.
// Usage:
//   <AdminFormField label="Price" required>
//     <input className="input" type="number" ... />
//   </AdminFormField>
// ─────────────────────────────────────────────

export default function AdminFormField({ label, required, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label className="label" style={{ marginBottom: 0 }}>
        {label}
        {required && <span style={{ color: "var(--color-accent)", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", margin: 0 }}>{hint}</p>
      )}
    </div>
  );
}
