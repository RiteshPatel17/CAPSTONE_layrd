"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Products (/admin/products)
// Full CRUD table with add/edit/delete modals.
// Data persists to Supabase via /api/admin/products (+ [productId]).
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmModal from "@/components/admin/ConfirmModal";
import AdminFormField from "@/components/admin/AdminFormField";
import {
  PRODUCT_CATEGORIES, FLAVOUR_TYPES, PRODUCT_SIZES, PRODUCT_STATUSES,
} from "@/lib/admin-products";

// Empty form template — uses camelCase, matching how the FORM works.
// WHY camelCase here even though the DB is snake_case: this is what the
// form inputs bind to directly; the camelCase→snake_case conversion
// happens ONLY at the moment we send data to the API (see toDbShape below),
// so the form logic itself stays simple.
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
};

// Converts a raw Supabase product row (snake_case) into the form's
// camelCase shape, for populating the edit form.
function toFormShape(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    flavour: row.flavour,
    flavourType: row.flavour_type,
    size: row.size,
    price: row.price,
    description: row.description || "",
    ingredients: row.ingredients || "",
    allergens: row.allergens || "",
    status: row.status,
    releaseDate: row.release_date || "",
  };
}

// Converts the form's camelCase shape back into snake_case for the DB.
// WHY id is never included: the product's slug/id is set on CREATE only
// (see handleSave) and never changes on update — updateProduct() targets
// a row by id in the URL already, not by a field in the body.
function toDbShape(form) {
  return {
    name: form.name,
    category: form.category,
    flavour: form.flavour,
    flavour_type: form.flavourType,
    size: form.size,
    price: Number(form.price),
    description: form.description || null,
    ingredients: form.ingredients || null,
    allergens: form.allergens || null,
    status: form.status,
    release_date: form.releaseDate || null,
  };
}

// WHY a slug is generated here: products.id is a TEXT primary key (e.g.
// 'lotus-250'), not an auto-incrementing DB default — createProduct()
// needs an id passed in on insert, same reasoning as inventory_batches'
// manually generated id in admin-inventory.js.
function generateSlug(name, size) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const sizeNum = (size || "").replace(/\D/g, ""); // e.g. "250ml" -> "250"
  return `${base}-${sizeNum}`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add mode, row object = edit mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saved, setSaved] = useState(false);

  async function refreshProducts() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    refreshProducts();
  }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(product) {
    setForm(toFormShape(product));
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
    const dbPayload = toDbShape(form);

    if (editTarget) {
      await fetch(`/api/admin/products/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });
    } else {
      // WHY id is added only here, not in toDbShape: id should only ever
      // be set on CREATE, generated fresh from the name+size — never sent
      // on an UPDATE, where the row's existing id must stay unchanged.
      const id = generateSlug(form.name, form.size);
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...dbPayload }),
      });
    }

    await refreshProducts();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    closeForm();
  }

  async function handleDelete() {
    await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
    await refreshProducts();
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <AdminLayout title="Products" subtitle="Loading...">
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading products...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Products"
        subtitle={`${products.length} products in catalogue`}
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
          fontSize: "0.85rem",
          marginBottom: "20px",
        }}>
          ✓ Product saved successfully.
        </div>
      )}

      <AdminTable
        headers={["Name", "Category", "Flavour Type", "Size", "Price", "Status", "Actions"]}
        emptyMessage="No products yet. Click + Add Product to get started."
      >
        {products.map((p) => (
          <tr key={p.id}>
            <td style={{ fontWeight: 500 }}>{p.name}</td>
            <td style={{ textTransform: "capitalize" }}>{p.category}</td>
            <td><StatusBadge status={p.flavour_type} /></td>
            <td>{p.size}</td>
            <td style={{ color: "var(--accent)" }}>${Number(p.price).toFixed(2)}</td>
            <td><StatusBadge status={p.status} /></td>
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

      {/* ── Add / Edit Modal ── */}
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
              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", margin: 0 }}>
                {editTarget ? "Edit Product" : "Add Product"}
              </h4>
              <button
                onClick={closeForm}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.3rem" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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

              {/* Row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
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

              {/* Row 3 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <AdminFormField label="Status" required>
                  <select className="input" value={form.status} onChange={(e) => handleField("status", e.target.value)}>
                    {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </AdminFormField>
                {form.status === "Coming Soon" && (
                  <AdminFormField label="Release Date" hint="Shown on Coming Soon products">
                    <input
                      className="input" type="date"
                      value={form.releaseDate}
                      onChange={(e) => handleField("releaseDate", e.target.value)}
                    />
                  </AdminFormField>
                )}
              </div>

              {/* Description */}
              <AdminFormField label="Description">
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  placeholder="Short product description shown on the shop page..."
                  onChange={(e) => handleField("description", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </AdminFormField>

              {/* Ingredients */}
              <AdminFormField label="Ingredients">
                <textarea
                  className="input"
                  rows={2}
                  value={form.ingredients}
                  placeholder="Comma-separated ingredient list..."
                  onChange={(e) => handleField("ingredients", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </AdminFormField>

              {/* Allergens */}
              <AdminFormField label="Allergens" hint="e.g. Dairy, Gluten, Nuts, Eggs, Soy">
                <input
                  className="input"
                  value={form.allergens}
                  placeholder="Dairy, Gluten, Soy"
                  onChange={(e) => handleField("allergens", e.target.value)}
                />
              </AdminFormField>

              {/* Image placeholder — Supabase Storage upload is not built yet (project-brief.md §11, still listed under "Not Yet Built") */}
              <AdminFormField label="Product Image" hint="Image upload not yet built — connects to Supabase Storage later.">
                <div style={{
                  border: "2px dashed var(--border)",
                  borderRadius: "4px",
                  padding: "24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}>
                  Image upload — coming soon
                </div>
              </AdminFormField>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "8px" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editTarget ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
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