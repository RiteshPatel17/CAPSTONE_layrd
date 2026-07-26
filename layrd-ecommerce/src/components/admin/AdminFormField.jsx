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
        {/* WHY --accent instead of the old --color-accent: --color-accent
            was never defined in globals.css (a ghost variable, same issue
            found earlier today in admin/login/page.jsx and admin/page.jsx).
            --accent is the real design-system token. */}
        {required && <span style={{ color: "var(--accent)", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{hint}</p>
      )}
    </div>
  );
}
