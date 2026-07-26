# LÄYRD — Project Brief

> **Document Type:** Project Brief  
> **Folder:** `g:/layrd-v1/imp doc/`  
> **Last Updated:** July 2026  
> **Author:** Adam (founder)  
> **Status:** Active Development — Backend integrations pending

---

## 1. What Is LÄYRD?

LÄYRD is a **Calgary-based boutique dessert brand** founded by Adam. The business sells handcrafted cheesecakes and tiramisus in 250ml cans. The product concept is novel — premium, restaurant-quality desserts in a portable, single-serve format that requires no utensils.

The brand is based in the **Pineridge NE neighbourhood** of Calgary, Alberta, and currently serves the Calgary area through **direct pickup and delivery**.

| Key Detail | Value |
|---|---|
| Business name | LÄYRD |
| Tagline | *Cake in a Can \| Espresso Shots* |
| Location | Pineridge NE, Calgary, AB |
| Email | info@layrd.org |
| Phone | 403-399-3903 |
| Instagram | @l.a.y.r.d |

---

## 2. The Product Line

### 2.1 Core Flavours — $8 per 250ml can
These are always-available, year-round products:

| Flavour | Description |
|---|---|
| Lotus Cheesecake | Biscoff crust + Lotus spread ribbons |
| Oreo Cheesecake | Smooth cream cheese with Oreo blend |
| Classic Tiramisu | Espresso ladyfingers + mascarpone + cocoa |

### 2.2 Limited Flavours — $9 per 250ml can
Seasonal / rotating products:

| Flavour | Status | Description |
|---|---|---|
| Bueno Cheesecake | Available | Kinder Bueno hazelnut cream |
| Matcha Cheesecake | Coming Soon | Ceremonial-grade matcha |
| Pistachio Tiramisu | Coming Soon | Sicilian pistachio cream |

### 2.3 Bundles (Mix & Match)

| Bundle | Base Price | Notes |
|---|---|---|
| Core 4-Pack | $30 | Any 4 core flavours; +$1 per limited flavour swapped in |
| Core 6-Pack | $44 | Any 6 core flavours; +$1 per limited flavour swapped in |

### 2.4 Espresso Shots

| Product | Price |
|---|---|
| Single shot × 1 | $4 |
| × 4 shots | $14 |
| × 6 shots | $20 |

Sweetness options: Black / Sugar / Stevia / Brown Sugar  
Espresso counts toward the 4-item delivery minimum.

### 2.5 Event Cans (150ml — Private Events Only)
- Core: $5/can
- Limited: $6/can
- Minimum: 24 cans per event order

---

## 3. Revenue Streams

The platform supports **four distinct customer journeys**, each with its own flow and pricing logic:

| Stream | Customer Type | How It Works |
|---|---|---|
| **Retail shop** | General public | Cart → Checkout → Stripe / E-Transfer / Cash |
| **Private events** | Logged-in customers | Inquiry form → Adam approves → 50% deposit → AI label studio → Pickup/delivery |
| **Wholesale** | B2B (cafés, restaurants, retailers) | Business account application → Adam verifies → Code unlocks trade pricing → Order submitted for approval |
| **Espresso shots** | General public | Added to cart alongside cake cans |

---

## 4. Platform Architecture

### 4.1 Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Framework | Next.js 16 (App Router) | ✅ Live |
| Styling | Vanilla CSS + Tailwind CSS | ✅ Live |
| Language | JavaScript (JSX) | ✅ Live |
| Database | Supabase (PostgreSQL) | ⚠️ Stub — not yet connected |
| Auth | Supabase Auth | ⚠️ Stub — not yet connected |
| Payments | Stripe | ⚠️ Stub — not yet connected |
| Email | Resend | ⚠️ Stub — not yet connected |
| AI Labels | Anthropic Claude API | ⚠️ Stub — mock responses only |
| Maps / Distance | Google Maps API | ⚠️ Stub — mock delivery fee calc |
| Storage (images) | Supabase Storage | ⚠️ Stub — no product images yet |

> **Current state:** The entire frontend UI is built and functional with mock/seed data. All backend integrations are written as stubs with TODO comments. Connecting each service is the primary remaining work.

### 4.2 Repository Structure

```
g:/layrd-v1/
├── layrd-ecommerce/          ← Next.js project root
│   └── src/
│       ├── app/              ← Page routes (Next.js App Router)
│       │   ├── page.jsx                  Homepage
│       │   ├── shop/                     Shop (products, bundles, espresso)
│       │   ├── checkout/                 Checkout flow
│       │   ├── confirmation/             Order confirmation
│       │   ├── events/                   Private event inquiries
│       │   ├── wholesale/                Wholesale programme
│       │   ├── ai-label-studio/          AI label customisation
│       │   ├── login/ signup/            Customer auth
│       │   ├── business/                 Business account application
│       │   ├── faq/ contact/             Support pages
│       │   ├── admin/                    Admin dashboard + all sub-pages
│       │   └── api/                      Next.js API routes
│       │       ├── ai-labels/
│       │       ├── contact/
│       │       ├── delivery-fee/
│       │       ├── events/
│       │       ├── orders/
│       │       ├── products/
│       │       └── stripe/
│       ├── components/
│       │   ├── layout/       Navbar, Footer, ThemeToggle
│       │   ├── products/     ProductCard
│       │   ├── cart/         CartContext, cart sidebar
│       │   └── admin/        AdminLayout, AdminSidebar, AdminCard, etc.
│       ├── lib/              All business logic + external service stubs
│       └── data/             Seed data (products, FAQs)
├── brand.md                  ← Brand guidelines
└── imp doc/                  ← This folder (important documents)
```

