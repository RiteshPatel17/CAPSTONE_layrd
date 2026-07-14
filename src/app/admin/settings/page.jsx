"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Settings (/admin/settings)
// Store-wide settings: contact info, pickup, GST, delivery tiers.
// Controlled form — changes update local state on Save.
// Persists to Supabase via updateSettings() in src/lib/admin-settings.js
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormField from "@/components/admin/AdminFormField";
import { getSettings, updateSettings } from "@/lib/admin-settings";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState(null); // "saved" | "error"
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, []);

  function handleField(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleTierFee(index, value) {
    const updated = settings.deliveryTiers.map((t, i) =>
      i === index ? { ...t, fee: Number(value) } : t
    );
    setSettings((prev) => ({ ...prev, deliveryTiers: updated }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      setToast("saved");
    } catch (error) {
      console.error(error);
      setToast("error");
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  }

  const tierLabels = [
    "0–5 km", "5–10 km", "10–15 km", "15–20 km", "20–25 km", "25+ km",
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Settings"
        subtitle="Store-wide configuration"
      />

      {toast === "saved" && (
        <div style={{
          background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
          color: "#4ade80", padding: "12px 16px", borderRadius: "4px",
          fontSize: "0.85rem", marginBottom: "24px",
          display: "flex", alignItems: "center", gap: "8px",
          animation: "fadeIn 0.2s ease",
        }}>
          ✓ Settings saved successfully.
        </div>
      )}

      {toast === "error" && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#f87171", padding: "12px 16px", borderRadius: "4px",
          fontSize: "0.85rem", marginBottom: "24px",
          display: "flex", alignItems: "center", gap: "8px",
          animation: "fadeIn 0.2s ease",
        }}>
          ⚠ Error saving settings.
        </div>
      )}

      {loading ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "260px",
          gap: "12px",
          color: "var(--color-muted)",
        }}>
          <div style={{
            width: "28px",
            height: "28px",
            border: "2px solid var(--border)",
            borderTopColor: "var(--color-accent)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }} />
          <span style={{ fontSize: "0.82rem" }}>Loading settings…</span>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "680px" }}>

          {/* ── Store Contact ── */}
          <SettingSection title="Store Contact">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <AdminFormField label="Store Email">
                <input className="input" type="email"
                  value={settings.storeEmail}
                  onChange={(e) => handleField("storeEmail", e.target.value)}
                />
              </AdminFormField>
              <AdminFormField label="Phone">
                <input className="input" type="tel"
                  value={settings.storePhone}
                  onChange={(e) => handleField("storePhone", e.target.value)}
                />
              </AdminFormField>
            </div>
            <AdminFormField label="Instagram Handle">
              <input className="input"
                value={settings.socialHandle}
                onChange={(e) => handleField("socialHandle", e.target.value)}
              />
            </AdminFormField>
          </SettingSection>

          {/* ── Pickup ── */}
          <SettingSection title="Pickup Location">
            <AdminFormField label="Pickup Area" hint="General area shown publicly (e.g. for delivery distance calc)">
              <input className="input"
                value={settings.pickupArea}
                onChange={(e) => handleField("pickupArea", e.target.value)}
              />
            </AdminFormField>
            <AdminFormField label="Exact Pickup Address" hint="Sent to customer only after order is confirmed. Keep private.">
              <input className="input"
                value={settings.pickupAddress}
                placeholder="e.g. 123 Fake St NE, Calgary, AB T3J 0A1"
                onChange={(e) => handleField("pickupAddress", e.target.value)}
              />
            </AdminFormField>
          </SettingSection>

          {/* ── Tax ── */}
          <SettingSection title="Tax">
            <AdminFormField label="GST Rate (%)" hint="Enter 5 for 5%. Applied to all orders.">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input className="input" type="number" min="0" max="100" step="0.5"
                  value={settings.gstRate}
                  style={{ width: "120px" }}
                  onChange={(e) => handleField("gstRate", Number(e.target.value))}
                />
                <span style={{ fontSize: "0.9rem", color: "var(--color-sand)" }}>
                  %
                </span>
              </div>
            </AdminFormField>
          </SettingSection>

          {/* ── Delivery ── */}
          <SettingSection title="Delivery">
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "20px" }}>
              <input
                type="checkbox"
                checked={settings.deliveryEnabled}
                onChange={(e) => handleField("deliveryEnabled", e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--color-accent)" }}
              />
              <span style={{ fontSize: "0.9rem", color: "var(--color-cream)" }}>
                Enable delivery option for customers
              </span>
            </label>

            {settings.deliveryEnabled && (
              <div>
                <p className="label" style={{ marginBottom: "12px" }}>Delivery Fee Tiers (Calgary only)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {settings.deliveryTiers.map((tier, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{
                        width: "80px", fontSize: "0.82rem", color: "var(--color-sand)", flexShrink: 0,
                      }}>
                        {tierLabels[i]}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>$</span>
                        <input
                          className="input"
                          type="number" min="0" step="1"
                          value={tier.fee}
                          style={{ width: "90px" }}
                          onChange={(e) => handleTierFee(i, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "10px" }}>
                  Delivery minimum: 4 items. Calgary area only.
                </p>
              </div>
            )}
          </SettingSection>

          {/* Save */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </form>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
}

// ── Helper component ─────────────────────────
function SettingSection({ title, children }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "4px", padding: "24px",
      display: "flex", flexDirection: "column", gap: "16px",
    }}>
      <h5 style={{
        fontFamily: "Inter, sans-serif", fontSize: "0.72rem",
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--color-sand)", margin: 0,
      }}>
        {title}
      </h5>
      {children}
    </div>
  );
}
