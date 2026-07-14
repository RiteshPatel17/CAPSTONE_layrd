# LÄYRD E-Commerce – README

## 🍰 About

**LÄYRD** is a Calgary boutique dessert brand selling handcrafted cheesecakes and tiramisus in 250ml cans.

This is the full-stack web application built with:
- **Next.js 16** (App Router) + **React 19** – JavaScript/JSX (no TypeScript)
- **Tailwind CSS v4** – styling
- **Supabase** – database, authentication, file storage
- **Stripe** – card payments
- **OpenRouteService API** – delivery fee calculation
- **Resend** – transactional emails
- **Google Gemini** – AI label generation

---

## 📁 Project Structure

```
layrd-ecommerce/
├── src/
│   ├── app/
│   │   ├── page.jsx                 # Homepage
│   │   ├── layout.jsx               # Root layout (CartProvider, Navbar, Footer)
│   │   ├── globals.css              # Full design system
│   │   ├── shop/
│   │   │   ├── page.jsx             # Shop with filters
│   │   │   └── [id]/page.jsx        # Product detail
│   │   ├── cart/page.jsx            # Cart page
│   │   ├── checkout/page.jsx        # Checkout (delivery, payment)
│   │   ├── confirmation/page.jsx    # Order confirmation
│   │   ├── faq/page.jsx             # FAQ accordion
│   │   ├── contact/page.jsx         # Contact form
│   │   ├── events/page.jsx          # Private event inquiries
│   │   ├── ai-label-studio/page.jsx # AI label generation
│   │   ├── wholesale/page.jsx       # Wholesale info
│   │   ├── business/page.jsx        # Business account application
│   │   ├── login/page.jsx           # Login
│   │   ├── signup/page.jsx          # Signup
│   │   ├── admin/
│   │   │   ├── page.jsx             # Admin dashboard
│   │   │   ├── products/page.jsx    # Product management
│   │   │   ├── orders/page.jsx      # Order management
│   │   │   └── settings/page.jsx    # App settings
│   │   └── api/
│   │       ├── products/route.js
│   │       ├── orders/route.js
│   │       ├── delivery-fee/route.js
│   │       ├── contact/route.js
│   │       ├── events/route.js
│   │       ├── ai-labels/route.js
│   │       └── stripe/create-checkout-session/route.js
│   ├── components/
│   │   ├── cart/
│   │   │   ├── CartContext.jsx      # Cart state (useReducer + localStorage)
│   │   │   └── CartSidebar.jsx      # Slide-in cart panel
│   │   ├── layout/
│   │   │   ├── Navbar.jsx           # Sticky navbar
│   │   │   └── Footer.jsx           # Site footer
│   │   └── products/
│   │       └── ProductCard.jsx      # Product card component
│   ├── data/
│   │   ├── seed-products.js         # Mock products, flavours, espresso, bundles
│   │   └── faqs.js                  # FAQ content
│   └── lib/
│       ├── constants.js             # All app-wide constants
│       ├── pricing.js               # Pricing utility functions
│       ├── supabase.js              # Supabase client stub
│       ├── stripe.js                # Stripe client stub
│       ├── resend.js                # Email stub
│       ├── anthropic.js             # AI label stub
│       ├── maps.js                  # Google Maps stub
│       └── auth.js                  # Auth utility stub
├── supabase/
│   └── schema.sql                   # Full DB schema + RLS policies
├── .env.example                     # Environment variable template
└── README.md                        # This file
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
cd layrd-ecommerce
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
# Fill in your real API keys
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 👥 Developer Task Split

### Dev 1 – Frontend & UI (Public Pages)
- `src/app/page.jsx` – Homepage
- `src/app/shop/` – Shop + Product Detail
- `src/app/faq/page.jsx` – FAQ
- `src/app/contact/page.jsx` – Contact
- `src/app/events/page.jsx` – Events
- `src/app/wholesale/page.jsx` – Wholesale
- `src/app/business/page.jsx` – Business Account
- `src/app/ai-label-studio/page.jsx` – AI Labels
- `src/components/` – All UI components
- Polish mobile responsiveness

### Dev 2 – Cart, Checkout, Payments, Email
- `src/components/cart/CartContext.jsx` – Cart state
- `src/components/cart/CartSidebar.jsx` – Cart UI
- `src/app/cart/page.jsx` – Cart page
- `src/app/checkout/page.jsx` – Checkout form
- `src/app/confirmation/page.jsx` – Confirmation
- `src/lib/pricing.js` – Pricing logic
- `src/app/api/stripe/` – Stripe integration
- `src/app/api/delivery-fee/` – Delivery calculation
- `src/lib/maps.js` – Real OpenRouteService integration
- `src/lib/resend.js` – Real email sending
- Promo code logic

### Dev 3 – Backend, Auth, Admin, Database
- `supabase/schema.sql` – Database setup
- `src/lib/supabase.js` – Real Supabase client
- `src/lib/auth.js` – Real Supabase auth
- `src/app/login/` + `src/app/signup/` – Auth pages
- All `/api` routes – Connect to Supabase
- `src/app/admin/` – All admin pages
- Row Level Security policies
- Admin-only route protection
- Wholesale & business code system

---

## 🔑 Promo Codes (Demo)

For testing, these codes work in the cart:
- `LAYRD10` – 10% off
- `FREESHIP` – Free delivery

For the business account activation demo:
- Code: `LAYRD-DEMO`

---

## 🌐 Key URLs

| Page | URL |
|---|---|
| Home | `/` |
| Shop | `/shop` |
| Product | `/shop/lotus-250` |
| Cart | `/cart` |
| Checkout | `/checkout` |
| FAQ | `/faq` |
| Events | `/events` |
| AI Labels | `/ai-label-studio` |
| Wholesale | `/wholesale` |
| Business | `/business` |
| Login | `/login` |
| Admin | `/admin` |
| Admin Orders | `/admin/orders` |
| Admin Products | `/admin/products` |
| Admin Settings | `/admin/settings` |

---

## 🔐 Auth Roles

| Role | Access |
|---|---|
| `customer` | Own orders, event inquiries (login required for events) |
| `business` | Business dashboard, wholesale orders |
| `admin` | Full admin dashboard, all data |

---

## ✅ Connecting Real Services

1. **Supabase**: Copy URL + anon key from Supabase project settings → `.env.local`
2. **Stripe**: Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. **OpenRouteService**: Get API key → add `OPENROUTESERVICE_API_KEY`
4. **Resend**: Create API key → add `RESEND_API_KEY`
5. **Gemini**: Get API key → add `GEMINI_API_KEY`

Then uncomment the real implementation code in each `src/lib/*.js` file (marked with `TODO`).

---

## 📝 Brand Info

- **Name**: LÄYRD
- **Tagline**: Cake in a Can | Espresso Shots
- **Email**: info@layrd.org
- **Phone**: 403-399-3903
- **Instagram**: @l.a.y.r.d
- **Pickup**: Pineridge NE, Calgary, AB
