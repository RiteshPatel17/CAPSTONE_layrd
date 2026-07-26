# LÄYRD E-COMMERCE — Jira Project Reference Document

> **Group 8 — SAIT Capstone**  
> **Team:** Ritesh Patel · Aaryan · Shivang Thakur  
> **Project Key:** CAPST  
> **Space:** Layrd E-comm  
> **Folder:** `g:/layrd-v1/imp doc/`

---

## 1. Project Overview

| Field | Details |
|---|---|
| **Client** | Adam — Cake in a Can & Läyrd Espresso, Calgary AB |
| **Project** | LÄYRD — Premium dessert and coffee e-commerce platform |
| **Jira Space** | Layrd E-comm (CAPST) |
| **GitHub Repo** | layrd-ecommerce |
| **Tech Stack** | React / Next.js / Tailwind (Vercel) + Supabase / PostgreSQL + Stripe + Gemini API |
| **Team Roles** | **Ritesh Patel:** Backend, Lead & Frontend<br>**Aaryan:** Frontend & UI<br>**Shivang Thakur:** AI, Integrations & Frontend |

---

## 2. Epics

*Create all 10 epics first in Jira before creating any stories. Epics are the parent groupings for all stories.*

**EP-1 — Project Setup & Planning**  
- **Label:** `planning` | **Dates:** June 2 – June 27, 2026  
- **Description:** Covers all planning, documentation, client meetings, team contract, business canvas, and academic submissions before development begins.

**EP-2 — Backend & Database**  
- **Label:** `backend` | **Dates:** June 30 – August 18, 2026  
- **Description:** All backend API development, Supabase/PostgreSQL database setup, schema design, delivery logic, authentication, and security work.

**EP-3 — Frontend & UI**  
- **Label:** `frontend` | **Dates:** June 16 – August 20, 2026  
- **Description:** All React frontend pages, components, wireframes, brand research, and UI refinement work. *Note: Ritesh and Shivang will also assist Aaryan with frontend work to balance the load.*

**EP-4 — Checkout & Payments**  
- **Label:** `payments` | **Dates:** June 30 – August 8, 2026  
- **Description:** Stripe payment integration, checkout flow UI (Ritesh), and delivery fee calculation for the online storefront.

**EP-5 — Admin Panel**  
- **Label:** `admin` | **Dates:** June 30 – August 15, 2026  
- **Description:** Adam's admin dashboard for managing orders, products, product drops, and business account applications. Backend + Frontend implementation.

**EP-6 — AI Label Generator**  
- **Label:** `ai` | **Dates:** June 30 – August 15, 2026  
- **Description:** Gemini API integration allowing customers to describe their event and receive 3 AI-generated label text suggestions. Includes full frontend UI (Shivang).

**EP-7 — Product Drops & Scheduling**  
- **Label:** `drops` | **Dates:** June 30 – August 15, 2026  
- **Description:** Scheduled product drop system with admin controls and a live frontend countdown timer (Shivang) displayed on the homepage and product pages.

**EP-8 — Business Account & Wholesale**  
- **Label:** `wholesale` | **Dates:** June 30 – August 15, 2026  
- **Description:** Wholesale buyer system with an application form UI, admin approval flow, and verification codes.

**EP-9 — Testing & QA**  
- **Label:** `testing` | **Dates:** June 30 – August 18, 2026  
- **Description:** Full testing strategy, end-to-end integration testing, and bug fixing across all features.

**EP-10 — Deployment & Handoff**  
- **Label:** `handoff` | **Dates:** August 18 – August 20, 2026  
- **Description:** Final deployment to Vercel and Supabase. Includes project documentation, client handoff materials, and capstone showcase preparation.

---

## 3. Sprints & Stories

*All stories use Work Type: `Story`. Reporter is always Ritesh Patel. Stories marked with ⚡ Watchers need Aaryan and Shivang added as Watchers after saving.*

