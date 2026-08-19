"use client";
// ─────────────────────────────────────────────
// LÄYRD – Checkout page (/checkout)
// Delivery/pickup selection, date/time, payment
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Truck } from "lucide-react";  // icons for pickup/delivery cards
import { useCart } from "../../components/cart/CartContext.jsx";
import { formatPrice, getCartTotals, getDeliveryFee } from "../../lib/pricing.js";
import { PAYMENT_METHODS, DELIVERY_MIN_ITEMS, BRAND } from "../../lib/constants.js";
import { supabase } from "../../lib/supabase.js";

const CHECKOUT_DRAFT_KEY = "layrd_checkout_draft";

// Turns a label like "11:00 AM" into minutes-since-midnight for comparison
function parseTimeLabelToMinutes(label) {
  const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let [, hh, mm, ap] = match;
  hh = parseInt(hh, 10);
  mm = parseInt(mm, 10);
  if (ap.toUpperCase() === "PM" && hh !== 12) hh += 12;
  if (ap.toUpperCase() === "AM" && hh === 12) hh = 0;
  return hh * 60 + mm;
}

function isDateToday(dateString) {
  if (!dateString) return false;
  const [y, m, d] = dateString.split("-").map(Number);
  const now = new Date();
  return y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();
}

// Filters out any time slot that has already passed, but only for today's date
function getAvailableTimeSlots(dateString, allSlots) {
  if (!isDateToday(dateString)) return allSlots;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return allSlots.filter((slot) => {
    const slotMinutes = parseTimeLabelToMinutes(slot);
    return slotMinutes !== null && slotMinutes > nowMinutes;
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items, totalItems, deliveryFee, promoCode, meetsDeliveryMinimum,
    setDeliveryFee, setDeliveryMethod, clearCart, setPromo, removePromo
  } = useCart();

  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/cart");
        return;
      }
      setSession(session);
      setCheckingAuth(false);
      setContactInfo((prev) => ({
        ...prev,
        name: prev.name || session.user.user_metadata?.full_name || "",
        email: prev.email || session.user.email || "",
      }));
    });
  }, [router]);

  const [method, setMethod] = useState("pickup"); // 'pickup' | 'delivery'
  const [address, setAddress] = useState("");
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null); // { label, lat, lon } from autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const [draftRestored, setDraftRestored] = useState(false);
  const suggestionJustSelectedRef = useRef(false);

  // Check if we are using a Stripe test key
  const isSandbox = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes("test");

  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  // ── Restore any saved checkout draft (survives Stripe redirects and shop visits) ──
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.method) setMethod(draft.method);
        if (draft.address) setAddress(draft.address);
        if (draft.distanceInfo) setDistanceInfo(draft.distanceInfo);
        if (draft.selectedCoords) setSelectedCoords(draft.selectedCoords);
        if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
        if (draft.selectedDate) setSelectedDate(draft.selectedDate);
        if (draft.selectedTime) setSelectedTime(draft.selectedTime);
        if (draft.notes) setNotes(draft.notes);
        if (draft.contactInfo) {
          setContactInfo((prev) => ({ ...prev, ...draft.contactInfo }));
        }
      }
    } catch (e) {
      // Corrupted or missing draft — just start fresh
    } finally {
      setDraftRestored(true);
    }
  }, []);

  // ── Save checkout draft on every change ──
  useEffect(() => {
    if (!draftRestored) return; // avoid overwriting the saved draft before it's loaded
    try {
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({
        method, address, distanceInfo, selectedCoords, paymentMethod,
        selectedDate, selectedTime, notes, contactInfo,
      }));
    } catch (e) {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [draftRestored, method, address, distanceInfo, selectedCoords, paymentMethod, selectedDate, selectedTime, notes, contactInfo]);

  const TIME_SLOTS = settings?.pickupTimes || ["11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM", "7:00 PM"];
  const availableTimeSlots = getAvailableTimeSlots(selectedDate, TIME_SLOTS);

  // Helper to check if a date is valid for the current method
  function isValidDate(dateString) {
    if (!settings || !dateString) return true;
    const date = new Date(dateString);
    // getDay() returns 0 for Sunday, 1 for Monday, etc. Adjust for timezone if needed, but local is fine here.
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // Since dateString is YYYY-MM-DD, parsing it as `new Date('YYYY-MM-DD')` might give UTC. We want local time.
    const [y, m, d] = dateString.split("-");
    const localDate = new Date(y, m - 1, d);
    const dayName = days[localDate.getDay()];

    if (method === "pickup") {
      return settings.pickupDays.includes(dayName);
    } else {
      return settings.deliveryDays.includes(dayName);
    }
  }

  // ── Live address autocomplete as the user types ──
  useEffect(() => {
    const trimmed = address.trim();
    // Skip re-fetching right after a suggestion was just selected
    if (selectedCoords && selectedCoords.label === address) {
      setAddressSuggestions([]);
      return;
    }
    if (trimmed.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(`/api/address-autocomplete?text=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setAddressSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [address, selectedCoords]);

  async function calculateDeliveryForCoords(suggestion) {
    setCalculatingDistance(true);
    try {
      const res = await fetch(
        `/api/delivery-fee?lat=${suggestion.lat}&lon=${suggestion.lon}&label=${encodeURIComponent(suggestion.label)}`
      );
      const data = await res.json();
      setDistanceInfo(data);
      if (data.isWithinCalgary) {
        setDeliveryFee(data.fee);
        setDeliveryMethod("delivery");
      } else {
        setDistanceInfo({ ...data, outsideCalgary: true });
        setDeliveryFee(0);
      }
    } catch {
      // Fallback: mock calculation
      const mockKm = 8;
      const mockFee = getDeliveryFee(mockKm);
      setDistanceInfo({ distanceKm: mockKm, fee: mockFee, isMock: true, isWithinCalgary: true });
      setDeliveryFee(mockFee);
    } finally {
      setCalculatingDistance(false);
    }
  }

  function handleSelectSuggestion(suggestion) {
    suggestionJustSelectedRef.current = true;
    setAddress(suggestion.label);
    setSelectedCoords(suggestion);
    setAddressSuggestions([]);
    setShowSuggestions(false);
    calculateDeliveryForCoords(suggestion);
  }

  // Safety net: if autocomplete never returns a match (API hiccup, unusual
  // address format, etc.) and the customer just types the full address and
  // moves on, calculate the fee from the typed text — same geocoding path
  // the old "Check" button used, just triggered automatically on blur.
  async function calculateDeliveryForTypedAddress(rawAddress) {
    if (!rawAddress.trim()) return;
    setCalculatingDistance(true);
    try {
      const res = await fetch(`/api/delivery-fee?address=${encodeURIComponent(rawAddress)}`);
      const data = await res.json();
      setDistanceInfo(data);
      if (data.isWithinCalgary) {
        setDeliveryFee(data.fee);
        setDeliveryMethod("delivery");
      } else {
        setDistanceInfo({ ...data, outsideCalgary: true });
        setDeliveryFee(0);
      }
    } catch (err) {
      console.error("[Checkout] delivery fee fallback calc failed:", err);
      const mockKm = 8;
      const mockFee = getDeliveryFee(mockKm);
      setDistanceInfo({ distanceKm: mockKm, fee: mockFee, isMock: true, isWithinCalgary: true });
      setDeliveryFee(mockFee);
    } finally {
      setCalculatingDistance(false);
    }
  }

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch(`/api/promo?code=${encodeURIComponent(promoInput.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code");
      } else {
        setPromo(data);
        setPromoInput("");
      }
    } catch (err) {
      setPromoError("Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const { discount, gst, total, subtotal } = getCartTotals(items, deliveryFee, promoCode, settings?.gstRate != null ? settings.gstRate / 100 : undefined);

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setPlacing(true);

    try {
      const orderPayload = {
        items,
        contactInfo,
        method, // 'pickup' or 'delivery'
        address: method === "delivery" ? address : null,
        deliveryFee,
        selectedDate,
        selectedTime,
        paymentMethod,
        promoCode,
        notes,
        totals: {
          subtotal,
          discount,
          gst,
          total
        }
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error placing order: " + (data.error || "Unknown error"));
        setPlacing(false);
        return;
      }

      if (data.url) {
        // Stripe checkout URL
        window.location.href = data.url;
      } else if (data.orderId) {
        // Mock fallback success or non-Stripe method
        window.location.href = `/confirmation?order=${data.orderId}`;
      }
    } catch (err) {
      console.error(err);
      alert("Failed to place order. Please try again.");
      setPlacing(false);
    }
  }

  if (checkingAuth || !session) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <h2 style={{ marginBottom: "20px" }}>Your cart is empty</h2>
          <Link href="/shop"><button className="btn btn-primary">Back to Shop</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <h1 style={{ marginBottom: "8px" }}>Checkout</h1>
        <div className="divider-accent" style={{ marginBottom: "40px" }} />

        {isSandbox && (
          <div style={{
            background: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            color: "#ca8a04",
            padding: "12px 16px",
            borderRadius: "4px",
            marginBottom: "24px",
            fontWeight: 500,
            textAlign: "center"
          }}>
            ⚠️ STRIPE SANDBOX MODE ACTIVE — Use test cards only. Remember to replace keys for production.
          </div>
        )}

        {!loadingSettings && settings && !settings.isOpen ? (
          <div style={{
            textAlign: "center", padding: "40px", background: "var(--surface)",
            border: "1px solid var(--border-soft)", borderRadius: "8px", margin: "40px auto", maxWidth: "600px"
          }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 600, color: "var(--text-main)", marginBottom: "12px" }}>
              The shop is currently closed.
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
              We are not accepting orders at this time. Please check back later.
            </p>
            <Link href="/shop" className="btn btn-outline">Back to Shop</Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
              {/* Left: form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

                {/* Contact */}
                <Section title="1. Contact Information">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name" required>
                      <input className="input" required placeholder="Jane Doe" value={contactInfo.name}
                        onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} />
                    </Field>
                    <Field label="Email">
                      <input className="input" type="email" required placeholder="jane@example.com" value={contactInfo.email}
                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Phone">
                    <input className="input" type="tel" placeholder="403-555-0000" value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} />
                  </Field>
                </Section>

                {/* Pickup or Delivery */}
                <Section title="2. Pickup or Delivery">
                  <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    {[
                      { value: "pickup", Icon: MapPin, label: "Pickup", sub: `${BRAND.pickupArea}` },
                      { value: "delivery", Icon: Truck, label: "Delivery", sub: `Min. ${DELIVERY_MIN_ITEMS} items` },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setMethod(opt.value);
                          if (opt.value === "pickup") {
                            setDeliveryFee(0);
                            setDeliveryMethod("pickup");
                          }
                        }}
                        style={{
                          flex: 1, padding: "16px",
                          border: `1px solid ${method === opt.value ? "#B89B5E" : "var(--border-soft)"}`,
                          background: method === opt.value ? "rgba(184,155,94,0.07)" : "var(--surface)",
                          color: "var(--text-main)", cursor: "pointer", borderRadius: "4px", textAlign: "left",
                          transition: "border-color 0.2s, background 0.2s",
                        }}
                      >
                        {/* lucide icon + label side by side */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, marginBottom: "4px" }}>
                          <opt.Icon size={18} strokeWidth={1.6} style={{ color: method === opt.value ? "var(--accent)" : "var(--text-muted)", flexShrink: 0 }} />
                          {opt.label}
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--text-muted)", paddingLeft: "26px" }}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>

                  {method === "delivery" && (
                    <div>
                      {!meetsDeliveryMinimum && (
                        <p style={{ fontSize: "20px", color: "var(--accent)", marginBottom: "12px" }}>
                          ⚠ Add {DELIVERY_MIN_ITEMS - totalItems} more item{DELIVERY_MIN_ITEMS - totalItems !== 1 ? "s" : ""} to enable delivery.
                        </p>
                      )}
                      <Field label="Delivery Address">
                        <div style={{ position: "relative" }}>
                          <input
                            className="input"
                            placeholder="Start typing your address..."
                            autoComplete="off"
                            value={address}
                            onChange={(e) => {
                              setAddress(e.target.value);
                              setSelectedCoords(null);
                              setDistanceInfo(null);
                              setDeliveryFee(0);
                            }}
                            onFocus={() => {
                              if (addressSuggestions.length > 0) setShowSuggestions(true);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowSuggestions(false);
                                if (suggestionJustSelectedRef.current) {
                                  suggestionJustSelectedRef.current = false;
                                  return;
                                }
                                if (!selectedCoords && address.trim().length > 5 && !distanceInfo) {
                                  calculateDeliveryForTypedAddress(address);
                                }
                              }, 150);
                            }}
                          />
                          {suggestLoading && (
                            <span style={{
                              position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                              fontSize: "14px", color: "var(--text-muted)"
                            }}>
                              ...
                            </span>
                          )}
                          {showSuggestions && addressSuggestions.length > 0 && (
                            <div
                              style={{
                                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20,
                                background: "var(--surface)", border: "1px solid var(--border-soft)",
                                borderRadius: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                maxHeight: "220px", overflowY: "auto",
                              }}
                            >
                              {addressSuggestions.map((s, i) => (
                                <button
                                  key={`${s.label}-${i}`}
                                  type="button"
                                  onMouseDown={() => handleSelectSuggestion(s)}
                                  style={{
                                    display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                                    background: "transparent", border: "none", cursor: "pointer",
                                    fontSize: "15px", color: "var(--text-main)",
                                    borderBottom: i < addressSuggestions.length - 1 ? "1px solid var(--border-soft)" : "none",
                                  }}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {calculatingDistance && (
                          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "6px" }}>
                            Calculating delivery fee...
                          </p>
                        )}
                        {!calculatingDistance && !suggestLoading && address.trim().length >= 2 && addressSuggestions.length === 0 && /^\d+$/.test(address.trim()) && (
                          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "6px" }}>
                            Keep typing your street name — a house number alone won't match.
                          </p>
                        )}
                      </Field>

                      {distanceInfo && (
                        <div
                          style={{
                            marginTop: "12px", padding: "12px 16px", borderRadius: "3px",
                            background: distanceInfo.outsideCalgary ? "rgba(239,68,68,0.08)" : "rgba(201,169,110,0.07)",
                            border: `1px solid ${distanceInfo.outsideCalgary ? "rgba(239,68,68,0.2)" : "rgba(201,169,110,0.2)"}`,
                            fontSize: "20px",
                          }}
                        >
                          {distanceInfo.outsideCalgary ? (
                            <p style={{ color: "#f87171" }}>{distanceInfo.message || "Outside Calgary — pickup only."}</p>
                          ) : (
                            <p style={{ color: "var(--accent)" }}>
                              ~{distanceInfo.distanceKm} km away · Delivery fee: {formatPrice(distanceInfo.fee)}
                              {distanceInfo.isMock && " (estimated)"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Section>

                {/* Date & Time */}
                <Section title="3. Pickup / Delivery Date & Time">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Date">
                      <input className="input" type="date" required value={selectedDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime(""); // slots differ per day/time — start fresh
                        }} />
                      {selectedDate && !isValidDate(selectedDate) && (
                        <div style={{ fontSize: "14px", color: "#ef4444", marginTop: "6px" }}>
                          ⚠ We only offer {method} on {method === "pickup" ? settings?.pickupDays.join(", ") : settings?.deliveryDays.join(", ")}.
                        </div>
                      )}
                      {selectedDate && isValidDate(selectedDate) && availableTimeSlots.length === 0 && (
                        <div style={{ fontSize: "14px", color: "#ef4444", marginTop: "6px" }}>
                          ⚠ No remaining time slots today. Please choose a future date.
                        </div>
                      )}
                    </Field>
                    <Field label="Time Slot">
                      <select className="input" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} required disabled={!selectedDate || !isValidDate(selectedDate) || availableTimeSlots.length === 0}>
                        <option value="">Select a time</option>
                        {availableTimeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>
                    Available slots are set by LÄYRD. Time is approximate.
                  </p>
                </Section>

                {/* Payment */}
                <Section title="4. Payment Method">
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {PAYMENT_METHODS.map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        style={{
                          padding: "14px 18px",
                          border: `1px solid ${paymentMethod === pm.id ? "var(--accent)" : "var(--border-soft)"}`,
                          background: paymentMethod === pm.id ? "var(--surface-active)" : "var(--surface)",
                          color: "var(--text-main)", cursor: "pointer", borderRadius: "3px",
                          textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                          transition: "border-color 0.2s, background 0.2s",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: "2px" }}>{pm.label}</div>
                          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{pm.subtitle}</div>
                        </div>
                        {paymentMethod === pm.id && (
                          <span style={{ color: "var(--accent)", fontSize: "24px" }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Notes */}
                <Section title="5. Order Notes (Optional)">
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Any special requests or notes for your order..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </Section>

                {/* Promo Code */}
                <Section title="6. Promo Code (Optional)">
                  {promoCode ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(201,169,110,0.1)", padding: "12px 16px", borderRadius: "4px", border: "1px solid rgba(201,169,110,0.3)" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 500 }}>Code: {promoCode.code} applied!</span>
                      <button type="button" onClick={removePromo} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px", textDecoration: "underline" }}>Remove</button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          className="input"
                          type="text"
                          placeholder="Enter optional promo code"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={promoLoading}
                          className="btn btn-outline sm:w-auto w-full"
                          style={{ minWidth: "100px" }}
                        >
                          {promoLoading ? "..." : "Apply"}
                        </button>
                      </div>
                      {promoError && <p style={{ color: "red", fontSize: "14px", marginTop: "6px" }}>{promoError}</p>}
                    </div>
                  )}
                </Section>
              </div>

              {/* Right: order summary */}
              <div
                style={{
                  background: "var(--surface)", border: "1px solid var(--border-soft)",
                  borderRadius: "4px", padding: "28px",
                  position: "sticky", top: "calc(var(--nav-height) + 24px)",
                }}
              >
                <h4 style={{ fontSize: "24px", marginBottom: "20px" }}>
                  Order Summary
                </h4>

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "20px" }}>
                      <span style={{ color: "var(--text-muted)" }}>{item.name} × {item.quantity}</span>
                      <span style={{ color: "var(--text-main)" }}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="divider" style={{ margin: "0 0 12px" }} />

                {/* Totals */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  <SumRow label="Subtotal" value={formatPrice(subtotal)} />
                  {discount > 0 && <SumRow label="Promo" value={`-${formatPrice(discount)}`} green />}
                  <SumRow label="Delivery" value={method === "pickup" ? "Pickup" : deliveryFee > 0 ? formatPrice(deliveryFee) : "TBD"} />
                  <SumRow label={`GST (${settings?.gstRate ?? 5}%)`} value={formatPrice(gst)} />
                </div>

                <div className="divider" style={{ margin: "0 0 16px" }} />

                <SumRow label="Total" value={formatPrice(total)} bold />

                {/* Place order */}
                <button
                  type="submit"
                  disabled={placing || !selectedDate || !selectedTime || !isValidDate(selectedDate)}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "20px" }}
                >
                  {placing ? "Placing Order..." : paymentMethod === "stripe" ? `Pay ${formatPrice(total)}` : "Place Order"}
                </button>

                {paymentMethod !== "stripe" && (
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "10px", textAlign: "center", lineHeight: "160%" }}>
                    {paymentMethod === "etransfer"
                      ? "You'll receive E-Transfer instructions by email. Order pending until payment confirmed."
                      : "Pay cash on pickup/delivery day."}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}
      </div>



    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 style={{ fontSize: "16px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "20px" }}>
        {title}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="label">{label}{required && <span style={{ color: "var(--accent)" }}> *</span>}</label>
      {children}
    </div>
  );
}

function SumRow({ label, value, bold, green }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: bold ? "1rem" : "0.875rem", fontWeight: bold ? 600 : 400, color: green ? "var(--accent)" : "var(--text-main)" }}>
        {value}
      </span>
    </div>
  );
}