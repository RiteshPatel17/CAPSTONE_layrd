"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { getAuthHeader } from "@/lib/auth";
import * as Icons from "lucide-react";

const WORKFLOW_STATUSES = ["New", "Contacted", "Qualified", "Not a Fit", "Closed"];

// Legacy values discovered from previous iterations.
const LEGACY_STATUSES = ["Pending", "Approved", "Rejected", "pending", "approved", "rejected"];

export default function AdminWholesalePage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const modalRef = useRef(null);

  // Actions
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [adminNotesDraft, setAdminNotesDraft] = useState("");

  const [copiedField, setCopiedField] = useState(null); // 'email' | 'phone'

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`/api/admin/wholesale`, {
        headers: { ...authHeader },
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load wholesale applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Filtering (Client-side)
  const filtered = useMemo(() => {
    return applications.filter(app => {
      let match = true;
      
      if (search) {
        const term = search.toLowerCase();
        const bName = (app.businessName || "").toLowerCase();
        const cName = (app.contactName || "").toLowerCase();
        const email = (app.email || "").toLowerCase();
        const phone = (app.phone || "").toLowerCase();
        const bType = (app.businessType || "").toLowerCase();
        
        match = bName.includes(term) || cName.includes(term) || email.includes(term) || phone.includes(term) || bType.includes(term);
      }

      if (statusFilter && app.status !== statusFilter) {
        match = false;
      }

      return match;
    });
  }, [applications, search, statusFilter]);

  const hasActiveFilters = search || statusFilter;
  const clearFilters = () => { setSearch(""); setStatusFilter(""); };

  const newCount = applications.filter(a => a.status === "New").length;
  const contactedCount = applications.filter(a => a.status === "Contacted").length;

  // Modal Handlers
  const openModal = (id) => {
    setSelectedAppId(id);
    setDetailError(null);
    setIsDetailLoading(true);
    setActionError(null);
    setActionSuccess(null);
    
    // Draft state initialization
    const found = applications.find(a => a.id === id);
    if (found) {
      setAdminNotesDraft(found.adminNotes || "");
    }

    document.body.style.overflow = "hidden";
    
    // Simulate tiny load for UX
    setTimeout(() => {
      if (!found) setDetailError("Application details could not be loaded.");
      setIsDetailLoading(false);
      setTimeout(() => {
        if (modalRef.current) modalRef.current.focus();
      }, 0);
    }, 200);
  };

  const closeModal = () => {
    if (isSaving) return;
    setSelectedAppId(null);
    setDetailError(null);
    setActionError(null);
    setActionSuccess(null);
    document.body.style.overflow = "auto";
  };

  const handleModalKeyDown = (e) => {
    if (e.key === "Escape" && !isSaving) {
      closeModal();
    }
  };

  const selectedApp = applications.find(a => a.id === selectedAppId);
  const isLegacyStatus = selectedApp && LEGACY_STATUSES.includes(selectedApp.status);

  // Copy Helpers
  const handleCopy = async (text, field) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // Actions
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedApp) return;
    setIsSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/admin/wholesale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ id: selectedApp.id, status: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      
      setApplications(applications.map(app => app.id === selectedApp.id ? { ...app, status: newStatus } : app));
      setActionSuccess(`Successfully marked as ${newStatus}`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setIsSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/admin/wholesale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ id: selectedApp.id, adminNotes: adminNotesDraft }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to save admin notes");
      }
      
      setApplications(applications.map(app => app.id === selectedApp.id ? { ...app, adminNotes: adminNotesDraft } : app));
      setActionSuccess("Admin notes saved successfully");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="wholesale-page-container">
        <AdminPageHeader title="Wholesale" subtitle="Review and follow up on wholesale applications" />
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="wholesale-filter-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px", background: "var(--bg-card)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
        <input 
          type="text" placeholder="Search business, contact, or email..." 
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="input filter-input" style={{ flex: "1 1 260px", margin: 0 }}
        />
        <select className="input filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ flex: "1 1 180px", margin: 0 }}>
          <option value="">All Statuses</option>
          {WORKFLOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          {/* Include Legacy statuses in filter if they exist in the current dataset so they can be filtered */}
          {Array.from(new Set(applications.map(a => a.status))).filter(s => LEGACY_STATUSES.includes(s)).map(s => (
            <option key={s} value={s}>{s} (Legacy)</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button className="btn btn-ghost filter-btn" onClick={clearFilters}>Clear Filters</button>
        )}
      </div>

      <div className="wholesale-result-count" style={{ marginBottom: "20px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "12px" }}>
        <span>Showing {filtered.length} of {applications.length} applications</span>
        {(newCount > 0 || contactedCount > 0) && (
          <>
            <span>·</span>
            {newCount > 0 && <span><strong>{newCount}</strong> New</span>}
            {newCount > 0 && contactedCount > 0 && <span>·</span>}
            {contactedCount > 0 && <span><strong>{contactedCount}</strong> Contacted</span>}
          </>
        )}
      </div>

      {/* ── Main List Layout ── */}
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        {loading ? (
          <div className="modal-body-text" style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
            Loading applications...
          </div>
        ) : error ? (
          <div className="modal-body-text" style={{ padding: "60px", textAlign: "center", color: "#ef4444", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
            {error}
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<Icons.Building2 size={48} color="var(--border-strong)" />}
            title="No wholesale applications found"
            message="When a business applies on the website, their application will appear here for you to review."
          />
        ) : filtered.length === 0 ? (
          <div className="modal-body-text" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
            No applications match your filters.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((app) => (
              <div 
                key={app.id} 
                className="wholesale-app-card"
                onClick={(e) => {
                  // Only open if the user didn't click inside another button/link
                  if (!e.target.closest('button') && !e.target.closest('a')) {
                    openModal(app.id);
                  }
                }}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(app.id); } }}
                style={{ 
                  background: "var(--bg-card)", border: "1px solid var(--border-soft)", borderRadius: "8px", 
                  padding: "20px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "border-color 0.15s, box-shadow 0.15s",
                  outlineColor: "var(--accent)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <div className="card-business-name" style={{ color: "var(--text-main)", marginBottom: "4px" }}>
                      {app.businessName}
                    </div>
                    <div className="card-contact-date" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span>{app.contactName}</span>
                      <span>·</span>
                      <span>Submitted {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="status-badge-wrapper">
                    <StatusBadge status={app.status} />
                  </div>
                </div>
                
                <div className="card-secondary-details" style={{ display: "flex", gap: "16px", color: "var(--text-muted)", flexWrap: "wrap", borderTop: "1px solid var(--border-soft)", paddingTop: "12px" }}>
                  {app.businessType && <div><strong>Type:</strong> {app.businessType}</div>}
                  {app.expectedVolume && <div><strong>Volume:</strong> {app.expectedVolume}</div>}
                  {app.expectedFrequency && <div><strong>Frequency:</strong> {app.expectedFrequency}</div>}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-4px" }}>
                  <button 
                    className="btn btn-outline btn-view-application" 
                    onClick={() => openModal(app.id)}
                    tabIndex={-1} // The whole card is focusable, keep this out of tab order
                  >
                    View Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Wholesale Application Detail Modal ── */}
      {selectedAppId && (
        <div className="wholesale-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div 
            ref={modalRef} tabIndex={-1} onKeyDown={handleModalKeyDown} role="dialog" aria-modal="true" aria-labelledby="wholesale-modal-title"
            className="wholesale-modal-content"
            style={{ background: "var(--bg-main)", width: "100%", maxWidth: "800px", height: "100%", maxHeight: "90vh", borderRadius: "12px", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", outline: "none" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-soft)", background: "var(--bg-card)", borderRadius: "12px 12px 0 0" }}>
              <div>
                <button onClick={closeModal} disabled={isSaving} className="btn btn-ghost modal-back-btn" style={{ padding: "4px 8px", height: "auto", marginBottom: "8px", marginLeft: "-8px", opacity: isSaving ? 0.5 : 1 }}>
                  ← Back to Wholesale
                </button>
                <div id="wholesale-modal-title" className="wholesale-modal-title" style={{ fontWeight: 700, color: "var(--text-main)", lineHeight: 1 }}>
                  Application Details
                </div>
              </div>
              <button onClick={closeModal} disabled={isSaving} style={{ background: "none", border: "none", cursor: isSaving ? "not-allowed" : "pointer", color: "var(--text-muted)", fontSize: "28px", padding: "4px", alignSelf: "flex-start", opacity: isSaving ? 0.5 : 1 }}>
                ×
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: "1 1 auto", padding: "24px", background: "var(--bg-main)" }}>
              {isDetailLoading ? (
                <div className="modal-body-text" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading details...</div>
              ) : detailError ? (
                <div className="modal-body-text" style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
                  <p style={{ marginBottom: "16px" }}>{detailError}</p>
                  <button className="btn btn-outline" onClick={() => openModal(selectedAppId)}>Try Again</button>
                </div>
              ) : selectedApp ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Notifications */}
                  {actionSuccess && (
                    <div className="modal-body-text" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#22c55e", padding: "12px 16px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }} role="status">
                      <Icons.Check size={18} /> {actionSuccess}
                    </div>
                  )}
                  {actionError && (
                    <div className="modal-body-text" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "12px 16px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }} role="alert">
                      <Icons.AlertCircle size={18} /> {actionError}
                    </div>
                  )}

                  {/* Header info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border-soft)" }}>
                    <div>
                      <h2 className="wholesale-modal-business-name" style={{ fontWeight: 700, margin: "0 0 8px", color: "var(--text-main)" }}>
                        {selectedApp.businessName}
                      </h2>
                      <div className="card-contact-date" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong>{selectedApp.contactName}</strong>
                        <span>·</span>
                        <span>Submitted {new Date(selectedApp.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                      </div>
                    </div>
                    <div className="status-badge-wrapper">
                      <StatusBadge status={selectedApp.status} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                    
                    {/* Business Group */}
                    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                      <h3 className="modal-section-heading" style={{ fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
                        Business
                      </h3>
                      <div className="modal-body-text" style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-main)" }}>
                        <div><strong style={{ color: "var(--text-muted)" }}>Name:</strong> {selectedApp.businessName}</div>
                        <div><strong style={{ color: "var(--text-muted)" }}>Type:</strong> {selectedApp.businessType || "—"}</div>
                        <div><strong style={{ color: "var(--text-muted)" }}>ABN:</strong> {selectedApp.albertaBusinessNumber || "—"}</div>
                        <div><strong style={{ color: "var(--text-muted)" }}>Website:</strong> {selectedApp.website ? <a href={selectedApp.website} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{selectedApp.website}</a> : "—"}</div>
                        <div><strong style={{ color: "var(--text-muted)" }}>Instagram:</strong> {selectedApp.instagram || "—"}</div>
                      </div>
                    </div>

                    {/* Contact Group */}
                    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                      <h3 className="modal-section-heading" style={{ fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
                        Contact
                      </h3>
                      <div className="modal-body-text" style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-main)" }}>
                        <div><strong style={{ color: "var(--text-muted)" }}>Name:</strong> {selectedApp.contactName}</div>
                        
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <div><strong style={{ color: "var(--text-muted)" }}>Email:</strong> <a href={`mailto:${selectedApp.email}`} style={{ color: "var(--accent)" }}>{selectedApp.email}</a></div>
                          <button onClick={() => handleCopy(selectedApp.email, 'email')} className="btn btn-ghost copy-btn" aria-label="Copy email">
                            {copiedField === 'email' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <div><strong style={{ color: "var(--text-muted)" }}>Phone:</strong> <a href={`tel:${selectedApp.phone}`} style={{ color: "var(--accent)" }}>{selectedApp.phone}</a></div>
                          <button onClick={() => handleCopy(selectedApp.phone, 'phone')} className="btn btn-ghost copy-btn" aria-label="Copy phone">
                            {copiedField === 'phone' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Wholesale Needs */}
                    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                      <h3 className="modal-section-heading" style={{ fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
                        Wholesale Needs
                      </h3>
                      <div className="modal-body-text" style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-main)" }}>
                        <div><strong style={{ color: "var(--text-muted)" }}>Volume:</strong> {selectedApp.expectedVolume || "—"}</div>
                        <div><strong style={{ color: "var(--text-muted)" }}>Frequency:</strong> {selectedApp.expectedFrequency || "—"}</div>
                        <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border-soft)" }}>
                          <strong style={{ color: "var(--text-muted)" }}>Applicant Notes:</strong>
                          <p style={{ marginTop: "4px", marginBottom: 0, whiteSpace: "pre-wrap", color: "var(--text-main)", lineHeight: 1.55 }}>
                            {selectedApp.notes || "No notes provided."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Application Info */}
                    <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                      <h3 className="modal-section-heading" style={{ fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
                        Application
                      </h3>
                      <div className="modal-body-text" style={{ display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-main)" }}>
                        <div><strong style={{ color: "var(--text-muted)" }}>Created:</strong> {new Date(selectedApp.createdAt).toLocaleString()}</div>
                        <div><strong style={{ color: "var(--text-muted)" }}>Updated:</strong> {new Date(selectedApp.updatedAt).toLocaleString()}</div>
                        {selectedApp.contactedAt && <div><strong style={{ color: "var(--text-muted)" }}>Contacted:</strong> {new Date(selectedApp.contactedAt).toLocaleString()}</div>}
                        
                        {selectedApp.permitUrl && (
                          <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border-soft)" }}>
                            <a href={selectedApp.permitUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Icons.Paperclip size={14} /> View historical permit
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Follow-up */}
                  <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-soft)" }}>
                    <h3 className="modal-section-heading" style={{ fontWeight: 700, color: "var(--text-main)", margin: "0 0 16px" }}>
                      Admin Follow-up
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      
                      <div>
                        <label className="label modal-label" style={{ fontWeight: 600, color: "var(--text-muted)" }}>Status</label>
                        <select
                          className="input modal-input"
                          value={selectedApp.status}
                          disabled={isSaving}
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          style={{ maxWidth: "300px" }}
                        >
                          {WORKFLOW_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          {isLegacyStatus && (
                            <option value={selectedApp.status} disabled>{selectedApp.status} (Legacy)</option>
                          )}
                        </select>
                        {isLegacyStatus && (
                          <div style={{ fontSize: "14px", color: "#eab308", marginTop: "8px", lineHeight: 1.5 }}>
                            This application has a legacy status. Please migrate it to a workflow status above.
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="label modal-label" style={{ fontWeight: 600, color: "var(--text-muted)" }}>Private Admin Notes</label>
                        <textarea
                          className="input modal-input"
                          rows={4}
                          value={adminNotesDraft}
                          onChange={(e) => setAdminNotesDraft(e.target.value)}
                          disabled={isSaving}
                          style={{ resize: "vertical", width: "100%" }}
                          placeholder="Add internal notes about this application..."
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                          <button
                            onClick={handleSaveNotes}
                            disabled={isSaving || adminNotesDraft === (selectedApp.adminNotes || "")}
                            className="btn btn-primary modal-body-text"
                            style={{ height: "auto", padding: "10px 20px" }}
                          >
                            {isSaving ? "Saving..." : "Save Notes"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Styles ── */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Responsive Typography - Wholesale */
        .wholesale-page-container h1 {
          font-size: clamp(34px, 4vw, 38px) !important;
          line-height: 1.4 !important;
        }
        .wholesale-page-container p {
          font-size: clamp(17px, 2vw, 19px) !important;
          line-height: 1.5 !important;
        }

        .wholesale-filter-toolbar .filter-input {
          height: 48px;
          padding: 0 16px;
          font-size: clamp(16px, 2vw, 18px);
          line-height: 1.5;
        }
        
        @media (max-width: 640px) {
          .wholesale-filter-toolbar .filter-input {
            flex: 1 1 100% !important;
          }
        }

        .wholesale-filter-toolbar .filter-btn {
          height: 48px;
          font-size: clamp(15px, 2vw, 16px);
        }

        .wholesale-result-count {
          font-size: clamp(16px, 2vw, 17px);
          line-height: 1.5;
        }

        .card-business-name {
          font-size: clamp(20px, 2.5vw, 22px);
          font-weight: 700;
          line-height: 1.4;
        }

        .card-contact-date {
          font-size: clamp(16px, 2vw, 17px);
          line-height: 1.5;
        }

        .card-secondary-details {
          font-size: clamp(16px, 2vw, 17px);
          line-height: 1.5;
        }

        .status-badge-wrapper > * {
          font-size: clamp(14px, 1.5vw, 16px) !important;
          padding: 4px 10px !important;
        }

        .btn-view-application {
          font-size: clamp(15px, 1.5vw, 16px) !important;
          height: auto !important;
          padding: 8px 16px !important;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
        }

        .btn-view-application:hover {
          background-color: var(--accent, #B89B5E) !important;
          border-color: var(--accent, #B89B5E) !important;
          color: #FAF8F3 !important;
        }

        /* Modal Typography */
        .wholesale-modal-title {
          font-size: clamp(19px, 2.5vw, 22px) !important;
          line-height: 1.4 !important;
        }

        .wholesale-modal-business-name {
          font-size: clamp(24px, 3vw, 28px) !important;
          line-height: 1.4 !important;
        }

        .modal-section-heading {
          font-size: clamp(19px, 2vw, 22px) !important;
          line-height: 1.4 !important;
        }

        .modal-body-text, .modal-label, .modal-input {
          font-size: clamp(16px, 2vw, 18px) !important;
          line-height: 1.55 !important;
        }

        .modal-back-btn {
          font-size: clamp(14px, 1.5vw, 16px) !important;
        }

        .copy-btn {
          padding: 6px 12px !important;
          font-size: clamp(14px, 1.5vw, 15px) !important;
          height: auto !important;
        }

        /* Interactions */
        .wholesale-app-card:hover {
          border-color: var(--border-strong) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
        }

        .wholesale-app-card:focus {
          border-color: var(--accent) !important;
        }

        @media (max-width: 767px) {
          .wholesale-modal-content {
            border-radius: 0 !important;
            max-height: 100vh !important;
          }
          .wholesale-modal-overlay {
            padding: 0 !important;
          }
        }
      `}} />
    </AdminLayout>
  );
}