---

## 5. Customer-Facing Pages

| Route | Page | Key Functionality |
|---|---|---|
| `/` | Homepage | Hero, featured products, brand story, service icons |
| `/shop` | Shop | Product grid, filter tabs (All / Core / Limited / Bundles / Espresso) |
| `/checkout` | Checkout | Contact info, pickup/delivery, date & time, payment method, order summary |
| `/confirmation` | Order confirmation | Post-purchase confirmation screen |
| `/events` | Private Events | Pricing info, login-gated inquiry form, event estimator |
| `/wholesale` | Wholesale | Pricing tiers table, how-it-works, B2B application CTA |
| `/ai-label-studio` | AI Label Studio | 3-step: configure tone → choose suggestion → edit & submit |
| `/business` | Business account | Application form for wholesale access |
| `/login` `/signup` | Auth | Customer login / registration |
| `/faq` | FAQ | Accordion FAQ list |
| `/contact` | Contact | Contact form + store info |

---

## 6. Admin Panel

Accessed at `/admin`. The sidebar is **always dark** (does not follow day/night theme). Admin login is at `/admin/login`.

| Admin Section | Route | What It Does |
|---|---|---|
| Dashboard | `/admin` | Stat cards (orders, low stock, pending payment, event inquiries), recent orders table, quick actions |
| Orders | `/admin/orders` | Full order list, status management, order details |
| Products | `/admin/products` | Add/edit/delete products and flavours |
| Inventory | `/admin/inventory` | Track stock levels, add production batches |
| Events | `/admin/events` | Review + approve/reject event inquiries |
| Wholesale | `/admin/wholesale` | Manage wholesale applications |
| Business Codes | `/admin/business-codes` | Generate and manage wholesale verification codes |
| Promo Codes | `/admin/promo-codes` | Create discount codes |
| FAQ | `/admin/faq` | Manage FAQ content |
| Availability | `/admin/availability` | Control which time slots are open for orders |
| AI Labels | `/admin/ai-labels` | Review and approve customer-submitted label designs |
| Settings | `/admin/settings` | Store email, phone, pickup area/address, GST rate, delivery tiers |

---

## 7. Business Logic & Rules

### Delivery
- Calgary only (outside Calgary → pickup only)
- Minimum 4 items to unlock delivery
- Distance-based fee tiers (calculated via Google Maps API):

| Distance | Fee |
|---|---|
| 0–5 km | $5 |
| 5–10 km | $10 |
| 10–15 km | $15 |
| 15–20 km | $20 |
| 20–25 km | $25 |
| 25+ km | $30 |

### Payment Methods
1. **Stripe** — Credit / debit card (immediate)
2. **E-Transfer** — Manual; order is "Pending Payment" until Adam confirms
3. **Cash on Pickup/Delivery** — Pay on day of collection

### Order Statuses
`New` → `Paid` → `Preparing` → `Ready for Pickup` / `Out for Delivery` → `Completed`  
Also: `Pending Payment`, `Cancelled`, `Refunded`

### GST
- Rate: 5% (configurable in admin settings)
- Applied to: (subtotal − discount + delivery fee) × 0.05

### Promo Codes
- Type: `percentage` (% off subtotal), `fixed` ($ amount off), `free_delivery`

### Events
- Minimum 24 cans per event order
- Minimum 5 business days notice required
- Login required to submit an inquiry
- 50% non-refundable deposit on approval
- Customer designs custom labels in AI Label Studio after approval
- Adam reviews labels before printing

### Wholesale
- Minimum 24 × 250ml cans
- 3–4 business days notice
- Approval-based ordering (Adam approves each order)
- Business account required (verified by one-time code)
- 48-hour code expiry
- Pricing tiers:

| Quantity | Price/Can |
|---|---|
| 24–36 | $5.50 |
| 37–47 | $5.25 |
| 48+ | $5.00 |

---

## 8. AI Label Studio Flow

1. Customer has an **approved event** (must be logged in)
2. They select a **tone** (Elegant / Romantic / Playful / Luxury / Minimal / Birthday / Wedding / Corporate)
3. Enter event type, a name to include, and any notes
4. Hit **Generate** → Anthropic Claude API returns 3 label text suggestions
5. Customer selects one, optionally edits it (80-char limit recommended)
6. Live preview renders the label in Cormorant Garamond italic
7. Customer submits → goes to **"Pending Approval"** (Adam reviews in admin)

