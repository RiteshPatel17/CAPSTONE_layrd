"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";

export default function AdminWholesalePage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/business-applications");
      const data = await res.json();
      setApplications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, newStatus) {
    try {
      const res = await fetch("/api/business-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        // Refresh the list
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AdminLayout>
      <AdminPageHeader title="Wholesale" subtitle="Review wholesale applications" />
      
      {loading ? (
        <div style={{ padding: "40px", color: "var(--color-muted)" }}>Loading applications...</div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No wholesale applications yet"
          message="When a business applies on the website, their application will appear here for you to review."
        />
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "auto" }}>
          <div className="table-responsive">
<table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Business Name</th>
                <th>Contact</th>
                <th>Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontSize: "16px", color: "var(--color-muted)" }}>
                    {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{app.business_name}</td>
                  <td>
                    <div style={{ fontSize: "16px", color: "var(--color-sand)" }}>{app.contact_name}</div>
                    <div style={{ fontSize: "16px", color: "var(--color-muted)" }}>
                      {app.email} <br /> {app.phone}
                    </div>
                  </td>
                  <td style={{ maxWidth: "250px" }}>
                    <div style={{ fontSize: "16px", color: "var(--color-sand)" }}>
                      <strong>Address:</strong> {app.address}
                    </div>
                    {app.instagram && (
                      <div style={{ fontSize: "16px", color: "var(--color-sand)" }}>
                        <strong>IG:</strong> {app.instagram}
                      </div>
                    )}
                    {app.notes && (
                      <div style={{ fontSize: "14px", color: "var(--color-muted)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {app.notes}
                      </div>
                    )}
                    {app.permit_url && (
                      <a href={app.permit_url} target="_blank" rel="noreferrer" style={{ fontSize: "14px", color: "var(--color-accent)", textDecoration: "underline", display: "inline-block", marginTop: "4px" }}>
                        View Permit 📎
                      </a>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td>
                    {app.status === "Pending" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: "4px 8px", fontSize: "14px", minWidth: "auto" }}
                          onClick={() => updateStatus(app.id, "Approved")}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: "4px 8px", fontSize: "14px", minWidth: "auto" }}
                          onClick={() => updateStatus(app.id, "Rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "14px", color: "var(--color-muted)" }}>Reviewed</span>
                    )}
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
