"use client";
// ─────────────────────────────────────────────
// LÄYRD – Admin Settings (/admin/settings)
// Store configuration: contact info, pickup details, GST rate, delivery.
// Persists to Supabase via /api/admin/settings (GET + PATCH).
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminFormField from "@/components/admin/AdminFormField";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data.settings);
      setLoading(false);
    }
    loadSettings();
  }, []);

  // Generic field updater — works for any top-level settings key.
  function updateField(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveStatus(null); // clear any previous save confirmation once the user edits again
  }

  // WHY delivery tiers get their own updater instead of reusing updateField:
  // deliveryTiers is an ARRAY of {maxKm, fee} objects, not a flat value —
  // editing one tier means replacing just that entry within the array,
  // not the whole field.
  function updateTier(index, key, value) {
    setSettings((prev) => {
      const tiers = [...prev.deliveryTiers];
      tiers[index] = { ...tiers[index], [key]: Number(value) };
      return { ...prev, deliveryTiers: tiers };
    });
    setSaveStatus(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setSettings(data.settings); // reflect exactly what the DB now holds
      setSaveStatus("success");
    } catch (err) {
      console.error("admin/settings: save failed:", err.message);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <AdminLayout title="Settings" subtitle="Loading...">
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading settings...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Store configuration">
      <form onSubmit={handleSave} style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Contact info */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "24px" }}>
          <h3 style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 18px" }}>
            Contact Information
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AdminFormField label="Store Email" required>
              <input className="input" type="email" required
                value={settings.storeEmail}
                onChange={(e) => updateField("storeEmail", e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Store Phone" required>
              <input className="input" type="tel" required
                value={settings.storePhone}
                onChange={(e) => updateField("storePhone", e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Instagram Handle">
              <input className="input" type="text"
                value={settings.socialHandle}
                onChange={(e) => updateField("socialHandle", e.target.value)} />
            </AdminFormField>
          </div>
        </div>

        {/* Pickup */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "24px" }}>
          <h3 style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 18px" }}>
            Pickup Location
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AdminFormField label="Pickup Area (public)" required hint="Shown publicly on the site, e.g. on the checkout page.">
              <input className="input" type="text" required
                value={settings.pickupArea}
                onChange={(e) => updateField("pickupArea", e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Exact Pickup Address (private)" hint="Never shown publicly — only sent to customers by email after their order is confirmed, per TRD 14.5.">
              <input className="input" type="text"
                value={settings.pickupAddress || ""}
                onChange={(e) => updateField("pickupAddress", e.target.value)} />
            </AdminFormField>
          </div>
        </div>

        {/* GST + Delivery */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "24px" }}>
          <h3 style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 18px" }}>
            Pricing &amp; Delivery
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AdminFormField label="GST Rate (%)" required hint="Applied to (subtotal − discount + delivery fee).">
              <input className="input" type="number" step="0.01" min="0" required
                value={settings.gstRate}
                onChange={(e) => updateField("gstRate", Number(e.target.value))} />
            </AdminFormField>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "var(--text-main)", cursor: "pointer" }}>
              <input type="checkbox"
                checked={settings.deliveryEnabled}
                onChange={(e) => updateField("deliveryEnabled", e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              Delivery enabled
            </label>

            {/* Delivery tiers */}
            <div>
              <label className="label" style={{ marginBottom: "10px", display: "block" }}>
                Delivery Fee Tiers
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {settings.deliveryTiers.map((tier, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", width: "60px", flexShrink: 0 }}>
                      Up to
                    </span>
                    <input className="input" type="number" min="0"
                      value={tier.maxKm >= 999999 ? "" : tier.maxKm}
                      placeholder={tier.maxKm >= 999999 ? "∞ (beyond)" : ""}
                      disabled={tier.maxKm >= 999999}
                      onChange={(e) => updateTier(i, "maxKm", e.target.value)}
                      style={{ width: "100px" }} />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>km →</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>$</span>
                    <input className="input" type="number" min="0" step="0.01"
                      value={tier.fee}
                      onChange={(e) => updateTier(i, "fee", e.target.value)}
                      style={{ width: "90px" }} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                The last tier (∞) applies to any distance beyond the second-to-last tier's limit.
              </p>
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saveStatus === "success" && (
            <span style={{ fontSize: "0.85rem", color: "#4ade80" }}>✓ Settings saved successfully</span>
          )}
          {saveStatus === "error" && (
            <span style={{ fontSize: "0.85rem", color: "#f87171" }}>✕ Failed to save — please try again</span>
          )}
        </div>
      </form>
    </AdminLayout>
  );
}