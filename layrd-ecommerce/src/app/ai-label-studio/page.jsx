"use client";
// ─────────────────────────────────────────────
// LÄYRD – Logo Studio page (/ai-label-studio)
// For approved event customers only
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { LABEL_TONES } from "../../lib/constants.js";
import { supabase } from "../../lib/supabase.js";
import Link from "next/link";

const STATUS_META = {
  Pending: { icon: "⏳", label: "Pending Review", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)" },
  Approved: { icon: "✅", label: "Approved!", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.3)" },
  Rejected: { icon: "❌", label: "Not Approved", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)" },
};

export default function AILabelStudioPage() {
  const [activeTab, setActiveTab] = useState("studio");
  const [mySubmissions, setMySubmissions] = useState([]);

  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [tone, setTone] = useState("Elegant");
  const [eventType, setEventType] = useState("");
  const [customName, setCustomName] = useState("");
  const [notes, setNotes] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [edited, setEdited] = useState("");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedImageUrl, setSubmittedImageUrl] = useState(null);

  // Live preview — calls the real image renderer (debounced), so it's an
  // exact match to the final label, not an approximation.
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadEvents(session.user.id);
      else setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadEvents(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadEvents(userId) {
    // Label design unlocks as soon as the deposit is paid — it doesn't
    // wait for admin to approve the event itself. Still excludes events
    // admin has already rejected.
    const { data } = await supabase
      .from("event_inquiries")
      .select("*")
      .eq("customer_id", userId)
      .eq("deposit_paid", true)
      .neq("status", "Rejected")
      .order("created_at", { ascending: false });

    setEvents(data || []);
    if (data && data.length > 0) {
      setSelectedEventId(data[0].id);
      setEventType(data[0].event_type);
    }
    setLoadingAuth(false);
  }

  useEffect(() => {
    if (activeTab === "my-labels") {
      loadMySubmissions();
    }
  }, [activeTab, session]);

  async function loadMySubmissions() {
    if (!session) return;
    try {
      const res = await fetch("/api/ai-labels", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const all = await res.json();
      if (Array.isArray(all)) {
        setMySubmissions(all);
      } else {
        console.error("Failed to load submissions:", all);
        setMySubmissions([]);
      }
    } catch {
      setMySubmissions([]);
    }
  }

  // Live preview: waits until the customer pauses typing, then renders the
  // real label picture (same engine used for the final submission).
  useEffect(() => {
    if (!selected || !session || !edited.trim()) return;

    setPreviewLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai-labels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "preview", text: edited.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.imageDataUrl) {
          setPreviewImageUrl(data.imageDataUrl);
        }
      } catch {
        // keep showing the last successful preview rather than blank it out
      } finally {
        setPreviewLoading(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [edited, selected, session]);

  async function handleGenerate() {
    setGenerating(true);
    setSuggestions([]);
    setSelected(null);
    setPreviewImageUrl(null);
    try {
      const res = await fetch("/api/ai-labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session && { Authorization: `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({ action: "generate", eventInquiryId: selectedEventId, tone, eventType, customerName: customName, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestions([data.error || "Something went wrong. Please try again shortly."]);
        return;
      }
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions(["Error generating suggestions. Please try again."]);
    } finally {
      setGenerating(false);
    }
  }

  function handleSelect(text) {
    setSelected(text);
    setEdited(text);
  }

  const editedWordCount = edited.trim() ? edited.trim().split(/\s+/).filter(Boolean).length : 0;

  async function handleSubmit() {
    if (!edited.trim() || !session || !selectedEventId) return;
    setSubmitting(true);

    const selectedEvent = events.find(e => e.id === selectedEventId);

    try {
      const res = await fetch("/api/ai-labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: "submit",
          eventInquiryId: selectedEventId,
          tone,
          eventType: selectedEvent?.event_type || eventType,
          editedText: edited.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[Logo Studio] API returned error status:", res.status);
        alert(data.error || "Failed to submit logo. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmittedImageUrl(data.labelImageUrl || null);
      setSubmitted(true);
    } catch (err) {
      console.error("[Logo Studio] Failed to save submission:", err);
      alert("Failed to submit logo. Please try again.");
    }

    setSubmitting(false);
  }

  const pendingCount = mySubmissions.filter((s) => s.status === "Pending").length;
  const approvedCount = mySubmissions.filter((s) => s.status === "Approved").length;

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "800px" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ marginBottom: "8px" }}>
            Logo Studio
          </h1>
          <div className="divider-accent" style={{ marginBottom: "12px" }} />
          <p style={{ fontSize: "20px" }}>
            Generate custom logo text for your upcoming events.
          </p>
        </div>

        {loadingAuth ? (
          <p style={{ color: "var(--color-muted)", padding: "40px 0", textAlign: "center" }}>Loading...</p>
        ) : !session ? (
          <div style={{ textAlign: "center", padding: "48px 24px", border: "1px solid var(--border)", borderRadius: "4px" }}>
            <div style={{ fontSize: "clamp(26px, 4vw, 48px)", marginBottom: "16px" }}>🔐</div>
            <h3 style={{ marginBottom: "12px" }}>Login Required</h3>
            <p style={{ fontSize: "20px", color: "var(--color-sand)", marginBottom: "24px" }}>
              Please log in to access the Logo Studio.
            </p>
            <Link href="/login"><button className="btn btn-primary">Log In</button></Link>
          </div>
        ) : events.length === 0 && activeTab === "studio" ? (
          <div style={{ textAlign: "center", padding: "48px 24px", border: "1px solid var(--border)", borderRadius: "4px" }}>
            <div style={{ fontSize: "clamp(26px, 4vw, 48px)", marginBottom: "16px" }}>📝</div>
            <h3 style={{ marginBottom: "12px" }}>No Eligible Events</h3>
            <p style={{ fontSize: "20px", color: "var(--color-sand)", marginBottom: "24px" }}>
              Submit an event request and pay the 50% deposit to unlock label design.
            </p>
            <Link href="/events"><button className="btn btn-outline">Submit Inquiry</button></Link>
            <button onClick={() => setActiveTab("my-labels")} className="btn btn-primary" style={{ marginLeft: "12px" }}>
              View My Submissions
            </button>
          </div>
        ) : (
          <>
        <div style={{
          display: "flex", gap: "0", marginBottom: "28px",
          borderBottom: "1px solid var(--border)",
        }}>
          {[
            { id: "studio", label: "✨ Logo Studio" },
            {
              id: "my-labels",
              label: `📋 My Submissions${mySubmissions.length > 0 ? ` (${mySubmissions.length})` : ""}`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "my-labels") loadMySubmissions();
              }}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? "var(--color-accent)" : "transparent"}`,
                color: activeTab === tab.id ? "var(--color-accent)" : "var(--color-muted)",
                fontSize: "20px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                letterSpacing: "0.03em",
                transition: "all 0.15s",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "studio" && (
          <>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "48px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "4px" }}>
                <div style={{ fontSize: "clamp(26px, 4vw, 48px)", marginBottom: "16px" }}>✓</div>
                <h3 style={{ marginBottom: "12px" }}>Logo Submitted!</h3>
                <span className="badge badge-gold">Pending Approval</span>

                {submittedImageUrl ? (
                  <div style={{ margin: "24px auto 0", maxWidth: "260px" }}>
                    <img
                      src={submittedImageUrl}
                      alt="Your generated label"
                      style={{ width: "100%", borderRadius: "50%", border: "1px solid var(--border)" }}
                    />
                  </div>
                ) : (
                  <p style={{ marginTop: "16px", fontSize: "16px", color: "var(--color-muted)" }}>
                    Your label picture is still being prepared — it'll show up under "My Submissions" shortly.
                  </p>
                )}

                <p style={{ marginTop: "16px", fontSize: "20px", color: "var(--color-sand)" }}>
                  Adam will review your label and respond within 24 hours.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "24px" }}>
                  <button
                    onClick={() => { setSubmitted(false); setSuggestions([]); setSelected(null); setEdited(""); setSubmittedImageUrl(null); setPreviewImageUrl(null); }}
                    className="btn btn-outline"
                  >
                    Generate Another
                  </button>
                  <button
                    onClick={() => { setActiveTab("my-labels"); loadMySubmissions(); }}
                    className="btn btn-primary"
                  >
                    📋 View My Submissions
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px", padding: "28px", marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "20px" }}>
                    1. Configure Your Logo
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <label className="label">Tone / Vibe</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                        {LABEL_TONES.map((t) => (
                          <button key={t} onClick={() => setTone(t)} className={`tag ${tone === t ? "active" : ""}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Select Approved Event</label>
                        <select
                          className="input"
                          value={selectedEventId}
                          onChange={(e) => {
                            setSelectedEventId(e.target.value);
                            const ev = events.find(ev => ev.id === e.target.value);
                            if(ev) setEventType(ev.event_type);
                          }}
                        >
                          {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.event_type} on {ev.event_date}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Event Type Override (Optional)</label>
                        <input className="input" value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="e.g. Wedding, Birthday" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="label">Name to Include (optional)</label>
                        <input className="input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Sarah & James" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Additional Notes</label>
                      <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Keep it short, include date, mention Calgary..." />
                    </div>
                    <button onClick={handleGenerate} disabled={generating} className="btn btn-primary">
                      {generating ? "✨ Generating..." : "✨ Generate Label Suggestions"}
                    </button>
                  </div>
                </div>

                {suggestions.length > 0 && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px", padding: "28px", marginBottom: "24px" }}>
                    <h4 style={{ fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "20px" }}>
                      2. Choose Your Favourite
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelect(s)}
                          style={{
                            padding: "16px 20px", textAlign: "left",
                            border: `1px solid ${selected === s ? "var(--color-accent)" : "var(--border)"}`,
                            background: selected === s ? "rgba(201,169,110,0.07)" : "none",
                            borderRadius: "3px", cursor: "pointer",
                            color: "var(--color-cream)", fontSize: "20px", lineHeight: "160%",
                            transition: "all 0.2s",
                          }}
                        >
                          {s}
                          {selected === s && <span style={{ float: "right", color: "var(--color-accent)" }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selected && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px", padding: "28px" }}>
                    <h4 style={{ fontSize: "14px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "20px" }}>
                      3. Edit & Submit for Approval
                    </h4>
                    <div style={{ marginBottom: "20px" }}>
                      <label className="label">Final Logo Text</label>
                      <textarea
                        className="input"
                        rows={3}
                        value={edited}
                        onChange={(e) => setEdited(e.target.value)}
                        style={{ resize: "vertical", fontSize: "20px" }}
                      />
                      <p style={{ fontSize: "14px", color: "var(--color-muted)", marginTop: "6px" }}>
                        Maximum 3 words — longer text won't fit the label's circular frame.
                        {editedWordCount > 3 && <span style={{ color: "#f87171" }}> ({editedWordCount} words — trim it down to submit)</span>}
                      </p>
                    </div>

                    <div style={{ marginBottom: "20px", padding: "24px 0", textAlign: "center" }}>
                      <p style={{ fontSize: "14px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: "16px" }}>
                        Live Preview
                      </p>

                      {previewImageUrl ? (
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <img
                            src={previewImageUrl}
                            alt="Label preview"
                            style={{
                              width: "260px", height: "260px", borderRadius: "50%",
                              border: "1px solid var(--border)",
                              opacity: previewLoading ? 0.6 : 1,
                              transition: "opacity 0.2s",
                            }}
                          />
                          {previewLoading && (
                            <span style={{
                              position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)",
                              fontSize: "12px", color: "var(--color-muted)", background: "rgba(0,0,0,0.5)",
                              padding: "3px 10px", borderRadius: "10px",
                            }}>
                              Updating…
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          width: "260px", height: "260px", borderRadius: "50%", margin: "0 auto",
                          border: "1px solid var(--border)", display: "flex", alignItems: "center",
                          justifyContent: "center", color: "var(--color-muted)", fontSize: "14px",
                        }}>
                          {previewLoading ? "Rendering preview…" : "Preview will appear here"}
                        </div>
                      )}

                      <p style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "16px" }}>
                        This is the exact picture that will be submitted — it updates a moment after you stop typing.
                      </p>
                    </div>

                    <button onClick={handleSubmit} disabled={submitting || !edited.trim() || editedWordCount > 3} className="btn btn-primary" style={{ width: "100%" }}>
                      {submitting ? "Submitting..." : editedWordCount > 3 ? "Trim to 3 Words to Submit" : "Submit for Adam's Approval"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "my-labels" && (
          <div>
            {approvedCount > 0 && (
              <div style={{
                padding: "14px 20px", marginBottom: "20px",
                background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
                borderRadius: "4px", display: "flex", alignItems: "center", gap: "12px",
              }}>
                <span style={{ fontSize: "24px" }}>🎉</span>
                <div>
                  <p style={{ fontWeight: 600, color: "#4ade80", fontSize: "20px", marginBottom: "2px" }}>
                    {approvedCount} label{approvedCount > 1 ? "s" : ""} approved!
                  </p>
                  <p style={{ fontSize: "14px", color: "var(--color-sand)" }}>
                    Your approved logo{approvedCount > 1 ? "s are" : " is"} ready to print. Adam will confirm next steps.
                  </p>
                </div>
              </div>
            )}

            {mySubmissions.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "56px 24px",
                border: "1px dashed var(--border)", borderRadius: "4px",
              }}>
                <div style={{ fontSize: "clamp(26px, 4vw, 48px)", marginBottom: "16px" }}>🏷️</div>
                <p style={{ fontWeight: 600, marginBottom: "8px" }}>No submissions yet</p>
                <p style={{ fontSize: "20px", color: "var(--color-muted)", marginBottom: "20px" }}>
                  Generate a label in the studio and submit it for Adam's approval.
                </p>
                <button onClick={() => setActiveTab("studio")} className="btn btn-primary">
                  Go to Logo Studio
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {mySubmissions.map((sub) => {
                  const meta = STATUS_META[sub.status] || STATUS_META.Pending;
                  return (
                    <div
                      key={sub.id}
                      style={{
                        background: "var(--bg-card)",
                        border: `1px solid ${meta.border}`,
                        borderRadius: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{
                        padding: "10px 20px",
                        background: meta.bg,
                        borderBottom: `1px solid ${meta.border}`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px" }}>{meta.icon}</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: meta.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {meta.label}
                          </span>
                        </div>
                        <span style={{ fontSize: "14px", color: "var(--color-muted)", }}>{sub.id}</span>
                      </div>

                      <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "center" }}>
                        {sub.label_image_url ? (
                          <img
                            src={sub.label_image_url}
                            alt="Your generated label"
                            style={{ width: "180px", height: "180px", borderRadius: "50%", border: "1px solid var(--border)", marginBottom: "16px" }}
                          />
                        ) : (
                          <div style={{
                            padding: "18px 20px", marginBottom: "16px", width: "100%",
                            background: "#111", borderRadius: "3px", textAlign: "center",
                          }}>
                            <p style={{ fontSize: "14px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>Your Logo</p>
                            <p style={{
                              fontSize: "20px",
                              color: "#F7F3EA", fontStyle: "normal", fontWeight: 600, lineHeight: "140%",
                            }}>
                              "{sub.generated_text}"
                            </p>
                            <div style={{ width: "36px", height: "1px", background: "#C9A96E", margin: "10px auto 0" }} />
                            <p style={{ fontSize: "14px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#77736B", marginTop: "6px" }}>LÄYRD · Calgary</p>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "14px", color: "var(--color-muted)" }}>
                          <span>🎉 <strong style={{ color: "var(--color-sand)" }}>{sub.event_type}</strong> · {sub.event_inquiries?.event_date || "Unknown date"}</span>
                          <span>🎨 <strong style={{ color: "var(--color-sand)" }}>{sub.tone}</strong> tone</span>
                          <span>📅 Submitted {new Date(sub.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {sub.quantity && <span>🏷️ {sub.quantity} labels needed</span>}
                        </div>

                        {sub.status !== "Pending" && sub.adminNote && (
                          <div style={{
                            marginTop: "8px", padding: "12px 16px",
                            background: meta.bg, border: `1px solid ${meta.border}`,
                            borderRadius: "4px",
                          }}>
                            <p style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.08em", color: meta.color, marginBottom: "4px", fontWeight: 600 }}>
                              Message from Adam
                            </p>
                            <p style={{ fontSize: "20px", color: "var(--color-cream)" }}>{sub.adminNote}</p>
                          </div>
                        )}

                        {sub.status === "Rejected" && (
                          <button
                            onClick={() => setActiveTab("studio")}
                            className="btn btn-outline"
                            style={{ marginTop: "8px", width: "fit-content", fontSize: "14px", padding: "6px 16px" }}
                          >
                            ✨ Try a Different Logo
                          </button>
                        )}

                        {sub.status === "Approved" && (
                          <div style={{
                            marginTop: "8px", padding: "10px 14px",
                            background: "rgba(74,222,128,0.06)", borderRadius: "4px",
                            fontSize: "14px", color: "var(--color-sand)",
                          }}>
                            ✅ Your label has been approved and sent to print. Adam will contact you to confirm your order details.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => setActiveTab("studio")}
                  className="btn btn-outline"
                  style={{ alignSelf: "flex-start", marginTop: "4px" }}
                >
                  ✨ Submit Another Label
                </button>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}