"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Products (/admin/products)
// Full CRUD table with add/edit/delete modals + featured toggle.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmModal from "@/components/admin/ConfirmModal";
import AdminFormField from "@/components/admin/AdminFormField";
import {
  getProducts, createProduct, updateProduct, deleteProduct, toggleFeatured,
} from "@/lib/admin-products";
import {
  PRODUCT_CATEGORIES, FLAVOUR_TYPES, PRODUCT_SIZES, PRODUCT_STATUSES,
} from "@/lib/product-options";

const EMPTY_FORM = {
  name: "",
  category: "cake",
  flavour: "",
  flavourType: "core",
  size: "250ml",
  price: "",
  description: "",
  ingredients: "",
  allergens: "",
  status: "Available",
  releaseDate: "",
  image: null,
  featured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(product) {
    setForm({ ...product });
    setEditTarget(product);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  function handleField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      if (editTarget) {
        await updateProduct(editTarget.id, form);
      } else {
        await createProduct(form);
      }
      setSaved(true);
      closeForm();
      loadProducts();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save product: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteProduct(deleteTarget.id);
      await loadProducts();
      setDeleteTarget(null);
    } catch (err) {
      if (err.message.includes("order_items") || err.message.includes("foreign key")) {
        alert(
          `Can't delete "${deleteTarget.name}" — it's referenced by existing orders. ` +
          `To remove it from the shop while keeping order history intact, edit the product ` +
          `and set its Status to "Hidden" instead.`
        );
      } else {
        alert(`Failed to delete product: ${err.message}`);
      }
      setDeleteTarget(null);
    }
  }

  async function handleToggleFeatured(product) {
    try {
      await toggleFeatured(product.id, !product.featured);
      await loadProducts();
    } catch (err) {
      alert(err.message);
    }
  }

  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Products"
        subtitle={`${products.length} products in catalogue · ${featuredCount}/4 featured on homepage`}
        action={
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + Add Product
          </button>
        }
      />

      {saved && (
        <div style={{
          background: "rgba(74,222,128,0.1)",
          border: "1px solid rgba(74,222,128,0.3)",
          color: "#4ade80",
          padding: "10px 16px",
          borderRadius: "4px",
          fontSize: "16px",
          marginBottom: "20px",
        }}>
          ✓ Product saved successfully.
        </div>
      )}

      <AdminTable
        headers={["Name", "Category", "Flavour Type", "Size", "Price", "Status", "Featured", "Actions"]}
        emptyMessage="No products yet. Click + Add Product to get started."
      >
        {products.map((p) => (
          <tr key={p.id}>
            <td style={{ fontWeight: 500 }}>{p.name}</td>
            <td style={{ textTransform: "capitalize" }}>{p.category}</td>
            <td><StatusBadge status={p.flavourType} /></td>
            <td>{p.size}</td>
            <td style={{ color: "var(--color-accent)" }}>${p.price}</td>
            <td><StatusBadge status={p.status} /></td>
            <td>
              <button
                onClick={() => handleToggleFeatured(p)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "18px", padding: "4px 8px", color: p.featured ? "var(--color-accent)" : "var(--color-muted)" }}
                title={p.featured ? "Remove from homepage" : "Feature on homepage"}
              >
                {p.featured ? "★" : "☆"}
              </button>
            </td>
            <td>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 12px" }} onClick={() => openEdit(p)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" style={{ padding: "4px 12px" }} onClick={() => setDeleteTarget(p)}>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {showForm && (
        <div className="overlay" onClick={closeForm}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "32px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "fadeIn 0.2s ease both",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <h4 style={{ margin: 0 }}>
                {editTarget ? "Edit Product" : "Add Product"}
              </h4>
              <button
                onClick={closeForm}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-sand)", fontSize: "24px" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="responsive-grid-2" style={{ gap: "16px" }}>
                <AdminFormField label="Product Name" required>
                  <input
                    className="input" required
                    value={form.name}
                    placeholder="e.g. Lotus Cheesecake"
                    onChange={(e) => handleField("name", e.target.value)}
                  />
                </AdminFormField>
                <AdminFormField label="Flavour" required>
                  <input
                    className="input" required
                    value={form.flavour}
                    placeholder="e.g. Lotus Cheesecake"
                    onChange={(e) => handleField("flavour", e.target.value)}
                  />
                </AdminFormField>
              </div>

              <div className="responsive-grid-4" style={{ gap: "16px" }}>
                <AdminFormField label="Category" required>
                  <select className="input" value={form.category} onChange={(e) => handleField("category", e.target.value)}>
                    {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </AdminFormField>
                <AdminFormField label="Flavour Type" required>
                  <select className="input" value={form.flavourType} onChange={(e) => handleField("flavourType", e.target.value)}>
                    {FLAVOUR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </AdminFormField>
                <AdminFormField label="Size" required>
                  <select className="input" value={form.size} onChange={(e) => handleField("size", e.target.value)}>
                    {PRODUCT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </AdminFormField>
                <AdminFormField label="Price ($)" required>
                  <input
                    className="input" type="number" step="0.01" min="0" required
                    value={form.price}
                    placeholder="8.00"
                    onChange={(e) => handleField("price", e.target.value)}
                  />
                </AdminFormField>
              </div>

              <div className="responsive-grid-2" style={{ gap: "16px" }}>
                <AdminFormField label="Status" required>
                  <select className="input" value={form.status} onChange={(e) => handleField("status", e.target.value)}>
                    {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </AdminFormField>
                {form.status === "Coming Soon" && (
                  <AdminFormField label="Release Date" hint="Shown on Coming Soon products">
                    <input
                      className="input" type="date"
                      value={form.releaseDate || ""}
                      onChange={(e) => handleField("releaseDate", e.target.value)}
                    />
                  </AdminFormField>
                )}
              </div>

              <AdminFormField label="Homepage Feature" hint="Show this product in the homepage's featured section (max 4 at a time).">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!form.featured}
                    onChange={(e) => handleField("featured", e.target.checked)}
                  />
                  <span style={{ fontSize: "16px" }}>
                    {form.featured ? "★ Featured on homepage" : "☆ Not featured"}
                  </span>
                </label>
              </AdminFormField>

              <AdminFormField label="Description">
                <textarea
                  className="input"
                  rows={3}
                  value={form.description || ""}
                  placeholder="Short product description shown on the shop page..."
                  onChange={(e) => handleField("description", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </AdminFormField>

              <AdminFormField label="Ingredients">
                <textarea
                  className="input"
                  rows={2}
                  value={form.ingredients || ""}
                  placeholder="Comma-separated ingredient list..."
                  onChange={(e) => handleField("ingredients", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </AdminFormField>

              <AdminFormField label="Allergens" hint="e.g. Dairy, Gluten, Nuts, Eggs, Soy">
                <input
                  className="input"
                  value={form.allergens || ""}
                  placeholder="Dairy, Gluten, Soy"
                  onChange={(e) => handleField("allergens", e.target.value)}
                />
              </AdminFormField>

              <AdminFormField label="Product Image" hint="Upload a high-quality photo of the product.">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="input"
                  onChange={(e) => handleField("image", e.target.files[0])}
                  style={{ padding: "8px" }}
                />
                {editTarget && editTarget.image && typeof form.image === 'string' && (
                  <div style={{ marginTop: "8px", fontSize: "16px", color: "var(--color-muted)" }}>
                    Current image: <a href={form.image} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>View</a>
                  </div>
                )}
              </AdminFormField>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "8px" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Saving..." : (editTarget ? "Save Changes" : "Add Product")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}