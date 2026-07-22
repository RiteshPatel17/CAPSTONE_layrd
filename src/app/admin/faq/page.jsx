"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin FAQ (/admin/faq)
// Full CRUD table with add/edit/delete modals.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import ConfirmModal from "@/components/admin/ConfirmModal";
import AdminFormField from "@/components/admin/AdminFormField";
import { getFaqs, createFaq, updateFaq, deleteFaq } from "@/lib/admin-faq";

const EMPTY_FORM = {
  category: "General",
  question: "",
  answer: "",
  sort_order: 0,
  is_published: true,
};

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saved, setSaved] = useState(false);

  async function loadFaqs() {
    try {
      setLoading(true);
      const data = await getFaqs();
      setFaqs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setSaved(false);
  }

  function openEdit(faq) {
    setEditTarget(faq);
    setForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
    setShowForm(true);
    setSaved(false);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleSaveForm(e) {
    e.preventDefault();
    try {
      if (editTarget) {
        await updateFaq(editTarget.id, form);
      } else {
        await createFaq(form);
      }
      setSaved(true);
      closeForm();
      loadFaqs();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save FAQ: " + err.message);
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteFaq(deleteTarget.id);
      setDeleteTarget(null);
      loadFaqs();
    } catch (err) {
      alert("Failed to delete FAQ.");
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: "40px", textAlign: "center" }}>Loading FAQs...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="FAQ Management"
        subtitle="Manage frequently asked questions"
        action={<button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add FAQ</button>}
      />

      {error && <div style={{ color: "red", marginBottom: "16px" }}>{error}</div>}

      {saved && (
        <div style={{
          background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
          color: "#4ade80", padding: "10px 16px", borderRadius: "4px", fontSize: "16px", marginBottom: "20px",
        }}>
          ✓ FAQ saved successfully.
        </div>
      )}

      <AdminTable headers={["Order", "Category", "Question", "Status", "Actions"]} emptyMessage="No FAQs yet. Click + Add FAQ to get started.">
        {faqs.map((f) => (
          <tr key={f.id}>
            <td style={{ color: "var(--color-muted)" }}>{f.sort_order}</td>
            <td>{f.category}</td>
            <td style={{ fontWeight: 500, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.question}</td>
            <td>
              <span style={{ 
                padding: "2px 8px", borderRadius: "12px", fontSize: "14px", 
                background: f.is_published ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                color: f.is_published ? "#4ade80" : "#ef4444"
              }}>
                {f.is_published ? "Published" : "Hidden"}
              </span>
            </td>
            <td>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 12px" }} onClick={() => openEdit(f)}>Edit</button>
                <button className="btn btn-danger btn-sm" style={{ padding: "4px 12px" }} onClick={() => setDeleteTarget(f)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="overlay" onClick={closeForm}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px", padding: "32px",
            width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative"
          }}>
            <h2 style={{ fontSize: "24px", marginBottom: "24px", color: "var(--color-text)" }}>
              {editTarget ? "Edit FAQ" : "Add FAQ"}
            </h2>

            <form onSubmit={handleSaveForm} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="responsive-grid-2" style={{ gap: "16px" }}>
                <AdminFormField label="Category">
                  <input required className="input" placeholder="e.g. General, Shipping" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </AdminFormField>
                <AdminFormField label="Sort Order">
                  <input required type="number" className="input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </AdminFormField>
              </div>

              <AdminFormField label="Question">
                <input required className="input" placeholder="What is your return policy?" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </AdminFormField>

              <AdminFormField label="Answer">
                <textarea required className="input" rows={4} placeholder="Type the answer..." value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
              </AdminFormField>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)", fontSize: "16px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} style={{ accentColor: "var(--color-accent)" }} />
                Published (visible on website)
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save FAQ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <ConfirmModal
          open={true}
          title="Delete FAQ?"
          message={`Are you sure you want to delete "${deleteTarget.question}"?`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
