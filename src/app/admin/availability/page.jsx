"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormField from "@/components/admin/AdminFormField";
import { getSettings, updateSettings } from "@/lib/admin-settings";
import { Plus, X, Loader2, Check } from "lucide-react";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminAvailabilityPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, []);

  function handleDayToggle(type, day) {
    const current = settings[type];
    if (current.includes(day)) {
      setSettings({ ...settings, [type]: current.filter((d) => d !== day) });
    } else {
      setSettings({ ...settings, [type]: [...current, day] });
    }
  }

  function handleAddTime() {
    if (!newTime.trim() || settings.pickupTimes.includes(newTime)) return;
    setSettings({ ...settings, pickupTimes: [...settings.pickupTimes, newTime] });
    setNewTime("");
  }

  function handleRemoveTime(time) {
    setSettings({ ...settings, pickupTimes: settings.pickupTimes.filter((t) => t !== time) });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(settings);
      setToast("saved");
    } catch (err) {
      console.error(err);
      setToast("error");
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Availability" subtitle="Control shop hours and pickup windows" />
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Loader2 className="spinner" size={24} style={{ color: "var(--accent)" }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <AdminPageHeader title="Availability" subtitle="Control shop hours, pickup windows, and delivery days" />
        {toast === "saved" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "0.875rem", fontWeight: 500 }}>
            <Check size={16} /> Saved Successfully
          </div>
        )}
        {toast === "error" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontSize: "0.875rem", fontWeight: 500 }}>
            <X size={16} /> Failed to save
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Master Toggle */}
        <div style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={settings.isOpen} 
              onChange={(e) => setSettings({ ...settings, isOpen: e.target.checked })} 
              style={{ width: "18px", height: "18px", accentColor: "var(--accent)" }} 
            />
            <div>
              <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "1rem" }}>
                {settings.isOpen ? "Shop is OPEN" : "Shop is CLOSED"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {settings.isOpen 
                  ? "Customers can browse and place orders normally." 
                  : "Checkout is disabled. Customers will see a closed banner."}
              </div>
            </div>
          </label>
        </div>

        {/* Pickup Days */}
        <div style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "12px" }}>Available Pickup Days</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {DAYS_OF_WEEK.map((day) => {
              const isActive = settings.pickupDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle("pickupDays", day)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border-soft)"}`,
                    background: isActive ? "rgba(201,169,110,0.1)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pickup Time Windows */}
        <div style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "12px" }}>Pickup Time Windows</h3>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {settings.pickupTimes.map((time) => (
              <div key={time} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 12px", background: "var(--bg-main)",
                border: "1px solid var(--border-soft)", borderRadius: "4px",
                fontSize: "0.85rem", color: "var(--text-main)"
              }}>
                {time}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTime(time)} 
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. 11:00 AM" 
              value={newTime} 
              onChange={(e) => setNewTime(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTime())}
              style={{ flex: 1 }} 
            />
            <button type="button" onClick={handleAddTime} className="btn btn-outline" style={{ display: "flex", gap: "6px" }}>
              <Plus size={16} /> Add Slot
            </button>
          </div>
        </div>

        {/* Delivery Days */}
        <div style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "12px" }}>Available Delivery Days</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {DAYS_OF_WEEK.map((day) => {
              const isActive = settings.deliveryDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle("deliveryDays", day)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    border: `1px solid ${isActive ? "var(--accent)" : "var(--border-soft)"}`,
                    background: isActive ? "rgba(201,169,110,0.1)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: "flex-start", minWidth: "120px" }}>
          {saving ? <Loader2 className="spinner" size={16} /> : "Save Changes"}
        </button>

      </form>
    </AdminLayout>
  );
}
