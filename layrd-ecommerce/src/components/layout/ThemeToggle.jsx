"use client";
// ─────────────────────────────────────────────
// LÄYRD – ThemeToggle
//
// How it works:
//   1. On mount, read localStorage('layrd-theme').
//      A tiny inline <script> in layout.jsx already set data-theme
//      on <html> before React hydrates, so there is no flash.
//   2. Clicking the button toggles between 'day' and 'night',
//      updates data-theme on <html>, and saves to localStorage.
//   3. The button shows Moon (→ switch to night) or Sun (→ switch to day).
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  // Start with "day" on the server (prevents hydration mismatch).
  // We sync to localStorage inside useEffect which only runs client-side.
  const [theme, setTheme] = useState("day");

  useEffect(() => {
    // Read the persisted preference once on client mount.
    // setState inside useEffect is intentional here — we need the
    // DOM to be available to read localStorage safely.
    const saved = localStorage.getItem("layrd-theme") || "day";
    // Only update state if it differs (avoids a redundant re-render)
    if (saved !== "day") setTheme(saved); // eslint-disable-line react-hooks/exhaustive-deps
  }, []); // empty deps = run once on mount only

  function toggleTheme() {
    const next = theme === "day" ? "night" : "day";
    setTheme(next);
    // Persist so the inline script in layout.jsx can restore it on next load
    localStorage.setItem("layrd-theme", next);
    // Apply or remove the night-mode CSS selector on <html>
    if (next === "night") {
      document.documentElement.setAttribute("data-theme", "night");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={theme === "day" ? "Switch to night mode" : "Switch to day mode"}
      title={theme === "day" ? "Night mode" : "Day mode"}
      suppressHydrationWarning
    >
      {/* Show Moon when in day mode (click → go dark); Sun when in night mode */}
      {theme === "day"
        ? <Moon size={24} strokeWidth={1.5} />
        : <Sun  size={24} strokeWidth={1.5} />
      }
    </button>
  );
}
