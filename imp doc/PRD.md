# LÄYRD — Product Requirements Document (PRD)

> **Document Type:** Product Requirements Document  
> **Version:** 1.0  
> **Folder:** `g:/layrd-v1/imp doc/`  
> **Last Updated:** July 2026  
> **Owner:** Adam (Founder)  
> **Status:** Active Development

---

## 1. Product Vision

LÄYRD is a direct-to-consumer boutique dessert e-commerce platform for a Calgary-based brand selling handcrafted cheesecakes and tiramisus in 250ml cans. The platform must serve **four distinct customer segments** — retail shoppers, event planners, wholesale buyers, and the internal admin (Adam) — through a single, beautifully designed web application.

### Vision Statement
> Give every Calgary dessert lover, event planner, and café owner seamless access to premium LÄYRD products — online, on their terms, with the elegance the brand deserves.

### Design Principle
The UI must feel **premium, editorial, and boutique** — not generic e-commerce. Every interaction should reflect the LÄYRD brand: warm, elevated, and intentional.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Enable online retail sales | Orders placed per week | 20+ orders/week within 3 months |
| Reduce manual admin overhead | % of orders managed in-app | 100% — no external spreadsheets |
| Enable private event bookings | Event inquiries per month | 5+ per month |
| Enable wholesale channel | Active wholesale accounts | 3+ by month 3 |
| Fast, reliable checkout | Checkout completion rate | > 70% |
| Accurate delivery pricing | Delivery fee calc accuracy | 100% (Google Maps distance) |

---

## 3. User Personas

### 3.1 Retail Customer — "The Treat Buyer"
- **Who:** Calgary resident, 25–45, buys for themselves or as a gift
- **Needs:** Easy browse → add to cart → checkout with pickup or delivery
- **Pain points:** Doesn't want to DM on Instagram; wants to see what's available right now
- **Key flows:** Shop → Cart → Checkout → Confirmation

### 3.2 Event Customer — "The Occasion Planner"
- **Who:** Planning a birthday, wedding, baby shower, or corporate event
- **Needs:** Custom 150ml cans with personalised labels, minimum 24 cans
- **Pain points:** Wants a professional inquiry process; wants to see custom label options
- **Key flows:** Events page → Login → Inquiry form → Approval → AI Label Studio → Order

### 3.3 Wholesale Buyer — "The Trade Buyer"
- **Who:** Café owner, restaurant manager, corporate caterer
- **Needs:** Bulk 250ml cans at trade pricing, repeat ordering, approval-based system
- **Pain points:** Needs predictable pricing, professional onboarding, and reliable fulfillment
- **Key flows:** Wholesale page → Business account application → Verification code → Wholesale dashboard → Order

### 3.4 Admin — "Adam"
- **Who:** The founder; sole operator managing all orders, production, and fulfilment
- **Needs:** Full visibility into all orders, inventory, events, and wholesale; ability to update everything from one dashboard
- **Pain points:** Currently managing everything manually (DMs, texts, spreadsheets)
- **Key flows:** Admin dashboard → Orders → Inventory → Events → Wholesale → Settings

---

## 4. Feature Requirements

### 4.1 Public Shop (Retail)

#### FR-01 — Product Catalogue
- Display all 250ml can flavours: Core ($8) and Limited ($9)
- Show product status: Available / Coming Soon / Sold Out
- Display allergen information on product detail
- Filter products by: All / Core Flavours / Limited Flavours / Bundles / Espresso

#### FR-02 — Bundles
- 4-Pack ($30 base) and 6-Pack ($44 base) — mix any core flavours
- +$1 per limited flavour included in bundle
- Bundle customiser page: `/shop/bundle-4` and `/shop/bundle-6`
- Customer selects specific flavours for each slot

#### FR-03 — Espresso Shots
- 3 pack sizes: ×1 ($4), ×4 ($14), ×6 ($20)
- Sweetness selector per pack: Black / Sugar / Stevia / Brown Sugar
- Counts toward 4-item delivery minimum

#### FR-04 — Cart
- Persistent cart (React Context; survive page navigation)
- Quantity adjustment per item
- Remove item
- Promo code field with live discount calculation
- Cart sidebar (slides in from right, 420px wide)
- Item count badge on cart icon in navbar

#### FR-05 — Checkout
1. Contact information (name, email, phone)
2. Pickup or Delivery toggle
   - Pickup: Pineridge NE, Calgary (exact address revealed post-order)
   - Delivery: address input → real-time distance + fee via Google Maps API; Calgary only; minimum 4 items
