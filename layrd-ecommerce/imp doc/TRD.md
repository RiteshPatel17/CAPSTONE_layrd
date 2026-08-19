# LÄYRD — Technical Requirements Document (TRD)

> **Document Type:** Technical Requirements Document  
> **Version:** 1.0  
> **Folder:** `g:/layrd-v1/imp doc/`  
> **Last Updated:** July 2026  
> **Owner:** Adam (Founder)  
> **Status:** Active Development — Backend integrations pending  
> **Cross-reference:** [PRD.md](./PRD.md) · [project-brief.md](./project-brief.md) · [../brand.md](../brand.md)

---

## 1. System Overview

LÄYRD is a **Next.js 16 (App Router) web application** deployed as a single monorepo. It serves four distinct user segments (retail, events, wholesale, admin) through a unified frontend, with a service-oriented backend using Supabase for persistence, Stripe for payments, Resend for email, Google Gemini for AI label generation, and Google Maps for delivery distance calculation.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                     │
│         Next.js 16 App Router (React 19 RSC)           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              Vercel (Edge / Node.js Runtime)            │
│         Next.js API Routes  (/app/api/*)               │
└──┬──────────────┬──────────────┬──────────────┬─────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
Supabase       Stripe        Resend          Gemini /
(DB + Auth   (Payments /   (Transactional    Google
+ Storage)    Webhooks)      Email)          Maps API
```

---

## 2. Tech Stack

### 2.1 Core Framework

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.7 | App Router (RSC + Client Components) |
| Runtime | Node.js | ≥ 18.x | Required by Next.js 16 |
| Language | JavaScript (JSX) | ES2022+ | No TypeScript currently |
| Package manager | npm | ≥ 9.x | |
| Build tool | Turbopack | (Next.js default) | Dev server only |

### 2.2 Frontend

| Technology | Purpose |
|---|---|
| React 19 | Component model, state management |
| Vanilla CSS + Tailwind CSS | Styling — CSS custom properties as design tokens |
| Lucide React | Icon library |
| Google Fonts (CDN) | Cormorant Garamond + Inter |

### 2.3 Backend / Services

| Service | SDK / Package | Purpose | Status |
|---|---|---|---|
| Supabase | `@supabase/supabase-js` | PostgreSQL DB, Auth, Storage | ⚠️ Stub |
| Stripe | `stripe`, `@stripe/stripe-js` | Card payments, webhooks | ⚠️ Stub |
| Resend | `resend` | Transactional email | ⚠️ Stub |
| Google Gemini | `@google/genai` ✅ | AI label text generation | ✅ Installed, real code |
| Google Maps | (fetch / REST) | Delivery distance calc | ⚠️ Stub |

### 2.4 Deployment Target

| Item | Value |
|---|---|
| Hosting | Vercel (recommended) |
| Region | Canada (closest to Calgary) |
| Edge functions | Not required for v1.0 |
| CDN | Vercel Edge Network |

---

## 3. Project Structure

```
g:/layrd-v1/
├── layrd-ecommerce/                 ← Next.js project root
│   ├── src/
│   │   ├── app/                     ← App Router (pages + API routes)
│   │   │   ├── layout.jsx           Root layout: fonts, meta, theme init
│   │   │   ├── globals.css          Full CSS design system
│   │   │   ├── page.jsx             Homepage
│   │   │   ├── shop/page.jsx
│   │   │   ├── checkout/page.jsx
│   │   │   ├── confirmation/page.jsx
│   │   │   ├── events/page.jsx
│   │   │   ├── ai-label-studio/page.jsx
│   │   │   ├── wholesale/page.jsx
│   │   │   ├── business/page.jsx
│   │   │   ├── login/page.jsx
│   │   │   ├── signup/page.jsx
│   │   │   ├── faq/page.jsx
│   │   │   ├── contact/page.jsx
│   │   │   ├── admin/
│   │   │   │   ├── login/page.jsx
│   │   │   │   ├── page.jsx          Dashboard
│   │   │   │   ├── orders/page.jsx
│   │   │   │   ├── products/page.jsx
│   │   │   │   ├── inventory/page.jsx
│   │   │   │   ├── events/page.jsx
│   │   │   │   ├── wholesale/page.jsx
│   │   │   │   ├── business-codes/page.jsx
│   │   │   │   ├── promo-codes/page.jsx
│   │   │   │   ├── faq/page.jsx
│   │   │   │   ├── availability/page.jsx
│   │   │   │   ├── ai-labels/page.jsx
│   │   │   │   └── settings/page.jsx
│   │   │   └── api/
│   │   │       ├── ai-labels/route.js
│   │   │       ├── contact/route.js
│   │   │       ├── delivery-fee/route.js
│   │   │       ├── events/route.js
│   │   │       ├── orders/route.js
│   │   │       ├── products/route.js
│   │   │       └── stripe/
│   │   │           ├── create-checkout-session/route.js
│   │   │           └── webhook/route.js
│   │   ├── components/
│   │   │   ├── Providers.jsx        Cart + Navbar + Footer shell
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── ThemeToggle.jsx
│   │   │   ├── products/
│   │   │   │   └── ProductCard.jsx
│   │   │   ├── cart/
│   │   │   │   ├── CartContext.jsx
│   │   │   │   └── CartSidebar.jsx
│   │   │   └── admin/
│   │   │       ├── AdminAuthGuard.jsx
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminSidebar.jsx
│   │   │       ├── AdminCard.jsx
│   │   │       ├── AdminPageHeader.jsx
│   │   │       ├── AdminFormField.jsx
│   │   │       ├── AdminTable.jsx
│   │   │       ├── ConfirmModal.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       └── StatusBadge.jsx
│   │   ├── lib/                     Service layer
│   │   │   ├── constants.js         Brand values, pricing constants
│   │   │   ├── pricing.js           Delivery fee, GST, cart totals, bundles
│   │   │   ├── supabase.js          DB + Auth client (stub → real)
│   │   │   ├── auth.js              Customer auth helpers (stub)
│   │   │   ├── admin-auth.js        Admin session (localStorage stub → Supabase)
│   │   │   ├── stripe.js            Stripe client (stub → real)
│   │   │   ├── resend.js            Email client (stub → real)
│   │   │   ├── gemini.js            AI label generation (real Gemini impl)
│   │   │   ├── maps.js              Google Maps distance (stub → real)
│   │   │   ├── admin-orders.js      Order CRUD (mock → Supabase)
│   │   │   ├── admin-order-items.js Order item CRUD (mock → Supabase)
│   │   │   ├── admin-products.js    Product CRUD (mock → Supabase)
│   │   │   ├── admin-inventory.js   Inventory + stock calc (mock → Supabase)
│   │   │   └── admin-settings.js    Settings (localStorage → Supabase)
│   │   └── data/
│   │       ├── seed-products.js     Product + bundle + espresso seed data
│   │       └── faqs.js              FAQ seed data
│   ├── .env.local                   ← Environment variables (never commit)
│   ├── next.config.js
│   └── package.json
├── brand.md
└── imp doc/
    ├── project-brief.md
    ├── PRD.md
    └── TRD.md                       ← This file
```

---

## 4. Architecture Decisions

### 4.1 Next.js App Router

All pages use the **App Router** (introduced in Next.js 13, stable in 14+). Key conventions:

- `page.jsx` → renders the route
- `layout.jsx` → wraps children (root layout only for now)
- `route.js` → API endpoint handlers (GET, POST, etc.)
- `"use client"` directive → all interactive components (all current pages are client components due to React state usage)
- Server Components → used in `layout.jsx` only; can be expanded when Supabase is connected

### 4.2 Two-Shell Layout Architecture

The `Providers.jsx` component is the layout switcher:

```javascript
// Admin routes bypass the customer shell entirely
const isAdmin = pathname.startsWith("/admin");
if (isAdmin) return <>{children}</>;

// Customer shell: Navbar + CartSidebar + Footer
return (
  <CartProvider>
    <Navbar openCart={...} />
    <CartSidebar ... />
    <main>{children}</main>
    <Footer />
  </CartProvider>
);
```

- **Customer shell**: Navbar, CartSidebar, Footer, CartProvider context
- **Admin shell**: AdminLayout → AdminSidebar + top content area (dark, always)
- These never mix — no risk of admin UI leaking into customer pages

### 4.3 Service Layer Pattern

All business logic lives in `src/lib/*.js` — NOT inside components. Each lib file:
1. Has a real implementation (or stub with TODO comments)
2. Uses named exports (no default exports on lib files)
3. Is the **only** file that talks to external services (Supabase, Stripe, etc.)
4. Contains mock/seed fallbacks so the UI works without credentials

This means swapping any backend service = editing **one file** only.

### 4.4 Inventory Calculation Model

Stock is **never stored as a direct count**. Instead:

```
availableStock = totalQtyProduced (from batches) 
              - committedQty (from order_items where status NOT IN Cancelled, Refunded)
```

Benefits:
- No race conditions updating a stock counter
- Cancellations automatically "free" stock without manual correction
- Audit trail of every production batch is preserved

### 4.5 Theme System

```javascript
// Anti-flash script in <head> (runs before React hydration)
(function(){
  try {
    var t = localStorage.getItem('layrd-theme');
    if (t === 'night') { document.documentElement.setAttribute('data-theme','night'); }
  } catch(e) {}
})();
```

CSS custom properties are the mechanism:
```css
:root          { --bg-main: #FAF8F3; --text-main: #0E0E0E; ... }
[data-theme="night"] { --bg-main: #0E0E0E; --text-main: #FAF8F3; ... }
```

Zero JavaScript for theme rendering — pure CSS variable switching.

---

## 5. State Management

| State | Mechanism | Scope |
|---|---|---|
| Cart (items, totals, promo code) | React Context (`CartContext.jsx`) | Global — customer app |
| Cart sidebar open/closed | `useState` in `Providers.jsx` | Global — customer app |
| Admin session | `localStorage` (`layrd_admin_session`) | Admin pages only |
| Theme (day/night) | `localStorage` + `data-theme` attribute | Global |
| Page-level UI state | `useState` per component | Local |
| Server data | Mock lib functions now → Supabase queries later | Per page |

**No Redux, Zustand, or global state library** is used. React Context + local state is sufficient for this scale.

---

## 6. Authentication Architecture

### 6.1 Customer Auth (To Be Implemented)

**Target: Supabase Auth**

```
Customer → /login → supabase.auth.signInWithPassword()
                  → JWT stored in Supabase session (httpOnly cookie via SSR or localStorage)
                  → User profile in public.profiles table
                  → role: 'customer' | 'business'
```

Protected routes (Events form, AI Label Studio, Wholesale ordering):
- Client-side: check `supabase.auth.getUser()` on mount; redirect to `/login` if null
- Server-side (future): middleware using `createServerClient` from `@supabase/ssr`

### 6.2 Admin Auth (Current: localStorage stub → Target: Supabase)

**Current implementation** (`src/lib/admin-auth.js`):
```javascript
// Dev credentials hardcoded — development only
const ADMIN_EMAIL    = "admin@layrd.org";
const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY    = "layrd_admin_session";

export function loginAdmin(email, password) { ... localStorage.setItem ... }
export function isAdminLoggedIn() { return !!localStorage.getItem(STORAGE_KEY); }
```

**Target implementation** (replace each function):
```javascript
// loginAdmin → supabase.auth.signInWithPassword({ email, password })
// logoutAdmin → supabase.auth.signOut()
// isAdminLoggedIn → supabase.auth.getSession() + check user.role === 'admin'
```

`AdminAuthGuard` component wraps every `/admin/*` page and redirects to `/admin/login` if not authenticated.

### 6.3 Role Model

| Role | Access |
|---|---|
| `customer` | Shop, checkout, account, event inquiries |
| `business` | Everything above + wholesale pricing and ordering |
| `admin` | Admin panel + all customer capabilities |

---

## 7. Database Architecture (Supabase / PostgreSQL)

### 7.1 Connection

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Server-only admin client (service role — never expose to client)
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
```

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY`** must ONLY be used in Next.js API routes (`/app/api/*`). Never import `getSupabaseAdmin()` from a client component.

### 7.2 Row Level Security (RLS) Policies

| Table | Rule |
|---|---|
| `profiles` | Users can read/update their own row only |
| `orders` | Users can read their own orders; admin can read all |
| `order_items` | Same as orders |
| `products` | Public read; admin write |
| `event_inquiries` | Users can read/create their own; admin can read/update all |
| `ai_label_requests` | Users can read/create their own; admin full access |
| `wholesale_applications` | Users can create; admin full access |
| `business_codes` | Admin only (insert); business user can mark as used |
| `promo_codes` | Public read (active only); admin full access |
| `inventory_batches` | Admin only |
| `availability_slots` | Public read; admin write |
| `settings` | Public read; admin write |

### 7.3 Key Queries (Supabase Pattern)

```javascript
// Get all orders (admin)
const { data: orders } = await supabase
  .from('orders')
  .select('*, order_items(*)')
  .order('created_at', { ascending: false });

// Get stock summary (server-side join)
// Recommended: Postgres view or RPC function
const { data: stock } = await supabase.rpc('get_stock_summary');

// Update order status
await supabase
  .from('orders')
  .update({ status })
  .eq('id', orderId);

// Create an order with items (transaction)
const { data: order } = await supabase
  .from('orders')
  .insert(orderData)
  .select()
  .single();

await supabase
  .from('order_items')
  .insert(items.map(item => ({ ...item, order_id: order.id })));
```

### 7.4 Recommended Supabase Functions / Triggers

| Trigger / Function | Purpose |
|---|---|
| `get_stock_summary()` RPC | Calculate available stock per flavour — replaces `calculateStock()` in `admin-inventory.js` |
| `on_order_status_change` trigger | When order status → Cancelled/Refunded, auto-cascade to order_items |
| `on_order_insert` trigger | Auto-generate human-readable order ID (e.g. `ORD-2026-042`) |
| `expire_business_codes` cron | Mark codes as expired after 48 hours (Supabase pg_cron) |

---

## 8. Payments Architecture (Stripe)

### 8.1 Checkout Flow

```
Customer → "Pay $X" button
  → POST /api/stripe/create-checkout-session
    → stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        success_url: '/confirmation?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: '/checkout',
        customer_email,
        metadata: { orderId, userId }
      })
  → Redirect to Stripe hosted checkout
  → Stripe → success_url
  → /confirmation page reads session_id → confirms order

Stripe → POST /api/stripe/webhook (checkout.session.completed)
  → Verify signature: stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)
  → Update order.status = 'Paid' in Supabase
  → Send confirmation email via Resend
```

### 8.2 Payment Methods in App

| Method | Flow |
|---|---|
| **Stripe** | Redirect to Stripe checkout → webhook confirms payment |
| **E-Transfer** | Order created in DB with status `Pending Payment` → Adam manually marks Paid |
| **Cash on Pickup** | Order created with status `New` → Adam marks Paid on collection |

### 8.3 Webhook Handler Requirements

- Must be a **raw body** handler (Next.js `export const config = { api: { bodyParser: false } }`)
- Must verify Stripe signature before processing
- Must be **idempotent** — safe to receive the same event twice
- Must not block — respond 200 immediately, process async

```javascript
// src/app/api/stripe/webhook/route.js
export async function POST(request) {
  const payload   = await request.text();
  const signature = request.headers.get('stripe-signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  // Handle event.type: 'checkout.session.completed', 'payment_intent.payment_failed'
  return new Response('OK', { status: 200 });
}
```

---

## 9. Email Architecture (Resend)

### 9.1 Email Triggers

| Trigger | Recipient | Template |
|---|---|---|
| Order placed (any payment) | Customer | Order confirmation with items, total, pickup details |
| Order placed | Admin (Adam) | New order notification |
| E-Transfer order approved | Customer | Payment instructions + E-Transfer email |
| Event inquiry submitted | Adam | Inquiry details notification |
| Event inquiry approved | Customer | Approval + deposit instructions |
| Business application approved | Business | One-time verification code + expiry |
| AI label approved | Customer | Label approved; print date info |
| Order status updated (Ready) | Customer | "Your order is ready" notification |

### 9.2 Resend Implementation Pattern

```javascript
// src/lib/resend.js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail({ to, orderNumber, items, total, pickupDate }) {
  await resend.emails.send({
    from: 'LÄYRD <orders@layrd.org>',
    to,
    subject: `Order Confirmed – #${orderNumber}`,
    html: buildOrderConfirmationHtml({ orderNumber, items, total, pickupDate }),
  });
}
```

> All email functions are non-blocking — order creation should NOT wait for email success. Wrap in try/catch and log failures.

---

## 10. AI Label Generation (Gemini)

### 10.1 Implementation

File: `src/lib/gemini.js`

```javascript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: prompt,   // structured prompt with tone, event type, name, notes
});
```

### 10.2 Prompt Structure

```
You are writing custom label text for LÄYRD, a boutique Calgary dessert brand.
Write exactly 3 short label options for a [eventType] occasion.
Tone: [tone]
Include the name: [customerName]
Event date: [eventDate]
Additional notes: [notes]

Rules:
- Each label must be under 80 characters
- Keep them poetic, personal, and fitting for a luxury dessert can
- Output exactly 3 lines, numbered 1. 2. 3. — no extra explanation
```

### 10.3 Response Parsing

```javascript
const lines = response.text
  .trim()
  .split("\n")
  .map(l => l.replace(/^\d+[\.\)]\s*/, "").trim())
  .filter(Boolean)
  .slice(0, 3);
