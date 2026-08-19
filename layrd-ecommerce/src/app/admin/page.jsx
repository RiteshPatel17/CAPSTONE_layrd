"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatusBadge from "@/components/admin/StatusBadge";
import { getAdminDashboard } from "@/lib/admin-dashboard-client";
import { AlertCircle, AlertTriangle, ArrowRight, Package, ShoppingBag, Store, Calendar, Tag, PackageX } from "lucide-react";

// Helper components
function StatCard({ title, value, icon: Icon, warn, danger }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${danger ? "rgba(239, 68, 68, 0.4)" : warn ? "rgba(245, 158, 11, 0.4)" : "var(--border-soft)"}`,
      borderRadius: "10px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: "110px", // Just enough height to look structured but compact
      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      transition: "transform 0.2s, box-shadow 0.2s"
    }} className="stat-card-hover">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <p style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-muted)",
          margin: 0,
          lineHeight: "1.2"
        }}>{title}</p>
        <div style={{ 
          color: danger ? "#ef4444" : warn ? "#f59e0b" : "var(--text-muted)",
          opacity: 0.9,
          background: danger ? "rgba(239, 68, 68, 0.1)" : warn ? "rgba(245, 158, 11, 0.1)" : "var(--bg-soft)",
          padding: "6px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      </div>
      <p style={{
        fontSize: "28px",
        fontWeight: 600,
        color: danger ? "#ef4444" : warn ? "#f59e0b" : "var(--text-main)",
        margin: "12px 0 0 0",
        lineHeight: 1,
        letterSpacing: "-0.02em"
      }}>{value}</p>
    </div>
  );
}

function AttentionItem({ item }) {
  const isHigh = item.severity === "high";
  const Icon = isHigh ? AlertCircle : AlertTriangle;
  return (
    <Link href={item.href} style={{ textDecoration: "none" }}>
      <div style={{
        background: isHigh ? "rgba(239, 68, 68, 0.04)" : "rgba(245, 158, 11, 0.04)",
        border: `1px solid ${isHigh ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
        borderRadius: "6px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        transition: "background 0.2s"
      }} className="attention-item-hover">
        <Icon size={18} style={{ color: isHigh ? "#ef4444" : "#f59e0b", marginTop: "2px", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)", margin: "0 0 4px" }}>
            {item.title}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {item.description}
          </p>
        </div>
        <ArrowRight size={16} style={{ color: "var(--text-muted)", opacity: 0.5, marginTop: "2px" }} />
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getAdminDashboard();
        if (res.ok) {
          setData(res);
        } else {
          setError(res.error || "Failed to load dashboard data");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
          gap: "16px", marginBottom: "32px", paddingTop: "8px"
        }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>Dashboard</h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "15px" }}>
              Operational Overview
            </p>
          </div>
        </div>
        <div style={{ padding: "40px 0", color: "var(--text-muted)", fontSize: "14px" }}>Loading workspace...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
          gap: "16px", marginBottom: "32px", paddingTop: "8px"
        }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>Dashboard</h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "15px" }}>
              Operational Overview
            </p>
          </div>
        </div>
        <div style={{ 
          padding: "16px", 
          background: "rgba(239, 68, 68, 0.1)", 
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "6px",
          color: "#ef4444",
          fontSize: "14px"
        }}>
          <strong>Error loading dashboard:</strong> {error}
        </div>
      </AdminLayout>
    );
  }

  const { stats = {}, recentOrders = [], attentionItems = [] } = data || {};

  return (
    <AdminLayout>
      
      {/* ── Internal Page Header ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
        gap: "16px", marginBottom: "32px", paddingTop: "8px"
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>Dashboard</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "15px" }}>
            Operational Overview
          </p>
        </div>
      </div>

      {/* ── Top Level Stats (Horizontal Grid) ── */}
      <div className="admin-dashboard-kpi-grid">
        <StatCard title="Pending Orders" value={(stats.pendingPayment || 0) + (stats.preparing || 0)} icon={ShoppingBag} />
        <StatCard title="Out of Stock" value={stats.outOfStock || 0} icon={PackageX} danger={stats.outOfStock > 0} />
        <StatCard title="Low Stock" value={stats.lowStock || 0} icon={Package} warn={stats.lowStock > 0} />
        <StatCard title="Event Inquiries" value={stats.newEventInquiries || 0} icon={Calendar} warn={stats.newEventInquiries > 0} />
        <StatCard title="Wholesale Apps" value={stats.newWholesaleApplications || 0} icon={Store} warn={stats.newWholesaleApplications > 0} />
        <StatCard title="Pending AI Labels" value={stats.pendingAiLabels || 0} icon={Tag} warn={stats.pendingAiLabels > 0} />
      </div>

      <div className="admin-dashboard-lower-grid">
        
        {/* ── Left Column: Recent Orders ── */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-soft)",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)", margin: 0 }}>Recent Orders</h2>
            <Link href="/admin/orders" style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
              View All
            </Link>
          </div>
          
          <div className="table-responsive" style={{ margin: 0 }}>
            {recentOrders.length > 0 ? (
              <table className="table" style={{ margin: 0, width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Order</th>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                    <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                    <th style={{ padding: "12px 20px", textAlign: "right", fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <td style={{ padding: "12px 20px", fontSize: "14px", fontWeight: 500 }}>
                        <Link href={`/admin/orders`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                          {order.orderNumber || order.id}
                        </Link>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: "14px", color: "var(--text-main)" }}>
                        {order.customerName}
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", textTransform: "capitalize" }}>
                          {order.deliveryMethod}
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontSize: "14px", fontWeight: 500, color: "var(--text-main)" }}>
                        ${Number(order.total || 0).toFixed(2)}
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", fontWeight: 400 }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                No recent orders.
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Attention Needed & Quick Actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Attention Items */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-soft)",
            borderRadius: "8px",
            padding: "16px 20px"
          }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={16} /> Needs Attention
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {attentionItems.length > 0 ? (
                attentionItems.map(item => (
                  <AttentionItem key={item.id} item={item} />
                ))
              ) : (
                <div style={{ fontSize: "14px", color: "var(--text-muted)", padding: "12px 0" }}>
                  All clear! No items need your immediate attention.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-soft)",
            borderRadius: "8px",
            padding: "16px 20px"
          }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-main)", margin: "0 0 16px" }}>
              Quick Actions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { href: "/admin/inventory", label: "Update Stock Levels" },
                { href: "/admin/products", label: "Manage Products" },
                { href: "/admin/availability", label: "Store Availability" },
                { href: "/admin/settings", label: "General Settings" },
              ].map(action => (
                <Link key={action.href} href={action.href} style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-soft)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-main)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "background 0.2s, border-color 0.2s"
                  }} className="quick-action-hover">
                    {action.label}
                    <ArrowRight size={16} style={{ opacity: 0.5 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .admin-dashboard-kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: clamp(0.75rem, 1.2vw, 1.25rem);
          margin-bottom: 32px;
        }
        @media (max-width: 1200px) {
          .admin-dashboard-kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .admin-dashboard-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .admin-dashboard-lower-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 999px) {
          .admin-dashboard-lower-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .stat-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .attention-item-hover:hover {
          filter: brightness(0.96);
        }
        .quick-action-hover:hover {
          background: var(--bg-soft);
          border-color: var(--border);
        }
        [data-theme='night'] .attention-item-hover:hover,
        [data-theme='night'] .quick-action-hover:hover {
          filter: brightness(1.2);
        }
      `}} />
    </AdminLayout>
  );
}