### Sprint 1 — Project Setup & Planning
**Dates:** June 2 – June 27, 2026  
**Goal:** Complete all project planning, documentation, and academic submissions. Conduct client meeting with Adam.

1. **Read the Läyrd product information document (Ritesh)** — 1pt | `planning`, `onboarding`
2. **Read the Läyrd product information document (Aaryan)** — 1pt | `planning`, `onboarding`
3. **Read the Läyrd product information document (Shivang)** — 1pt | `planning`, `onboarding`
4. **Set up GitHub repository and connect to Jira (Ritesh)** — 2pt | `planning`
5. **Client meeting with Adam — June 3rd (Ritesh)** ⚡ — 2pt | `planning`
6. **Team meeting — deciding app flow (Ritesh)** ⚡ — 2pt | `planning`
7. **Team meeting — deciding app flow (Shivang)** — 2pt | `planning`
8. **Team meeting — deciding app flow (Aaryan)** — 2pt | `planning`
9. **Complete and submit Team Contract (Ritesh)** — 2pt | `planning`
10. **Complete and submit Business Case / Canvas (Ritesh)** — 3pt | `planning`
11. **Prepare and deliver Project Plan presentation (Ritesh)** ⚡ — 3pt | `planning`, `presentation`

### Sprint 2 — Architecture & Research
**Dates:** June 28 – July 18, 2026  
**Goal:** Plan and research all technical foundations before coding begins. Define architecture, Supabase schema, and frontend UI library.

1. **Plan backend architecture (Ritesh)** — 3pt | `backend`
2. **Plan Supabase database schema (Ritesh)** — 3pt | `backend`, `database`
3. **Research Stripe payment integration (Ritesh)** — 2pt | `payments`, `stripe`
4. **Plan admin panel features and access control (Ritesh)** — 2pt | `admin`, `backend`
5. **Plan delivery fee calculation logic (Ritesh)** — 2pt | `backend`
6. **Plan React project structure and component library (Aaryan)** — 2pt | `frontend`, `ui`
7. **Create wireframes for all UI pages (Aaryan)** — 5pt | `frontend`, `ui`
8. **Research Läyrd brand and apply to design plan (Aaryan)** — 2pt | `frontend`, `ui`
9. **Research Instagram feed embed for storefront (Aaryan)** — 1pt | `frontend`
10. **Research Gemini API for AI label generator (Shivang)** — 3pt | `ai`
11. **Plan scheduled product drops and countdown timer UI (Shivang)** — 2pt | `drops`, `frontend`
12. **Plan business account and wholesale system (Shivang)** — 2pt | `wholesale`
13. **Plan testing strategy for the app (Shivang)** — 2pt | `testing`, `qa`
14. **Sprint 1 Status Update presentation (Ritesh)** ⚡ — 2pt | `presentation`

### Sprint 3 — Core Build
**Dates:** July 19 – July 25, 2026  
**Goal:** Build the core working platform. Setup DB, Auth, Homepage, and Catalogue.

1. **Build product catalogue API endpoints (Ritesh)** — 5pt | `backend`
2. **Set up Supabase database and run migrations (Ritesh)** — 5pt | `backend`, `database`
3. **Build user authentication & Admin Guards (Ritesh)** — 5pt | `backend`, `frontend` *(Frontend work added for Ritesh)*
4. **Build homepage UI (Aaryan)** — 5pt | `frontend`, `ui`
5. **Build product catalogue and product detail pages (Aaryan)** — 5pt | `frontend`, `ui`
6. **Build cart and guest checkout flow UI (Ritesh & Aaryan)** — 5pt | `frontend`, `ui` *(Frontend work added for Ritesh)*

### Sprint 4 — Payments & Admin
**Dates:** July 26 – August 8, 2026  
**Goal:** Complete checkout experience and admin panel.