---

## 9. Theme System

The site supports **Day** (default) and **Night** modes:

- Stored in `localStorage` key: `layrd-theme`
- Applied as `data-theme="night"` on `<html>`
- Anti-flash inline script in `<head>` reads localStorage before first paint
- Gold accent (`#B89B5E`) is the only colour that does not change between modes

---

## 10. Design System Summary

| Element | Specification |
|---|---|
| Display font | Cormorant Garamond (400/500/600/700) |
| Body / UI font | Inter (300/400/500/600) |
| Primary accent | Muted Gold `#B89B5E` |
| Day background | Warm White `#FAF8F3` |
| Night background | Near-Black `#0E0E0E` |
| Border radius | 2px (inputs, buttons) / 4px (cards) |
| Animation easing | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Max container width | 1280px |
| Navbar height | 72px (sticky) |
| Mobile breakpoint | 768px |

Full design system is documented in → [`brand.md`](../brand.md)

---

## 11. What Is Built vs. What Is Pending

### ✅ Built & Working
- Complete customer-facing UI (all pages)
- Cart system with context (React state)
- Checkout form with pickup/delivery toggle
- Admin dashboard, all admin pages
- AI Label Studio UI (with mock AI responses)
- Day/Night theme toggle
- Pricing engine (delivery tiers, bundles, promos, GST, wholesale)
- All admin components (sidebar, cards, tables, modals, badges)
- Product, bundle, espresso cards on shop page
- Event inquiry form
- Wholesale B2B info page
- FAQ, Contact, Confirmation pages

### ⚠️ Pending — Backend Integrations
These are all written as stubs. The UI is wired up; the integration just needs the env vars and real SDK calls:

| Integration | File | What It Needs |
|---|---|---|
| Supabase (database + auth) | `src/lib/supabase.js` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe (payments) | `src/lib/stripe.js` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Resend (email) | `src/lib/resend.js` | `RESEND_API_KEY`, `ADMIN_EMAIL` |
| Gemini (AI labels) | `src/lib/gemini.js` | `GEMINI_API_KEY` |
| Google Maps (delivery distance) | `src/lib/maps.js` | `GOOGLE_MAPS_API_KEY` |
| Supabase Storage (product images) | `src/lib/supabase.js` | Same Supabase credentials |

### 🔲 Not Yet Built (UI needs building)
- Bundle customiser page (`/shop/bundle-4`, `/shop/bundle-6`)
- Customer account dashboard (post-login: view orders, past events)
- Stripe checkout session creation (real payment flow)
- Email notifications (order confirmation, event inquiry, business codes)
- Admin order detail view
- Real-time stock sync from Supabase
- Mobile menu polish
- Product image upload in admin

---

## 12. Key Files Quick Reference

| File | Purpose |
|---|---|
| `src/app/globals.css` | Entire CSS design system (tokens, components, utilities) |
| `src/lib/constants.js` | All brand values, pricing, nav links, flavours |
| `src/lib/pricing.js` | Delivery fee, cart totals, GST, bundle, wholesale calculations |
| `src/lib/supabase.js` | Database + auth client (stub) |
| `src/lib/stripe.js` | Payment client (stub) |
| `src/lib/resend.js` | Email client (stub) |
| `src/lib/anthropic.js` | AI label generation (stub + mock responses) |
| `src/data/seed-products.js` | All product, bundle, espresso data (until Supabase connected) |
| `src/data/faqs.js` | FAQ content |
| `src/app/layout.jsx` | Root layout: Google Fonts, SEO meta, theme init script |
| `brand.md` | Full brand / design system documentation |

---

## 13. Environment Variables Required

Create `layrd-ecommerce/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (email)
RESEND_API_KEY=
ADMIN_EMAIL=info@layrd.org

# Gemini (AI labels)
GEMINI_API_KEY=

# Google Maps (delivery distance)
GOOGLE_MAPS_API_KEY=
```

---

## 14. Next Recommended Steps (Priority Order)

1. **Connect Supabase** — database schema creation, seed data migration, auth setup
2. **Connect Stripe** — implement real checkout session, webhook handler
3. **Connect Resend** — order confirmation emails, new order notifications to Adam
4. **Connect Anthropic** — swap mock label generator for real Claude API call
5. **Connect Google Maps** — real delivery distance calculation
6. **Build bundle customiser** — `/shop/bundle-4` and `/shop/bundle-6` pages
7. **Build customer account** — post-login dashboard with order history
8. **Add product images** — upload to Supabase Storage, display in ProductCard
9. **Real-time inventory** — connect admin inventory to Supabase
10. **Deploy** — Vercel (recommended for Next.js) with environment variables set

---

*This document was generated from a full read of all source files in `g:/layrd-v1/layrd-ecommerce/src/`. Update this document whenever significant features are added or the architecture changes.*
