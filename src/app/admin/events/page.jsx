"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { supabase } from "@/lib/supabase";

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id, newStatus) {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      
      setEvents(events.map(ev => ev.id === id ? { ...ev, status: newStatus } : ev));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <AdminLayout>
      <AdminPageHeader title="Events" subtitle="Review and manage event inquiries" />
      
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-muted)" }}>Loading events...</div>
      ) : error ? (
        <div style={{ padding: "40px", textAlign: "center", color: "red" }}>{error}</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="No event inquiries yet"
          message="When customers submit event inquiries, they will appear here for your review."
        />
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <div className="table-responsive">
<table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "16px 12px", width: "15%" }}>Date</th>
                <th style={{ padding: "16px 12px", width: "15%" }}>Event Type</th>
                <th style={{ padding: "16px 12px", width: "10%" }}>Guest Count</th>
                <th style={{ padding: "16px 12px", width: "10%" }}>Cans</th>
                <th style={{ padding: "16px 12px", width: "20%" }}>Notes</th>
                <th style={{ padding: "16px 12px", width: "10%" }}>Status</th>
                <th style={{ padding: "16px 12px", width: "20%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>
                  <td style={{ padding: "16px 12px" }}>
                    <div style={{ fontWeight: 500, color: "var(--color-sand)", marginBottom: "4px" }}>
                      {new Date(ev.event_date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                    </div>
                    <div style={{ fontSize: "16px", color: "var(--color-muted)" }}>
                      Submitted {new Date(ev.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px" }}>{ev.event_type}</td>
                  <td style={{ padding: "16px 12px" }}>{ev.guest_count || "-"}</td>
                  <td style={{ padding: "16px 12px" }}>
                    {ev.core_cans + ev.limited_cans}
                    <div style={{ fontSize: "14px", color: "var(--color-muted)", marginTop: "2px" }}>
                      {ev.core_cans} core, {ev.limited_cans} limited
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px", maxWidth: "200px" }}>
                    <div style={{ 
                      whiteSpace: "nowrap", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis",
                      fontSize: "16px",
                      color: "var(--color-text)"
                    }} title={ev.notes}>
                      {ev.notes || "-"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 12px" }}>
                    <span className={`badge ${
                      ev.status === "Approved" ? "badge-green" : 
                      ev.status === "Rejected" ? "badge-red" : "badge-gold"
                    }`}>
                      {ev.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      {ev.status === "Pending" ? (
                        <>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: "6px 12px", fontSize: "14px", fontWeight: 600, borderColor: "var(--color-success)", color: "var(--color-success)" }}
                            onClick={() => handleUpdateStatus(ev.id, "Approved")}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: "6px 12px", fontSize: "14px", fontWeight: 600, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
                            onClick={() => handleUpdateStatus(ev.id, "Rejected")}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: "16px", color: "var(--color-muted)" }}>No actions available</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </div>
      )}
    </AdminLayout>
  );
}
