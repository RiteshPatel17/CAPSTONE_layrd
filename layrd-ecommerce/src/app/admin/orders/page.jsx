"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Orders (/admin/orders)
// Order list with detail panel, line items, status update, CSV export.
// Changing order status updates committed inventory automatically.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
// WHY ORDER_STATUSES still imports from admin-orders.js directly: it's just
// a plain array constant, no Supabase call involved — safe to import
// client-side. Only the actual DATA-FETCHING functions need to go through
// API routes now.
import { ORDER_STATUSES } from "@/lib/admin-orders";

function exportToCSV(orders) {
  const headers = ["Order ID","Customer","Email","Type","Fulfillment","Payment","Pay Status","Items","Subtotal","GST","Delivery","Total","Status","Date"];
  const rows = orders.map((o) => [
    o.id, o.customer, o.email, o.type, o.fulfillment, o.payment, o.paymentStatus,
    o.items, o.subtotal.toFixed(2), o.gst.toFixed(2), o.deliveryFee.toFixed(2), o.total.toFixed(2),
    o.status, o.date,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `layrd-orders-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function InfoRow({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.83rem", marginBottom: "7px" }}>
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      <span style={{ fontWeight: bold ? 600 : 400, color: "var(--color-cream)" }}>{value}</span>
    </div>
  );
}

export default function AdminOrdersPage() {
  // WHY useState([]) + useEffect instead of useState(getOrders): getOrders
  // is now an ASYNC function (real Supabase query) — useState's initializer
  // must be synchronous. We start empty and load real data after mount.
  const [orders,     setOrders]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [filter,     setFilter]    = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected,   setSelected]  = useState(null); // full order with lineItems

  async function refreshOrders() {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    refreshOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const statusOk = filter === "All" || o.status === filter;
    const typeOk   = typeFilter === "All" || o.type === typeFilter;
    return statusOk && typeOk;
  });

  async function handleSelectOrder(order) {
    const res = await fetch(`/api/admin/orders/${order.id}`);
    const data = await res.json();
    setSelected(data.order);
  }

  async function handleStatusChange(id, status) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refreshOrders();
    // Refresh detail panel if it's the selected order
    if (selected?.id === id) {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      setSelected(data.order);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Orders" subtitle="Loading...">
        <div style={{ textAlign: "center", padding: "60px", color: "var(--color-muted)" }}>
          Loading orders...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Orders"
      subtitle={`${orders.length} total · ${orders.filter(o => o.status === "New").length} new`}
      actions={
        <button className="btn btn-ghost btn-sm"
          style={{ fontSize: "0.75rem", border: "1px solid var(--border)" }}
          onClick={() => exportToCSV(filtered)}>
          ↓ Export CSV
        </button>
      }
    >
      {/* ── Filters ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {["All", ...ORDER_STATUSES].map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>{s}</FilterChip>
          ))}
        </div>
        <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
        <div style={{ display: "flex", gap: "5px" }}>
          {["All","regular","event","wholesale"].map((t) => (
            <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}
              style={{ textTransform: "capitalize" }}>{t}</FilterChip>
          ))}
        </div>
      </div>

      {/* ── Layout: table + detail panel ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: selected ? "1fr 340px" : "1fr",
        gap: "20px",
        alignItems: "start",
      }}>
        {/* Table */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          overflow: "auto",
        }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Fulfillment</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--color-muted)", padding: "40px" }}>
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    style={{
                      cursor: "pointer",
                      background: selected?.id === order.id ? "rgba(201,169,110,0.04)" : "transparent",
                      outline: selected?.id === order.id ? "1px solid rgba(201,169,110,0.15)" : "none",
                    }}
                  >
                    <td style={{ color: "var(--color-accent)", fontWeight: 600, fontSize: "0.83rem" }}>{order.id}</td>
                    <td>{order.customer}</td>
                    <td style={{ textTransform: "capitalize", color: "var(--color-sand)", fontSize: "0.83rem" }}>{order.type}</td>
                    <td style={{ textTransform: "capitalize", color: "var(--color-sand)", fontSize: "0.83rem" }}>{order.fulfillment}</td>
                    <td>{order.items}</td>
                    <td style={{ fontWeight: 500 }}>${order.total.toFixed(2)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ color: "var(--color-muted)", fontSize: "0.78rem" }}>{order.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "22px",
            position: "sticky",
            top: "16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-accent)", fontWeight: 600 }}>{selected.id}</div>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-cream)", marginTop: "2px" }}>{selected.customer}</div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", fontSize: "1.1rem" }}>
                ×
              </button>
            </div>

            <InfoRow label="Email"       value={selected.email} />
            <InfoRow label="Type"        value={selected.type} />
            <InfoRow label="Fulfillment" value={selected.fulfillment} />
            <InfoRow label="Payment"     value={selected.payment} />
            <InfoRow label="Date"        value={selected.date} />

            <div style={{ height: "1px", background: "var(--border)", margin: "14px 0" }} />

            {/* Line items */}
            {selected.lineItems && selected.lineItems.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{
                  fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--color-muted)", marginBottom: "8px",
                }}>
                  Items Ordered
                </div>
                {selected.lineItems.map((item) => (
                  <div key={item.id} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: "0.82rem", marginBottom: "5px", color: "var(--color-cream)",
                  }}>
                    <span>{item.flavour} <span style={{ color: "var(--color-muted)" }}>{item.size}</span></span>
                    <span style={{ color: "var(--color-sand)" }}>×{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: "1px", background: "var(--border)", margin: "14px 0" }} />

            <InfoRow label="Subtotal" value={`$${selected.subtotal.toFixed(2)}`} />
            <InfoRow label="Delivery" value={`$${selected.deliveryFee.toFixed(2)}`} />
            <InfoRow label="GST"      value={`$${selected.gst.toFixed(2)}`} />
            <div style={{ marginTop: "6px" }}>
              <InfoRow label="Total" value={`$${selected.total.toFixed(2)}`} bold />
            </div>

            <div style={{ height: "1px", background: "var(--border)", margin: "14px 0" }} />

            {/* Status update */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
                marginBottom: "8px",
              }}>
                Update Status
              </label>
              <select
                className="input"
                value={selected.status}
                onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                style={{ fontSize: "0.85rem" }}
              >
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <p style={{ fontSize: "0.7rem", color: "var(--color-muted)", marginTop: "6px" }}>
                Cancelling or refunding frees inventory automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function FilterChip({ children, active, onClick, style: extra }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 11px",
        fontSize: "0.72rem",
        background: active ? "rgba(201,169,110,0.12)" : "transparent",
        border: `1px solid ${active ? "rgba(201,169,110,0.4)" : "var(--border)"}`,
        borderRadius: "20px",
        color: active ? "var(--color-accent)" : "var(--color-muted)",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        ...extra,
      }}
    >
      {children}
    </button>
  );
}
