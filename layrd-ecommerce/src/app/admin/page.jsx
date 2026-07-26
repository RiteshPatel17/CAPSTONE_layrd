"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Dashboard (/admin)
// Overview with live stat cards, recent orders, quick actions.
// ─────────────────────────────────────────────
import Link from "next/link";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatusBadge from "@/components/admin/StatusBadge";

// Mock counts for pages not yet built (Events/Wholesale admin sections
// don't exist yet — tracked separately, not part of today's fix)
const MOCK = { eventInquiries: 3, wholesaleApps: 2, upcomingDrops: 2 };

function StatCard({ label, value, sub, warn }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${warn ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
      borderRadius: "6px",
      padding: "20px 22px",
      transition: "border-color 0.2s",
    }}>
      <p style={{
        fontSize: "0.66rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
        margin: "0 0 6px",
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "2.2rem",
        fontWeight: 600,
        color: warn ? "#f87171" : "var(--text-main)",
        lineHeight: 1,
        margin: 0,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "5px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  // WHY useState([]) + useEffect instead of useState(getOrders)/useState(calculateStock):
  // both getOrders() (admin-orders.js) and calculateStock() (admin-inventory.js) use
  // getSupabaseAdmin() — the SERVICE ROLE key — which per TRD 7.1 must never run inside
  // a "use client" component (calling it here directly throws "supabaseKey is required").
  // We must fetch through the server-side bridge routes /api/admin/orders and
  // /api/admin/inventory instead, same pattern as admin/orders/page.jsx.
  const [orders, setOrders]   = useState([]);
  const [stock, setStock]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      // Fetch both in parallel since neither depends on the other's result.
      const [ordersRes, inventoryRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/inventory"),
      ]);
      const ordersData    = await ordersRes.json();
      const inventoryData = await inventoryRes.json();

      setOrders(ordersData.orders || []);
      setStock(inventoryData.stock || []); // note: inventory route returns { batches, stock } — we only need stock here
      setLoading(false);
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Loading...">
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading dashboard...
        </div>
      </AdminLayout>
    );
  }

  const totalOrders     = orders.length;
  const pendingPayment  = orders.filter((o) => o.status === "Pending Payment").length;
  const preparing       = orders.filter((o) => o.status === "Preparing").length;
  const lowStockCount   = stock.filter((s) => s.status !== "OK").length;
  const recentOrders    = [...orders].slice(0, 6);

  return (
    <AdminLayout title="Dashboard" subtitle="LÄYRD Admin Overview">

      {/* ── Stat cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
        gap: "14px",
        marginBottom: "36px",
      }}>
        <StatCard label="Total Orders"     value={totalOrders}                sub="all time" />
        <StatCard label="Pending Payment"  value={pendingPayment}             sub="awaiting e-transfer" warn={pendingPayment > 0} />
        <StatCard label="Preparing"        value={preparing}                  sub="in progress" />
        <StatCard label="Low / Out Stock"  value={lowStockCount}              sub="flavours needing attention" warn={lowStockCount > 0} />
        <StatCard label="Event Inquiries"  value={MOCK.eventInquiries}        sub="pending review" />
        <StatCard label="Wholesale Apps"   value={MOCK.wholesaleApps}         sub="pending review" />
      </div>

      {/* ── Recent orders ── */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <h3 style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            margin: 0,
          }}>
            Recent Orders
          </h3>
          <Link href="/admin/orders">
            <span style={{
              fontSize: "0.75rem",
              color: "var(--accent)",
              cursor: "pointer",
            }}>
              View all →
            </span>
          </Link>
        </div>

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
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.83rem" }}>{order.id}</td>
                  <td>{order.customer}</td>
                  <td style={{ textTransform: "capitalize", color: "var(--text-muted)", fontSize: "0.83rem" }}>{order.type}</td>
                  <td style={{ fontWeight: 500 }}>${order.total.toFixed(2)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h3 style={{
          fontSize: "0.68rem",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          margin: "0 0 10px",
        }}>
          Quick Actions
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { href: "/admin/products",   label: "Add Product" },
            { href: "/admin/inventory",  label: "Add Batch" },
            { href: "/admin/orders",     label: "View Orders" },
            { href: "/admin/events",     label: "Event Inquiries" },
            { href: "/admin/wholesale",  label: "Wholesale Apps" },
            { href: "/admin/settings",   label: "Settings" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <button style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: "var(--text-muted)",
                fontSize: "0.78rem",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text-main)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                {a.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}