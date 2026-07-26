# LÄYRD E-COMMERCE — Implementation Plan

> **Document Type:** Technical Implementation Plan  
> **Version:** 1.0  
> **Folder:** `g:/layrd-v1/imp doc/`  
> **Last Updated:** July 2026  
> **Cross-reference:** [TRD.md](./TRD.md) · [backend-schema.md](./backend-schema.md) · [jira-reference.md](./jira-reference.md)

---

## Overview

This document translates the LÄYRD architecture and Jira stories into a concrete, sequential development roadmap. It defines exactly what needs to be built, in what order, to ensure smooth integration between the backend (Supabase/Stripe/Gemini) and the frontend (Next.js/React).

---

## Phase 1: Environment & Foundation Setup
**Goal:** Establish the development environment, version control, and core cloud services.

- [ ] **GitHub Repository:**
  - Initialise `layrd-ecommerce` repo.
  - Set up `main` and `dev` branches with branch protection.
  - Connect Jira integration for commit tracking.
- [ ] **Local Next.js Setup:**
  - Run `npx create-next-app@latest`.
  - Configure TailwindCSS, App Router, and base `globals.css` with day/night CSS variables from `brand.md`.
- [ ] **Supabase Setup:**
  - Create Supabase project.
  - Set up local `.env` variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] **Third-Party Accounts:**
  - Create Stripe developer account and get test API keys.
  - Create Google Gemini API key.
  - Create Resend API key for transactional emails.

---

## Phase 2: Database Setup & Migrations (Backend)
**Goal:** Implement the data layer defined in `backend-schema.md`.

- [ ] **Table Creation:**
  - Run SQL scripts to create `profiles`, `products`, `orders`, `order_items`, `inventory_batches`, `event_inquiries`, `ai_label_requests`, `wholesale_applications`, `business_codes`, `promo_codes`, `availability_slots`, and `settings`.
- [ ] **Database Functions & Triggers:**
  - Implement `handle_new_user()` trigger for `profiles`.
  - Implement auto-ID generators for `orders` (`ORD-2026-001`) and `events` (`EVT-2026-001`).
  - Implement `get_stock_summary()` Postgres RPC function.
- [ ] **Row Level Security (RLS):**
  - Apply RLS policies across all tables (public reads for products, owner-only reads for orders, admin bypass via service role).
- [ ] **Storage Buckets:**
  - Create `product-images` (public) and `label-artwork` (private).
- [ ] **Seed Data:**
  - Insert initial 9 products (cakes + espresso) and default store settings.

---

## Phase 3: Core Frontend UI & Components
**Goal:** Build the visual shell and reusable component library.

- [ ] **Typography & Theme:**
  - Implement `Cormorant Garamond` and `Inter` in `layout.jsx`.
  - Build `ThemeToggle` component and local storage persistence.
- [ ] **Layout Shell:**
  - Build responsive `Navbar` (with cart drawer trigger) and `Footer`.
- [ ] **Component Library:**
  - Build `Button` (Primary, Outline, Ghost, Danger).
  - Build `ProductCard` (with status badges).
  - Build `FormInput` and `Badge` components.
- [ ] **Pages (Static first):**
  - Build `/` (Homepage) with Hero and decorative rings.
  - Build `/shop` layout.
  - Build `/contact` and `/faq`.

---

## Phase 4: State Management & Product Integration
**Goal:** Connect the frontend to Supabase and handle local cart state.

- [ ] **Supabase Client:**
  - Implement singleton client in `src/lib/supabase.js`.
- [ ] **Product Fetching:**
  - Update `src/lib/admin-products.js` to fetch live data from Supabase instead of mock data.
  - Render live products on `/shop`.
- [ ] **Cart Context:**
  - Implement React Context for cart state (`items`, `subtotal`).
  - Build `CartSidebar` that reads from Context and allows quantity adjustments.
- [ ] **Authentication Flow:**
  - Build `/login` and `/signup` pages using Supabase Auth.
  - Implement session management in `layout.jsx`.

---

## Phase 5: Checkout & Payments (Stripe)
**Goal:** Complete the transaction flow.

- [ ] **Checkout UI:**
  - Build `/checkout` page collecting contact and delivery/pickup info.
  - Implement delivery fee logic based on postal code / distance calculation.
- [ ] **API Routes (Server-side):**
  - Build `/api/checkout_sessions` route.
  - Calculate cart total server-side (preventing frontend tampering).
  - Create Stripe Checkout Session.
- [ ] **Webhooks:**
  - Build `/api/webhooks/stripe` to listen for `checkout.session.completed`.
  - Securely insert order and order items into Supabase upon payment success.
- [ ] **Confirmation Page:**
  - Build `/confirmation` page displaying order ID and storage instructions.

---

## Phase 6: Admin Dashboard
**Goal:** Build the secure back-office for Adam.

- [ ] **Admin Layout & Auth Guard:**
  - Build `AdminSidebar`.
  - Implement `AdminAuthGuard` that redirects non-admins.
- [ ] **Order Management:**
  - Build `/admin/orders` view. Allow Adam to change statuses (New → Preparing → Completed).
- [ ] **Inventory & Batches:**
  - Build `/admin/inventory` view. Allow Adam to log new batches to update calculated stock.
- [ ] **Settings:**
  - Build `/admin/settings` to manage delivery tiers, GST, and contact info.

---

## Phase 7: Advanced Features
**Goal:** Deliver the unique selling points (AI, Wholesale, Drops).

- [ ] **AI Label Studio (Shivang):**
  - Frontend: Build `/ai-label-studio` multi-step form.
  - Backend: Connect `src/lib/gemini.js` to Google GenAI SDK.
  - Store generated labels in `ai_label_requests` table.
- [ ] **Wholesale System (Shivang):**
  - Frontend: Build `/wholesale` and `/business` application pages.
  - Admin: Build verification code generator in `/admin/wholesale`.
  - Backend: Implement logic to apply wholesale pricing at checkout if a valid code is in session.
- [ ] **Product Drops (Shivang):**
  - Add `release_date` countdown logic to `ProductCard`.
  - Prevent checkout of drops before release time.

---

## Phase 8: Testing & Refinement
**Goal:** Ensure platform stability and UI perfection.

- [ ] **End-to-End Testing:**
  - Test checkout flow as guest.
  - Test checkout flow as logged-in user.
  - Test Stripe webhook locally using Stripe CLI.
  - Test AI label fallback mechanisms.
- [ ] **UX Polish:**
  - Ensure all animations (`fadeIn`, `shimmer`) are smooth.
  - Verify Day/Night mode looks perfect on all pages.
  - Mobile responsiveness check (especially cart sidebar and tables).
- [ ] **Security Review:**
  - Verify RLS policies are strictly enforced.
  - Ensure API routes validate all incoming payload data.

---

## Phase 9: Deployment & Handoff
**Goal:** Go live and transfer ownership.

- [ ] **Deployment:**
  - Connect Vercel to GitHub `main` branch.
  - Add all production environment variables to Vercel and Supabase.
- [ ] **Documentation:**
  - Ensure all code is commented for the academic submission.
  - Create a User Manual for Adam covering how to use the Admin Dashboard.
- [ ] **Final Delivery:**
  - Capstone presentation preparation and live demo rehearsal.

---

*This document outlines the chronological execution path for development. Refer to Jira for specific story assignments and sprint tracking.*