1. **Build Stripe payment integration (Ritesh)** — 8pt | `payments`, `stripe`
2. **Build delivery fee calculation API (Ritesh)** — 5pt | `backend`
3. **Build Admin Panel Frontend — Order Management (Ritesh)** — 5pt | `admin`, `frontend` *(Frontend work added for Ritesh)*
4. **Build Admin Panel Frontend — Product Management (Ritesh)** — 5pt | `admin`, `frontend` *(Frontend work added for Ritesh)*
5. **Sprint 2 Status Update presentation (Ritesh)** ⚡ — 2pt | `presentation`

### Sprint 5 — AI, Drops & Wholesale
**Dates:** August 9 – August 15, 2026  
**Goal:** Deliver advanced features including AI Labels, Drops, and Wholesale.

1. **Build AI label generator Feature & UI (Shivang)** — 8pt | `ai`, `frontend` *(Frontend work added for Shivang)*
2. **Build scheduled product drops and countdown timer UI (Shivang)** — 5pt | `drops`, `frontend` *(Frontend work added for Shivang)*
3. **Build business account application and wholesale UI (Shivang)** — 8pt | `wholesale`, `frontend` *(Frontend work added for Shivang)*
4. **Build Admin Panel Frontend — Product Drops & Wholesale (Shivang)** — 5pt | `admin`, `frontend` *(Frontend work added for Shivang)*

### Sprint 6 — Testing & Refinement
**Dates:** August 16 – August 18, 2026  
**Goal:** Merge all streams, test End-to-End, and refine UI.

1. **End-to-end integration testing (Shivang)** — 8pt | `testing`, `qa`
2. **Bug fixes and UX refinement (Aaryan)** — 5pt | `frontend`, `ui`
3. **Security review and input validation (Ritesh)** — 5pt | `backend`
4. **Client review meeting with Adam (Ritesh)** ⚡ — 2pt | `planning`
5. **Sprint 3 Status Update presentation (Ritesh)** ⚡ — 2pt | `presentation`

### Sprint 7 — Polish & Handoff
**Dates:** August 18 – August 20, 2026  
**Goal:** Deliver production-ready platform to client.

1. **Final polish based on client feedback (Aaryan & Ritesh & Shivang)** — 3pt | `frontend`, `ui`
2. **Write final project documentation and code comments (Ritesh)** — 3pt | `handoff`
3. **Final deployment and handoff preparation (Shivang)** — 5pt | `deployment`, `handoff`
4. **Capstone showcase preparation (Ritesh)** — 3pt | `presentation`, `handoff`
5. **Final Showcase and Peer Assessment (Ritesh)** ⚡ — 2pt | `presentation`, `handoff`

---

## 4. Quick Reference

**Watcher tasks — add Aaryan & Shivang after saving:**
- Client meeting with Adam — June 3rd (Sprint 1)
- Team meeting — deciding app flow (Sprint 1)
- Prepare and deliver Project Plan presentation (Sprint 1)
- Sprint 1 Status Update presentation (Sprint 2)
- Sprint 2 Status Update presentation (Sprint 4)
- Client review meeting with Adam (Sprint 6)
- Sprint 3 Status Update presentation (Sprint 6)
- Final Showcase and Peer Assessment (Sprint 7)

**Story Point Totals by Sprint:**
- Sprint 1: 11 stories · 21 story points
- Sprint 2: 14 stories · 33 story points
- Sprint 3: 6 stories · 30 story points
- Sprint 4: 5 stories · 25 story points
- Sprint 5: 4 stories · 26 story points
- Sprint 6: 5 stories · 22 story points
- Sprint 7: 5 stories · 16 story points  
**Total:** 50 stories · 173 story points

**Hosting & Cost for Adam (post-handoff):**
- **Supabase (database):** Free tier, ~$25/mo if upgraded
- **Vercel (frontend & API routes):** Free forever at this scale
- **Domain (Namecheap/Google):** ~$15/year
- **Estimated total:** ~$0/month on free tiers + $15/year domain