```

### 10.4 Fallback Strategy

```
GEMINI_API_KEY set? → Call Gemini API
  API call succeeds + returns ≥ 3 lines? → Return parsed suggestions
  API call fails? → Log error → Fall through to mock
GEMINI_API_KEY not set? → Return mock suggestions (tone-based)
```

The customer **always** gets 3 suggestions — no error is ever shown.

### 10.5 API Route

```
POST /api/ai-labels
Body: { tone, eventType, customerName, notes, eventInquiryId }
Response: { suggestions: string[] }
```

---

## 11. Delivery Distance Calculation (Google Maps)

### 11.1 API Used

**Distance Matrix API** — calculates driving distance and duration between two addresses.

Endpoint:
```
GET https://maps.googleapis.com/maps/api/distancematrix/json
  ?origins=Pineridge+NE,+Calgary,+AB
  &destinations={customerAddress}
  &mode=driving
  &units=metric
  &key={GOOGLE_MAPS_API_KEY}
```

### 11.2 Implementation Target (`src/lib/maps.js`)

```javascript
export async function getDeliveryDistance(destination, origin = DEFAULT_ORIGIN) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&units=metric&key=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();
  const element = data.rows[0]?.elements[0];
  if (element?.status !== 'OK') throw new Error('Distance unavailable');
  const distanceKm = element.distance.value / 1000;
  return {
    distanceKm,
    durationMin: Math.round(element.duration.value / 60),
    isWithinCalgary: distanceKm <= 40, // 40km radius approximation
  };
}
```

### 11.3 Fallback

If the API fails or key is missing, the checkout shows "estimated" delivery fee using a mock 8km distance. Order can still be placed.

---

## 12. API Routes Specification

All routes are in `src/app/api/`. Request/response are JSON unless noted.

### POST `/api/orders`
```
Request:  { items[], contactInfo, method, deliveryAddress, date, time, paymentMethod, notes, promoCode }
Response: { orderId, total }
Action:   Insert order + order_items into Supabase → send emails → return orderId
```

### POST `/api/stripe/create-checkout-session`
```
Request:  { items[], customerEmail, orderId, successUrl, cancelUrl }
Response: { url }   ← Stripe hosted checkout URL
Action:   Call stripe.checkout.sessions.create() → return session.url
```

### POST `/api/stripe/webhook`
```
Headers:  stripe-signature (verified)
Body:     Raw Stripe event payload (text, not JSON)
Response: 200 OK
Action:   On 'checkout.session.completed': update order status → send emails
```

### GET `/api/delivery-fee`
```
Query:    ?address=123+Main+St+NE,+Calgary
Response: { distanceKm, fee, isWithinCalgary, isMock? }
Action:   Call getDeliveryDistance() → getDeliveryFee() → return
```

### POST `/api/events`
```
Request:  { eventType, eventDate, guestCount, coreCans, limitedCans, notes }
Response: { inquiryId }
Action:   Insert into event_inquiries → notify Adam by email
Auth:     Logged-in customer only
```

### GET `/api/events`
```
Response: { inquiries[] }
Auth:     Admin only (service role key)
```

### POST `/api/ai-labels`
```
Request:  { tone, eventType, customerName, notes, eventInquiryId }
Response: { suggestions: string[] }
Action:   Call generateLabelSuggestions() from gemini.js → return 3 suggestions
Auth:     Logged-in customer with approved event_inquiry only (TODO: verify)
```

### POST `/api/contact`
```
Request:  { name, email, subject, message }
Response: { success: true }
Action:   Send email to Adam via Resend
```

### GET `/api/products`
```
Response: { products[] }
Action:   Query Supabase products table
```

---

## 13. Pricing Engine

All pricing logic is in `src/lib/pricing.js`. No calculations are done in components.

### 13.1 Cart Total Calculation

```javascript
getCartTotals(items, deliveryFee, promoCode)
// Returns: { subtotal, discount, deliveryFee, gst, total }

