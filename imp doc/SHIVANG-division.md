# LÄYRD Capstone — Your Part: Admin Frontend + AI Integration

Hey Shivang — this is your file list and talking points for the presentation. You own the entire admin dashboard plus both AI-powered features (AI label studio and logo studio).

## Your files

### Admin pages
```
src/app/admin/page.jsx
src/app/admin/ai-labels/page.jsx
src/app/admin/availability/page.jsx
src/app/admin/business-codes/page.jsx
src/app/admin/contact/page.jsx
src/app/admin/events/page.jsx
src/app/admin/faq/page.jsx
src/app/admin/inventory/page.jsx
src/app/admin/orders/page.jsx
src/app/admin/products/page.jsx
src/app/admin/promo-codes/page.jsx
src/app/admin/settings/page.jsx
src/app/admin/wholesale/page.jsx
```

### AI feature pages
```
src/app/ai-label-studio/page.jsx
src/app/logo-studio/page.jsx
```

### Admin components
```
src/components/admin/AdminLayout.jsx
src/components/admin/AdminAuthGuard.jsx
src/components/admin/AdminSidebar.jsx
src/components/admin/AdminCard.jsx
src/components/admin/AdminFormField.jsx
src/components/admin/AdminPageHeader.jsx
src/components/admin/AdminTable.jsx
src/components/admin/ConfirmModal.jsx
src/components/admin/EmptyState.jsx
src/components/admin/StatusBadge.jsx
```

### AI integration
```
src/lib/anthropic.js
src/app/api/ai-labels/route.js
microservices/ai-label-service/index.js
microservices/ai-label-service/package.json
microservices/ai-label-service/test-auth.js
microservices/ai-label-service/assets/logo-icon.png
microservices/ai-label-service/fonts/CormorantGaramond-Italic.ttf
microservices/ai-label-service/migrations/001_add_updated_at.sql
microservices/ai-label-service/migrations/002_add_label_image_and_quantity.sql
```

**Total solo: 19 files**

### Joint files (with Ritesh)
These Server Actions power your admin pages. **You present the UI/data-flow side** — what each page shows, what action it calls, what happens on screen. Ritesh presents the security check inside each one. Don't claim these as fully yours, but know roughly what each does:
```
src/lib/admin-dashboard-client.js
src/lib/admin-faq.js
src/lib/admin-inventory.js
src/lib/admin-order-items.js
src/lib/admin-orders.js
src/lib/admin-products.js
src/lib/admin-promos.js
src/lib/admin-settings.js
src/lib/admin-site-images.js
src/lib/admin-stats.js
```

**Total joint: 10 files — grand total 29**

---

## Talking points for your section

- **One login, role-based access**: there's no separate admin login system — an admin is just a regular Supabase account where `profiles.role = "admin"`. Your `AdminAuthGuard` component redirects non-admins client-side; this is the UX layer (no flash of admin content before redirect). The layer that actually matters for security is Ritesh's server-side `requireAdmin()` check on every Server Action — good to mention both, and be clear which one you built.
- **AI label studio flow**: describe it end-to-end — admin fills a form (event details, quantities) → request goes to `/api/ai-labels` → proxies to `ai-label-service` (port 3004) → that service calls Gemini to generate the label design → result comes back and renders in the studio.
- **Why a separate microservice for AI labels**: it isolates the Gemini API key to one place, and if the AI service goes down, it doesn't take down the rest of the admin panel or any customer-facing action.
- **Admin table/CRUD pattern**: most admin pages follow the same shape — `AdminTable` renders data, actions call a Server Action from `src/lib/admin-*.js`, which checks admin permission before touching the database. You can use one page (e.g. `admin/products`) as your detailed walkthrough example and note the others follow the same pattern.

## A real bug worth mentioning if asked about security
Several of these admin Server Actions (`admin-products.js`, `admin-settings.js`, `admin-faq.js`, `admin-site-images.js`) originally had **no permission check at all** — meaning anyone could call them directly, bypassing the UI entirely, since Server Actions are invokable by their action ID regardless of what page renders them. This was found and fixed — every one of them now calls `requireAdmin()` first. This is a good story of "we found and fixed a real vulnerability," and it's fine for you to mention it even though the fix itself was Ritesh's — you can say you helped surface it while building the UI around these actions.

## If asked "who built X" and it's not on your list
Storefront pages (shop, cart, checkout UI) are Aaryan's. All API routes, Supabase auth internals, Stripe, and the other three microservices (delivery, promo, notifications) are Ritesh's.
