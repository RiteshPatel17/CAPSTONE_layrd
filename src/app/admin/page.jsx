"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Dashboard (/admin)
// Overview with live stat cards, recent orders, quick actions.
// ─────────────────────────────────────────────
import Link from "next/link";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatusBadge from "@/components/admin/StatusBadge";
import { getOrders } from "@/lib/admin-orders";
import { getCurrentStock } from "@/lib/admin-inventory";
import { getEventInquiriesCount, getWholesaleAppsCount } from "@/lib/admin-stats";

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
        fontSize: "14px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-muted)",
        margin: "0 0 6px",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: "14px",
        fontWeight: 600,
        color: warn ? "#f87171" : "var(--color-cream)",
        lineHeight: "100%",
        margin: 0,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "14px", color: "var(--color-muted)", margin: "5px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [stats, setStats] = useState({ events: 0, wholesale: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
        setStock(await getCurrentStock());
        
        const [events, wholesale] = await Promise.all([
          getEventInquiriesCount(),
          getWholesaleAppsCount()
        ]);
        setStats({ events, wholesale });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="LÄYRD Admin Overview">
        <div style={{ padding: "40px", color: "var(--color-muted)" }}>Loading dashboard...</div>
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
      <div className="admin-card-grid-160" style={{ gap: "20px", marginBottom: "40px" }}>
        <StatCard label="Total Orders"     value={totalOrders}                sub="all time" />
        <StatCard label="Pending Payment"  value={pendingPayment}             sub="awaiting e-transfer" warn={pendingPayment > 0} />
        <StatCard label="Preparing"        value={preparing}                  sub="in progress" />
        <StatCard label="Low / Out Stock"  value={lowStockCount}              sub="flavours needing attention" warn={lowStockCount > 0} />
        <StatCard label="Event Inquiries"  value={stats.events}        sub="pending review" />
        <StatCard label="Wholesale Apps"   value={stats.wholesale}         sub="pending review" />
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
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            margin: 0,
          }}>
            Recent Orders
          </h3>
          <Link href="/admin/orders">
            <span style={{
              fontSize: "14px",
              color: "var(--color-accent)",
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
          <div className="table-responsive">
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
                  <td style={{ color: "var(--color-accent)", fontWeight: 600, fontSize: "16px" }}>{order.id}</td>
                  <td>{order.customer}</td>
                  <td style={{ textTransform: "capitalize", color: "var(--color-sand)", fontSize: "16px" }}>{order.type}</td>
                  <td style={{ fontWeight: 500 }}>${order.total.toFixed(2)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td style={{ color: "var(--color-muted)", fontSize: "16px" }}>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h3 style={{
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-muted)",
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
                color: "var(--color-sand)",
                fontSize: "16px",
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-cream)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--color-sand)"; }}
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