subtotal = sum(item.price * item.quantity)
discount = subtotal * promoCode.value/100  (if percentage)
         | min(promoCode.value, subtotal)  (if fixed)
         | 0                              (if free_delivery)
appliedDeliveryFee = 0 (if free_delivery promo) | deliveryFee
gst   = (subtotal - discount + appliedDeliveryFee) * 0.05
total = subtotal - discount + appliedDeliveryFee + gst
```

### 13.2 Bundle Pricing

```javascript
getBundlePrice(totalCans, limitedCount, basePrice)
// = basePrice + limitedCount * 1
// Each limited flavour slot adds $1 to the base bundle price
```

### 13.3 Delivery Fee Tiers

```
0–5 km   → $5
5–10 km  → $10
10–15 km → $15
15–20 km → $20
20–25 km → $25
25+ km   → $30
```

### 13.4 Wholesale Price Per Can

```
24–36 cans  → $5.50/can
37–47 cans  → $5.25/can
48+ cans    → $5.00/can
```

---

## 14. Security Requirements

### 14.1 Environment Variables

| Variable | Exposure | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-safe | Public anon key URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-safe | RLS enforced |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | NEVER in client code |
| `STRIPE_SECRET_KEY` | Server only | API routes only |
| `STRIPE_WEBHOOK_SECRET` | Server only | Webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-safe | Stripe.js only |
| `RESEND_API_KEY` | Server only | |
| `GEMINI_API_KEY` | Server only | API routes only |
| `GOOGLE_MAPS_API_KEY` | Server only | Restrict to server IPs in GCP |
| `ADMIN_EMAIL` | Server only | |

### 14.2 Admin Route Protection

Every admin page component wraps with `<AdminAuthGuard>`:

```javascript
// AdminAuthGuard.jsx
useEffect(() => {
  if (!isAdminLoggedIn()) router.push('/admin/login');
}, []);
```

After Supabase integration, add middleware-level protection:
```javascript
// middleware.js
export function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check Supabase session cookie
    // Redirect to /admin/login if not authenticated
  }
}
```

### 14.3 Input Validation

- All form fields: client-side validation (required, min/max, type)
- All API routes: server-side validation before DB write
- Character limit on AI label text: 80 chars soft, 200 chars hard max
- Date inputs: `min` attribute set to prevent past dates

### 14.4 Stripe Webhook Security

```javascript
stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)
// Throws if signature invalid → return 400
// NEVER process event without signature verification
```

### 14.5 Exact Pickup Address

The precise pickup address is stored in admin settings. It is:
- Never displayed on public-facing pages
- Only included in order confirmation email sent after payment

---

## 15. Performance Requirements

| Metric | Target | Method |
|---|---|---|
| Page load (LCP) | < 2s | Static product data, optimised fonts |
| Time to Interactive | < 3s | Minimal JavaScript on above-fold content |
| Gemini label gen | < 5s | `gemini-2.0-flash` model (fast) |
| Delivery fee calc | < 2s | Single Maps API call |
| Admin dashboard | < 1s | Paginated orders query |

### Optimisation Strategies
- Google Fonts loaded via `rel="preconnect"` and `display=swap`
- CSS transitions use `will-change: transform` only where needed
- Product images: stored in Supabase Storage with CDN; lazy-loaded
- Admin data: paginate orders (20 per page); avoid loading all records
- Stripe checkout: redirect to Stripe-hosted page (no client-side JS bundle overhead)

---

## 16. Error Handling Strategy

| Scenario | Handling |
|---|---|
| Gemini API failure | Catch error → log → return mock suggestions (silent fallback) |
| Stripe payment failure | Webhook catches → update order status → email customer |
| Google Maps failure | Catch → show "estimated" fee → allow checkout to proceed |
| Supabase query failure | Surface generic error to user; log full error server-side |
| Email send failure | Non-blocking try/catch; log; do NOT block order creation |
| Invalid promo code | Return `{ valid: false, message: "..." }` — user shown inline message |
| Out-of-stock on checkout | Server-side stock check before order insert; return 409 Conflict |

---

## 17. Dependency Integration Checklist

When connecting each service, update the corresponding `src/lib/*.js` file by:
1. Uncommenting the real SDK import
2. Replacing the mock function body with the real SDK call
3. Removing `// TODO:` comments
4. Adding the env variable to `.env.local` and Vercel

| Service | File | npm install command |
|---|---|---|
| Supabase | `supabase.js`, `auth.js`, `admin-auth.js` | `npm install @supabase/supabase-js` |
| Stripe | `stripe.js` | `npm install stripe @stripe/stripe-js` |
| Resend | `resend.js` | `npm install resend` |
| Gemini | `gemini.js` | ✅ `@google/genai` already installed |
| Google Maps | `maps.js` | No SDK needed — direct REST fetch |

---

## 18. Deployment Configuration (Vercel)

### 18.1 Environment Variables (Vercel Dashboard)

Set all variables from Section 14.1 in:  
**Vercel Project → Settings → Environment Variables**

Set for: **Production**, **Preview**, **Development** (or subset as appropriate)

### 18.2 Build Settings

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `layrd-ecommerce` |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (default) |
| Node.js Version | 18.x or 20.x |

### 18.3 Domain

- Primary: `layrd.org` or `layrd.ca` (configure in Vercel → Domains)
- Admin subdomain (optional): `admin.layrd.org` or path-based `/admin`

### 18.4 Stripe Webhook (Post-Deploy)

After deploying:
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://layrd.org/api/stripe/webhook`
3. Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copy signing secret → paste as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 19. Local Development Setup

```bash
# 1. Clone and navigate
cd g:/layrd-v1/layrd-ecommerce

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
# Fill in values from Section 14.1

# 4. Run dev server
npm run dev
# → http://localhost:3000

# Admin login (dev only):
# Email: admin@layrd.org
# Password: admin123
```

---

## 20. Known Technical Debt

| Issue | Location | Priority |
|---|---|---|
| Admin auth uses hardcoded credentials | `src/lib/admin-auth.js` | High — replace with Supabase Auth before launch |
| All data in memory (resets on dev server restart) | All `admin-*.js` libs | High — connect Supabase |
| No server-side auth guard on API routes | All `/api/*` routes | High — add before launch |
| `use client` on all pages (no RSC benefit) | All `page.jsx` files | Medium — refactor data-fetching pages post-launch |
| No stock check at checkout | `checkout/page.jsx` | High — race condition risk on launch |
| No rate limiting on AI label endpoint | `/api/ai-labels/route.js` | Medium — add before launch |
| `bundle-4` and `bundle-6` pages not built | `/shop/bundle-*` | High — needed for full shop |
| `deprecated node-domexception` warning | `@google/genai` dep | Low — cosmetic, doesn't affect function |

---

*This TRD is a living document. Update it when integrations are connected, new services are added, or architectural decisions change.*  
*Cross-reference: [PRD.md](./PRD.md) · [project-brief.md](./project-brief.md) · [../brand.md](../brand.md)*
