"use client";
import { useState, useEffect, useCallback } from "react";
import { getAuthHeader } from "@/lib/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";

export default function AdminContactPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = useCallback(async () => {
  setLoading(true);
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch("/api/admin/contact-messages", { headers: { ...authHeader } });
      if (!res.ok) {
        console.error("Failed to fetch messages:", res.status);
        setMessages([]);
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  async function toggleRead(msg) {
  try {
    const authHeader = await getAuthHeader();
    await fetch("/api/admin/contact-messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ id: msg.id, isRead: !msg.is_read }),
    });
      fetchMessages();
    } catch (err) {
      console.error(err);
      alert("Failed to update message.");
    }
  }

  function handleExpand(msg) {
    const willOpen = expandedId !== msg.id;
    setExpandedId(willOpen ? msg.id : null);
    if (willOpen && !msg.is_read) {
      toggleRead(msg);
    }
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Contact Messages"
        subtitle={`${messages.length} messages${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
      />

      {loading ? (
        <div style={{ padding: "40px", color: "var(--color-muted)" }}>Loading messages...</div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No messages yet"
          message="When someone submits the contact form, their message will appear here."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {messages.map((msg) => {
            const isOpen = expandedId === msg.id;
            return (
              <div
                key={msg.id}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${!msg.is_read ? "var(--color-accent)" : "var(--border)"}`,
                  borderRadius: "6px",
                  padding: "16px 20px",
                  cursor: "pointer",
                }}
                onClick={() => handleExpand(msg)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {!msg.is_read && (
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
                    )}
                    <div>
                      <span style={{ fontWeight: 600 }}>{msg.name}</span>
                      <span style={{ color: "var(--color-muted)", marginLeft: "10px", fontSize: "14px" }}>{msg.email}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "14px", color: "var(--color-muted)" }}>
                    {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                {msg.subject && (
                  <div style={{ marginTop: "6px", fontSize: "16px", color: "var(--color-sand)" }}>
                    <strong>Subject:</strong> {msg.subject}
                  </div>
                )}

                {isOpen && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "16px", color: "var(--color-sand)", whiteSpace: "pre-wrap" }}>{msg.message}</p>
                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                      <a href={`mailto:${msg.email}`} onClick={(e) => e.stopPropagation()} className="btn btn-primary btn-sm">
                        Reply by Email
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleRead(msg); }}
                        className="btn btn-ghost btn-sm"
                      >
                        Mark as {msg.is_read ? "unread" : "read"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}