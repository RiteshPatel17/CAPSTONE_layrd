// ─────────────────────────────────────────────
// LÄYRD – App-wide constants
// ─────────────────────────────────────────────

export const BRAND = {
  name: "LÄYRD",
  tagline: "Cake in a Can | Espresso Shots",
  email: "info@layrd.org",
  phone: "403-399-3903",
  instagram: "@l.a.y.r.d",
  pickupArea: "Pineridge NE, Calgary",
};

// GST rate (configurable in admin settings)
export const GST_RATE = 0.05; // 5%

// ─── Product pricing ───
export const PRICES = {
  // Individual cans
  coreIndividual: 8,      // 250 ml core flavour
  limitedIndividual: 9,   // 250 ml limited flavour

  // Bundles (core only)
  coreFourPack: 30,
  coreSixPack: 44,

  // Bundle premium per limited flavour included
  limitedBundlePremium: 1,

  // Espresso shots
  espresso1: 4,
  espresso4: 14,
  espresso6: 20,

  // Events (150 ml cans)
  eventCorePerCan: 5,
  eventLimitedPerCan: 6,
};

// Minimum items for delivery (cans + espresso packs count)
export const DELIVERY_MIN_ITEMS = 4;

// Minimum cans for event orders
export const EVENT_MIN_CANS = 24;

// Minimum notice for events (business days)
export const EVENT_MIN_NOTICE_DAYS = 5;

// ─── Delivery fee tiers ───
// Each tier: { maxKm, fee }
export const DELIVERY_TIERS = [
  { maxKm: 5,   fee: 5  },
  { maxKm: 10,  fee: 10 },
  { maxKm: 15,  fee: 15 },
  { maxKm: 20,  fee: 20 },
  { maxKm: 25,  fee: 25 },
  { maxKm: Infinity, fee: 30 },
];

// Outside Calgary: pickup only flag
export const CALGARY_ONLY_DELIVERY = true;

// ─── Wholesale pricing ───
export const WHOLESALE_TIERS = [
  { minCans: 24, maxCans: 36, pricePerCan: 5.50 },
  { minCans: 37, maxCans: 47, pricePerCan: 5.25 },
  { minCans: 48, maxCans: Infinity, pricePerCan: 5.00 },
];

export const WHOLESALE_MIN_CANS = 24;
export const WHOLESALE_NOTICE_DAYS = 3; // 3-4 business days

// ─── Business verification code ───
export const BUSINESS_CODE_EXPIRY_HOURS = 48; // 2 days

// ─── Can sizes ───
export const CAN_SIZES = {
  small: 150,   // Events only
  standard: 250, // Regular shop
  large: 330,   // Admin can manage
};

// ─── Order statuses ───
export const ORDER_STATUSES = [
  "New",
  "Paid",
  "Pending Payment",
  "Preparing",
  "Ready for Pickup",
  "Out for Delivery",
  "Completed",
  "Cancelled",
  "Refunded",
];

// ─── Payment methods ───
export const PAYMENT_METHODS = [
  { id: "stripe", label: "Credit / Debit Card", subtitle: "Secure payment via Stripe" },
  { id: "etransfer", label: "E-Transfer", subtitle: "Pending approval from LÄYRD" },
  { id: "cash", label: "Cash on Pickup", subtitle: "Pay when you collect your order" },
];

// ─── Flavours ───
export const FLAVOUR_CATEGORIES = {
  core: "Core",
  limited: "Limited",
};

export const CORE_FLAVOURS = [
  "Lotus Cheesecake",
  "Oreo Cheesecake",
  "Classic Tiramisu",
];

export const LIMITED_FLAVOURS = [
  "Bueno Cheesecake",
  "Matcha Cheesecake",
  "Pistachio Tiramisu",
];

// ─── AI Label tones ───
export const LABEL_TONES = [
  "Elegant",
  "Romantic",
  "Playful",
  "Luxury",
  "Minimal",
  "Birthday",
  "Wedding",
  "Corporate",
];

// ─── Allergy / storage info ───
export const STORAGE_INFO = [
  "Keep refrigerated",
  "Sealed shelf life: 3–5 days",
  "Once opened: consume within 24–48 hours",
];

// ─── Navigation links ───
export const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/events", label: "Events" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];
