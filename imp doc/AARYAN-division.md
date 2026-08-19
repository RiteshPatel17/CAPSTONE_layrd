# LÄYRD Capstone — Your Part: Customer-Facing Frontend

Hey Aaryan — this is your file list and talking points for the presentation. You own everything a customer sees and clicks through, from landing on the homepage to completing an order.

## Your files

### Pages
```
src/app/page.jsx
src/app/layout.jsx
src/app/globals.css
src/app/favicon.ico
src/app/shop/page.jsx
src/app/shop/[id]/page.jsx
src/app/shop/bundle/[count]/page.jsx
src/app/cart/page.jsx
src/app/checkout/page.jsx
src/app/confirmation/page.jsx
src/app/login/page.jsx
src/app/signup/page.jsx
src/app/reset-password/page.jsx
src/app/reset-password-confirm/page.jsx
src/app/profile/page.jsx
src/app/contact/page.jsx
src/app/faq/page.jsx
src/app/events/page.jsx
src/app/business/page.jsx
src/app/wholesale/page.jsx
src/app/wholesale/_components/WholesaleMedia.jsx
```

### Components
```
src/components/Providers.jsx
src/components/layout/Navbar.jsx
src/components/layout/Footer.jsx
src/components/layout/HeroShapes.jsx
src/components/layout/ThemeToggle.jsx
src/components/cart/CartContext.jsx
src/components/cart/CartSidebar.jsx
src/components/auth/AuthGateModal.jsx
src/components/products/ProductCard.jsx
```

### Data & assets
```
src/data/faqs.js
src/data/seed-products.js
public/  (all images, logo, patterns, icons)
```

**Total: 30 files**

---

## One thing to know before you present

`globals.css` is imported once in the root `layout.jsx`, which wraps the **whole app** — meaning it styles the admin panel too, not just the storefront. Present it as "the shared design system," not "storefront-only CSS." If the instructor asks whether admin uses different styling, the honest answer is: no, same base file.

## Talking points for your section

- **Full customer journey ownership**: home → browse shop → product detail → cart → checkout → payment confirmation → order history (profile page). You can walk through this as one continuous flow.
- **Auth-gated actions**: `AuthGateModal` pops up when a logged-out user tries to check out or submit the contact form — this is the UX layer. (Ritesh's backend enforces the same rule server-side, so even if someone bypassed your modal, the request would still get rejected — good to mention this is defense-in-depth, not just a UI nicety.)
- **Cart persistence**: `CartContext.jsx` keeps cart state in `localStorage`, separate from login state — so a cart survives a page refresh even before someone logs in.
- **Checkout UI**: you built the form (contact info, pickup/delivery, promo code entry) but the actual price the customer pays is recalculated and verified server-side by Ritesh's checkout API — worth stating clearly so it's obvious you understand the split, not claiming you own pricing logic.

## If asked "who built X" and it's not on your list
The admin panel and AI label/logo studio pages are Shivang's. All API routes, Supabase auth, Stripe, and the other microservices are Ritesh's. If a question lands outside your list, it's fine to say "that's [name]'s part" and hand it off.
