"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { getAuthHeader } from "@/lib/auth";
import * as Icons from "lucide-react";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Detail Modal
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const modalRef = useRef(null);

  // Actions
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events", { headers: { ...(await getAuthHeader()) } });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper for badges and filters
  const isUpcoming = (dateStr, status) => {
    if (status === "Rejected" || status === "Cancelled") return false;
    const evDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return evDate >= today;
  };

  const isPast = (dateStr) => {
    const evDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return evDate < today;
  };

  const isWithinDays = (dateStr, days) => {
    const evDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const future = new Date(today);
    future.setDate(today.getDate() + days);
    return evDate >= today && evDate <= future;
  };

  // Stats
  const pendingCount = events.filter(e => e.status === "Pending").length;
  const approvedCount = events.filter(e => e.status === "Approved").length;
  const upcomingCount = events.filter(e => isUpcoming(e.event_date, e.status)).length;

  // Filtering
  const filtered = useMemo(() => {
    return events.filter(ev => {
      let match = true;
      
      // Search (event type, meaningful ID if shown)
      if (search) {
        const term = search.toLowerCase();
        const typeMatch = (ev.event_type || "").toLowerCase().includes(term);
        // We do not search the internal customer_id as requested
        match = typeMatch;
      }

      // Status
      if (statusFilter !== "All" && ev.status !== statusFilter) match = false;

      // Date Filter
      if (dateFilter === "Upcoming" && !isUpcoming(ev.event_date, ev.status)) match = false;
      if (dateFilter === "Next 7 Days" && !isWithinDays(ev.event_date, 7)) match = false;
      if (dateFilter === "Next 30 Days" && !isWithinDays(ev.event_date, 30)) match = false;
      if (dateFilter === "Past Events" && !isPast(ev.event_date)) match = false;

      return match;
    });
  }, [events, search, statusFilter, dateFilter]);

  const hasActiveFilters = search || statusFilter !== "All" || dateFilter !== "All";
  const clearFilters = () => { setSearch(""); setStatusFilter("All"); setDateFilter("All"); };

  // Modal Handlers
  const openModal = (id) => {
    setSelectedEventId(id);
    setDetailError(null);
    setIsDetailLoading(true);
    setActionError(null);
    setActionSuccess(null);
    setConfirmAction(null);
    
    // Lock scroll
    document.body.style.overflow = "hidden";
    
    // Simulate tiny load for UX
    setTimeout(() => {
      const found = events.find(e => e.id === id);
      if (!found) setDetailError("Event details could not be loaded.");
      setIsDetailLoading(false);
      // Focus trap setup after render
      setTimeout(() => {
        if (modalRef.current) modalRef.current.focus();
      }, 0);
    }, 200);
  };

  const closeModal = () => {
    if (isSaving) return; // Prevent closing while saving
    setSelectedEventId(null);
    setDetailError(null);
    setConfirmAction(null);
    document.body.style.overflow = "auto";
  };

  const handleModalKeyDown = (e) => {
    if (e.key === "Escape" && !isSaving) {
      closeModal();
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Actions
  const handleUpdateStatus = async (id, newStatus) => {
    setIsSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      
      setEvents(events.map(ev => ev.id === id ? { ...ev, status: newStatus } : ev));
      setActionSuccess(`Successfully marked as ${newStatus}`);
      setConfirmAction(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      {/* ── Internal Page Header ── */}
      <div className="events-page-header" style={{
        display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
        gap: "16px", marginBottom: "24px", paddingTop: "8px"
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "var(--text-main)" }}>Events</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "16px" }}>
            Review and manage event inquiries
          </p>
        </div>
      </div>

      {/* ── Live Summary Badges ── */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
        <div style={{ background: "var(--bg-card)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-soft)", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#eab308" }}></span>
          <strong style={{ color: "var(--text-main)" }}>{pendingCount}</strong> <span style={{ color: "var(--text-muted)" }}>Pending</span>
        </div>
        <div style={{ background: "var(--bg-card)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-soft)", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }}></span>
          <strong style={{ color: "var(--text-main)" }}>{approvedCount}</strong> <span style={{ color: "var(--text-muted)" }}>Approved</span>
        </div>
        <div style={{ background: "var(--bg-card)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-soft)", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }}></span>
          <strong style={{ color: "var(--text-main)" }}>{upcomingCount}</strong> <span style={{ color: "var(--text-muted)" }}>Upcoming</span>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="events-filter-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px", background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
        <input 
          type="text" placeholder="Search event type..." 
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="input" style={{ flex: "1 1 240px", margin: 0 }}
        />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: "1 1 140px", margin: 0 }}>
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select className="input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ flex: "1 1 140px", margin: 0 }}>
          <option value="All">All Dates</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Next 7 Days">Next 7 Days</option>
          <option value="Next 30 Days">Next 30 Days</option>
          <option value="Past Events">Past Events</option>
        </select>
        {hasActiveFilters && (
          <button className="btn btn-ghost" onClick={clearFilters} style={{ height: "48px" }}>Clear Filters</button>
        )}
      </div>

      <div style={{ marginBottom: "16px", fontSize: "14px", color: "var(--text-muted)" }}>
        Showing {filtered.length} of {events.length} inquiries
      </div>

      {/* ── Main List Layout ── */}
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
            Loading events...
          </div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#ef4444", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
            {error}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Icons.Calendar size={48} color="var(--border-strong)" />}
            title="No event inquiries yet"
            message="When customers submit event inquiries, they will appear here for your review."
          />
        ) : (
          <>
            {/* Desktop Table (Visible >= 1024px) */}
            <div className="events-desktop-table" style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div className="table-responsive" style={{ margin: 0, border: "none" }}>
                <table className="table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                  <thead style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                    <tr>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Date</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Type</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Guests</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cans</th>
                      <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                      <th style={{ padding: "16px 20px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 20px" }}>
                          No inquiries match your filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((ev) => (
                        <tr
                          key={ev.id}
                          onClick={() => openModal(ev.id)}
                          className="events-table-row"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(ev.id); } }}
                          style={{
                            cursor: "pointer",
                            background: selectedEventId === ev.id ? "var(--bg-soft)" : "transparent",
                            borderBottom: "1px solid var(--border-soft)",
                            transition: "background 0.15s",
                          }}
                        >
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>
                              {new Date(ev.event_date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                              Submitted {new Date(ev.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            {ev.customerName ? (
                              <>
                                <div style={{ fontSize: "15px", color: "var(--text-main)", fontWeight: 500 }}>{ev.customerName}</div>
                                {ev.customerEmail && ev.customerEmail !== ev.customerName && (
                                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{ev.customerEmail}</div>
                                )}
                              </>
                            ) : (
                              <span style={{ fontSize: "15px", color: "var(--text-muted)", fontStyle: "italic" }}>
                                Customer details unavailable
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "16px 20px", color: "var(--text-main)", fontSize: "15px", fontWeight: 500 }}>
                            {ev.event_type}
                          </td>
                          <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: "15px" }}>
                            {ev.guest_count || "—"}
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-main)" }}>
                              {ev.core_cans + ev.limited_cans} Total
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {ev.core_cans} core · {ev.limited_cans} limited
                            </div>
                          </td>
                          <td style={{ padding: "16px 20px" }}>
                            <StatusBadge status={ev.status} />
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "right" }}>
                            <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "14px" }} tabIndex={-1}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards (Visible < 1024px) */}
            <div className="events-mobile-cards" style={{ display: "none", flexDirection: "column", gap: "16px" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                  No inquiries match your filters.
                </div>
              ) : (
                filtered.map((ev) => (
                  <div 
                    key={ev.id} 
                    onClick={() => openModal(ev.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(ev.id); } }}
                    style={{ 
                      background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", 
                      padding: "16px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-main)", marginBottom: "4px" }}>
                          {new Date(ev.event_date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-main)" }}>{ev.event_type}</div>
                      </div>
                      <StatusBadge status={ev.status} />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "14px", color: "var(--text-muted)" }}>
                      <div><strong style={{ fontWeight: 600 }}>Cans:</strong> {ev.core_cans + ev.limited_cans}</div>
                      <div><strong style={{ fontWeight: 600 }}>Guests:</strong> {ev.guest_count || "—"}</div>
                    </div>

                    <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                      {ev.customerName ? (
                        <>
                          <strong style={{ fontWeight: 600, color: "var(--text-main)" }}>{ev.customerName}</strong>
                          {ev.customerEmail && ev.customerEmail !== ev.customerName && ` · ${ev.customerEmail}`}
                        </>
                      ) : (
                        <span style={{ fontStyle: "italic" }}>Customer details unavailable</span>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "12px", textAlign: "center", color: "var(--accent)", fontWeight: 600, fontSize: "14px" }}>
                      View Details
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Event Detail Modal ── */}
      {selectedEventId && (
        <div className="events-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div 
            ref={modalRef} tabIndex={-1} onKeyDown={handleModalKeyDown} role="dialog" aria-modal="true" aria-labelledby="event-modal-title"
            style={{ background: "var(--bg-main)", width: "100%", maxWidth: "720px", height: "100%", maxHeight: "90vh", borderRadius: "12px", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", outline: "none" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-soft)", background: "var(--bg-card)", borderRadius: "12px 12px 0 0" }}>
              <div>
                <button onClick={closeModal} disabled={isSaving} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "13px", height: "auto", marginBottom: "8px", marginLeft: "-8px", opacity: isSaving ? 0.5 : 1 }}>
                  ← Back to Events
                </button>
                <div id="event-modal-title" style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)", lineHeight: 1 }}>
                  Event Details
                </div>
              </div>
              <button onClick={closeModal} disabled={isSaving} style={{ background: "none", border: "none", cursor: isSaving ? "not-allowed" : "pointer", color: "var(--text-muted)", fontSize: "28px", padding: "4px", alignSelf: "flex-start", opacity: isSaving ? 0.5 : 1 }}>
                ×
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: "1 1 auto", padding: "24px", background: "var(--bg-main)" }}>
              {isDetailLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading details...</div>
              ) : detailError ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
                  <p style={{ marginBottom: "16px" }}>{detailError}</p>
                  <button className="btn btn-outline" onClick={() => openModal(selectedEventId)}>Try Again</button>
                </div>
              ) : selectedEvent ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Notifications */}
                  {actionSuccess && (
                    <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22c55e", padding: "12px 16px", borderRadius: "6px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }} role="status">
                      <Icons.Check size={18} /> {actionSuccess}
                    </div>
                  )}
                  {actionError && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "12px 16px", borderRadius: "6px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }} role="alert">
                      <Icons.AlertCircle size={18} /> {actionError}
                    </div>
                  )}

                  {/* Header info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border-soft)" }}>
                    <div>
                      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px", color: "var(--text-main)" }}>
                        {selectedEvent.event_type}
                      </h2>
                      <div style={{ fontSize: "15px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div><strong>Event Date:</strong> {new Date(selectedEvent.event_date).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</div>
                        <div><strong>Submitted:</strong> {new Date(selectedEvent.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={selectedEvent.status} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
                    
                    {/* Customer Info */}
                    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
                        Customer
                      </h3>
                      {selectedEvent.customerName ? (
                        <div style={{ fontSize: "15px", color: "var(--text-main)", lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 600 }}>{selectedEvent.customerName}</div>
                          {selectedEvent.customerEmail && selectedEvent.customerEmail !== selectedEvent.customerName && (
                            <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>{selectedEvent.customerEmail}</div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: "15px", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
                          Customer details unavailable.
                        </div>
                      )}
                    </div>

                    {/* Quantities */}
                    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
                        Quantities
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "15px", color: "var(--text-main)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Core Cans:</span>
                          <span style={{ fontWeight: 600 }}>{selectedEvent.core_cans}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Limited Cans:</span>
                          <span style={{ fontWeight: 600 }}>{selectedEvent.limited_cans}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border-soft)" }}>
                          <strong style={{ color: "var(--text-main)" }}>Total Cans:</strong>
                          <strong style={{ color: "var(--text-main)" }}>{selectedEvent.core_cans + selectedEvent.limited_cans}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px" }}>
                          <span style={{ color: "var(--text-muted)" }}>Guests:</span>
                          <span style={{ fontWeight: 600 }}>{selectedEvent.guest_count || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deposit */}
                    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
                        Deposit
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "15px", color: "var(--text-main)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Estimated Total:</span>
                          <span style={{ fontWeight: 600 }}>${Number(selectedEvent.estimated_total || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Deposit (50%):</span>
                          <span style={{ fontWeight: 600 }}>${Number(selectedEvent.deposit_amount || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border-soft)" }}>
                          <strong style={{ color: "var(--text-main)" }}>Status:</strong>
                          <strong style={{ color: selectedEvent.deposit_paid ? "#22c55e" : "#eab308" }}>
                            {selectedEvent.deposit_paid ? "Paid" : "Not Paid"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                      Customer Notes
                    </h3>
                    <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
                      {selectedEvent.notes || "No additional notes provided."}
                    </p>
                  </div>

                </div>
              ) : null}
            </div>

            {/* Actions Footer */}
            {selectedEvent && !isDetailLoading && !detailError && (
              <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-soft)", background: "var(--bg-card)", borderRadius: "0 0 12px 12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {selectedEvent.status === "Pending" ? (
                  confirmAction ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                        Confirm you want to <strong>{confirmAction.toLowerCase()}</strong> this event?
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => setConfirmAction(null)}
                          disabled={isSaving}
                          className="btn btn-ghost"
                          style={{ fontSize: "14px", padding: "8px 16px", textTransform: "none", letterSpacing: "normal" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedEvent.id, confirmAction === 'Approve' ? 'Approved' : 'Rejected')}
                          disabled={isSaving}
                          className="btn btn-primary"
                          style={{ background: confirmAction === 'Reject' ? "#ef4444" : "var(--accent)", fontSize: "14px", padding: "8px 16px", textTransform: "none", letterSpacing: "normal" }}
                        >
                          {isSaving ? "Saving..." : `Yes, ${confirmAction}`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!selectedEvent.deposit_paid && (
                        <span style={{ fontSize: "14px", color: "#eab308" }}>
                          Deposit not yet paid — this shouldn't normally happen unless the customer abandoned checkout.
                        </span>
                      )}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => setConfirmAction('Reject')}
                          disabled={isSaving}
                          style={{ color: "#ef4444", borderColor: "#ef4444", fontSize: "14px", padding: "8px 16px", textTransform: "none", letterSpacing: "normal" }}
                        >
                          Reject Inquiry
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => setConfirmAction('Approve')}
                          disabled={isSaving || !selectedEvent.deposit_paid}
                          title={!selectedEvent.deposit_paid ? "Deposit must be paid before approving" : undefined}
                          style={{ fontSize: "14px", padding: "8px 16px", textTransform: "none", letterSpacing: "normal" }}
                        >
                          Approve Inquiry
                        </button>
                      </div>
                    </>
                  )
                ) : (
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "15px", color: "var(--text-muted)" }}>
                      Decision finalized: <strong style={{ color: "var(--text-main)" }}>{selectedEvent.status}</strong>
                    </span>
                    <button className="btn btn-outline" onClick={closeModal} style={{ fontSize: "14px", padding: "8px 16px", textTransform: "none", letterSpacing: "normal" }}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CSS Styles ── */}
      <style dangerouslySetInnerHTML={{__html: `
        .events-filter-toolbar input,
        .events-filter-toolbar select {
          min-width: 0;
          height: 48px;
          padding: 0 1rem;
          font-size: 16px;
          line-height: 1.2;
        }

        .events-table-row:hover td {
          background: rgba(0,0,0,0.02);
        }

        /* 1280px Scale text slightly */
        @media (max-width: 1279px) {
          .events-desktop-table th {
            font-size: 13px !important;
            padding: 14px 16px !important;
          }
          .events-table-row td {
            font-size: 14px !important;
            padding: 14px 16px !important;
          }
        }

        /* 1024px Mobile table behavior */
        @media (max-width: 1023px) {
          .events-desktop-table {
            display: none !important;
          }
          .events-mobile-cards {
            display: flex !important;
          }
        }
      `}} />
    </AdminLayout>
  );
}