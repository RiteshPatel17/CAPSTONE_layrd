"use client";
// ─────────────────────────────────────────────
// LÄYRD – User Profile page (/profile)
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getCurrentUser, getAuthHeader, signOut } from "../../lib/auth.js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "../../lib/pricing.js";
import { Settings, Package, LogOut, HelpCircle, Briefcase, ChevronDown } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        loadOrders();
      }
      setLoading(false);
    }
    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch("/api/orders", { headers: { ...authHeader } });
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setOrders(data || []);
      } catch (err) {
        console.error(err);
        setOrdersError("Couldn't load your orders. Please try again later.");
      } finally {
        setOrdersLoading(false);
      }
    }
    loadUser();
  }, [router]);

  async function handleSignOut() {
    await signOut();
    // Hard navigation clears Next.js's client-side router cache so no
    // page content from this session can linger and resurface later.
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="section" style={{ minHeight: "calc(100vh - 72px)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "orders", label: "Orders", icon: Package },
    { id: "wholesale", label: "Wholesale Account", icon: Briefcase },
    { id: "help", label: "Help & Support", icon: HelpCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="section" style={{ minHeight: "calc(100vh - 72px)" }}>
      <div className="container" style={{ maxWidth: "1000px" }}>
        
        <div style={{ marginBottom: "48px" }}>
          <h1 style={{ marginBottom: "8px" }}>
            My Account
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Manage your orders, preferences, and settings.
          </p>
          <div className="divider-accent" style={{ marginTop: "16px" }} />
        </div>

        <div>
          
          {/* User Header */}
          <div className="card" style={{ padding: "32px", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--bg-soft)", color: "var(--text-main)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 600, border: "1px solid var(--border-soft)" }}>
                {user.profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: "clamp(24px, 4vw, 32px)", color: "var(--text-main)", marginBottom: "4px" }}>
                  {user.profile?.full_name || "User"}
                </h3>
                <p style={{ fontSize: "20px", color: "var(--accent)" }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Accordion List */}
          <div className="card" style={{ overflow: "hidden" }}>
            {tabs.map((tab, idx) => {
              const active = activeTab === tab.id;
              const isLast = idx === tabs.length - 1;
              return (
                <div key={tab.id} className="accordion-item" style={{ borderBottom: isLast ? "none" : "1px solid var(--border-soft)" }}>
                  <button
                    className="accordion-trigger"
                    onClick={() => setActiveTab(active ? null : tab.id)}
                    style={{ padding: "24px 32px", background: active ? "var(--bg-soft)" : "transparent", transition: "background 0.2s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <tab.icon size={22} style={{ color: "var(--accent)" }} />
                      <span style={{ fontWeight: 500, fontSize: "20px" }}>{tab.label}</span>
                    </div>
                    <ChevronDown
                      size={20}
                      style={{
                        transform: active ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                        color: "var(--text-muted)",
                      }}
                    />
                  </button>
                  
                  {active && (
                    <div className="accordion-content" style={{ padding: "0 32px 32px 32px", background: "var(--bg-soft)" }}>
                      {tab.id === "orders" && (
                        <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-soft)" }}>
                          {ordersLoading ? (
                            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading your orders...</p>
                          ) : ordersError ? (
                            <p style={{ textAlign: "center", color: "#ef4444" }}>{ordersError}</p>
                          ) : orders.length === 0 ? (
                            <div style={{ textAlign: "center" }}>
                              <Package size={48} strokeWidth={1} style={{ margin: "0 auto 16px", color: "var(--border)" }} />
                              <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                                You haven't placed any orders yet.
                              </p>
                              <Link href="/shop">
                                <button className="btn btn-primary">
                                  Start Shopping
                                </button>
                              </Link>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {orders.map((order) => (
                                <div
                                  key={order.id}
                                  style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    flexWrap: "wrap", gap: "8px",
                                    background: "var(--bg-card)", border: "1px solid var(--border-soft)",
                                    borderRadius: "6px", padding: "16px 20px",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                      Order #{(order.order_number || order.id).toString().slice(0, 8)}
                                    </div>
                                    <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                      {" · "}{(order.order_items || []).length} item{(order.order_items || []).length !== 1 ? "s" : ""}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{formatPrice(order.total)}</div>
                                    <div style={{ fontSize: "14px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                                      {order.status} · {order.payment_status}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {tab.id === "wholesale" && (
                        <div style={{ textAlign: "center", paddingTop: "24px", borderTop: "1px solid var(--border-soft)" }}>
                          <Briefcase size={48} strokeWidth={1} style={{ margin: "0 auto 16px", color: "var(--border)" }} />
                          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                            Interested in carrying LÄYRD at your business?
                          </p>
                          <Link href="/wholesale">
                            <button className="btn btn-primary">
                              Apply for Wholesale
                            </button>
                          </Link>
                        </div>
                      )}
                      {tab.id === "help" && (
                        <div style={{ textAlign: "center", paddingTop: "24px", borderTop: "1px solid var(--border-soft)" }}>
                          <HelpCircle size={48} strokeWidth={1} style={{ margin: "0 auto 16px", color: "var(--border)" }} />
                          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                            Need assistance with your order or have questions?
                          </p>
                          <Link href="/contact">
                            <button className="btn btn-primary">
                              Contact Us
                            </button>
                          </Link>
                        </div>
                      )}
                      {tab.id === "settings" && (
                        <div style={{ textAlign: "center", paddingTop: "24px", borderTop: "1px solid var(--border-soft)" }}>
                          <Settings size={48} strokeWidth={1} style={{ margin: "0 auto 16px", color: "var(--border)" }} />
                          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
                            Settings management is coming soon.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "32px", display: "flex", justifyContent: "center" }}>
            <button
              onClick={handleSignOut}
              className="btn btn-outline"
              style={{ padding: "12px 32px", borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
