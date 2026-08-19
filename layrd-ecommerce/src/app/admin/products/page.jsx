"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import ConfirmModal from "@/components/admin/ConfirmModal";
import AdminFormField from "@/components/admin/AdminFormField";
import {
  getProducts, createProduct, updateProduct, deleteProduct, toggleFeatured,
} from "@/lib/admin-products";
import {
  PRODUCT_CATEGORIES, FLAVOUR_TYPES, PRODUCT_SIZES, PRODUCT_STATUSES,
} from "@/lib/product-options";
import { supabase } from "@/lib/supabase";

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

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
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterFeatured, setFilterFeatured] = useState("All");
  const [errorAlert, setErrorAlert] = useState("");

  // Form Modal State
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingFeaturedId, setProcessingFeaturedId] = useState(null);

  // Accessibility Refs
  const modalRef = useRef(null);
  const lastActiveElement = useRef(null);

  async function loadProducts() {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      const data = await getProducts(accessToken);
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

  // ── Modal Accessibility ──
  useEffect(() => {
    if (showForm) {
      lastActiveElement.current = document.activeElement;
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      if (lastActiveElement.current) {
        lastActiveElement.current.focus();
      }
    }
  }, [showForm]);

  function handleModalKeyDown(e) {
    if (e.key === "Escape" && !saving) {
      closeForm();
    }
  }

  // ── Handlers ──
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
    
    // Strict > 0 validation for price, backup to the HTML5 min="0.01" step="0.01"
    if (parseFloat(form.price) <= 0) {
      setErrorAlert("Price must be greater than zero.");
      setTimeout(() => setErrorAlert(""), 5000);
      return;
    }
    if (!form.ingredients || !form.ingredients.trim()) {
      setErrorAlert("Ingredients are required.");
      setTimeout(() => setErrorAlert(""), 5000);
      return;
    }
    if (!form.allergens || !form.allergens.trim()) {
      setErrorAlert("Allergens are required.");
      setTimeout(() => setErrorAlert(""), 5000);
      return;
    }
    // Image is required, but editing an existing product that already has
    // a saved photo shouldn't force re-uploading a new one every time.
    const hasExistingImage = editTarget && editTarget.image && typeof form.image === "string";
    if (!form.image && !hasExistingImage) {
      setErrorAlert("A product image is required.");
      setTimeout(() => setErrorAlert(""), 5000);
      return;
    }
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (editTarget) {
        await updateProduct(accessToken, editTarget.id, form);
      } else {
        await createProduct(accessToken, form);
      }
      setSaved(true);
      closeForm();
      loadProducts();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorAlert(err.message);
      setTimeout(() => setErrorAlert(""), 7000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const accessToken = await getAccessToken();
      await deleteProduct(accessToken, deleteTarget.id);
      await loadProducts();
      setDeleteTarget(null);
    } catch (err) {
      if (err.message.includes("order_items") || err.message.includes("foreign key")) {
        setErrorAlert(
          `Can't delete "${deleteTarget.name}" — it's referenced by existing orders. To remove it from the shop while keeping order history intact, edit the product and set its Status to "Hidden" instead.`
        );
      } else {
        setErrorAlert(`Failed to delete product: ${err.message}`);
      }
      setTimeout(() => setErrorAlert(""), 10000);
      setDeleteTarget(null);
    }
  }

  async function handleToggleFeatured(product) {
    if (processingFeaturedId) return;
    try {
      setProcessingFeaturedId(product.id);
      const accessToken = await getAccessToken();
      await toggleFeatured(accessToken, product.id, !product.featured);
      await loadProducts();
    } catch (err) {
      setErrorAlert("A maximum of four products can be featured on the homepage.");
      setTimeout(() => setErrorAlert(""), 5000);
    } finally {
      setProcessingFeaturedId(null);
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterCategory("All");
    setFilterStatus("All");
    setFilterFeatured("All");
  }

  // ── Derived Data & Filtering ──
  const featuredCount = products.filter((p) => p.featured).length;

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.flavour.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q);

        const matchesCategory = filterCategory === "All" || p.category === filterCategory;
        const matchesStatus = filterStatus === "All" || p.status === filterStatus;
        const matchesFeatured = filterFeatured === "All" || 
          (filterFeatured === "Featured" ? p.featured : !p.featured);

        return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
      })
      // Hidden products sink to the bottom; everything else keeps its
      // existing relative order (newest first, from getProducts()).
      .sort((a, b) => {
        const aHidden = a.status === "Hidden" ? 1 : 0;
        const bHidden = b.status === "Hidden" ? 1 : 0;
        return aHidden - bHidden;
      });
  }, [products, searchQuery, filterCategory, filterStatus, filterFeatured]);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Products"
        subtitle={
          <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ background: "var(--bg-soft)", padding: "2px 8px", borderRadius: "12px", fontSize: "13px", fontWeight: 500 }}>
              {products.length} Products
            </span>
            <span style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706", padding: "2px 8px", borderRadius: "12px", fontSize: "13px", fontWeight: 500 }}>
              {featuredCount} of 4 featured
            </span>
          </span>
        }
        action={
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + Add Product
          </button>
        }
      />

      {/* Notifications / Alerts */}
      {saved && (
        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", padding: "10px 16px", borderRadius: "4px", fontSize: "14px", marginBottom: "20px" }} role="status" aria-live="polite">
          ✓ Product saved successfully.
        </div>
      )}

      {errorAlert && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "10px 16px", borderRadius: "4px", fontSize: "14px", marginBottom: "20px" }} role="alert">
          {errorAlert}
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-products-toolbar" style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
        <input 
          className="input" 
          placeholder="Search products..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: "1 1 250px", margin: 0, height: "48px" }}
        />
        <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ flex: "1 1 160px", margin: 0 }}>
          <option value="All">All Categories</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: "1 1 160px", margin: 0 }}>
          <option value="All">All Statuses</option>
          {PRODUCT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={filterFeatured} onChange={(e) => setFilterFeatured(e.target.value)} style={{ flex: "1 1 160px", margin: 0 }}>
          <option value="All">All Featured</option>
          <option value="Featured">Featured Only</option>
          <option value="Not Featured">Not Featured</option>
        </select>
        {(searchQuery || filterCategory !== "All" || filterStatus !== "All" || filterFeatured !== "All") && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ height: "48px" }}>Clear Filters</button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px 0" }}>Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", color: "var(--text-muted)" }}>
          {products.length === 0 ? "No products yet. Click + Add Product to get started." : "No products match your filters."}
        </div>
      ) : (
        <div className="admin-products-grid">
          {filteredProducts.map((p) => (
            <div key={p.id} className="admin-product-card" style={{
              display: "flex", flexDirection: "column", background: "var(--bg-card)",
              border: "1px solid var(--border-soft)", borderRadius: "8px", overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)", transition: "transform 0.2s, box-shadow 0.2s"
            }}>
              <div className="admin-product-card-media" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                    No Image
                  </div>
                )}
                
                <button
                  onClick={() => handleToggleFeatured(p)}
                  disabled={processingFeaturedId === p.id}
                  style={{
                    position: "absolute", top: "8px", right: "8px",
                    background: p.featured ? "rgba(255, 255, 255, 0.95)" : "rgba(0,0,0,0.5)",
                    border: "none", borderRadius: "50%",
                    width: "32px", height: "32px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: processingFeaturedId === p.id ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    color: p.featured ? "#f59e0b" : "#ffffff",
                    fontSize: "18px", paddingBottom: "2px",
                    opacity: processingFeaturedId === p.id ? 0.5 : 1
                  }}
                  aria-label={p.featured ? "Remove from homepage" : "Feature on homepage"}
                  title={p.featured ? "Remove from homepage" : "Feature on homepage"}
                >
                  {p.featured ? "★" : "☆"}
                </button>
              </div>
              
              <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "var(--text-main)", lineHeight: "1.2" }}>{p.name}</h3>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                    {p.flavourType} • {p.category}
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent)" }}>${p.price.toFixed(2)}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{p.size}</div>
                </div>
                
                <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                  <StatusBadge status={p.status} />
                </div>
              </div>
              
              <div style={{ padding: "12px 16px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button className="btn btn-primary btn-sm" style={{ padding: "6px 12px" }} onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}>
                  Edit
                </button>
                <button className="btn btn-outline btn-sm" style={{ padding: "6px 12px", color: "#ef4444", borderColor: "#ef4444" }} onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.name}`}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div
            ref={modalRef}
            tabIndex={-1}
            onKeyDown={handleModalKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "24px",
              width: "100%",
              maxWidth: "720px",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "fadeIn 0.2s ease both",
              outline: "none"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border-soft)" }}>
              <h4 id="modal-title" style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                {editTarget ? "Edit Product" : "Add Product"}
              </h4>
              <button
                onClick={closeForm}
                disabled={saving}
                aria-label="Close modal"
                style={{ background: "none", border: "none", cursor: saving ? "not-allowed" : "pointer", color: "var(--text-muted)", fontSize: "28px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="admin-form-grid-2">
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

              <div className="admin-form-grid-4">
                <AdminFormField label="Category" required>
                  <select className="input" value={form.category} onChange={(e) => handleField("category", e.target.value)}>
                    {!PRODUCT_CATEGORIES.includes(form.category) && form.category && (
                      <option value={form.category}>{form.category} (Legacy)</option>
                    )}
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
                    className="input" type="number" step="0.01" min="0.01" required
                    value={form.price}
                    placeholder="8.00"
                    onChange={(e) => handleField("price", e.target.value)}
                  />
                </AdminFormField>
              </div>

              <div className="admin-form-grid-2">
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
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", width: "fit-content" }}>
                  <input
                    type="checkbox"
                    checked={!!form.featured}
                    onChange={(e) => handleField("featured", e.target.checked)}
                  />
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>
                    {form.featured ? "★ Featured on homepage" : "☆ Not featured"}
                  </span>
                </label>
              </AdminFormField>

              <AdminFormField label="Description">
                <textarea
                  className="input"
                  rows={2}
                  value={form.description || ""}
                  placeholder="Short product description shown on the shop page..."
                  onChange={(e) => handleField("description", e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </AdminFormField>

              <div className="admin-form-grid-2">
                <AdminFormField label="Ingredients" required>
                  <textarea
                    className="input"
                    required
                    rows={2}
                    value={form.ingredients || ""}
                    placeholder="Comma-separated ingredient list..."
                    onChange={(e) => handleField("ingredients", e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </AdminFormField>
                <AdminFormField label="Allergens" required hint="e.g. Dairy, Gluten, Nuts, Eggs, Soy">
                  <textarea
                    className="input"
                    required
                    rows={2}
                    value={form.allergens || ""}
                    placeholder="Dairy, Gluten, Soy"
                    onChange={(e) => handleField("allergens", e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </AdminFormField>
              </div>

              <AdminFormField label="Product Image" required hint="Upload a high-quality photo of the product (approx. 4:3 ratio recommended).">
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                  {editTarget && editTarget.image && typeof form.image === 'string' && (
                    <div style={{ width: "80px", height: "60px", flexShrink: 0, borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border-soft)", background: "var(--bg-soft)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="input"
                    onChange={(e) => handleField("image", e.target.files[0])}
                    style={{ padding: "8px", flex: 1, minWidth: "200px" }}
                  />
                </div>
              </AdminFormField>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "16px", borderTop: "1px solid var(--border-soft)", marginTop: "8px" }}>
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

      <style dangerouslySetInnerHTML={{__html: `
        .admin-products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        @media (max-width: 1199px) {
          .admin-products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 899px) {
          .admin-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 639px) {
          .admin-products-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        .admin-form-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .admin-form-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 767px) {
          .admin-form-grid-2, .admin-form-grid-4 {
            grid-template-columns: 1fr;
          }
        }

        .admin-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        }

        .admin-product-card-media {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: var(--bg-soft);
        }

        .admin-products-toolbar select,
        .admin-form-grid-2 select,
        .admin-form-grid-4 select {
          width: 100%;
          min-width: 0;
          height: 48px !important;
          padding: 0 2.5rem 0 1rem !important;
          font-size: 1rem;
          line-height: 1.2;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat, repeat;
          background-position: right .7em top 50%, 0 0;
          background-size: .65em auto, 100%;
        }
      `}} />
    </AdminLayout>
  );
}