3. Date and time slot selection (slots set by Adam in admin)
4. Payment method: Stripe / E-Transfer / Cash on Pickup
5. Order notes (optional free text)
6. Sticky order summary sidebar (subtotal, promo discount, delivery, GST, total)
7. "Place Order" or "Pay $X" button

#### FR-06 — Order Confirmation
- Display order number, items, total, pickup/delivery info
- Send confirmation email to customer (Resend)
- Send new order notification email to Adam (Resend)

---

### 4.2 Customer Authentication

#### FR-07 — Account System
- Register with: name, email, password
- Login / logout
- Auth required for: Events inquiry form, AI Label Studio, Wholesale order placement
- Auth powered by Supabase Auth
- User roles: `customer`, `business`, `admin`

---

### 4.3 Private Events

#### FR-08 — Event Inquiry Form
- Login-gated (prompt to log in if not authenticated)
- Fields: Event type (dropdown), Event date (min 5 business days out), Estimated guest count, Core cans (#), Limited cans (#), Additional notes
- Live price estimate shown as user fills in can counts
- Validation: minimum 24 cans total
- On submit: create event record in Supabase → notify Adam by email

#### FR-09 — Event Approval (Admin)
- Adam sees inquiry in Admin → Events
- Can approve or reject with a note
- On approval: customer is notified → unlocked to use AI Label Studio
- 50% deposit collected on approval (Stripe link or E-Transfer instruction sent by email)

#### FR-10 — AI Label Studio
- Accessible only to customers with an approved event
- Step 1 — Configure: Tone (8 options), Event type, Name to include, Additional notes
- Step 2 — Generate: Call Gemini API → return 3 label text suggestions
- Step 3 — Select: Customer picks one; can edit freely (80-char guideline)
- Step 4 — Preview: Live render in Cormorant Garamond italic on dark background (mimics can label)
- Step 5 — Submit: Sends to Adam for final approval
- Character limit soft warning at 80 chars, hard limit UI warning but not blocked

---

### 4.4 Wholesale

#### FR-11 — Business Account Application
- Form fields: Business name, contact name, email, phone, business type, Alberta business number (optional)
- Submission creates a pending business application in Supabase
- Adam reviews in Admin → Wholesale

#### FR-12 — Business Verification Code
- Adam approves application → system generates a one-time code → Resend emails code to business
- Code expires in 48 hours
- Business enters code on `/business` page → account upgraded to `business` role
- Wholesale pricing unlocked in checkout

#### FR-13 — Wholesale Ordering
- Business users see trade pricing:

| Quantity | Price/Can |
|---|---|
| 24–36 cans | $5.50 |
| 37–47 cans | $5.25 |
| 48+ cans | $5.00 |

- Minimum: 24 × 250ml cans
- 3–4 business days notice required
- Order goes to "Pending Approval" until Adam confirms
- Payment after Adam approval (E-Transfer or Stripe)

---

### 4.5 Admin Panel

#### FR-14 — Admin Authentication
- Separate login at `/admin/login`
- Hardcoded admin credentials OR Supabase Auth with `admin` role check
- `AdminAuthGuard` component wraps all admin pages
- Session persisted via localStorage

#### FR-15 — Admin Dashboard
- Stat cards: Total Orders, Pending Payment count, Preparing count, Low/Out of Stock count, Event Inquiries pending, Wholesale Applications pending
- Recent orders table (last 6): Order ID, Customer, Type, Total, Status, Date
- Quick action buttons: Add Product, Add Batch, View Orders, Event Inquiries, Wholesale Apps, Settings

#### FR-16 — Order Management
- Full orders list with status badges and filters
- Update order status (dropdown: New → Paid → Preparing → Ready → Completed etc.)
- Order detail view: items, customer info, delivery/pickup info, payment method, notes
- Manual order creation (for phone/walk-in orders)

#### FR-17 — Product Management
- Add, edit, delete products and flavours
- Fields: Name, category (core/limited), price, size, status (available/coming_soon/unavailable), allergens, description
- Upload product image to Supabase Storage

#### FR-18 — Inventory Management
- View current stock levels per flavour
- Add production batch (flavour, quantity, batch date)
- Stock auto-decrements on order fulfillment
- Low stock alert (threshold configurable in settings)

#### FR-19 — Availability Management
- Adam sets available dates and time slots for pickup/delivery
- Time slots: select which days and hours are bookable
- Customers only see slots that are open
- "Block" dates (holidays, personal days) with a single toggle

#### FR-20 — Event Management (Admin)
- List all event inquiries: Customer, Event type, Date, Can count, Status
- Open inquiry detail: approve / reject with optional message
- View submitted AI label text; approve or request revision

#### FR-21 — Wholesale Management (Admin)
- List pending and approved business applications
- Approve or reject application → send verification code on approval
- List wholesale orders; approve/reject/fulfill

#### FR-22 — Business Codes (Admin)
- Generate one-time codes manually
- View: code value, associated business, generated date, expiry, used/unused status
- Revoke a code

#### FR-23 — Promo Codes (Admin)
- Create promo code: code string, type (percentage / fixed / free_delivery), value, expiry date, usage limit
- View all codes with redemption count
- Deactivate a code

#### FR-24 — FAQ Management (Admin)
- Add, edit, reorder, delete FAQ items
- Changes reflect immediately on public `/faq` page

#### FR-25 — Settings (Admin)
- Store email, phone, Instagram handle
- Pickup area (public) + exact pickup address (private, sent post-order)
- GST rate (%)
- Enable/disable delivery
- Delivery fee tiers (per km bracket, editable)
- Delivery minimum item count
- Persist to Supabase

#### FR-26 — AI Labels (Admin)
- List all customer label submission requests
- View: event, customer name, generated text, tone
- Approve or request revision with message
- Approved labels locked for printing

---

## 5. Non-Functional Requirements

### NFR-01 — Performance
- Page load: < 2 seconds on 4G connection
- Checkout flow completion: no perceptible lag between steps
- Gemini label generation: < 5 seconds response time

### NFR-02 — Responsiveness
- Fully functional on mobile (≥ 320px), tablet (≥ 768px), and desktop (≥ 1280px)
- Admin panel: acceptable on tablet (768px+); desktop-optimised
- Cart sidebar: full-width on mobile

### NFR-03 — Security
- Admin routes: server-side or client-side auth guard on every page
- Supabase service role key: used only in server-side API routes (never exposed to client)
- Stripe webhook: signature verified on every webhook event
- Business codes: hashed or short-lived; not guessable
- Customer exact pickup address: never shown publicly; only in order confirmation email

### NFR-04 — Accessibility
- Semantic HTML throughout (headings, landmarks, labels)
- All interactive elements keyboard-accessible
- Sufficient colour contrast for WCAG AA (especially gold on cream backgrounds)
- `aria-label` on icon-only buttons (cart, menu, theme toggle)

### NFR-05 — SEO
- Unique `<title>` and `<meta description>` on every public page
- `<h1>` per page (one only)
- No content behind login for indexed pages
- Semantic heading hierarchy

### NFR-06 — Reliability
- Stripe webhook delivery failures: idempotent handlers, retry-safe
- Email failures: non-blocking (order proceeds; email retry or manual resend from admin)
- Gemini API failure: graceful fallback to mock suggestions (never show error to customer)
- Google Maps API failure: show "estimated" fee; allow order to proceed

### NFR-07 — Analytics (Future)
- Track: page views, add-to-cart events, checkout starts, order completions, promo code usage
- Recommended: Vercel Analytics or PostHog (privacy-friendly)

---

## 6. User Flows

### 6.1 Standard Retail Purchase
```
Homepage → Shop → Select product(s) → Cart → Checkout
→ [Stripe] Pay now → Confirmation page + Email
→ [E-Transfer] Place order (Pending Payment) → Adam confirms → Email sent
→ [Cash] Place order → Pay on pickup day
```

### 6.2 Private Event Booking
```
Events page → "Login Required" → Login/Signup
→ Submit inquiry form → "Inquiry Submitted" confirmation
→ Adam reviews (Admin → Events) → Approve + Email customer
→ Customer pays 50% deposit (Stripe link in email)
→ Customer opens AI Label Studio → Generate suggestions
→ Select + edit label → Submit for approval
→ Adam approves label (Admin → AI Labels) → Label locked for printing
→ Pickup/delivery day
```

### 6.3 Wholesale Onboarding
```
Wholesale page → "Apply for Business Account" → /business
→ Fill application form → Submit → "Pending review"
→ Adam reviews (Admin → Wholesale) → Approve → Code emailed
→ Business enters code on /business → Account upgraded
→ Shop with wholesale pricing → Submit order (Pending Approval)
→ Adam approves → Payment arranged → Fulfilment
```

### 6.4 Admin Daily Workflow
```
Login (/admin/login) → Dashboard
→ Check stat cards for flags (pending payments, low stock)
→ Orders → Update statuses for the day's pickups/deliveries
→ Inventory → Log any new production batches
→ Events → Review any new inquiries
→ AI Labels → Approve pending label submissions
→ Settings → Adjust availability for upcoming days
```

---

## 7. Page-Level Requirements

| Page | Auth Required | Key Requirement |
|---|---|---|
| `/` | No | Hero CTA, featured products, brand story, service icons |
| `/shop` | No | Category filter tabs, all product types visible |
| `/shop/bundle-4` | No | Flavour slot picker, live price calculator |
| `/shop/bundle-6` | No | Same as bundle-4 |
| `/checkout` | No | Full checkout flow; delivery address validation |
| `/confirmation` | No | Order number, summary, next steps |
| `/events` | Login to submit | Pricing info visible to all; form behind auth |
| `/ai-label-studio` | Login + approved event | Blocked entirely without approved event |
| `/wholesale` | No | Info + CTA to apply |
| `/business` | No | Application form + code entry |
| `/login` | No | Email + password |
| `/signup` | No | Name + email + password |
| `/faq` | No | Accordion list from CMS |
| `/contact` | No | Contact form + store info |
| `/admin/*` | Admin role | All admin pages blocked without admin session |

---

## 8. API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | List orders (admin) |
| `POST` | `/api/stripe/create-checkout-session` | Create Stripe checkout |
| `POST` | `/api/stripe/webhook` | Handle Stripe events (payment succeeded, etc.) |
| `GET` | `/api/delivery-fee` | Calculate delivery fee from address |
| `POST` | `/api/events` | Submit event inquiry |
| `GET` | `/api/events` | List event inquiries (admin) |
| `POST` | `/api/contact` | Submit contact form |
| `POST` | `/api/ai-labels` | Generate Gemini label suggestions |
| `GET` | `/api/ai-labels` | List label requests (admin) |
| `GET` | `/api/products` | List products |

---

## 9. Data Models (Supabase Schema)

### `profiles` (extends Supabase auth.users)
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | FK to auth.users |
| `full_name` | text | |
| `phone` | text | |
| `role` | enum | `customer`, `business`, `admin` |
| `created_at` | timestamp | |

### `orders`
| Field | Type | Notes |
|---|---|---|
| `id` | text | e.g. `ORD-2026-001` |
| `customer_id` | uuid | FK to profiles |
| `customer_name` | text | |
| `customer_email` | text | |
| `customer_phone` | text | |
| `type` | enum | `pickup`, `delivery` |
| `status` | enum | New / Paid / Preparing / etc. |
| `payment_method` | enum | stripe / etransfer / cash |
| `subtotal` | numeric | |
| `delivery_fee` | numeric | |
| `discount` | numeric | |
| `gst` | numeric | |
| `total` | numeric | |
| `promo_code` | text | nullable |
| `delivery_address` | text | nullable |
| `pickup_date` | date | |
| `pickup_time` | text | |
| `notes` | text | |
| `stripe_session_id` | text | nullable |
| `created_at` | timestamp | |

### `order_items`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `order_id` | text | FK to orders |
| `product_id` | text | |
| `name` | text | |
| `type` | enum | can / bundle / espresso |
| `quantity` | int | |
| `price` | numeric | unit price |
| `sweetness` | text | for espresso |

### `products`
| Field | Type | Notes |
|---|---|---|
| `id` | text | e.g. `lotus-250` |
| `name` | text | |
| `category` | enum | core / limited |
| `size` | int | ml |
| `price` | numeric | |
| `status` | enum | available / coming_soon / unavailable |
| `stock` | int | current available units |
| `image_url` | text | Supabase Storage URL |
| `description` | text | |
| `allergens` | text[] | |

### `event_inquiries`
| Field | Type | Notes |
|---|---|---|
| `id` | text | e.g. `EVT-2026-001` |
| `customer_id` | uuid | FK to profiles |
| `event_type` | text | |
| `event_date` | date | |
| `guest_count` | int | |
| `core_cans` | int | |
| `limited_cans` | int | |
| `notes` | text | |
| `status` | enum | pending / approved / rejected |
| `admin_note` | text | nullable |
| `deposit_paid` | boolean | |
| `created_at` | timestamp | |

### `ai_label_requests`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `event_inquiry_id` | text | FK to event_inquiries |
| `customer_id` | uuid | |
| `tone` | text | |
| `generated_text` | text | final submitted label |
| `status` | enum | pending / approved / revision_requested |
| `admin_note` | text | nullable |
| `created_at` | timestamp | |

### `wholesale_applications`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `business_name` | text | |
| `contact_name` | text | |
| `email` | text | |
| `phone` | text | |
| `business_type` | text | |
| `abn` | text | nullable |
| `status` | enum | pending / approved / rejected |
| `created_at` | timestamp | |

### `business_codes`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `code` | text | unique, one-time |
| `application_id` | uuid | FK to wholesale_applications |
| `email` | text | sent to |
| `expires_at` | timestamp | 48hrs after creation |
| `used_at` | timestamp | nullable |
| `created_at` | timestamp | |

### `promo_codes`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `code` | text | unique |
| `type` | enum | percentage / fixed / free_delivery |
| `value` | numeric | % or $ |
| `expires_at` | timestamp | nullable |
| `usage_limit` | int | nullable |
| `times_used` | int | default 0 |
| `active` | boolean | |

### `inventory_batches`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `product_id` | text | FK to products |
| `quantity_added` | int | |
| `batch_date` | date | |
| `notes` | text | |
| `created_at` | timestamp | |

### `availability_slots`
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `date` | date | |
| `time_slot` | text | e.g. "3:00 PM" |
| `available` | boolean | |
| `max_orders` | int | optional cap |

### `settings`
| Field | Type | Notes |
|---|---|---|
| `key` | text | unique setting key |
| `value` | jsonb | flexible value store |
| `updated_at` | timestamp | |

---

## 10. Out of Scope (v1.0)

The following are **intentionally excluded** from the initial release:

| Feature | Reason |
|---|---|
| Subscription / recurring orders | Not needed for this volume yet |
| Customer loyalty/points system | Post-launch |
| Multi-location / multi-city | Calgary only for now |
| Mobile app (iOS/Android) | Web-first; app later if needed |
| Live chat / chatbot | Contact form is sufficient |
| Social login (Google, Apple) | Email/password only for now |
| Inventory barcode scanning | Manual batch entry is sufficient |
| Product reviews / ratings | Not in brand concept |
| Automated refund processing | Manual; Adam handles case-by-case |
| Multi-currency | CAD only |

---

## 11. Acceptance Criteria Summary

### Retail flow is complete when:
- [ ] A customer can browse, add to cart, checkout with Stripe, and receive an email confirmation
- [ ] Pickup and delivery both work end-to-end
- [ ] Delivery fee is calculated using real Google Maps distance
- [ ] Promo codes apply correctly to cart totals
- [ ] GST is calculated and displayed accurately

### Event flow is complete when:
- [ ] A logged-in customer can submit an event inquiry
- [ ] Adam receives an email notification of the inquiry
- [ ] Adam can approve/reject in admin
- [ ] Approved customer can use AI Label Studio (Gemini)
- [ ] Customer can submit a label; Adam can approve it in admin

### Wholesale flow is complete when:
- [ ] A business can submit an application
- [ ] Adam can approve it and a code is emailed automatically
- [ ] Business enters code and sees wholesale pricing
- [ ] Wholesale orders appear in admin for Adam's approval

### Admin is complete when:
- [ ] All orders visible and statuses can be updated
- [ ] Inventory can be logged and monitored
- [ ] Availability slots can be managed
- [ ] Settings persist to Supabase and reflect live in the UI
- [ ] All email notifications send correctly

---

## 12. Dependencies & Integrations

| Service | Purpose | SDK / Package |
|---|---|---|
| Supabase | Database, Auth, Storage | `@supabase/supabase-js` |
| Stripe | Card payments, webhooks | `stripe`, `@stripe/stripe-js` |
| Resend | Transactional emails | `resend` |
| Google Gemini | AI label generation | `@google/genai` ✅ installed |
| Google Maps | Delivery distance calc | `@googlemaps/google-maps-services-js` |

---

## 13. Release Milestones

| Milestone | Features | Target |
|---|---|---|
| **Alpha** | Shop + Cart + Checkout (mock payments) | Complete |
| **Beta** | Supabase + Stripe connected; order confirmation emails | Sprint 1 |
| **v1.0** | All 4 revenue streams live; admin fully functional | Sprint 2–3 |
| **v1.1** | Bundle customiser pages; customer account dashboard | Post-launch |
| **v1.2** | Real-time inventory; availability calendar | Post-launch |

---

*This PRD is a living document. Update it as features are added, scoped out, or reprioritised.*  
*Cross-reference: [`project-brief.md`](./project-brief.md) · [`../brand.md`](../brand.md)*
