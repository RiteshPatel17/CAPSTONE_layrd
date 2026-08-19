# LÄYRD — User Flow Document

> **Document Type:** User Flow  
> **Version:** 1.0  
> **Folder:** `g:/layrd-v1/imp doc/`  
> **Last Updated:** July 2026  
> **Cross-reference:** [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [project-brief.md](./project-brief.md)

---

## Overview

LÄYRD has **four distinct user types**, each with their own journey through the platform:

| User Type | Entry Point | Goal |
|---|---|---|
| **Retail Customer** | Homepage / Shop | Browse → buy cans, bundles, or espresso |
| **Event Customer** | `/events` page | Book private event catering with custom labels |
| **Wholesale Buyer** | `/wholesale` page | Get trade pricing and place bulk orders |
| **Admin (Adam)** | `/admin/login` | Manage all orders, products, inventory, and customers |

---

## 1. Retail Customer Flows

### 1.1 First-Time Visitor → Purchase (Stripe)

```mermaid
flowchart TD
    A([User lands on homepage]) --> B[Views hero + featured products]
    B --> C{Interested?}
    C -- Browse more --> D[Clicks Shop Now or nav → /shop]
    C -- Leave --> Z([Exit])

    D --> E[Sees product grid with filter tabs]
    E --> F{Filter?}
    F -- Yes --> G[Selects Core / Limited / Bundles / Espresso]
    F -- No --> H[Views All products]
    G --> H

    H --> I[Clicks product card]
    I --> J{Product status?}
    J -- Available --> K[Selects quantity → Add to Cart]
    J -- Coming Soon --> L[Views coming soon badge, no add]
    L --> H

    K --> M[Cart sidebar slides in]
    M --> N{Continue shopping?}
    N -- Yes --> D
    N -- Checkout --> O[Clicks Checkout in cart sidebar]

    O --> P[/checkout page]
    P --> P1[Fills contact info: name, email, phone]
    P1 --> P2{Pickup or Delivery?}

    P2 -- Pickup --> P3[Selects Pickup]
    P2 -- Delivery --> P4[Enters delivery address → Clicks Check]
    P4 --> P4a{Within Calgary + ≥4 items?}
    P4a -- Yes --> P4b[Delivery fee shown → Confirmed]
    P4a -- Outside Calgary --> P4c[Shows Outside Calgary — pickup only warning]
    P4c --> P3
    P4a -- Under 4 items --> P4d[Warning: add X more items for delivery]
    P4b --> P5

    P3 --> P5[Selects date and time slot]
    P5 --> P6{Payment method?}

    P6 -- Stripe --> P7[Clicks Pay $X → Redirect to Stripe hosted checkout]
    P7 --> P7a{Payment result?}
    P7a -- Success --> Q[Redirects to /confirmation?order=ORD-XXX]
    P7a -- Cancelled/Failed --> P[Back to /checkout]

    P6 -- E-Transfer --> P8[Clicks Place Order → Order created Pending Payment]
    P8 --> Q
    P6 -- Cash --> P9[Clicks Place Order → Order created New]
    P9 --> Q

    Q --> Q1[Sees order number, pickup info, storage reminder]
    Q1 --> Q2[Receives confirmation email]
    Q2 --> R{Next action?}
    R -- Shop Again --> D
    R -- Home --> A
```

---

### 1.2 Adding Espresso Shots

```mermaid
flowchart TD
    A[User on /shop] --> B[Selects Espresso tab or scrolls to Espresso section]
    B --> C[Views 3 pack sizes: ×1 / ×4 / ×6]
    C --> D[Selects sweetness: Black / Sugar / Stevia / Brown Sugar]
    D --> E[Clicks Add to Cart]
    E --> F[Espresso added to cart with sweetness preference]
    F --> G{Want more?}
    G -- Yes --> C
    G -- Checkout --> H[Proceeds to checkout]
    H --> I{Total items ≥ 4?}
    I -- Yes --> J[Delivery option unlocked]
    I -- No --> K[Delivery locked — add more items or choose pickup]
```

---

### 1.3 Bundle Purchase Flow

```mermaid
flowchart TD
    A[User on /shop] --> B[Selects Bundles tab]
    B --> C[Sees 4-Pack and 6-Pack cards]
    C --> D[Clicks Customize Bundle on chosen pack]
    D --> E[Goes to /shop/bundle-4 or /shop/bundle-6]
    E --> F[Selects flavour for each slot]
    F --> G{Any limited flavour selected?}
    G -- Yes --> H[+$1 per limited slot added to price — live updated]
    G -- No --> I[Base price shown]
    H --> J
    I --> J[Clicks Add Bundle to Cart]
    J --> K[Bundle added as single cart item]
    K --> L[Proceeds to standard checkout flow]
```

---

### 1.4 Promo Code Application

```mermaid
flowchart TD
    A[User has items in cart] --> B[Opens cart sidebar]
    B --> C[Enters promo code in code field]
    C --> D{Code valid?}
    D -- Percentage discount --> E[Subtotal reduced by X%]
    D -- Fixed discount --> F[Flat $ amount deducted from subtotal]
    D -- Free delivery --> G[Delivery fee set to $0]
    D -- Invalid / Expired --> H[Error shown: Code not valid]
    E --> I[Updated total shown]
    F --> I
    G --> I
    H --> C
    I --> J[Discount carries through to checkout]
```

---

## 2. Event Customer Flows

### 2.1 First-Time Event Inquiry

```mermaid
flowchart TD
    A([User interested in event catering]) --> B[Visits /events page]
    B --> C[Reads pricing info: $5 core / $6 limited / min 24 cans]
    C --> D[Sees How It Works + Available Flavours]
    D --> E{Logged in?}

    E -- No --> F[Sees Login Required card with lock icon]
    F --> G{Action?}
    G -- Log In --> H[Clicks Log In → /login]
    G -- Create Account --> I[Clicks Create Account → /signup]
    H --> H1[Enters email + password]
    H1 --> H2{Credentials valid?}
    H2 -- Yes --> J[Redirected back to /events — form now visible]
    H2 -- No --> H3[Error shown → Retry]
    I --> I1[Fills name, email, password]
    I1 --> I2[Account created → Auto-logged in]
    I2 --> J

    E -- Yes --> J
    J --> K[Fills inquiry form]
    K --> K1[Selects Event Type from dropdown]
    K1 --> K2[Picks Event Date — min 5 business days out]
    K2 --> K3[Enters Estimated Guests]
    K3 --> K4[Enters Core Cans count]
    K4 --> K5[Enters Limited Cans count]
    K5 --> K6{Total cans ≥ 24?}
    K6 -- No --> K7[Warning shown: Min 24 cans — Submit button stays disabled]
    K7 --> K4
    K6 -- Yes --> K8[Live estimate updates: X cans · $Y]
    K8 --> K9[Adds optional notes]
    K9 --> K10[Clicks Submit Inquiry]
    K10 --> L[Inquiry submitted confirmation shown]
    L --> L1[Adam notified by email]
    L1 --> M[Customer waits for approval]
```

---

### 2.2 Post-Approval: AI Label Studio

```mermaid
flowchart TD
    A([Adam approves event inquiry]) --> B[Customer receives approval email]
    B --> B1[Email includes deposit instructions]
    B1 --> C[Customer pays 50% deposit]
    C --> D[Customer navigates to /ai-label-studio]
    D --> E{Has approved event?}
    E -- No --> F[Blocked: shows no approved event message]
    E -- Yes --> G[Step 1: Configure label]

    G --> G1[Selects tone: Elegant / Romantic / Playful / Luxury / Minimal / Birthday / Wedding / Corporate]
    G1 --> G2[Confirms or edits Event Type]
    G2 --> G3[Optional: enters name to include]
    G3 --> G4[Optional: adds notes]
    G4 --> G5[Clicks Generate Label Suggestions]

    G5 --> H{Gemini API available?}
    H -- Yes --> H1[API returns 3 personalised label options]
    H -- No/Error --> H2[Mock fallback returns 3 tone-based options]
    H1 --> I
    H2 --> I

    I[Step 2: Choose a suggestion] --> I1[Three options displayed]
    I1 --> I2[Customer clicks preferred option — highlighted with gold border]
    I2 --> J[Step 3: Edit and Submit]

    J --> J1[Selected text copied to editable textarea]
    J1 --> J2{Edited text > 80 chars?}
    J2 -- Yes --> J3[Soft warning shown: may be trimmed — not blocked]
    J2 -- No --> J4[Character count shown]
    J3 --> J4
    J4 --> J5[Live preview renders label in Cormorant Garamond italic on dark bg]
    J5 --> J6[Clicks Submit for Adam's Approval]

    J6 --> K[Label saved as Pending Approval]
    K --> K1[Adam reviews in Admin → AI Labels]
    K1 --> L{Adam's decision?}
    L -- Approve --> M[Label locked — customer notified]
    L -- Revision needed --> N[Customer notified with feedback]
    N --> G1[Customer regenerates or edits]
```

---

## 3. Wholesale Buyer Flows

### 3.1 Business Account Application

```mermaid
flowchart TD
    A([Café / retailer / food operator visits site]) --> B[Reads /wholesale page]
    B --> C[Reviews pricing tiers: 24–36 cans $5.50 / 37–47 $5.25 / 48+ $5.00]
    C --> D[Reviews Who Qualifies + How It Works]
    D --> E[Clicks Apply for Business Account → /business]

    E --> F[Fills application form]
    F --> F1[Business name]
    F1 --> F2[Contact name + email + phone]
    F2 --> F3[Business type: café / restaurant / retailer / etc.]
    F3 --> F4[Optional: Alberta Business Number]
    F4 --> F5[Submits application]

    F5 --> G[Application created — Pending status]
    G --> G1[Adam notified by email]
    G1 --> H[Adam reviews in Admin → Wholesale Applications]

    H --> I{Adam's decision?}
    I -- Reject --> J[Applicant notified — reason given]
    J --> Z([End])

    I -- Approve --> K[System generates one-time code]
    K --> K1[Code emailed to business — valid 48 hours]
    K1 --> L[Business returns to /business]
    L --> M[Enters verification code]
    M --> N{Code valid + not expired?}
    N -- No --> O[Error shown: invalid or expired]
    O --> M
    N -- Yes --> P[Account upgraded to business role]
    P --> Q[Wholesale pricing unlocked in checkout]
    Q --> R[Business can now place wholesale orders]
```

---

### 3.2 Wholesale Order Placement

```mermaid
flowchart TD
    A([Business user — verified]) --> B[Logs in to account]
    B --> C[Browses shop with wholesale prices visible]
    C --> D[Adds 250ml cans — minimum 24 required]
    D --> E{Quantity ≥ 24?}
    E -- No --> F[Warning shown — must reach minimum before checkout]
    E -- Yes --> G[Cart shows wholesale price per can]
    G --> H[Proceeds to checkout]
    H --> H1[Fills contact + delivery / pickup preference]
    H1 --> H2{Notice ≥ 3 business days?}
    H2 -- No --> H3[Warning: 3–4 business days notice required]
    H2 -- Yes --> H4[Selects date + time]
    H4 --> H5[Payment: E-Transfer or Stripe]
    H5 --> H6[Submits order → status: Pending Approval]
    H6 --> I[Adam reviews in Admin → Orders]
    I --> J{Adam approves?}
    J -- Reject --> K[Business notified — order cancelled]
    J -- Approve --> L[Order confirmed — payment arranged]
    L --> M[Business pays]
    M --> N[Adam prepares and fulfils order]
```

---

## 4. Admin (Adam) Flows

### 4.1 Admin Login

```mermaid
flowchart TD
    A([Adam visits /admin]) --> B{AdminAuthGuard check}
    B -- Session exists in localStorage --> C[Admin dashboard loads]
    B -- No session --> D[Redirected to /admin/login]
    D --> E[Enters email + password]
    E --> F{Credentials valid?}
    F -- No --> G[Error shown: Invalid email or password]
    G --> E
    F -- Yes --> H[Session saved to localStorage]
    H --> C[/admin dashboard]
    C --> I[Views stat cards and recent orders]
```

---

### 4.2 Daily Admin Workflow

```mermaid
flowchart TD
    A([Adam opens /admin]) --> B[Checks Dashboard stat cards]
    B --> C{Any flags?}

    C -- Pending Payment orders --> D[Admin → Orders → Filter: Pending Payment]
    D --> D1[Confirms E-Transfer received → Changes status to Paid]
    D1 --> D2[Sends payment confirmation email]

    C -- Low or Out of Stock --> E[Admin → Inventory]
    E --> E1[Reviews low stock flavours]
    E1 --> E2[After baking: clicks Add Batch]
    E2 --> E3[Fills: flavour, size, qty produced, bake date, expiry date]
    E3 --> E4[Batch saved → stock recalculated automatically]

    C -- Event Inquiries pending --> F[Admin → Events]
    F --> F1[Opens inquiry: reads event type, date, can count, notes]
    F1 --> F2{Decision?}
    F2 -- Approve --> F3[Sets status to Approved → email sent to customer]
    F2 -- Reject --> F4[Sets status to Rejected with note → email sent]

    C -- Wholesale apps pending --> G[Admin → Wholesale]
    G --> G1[Reviews application details]
    G1 --> G2{Decision?}
    G2 -- Approve --> G3[Generates verification code → emailed to business]
    G2 -- Reject --> G4[Application rejected with note]

    C -- AI Labels pending approval --> H[Admin → AI Labels]
    H --> H1[Reads submitted label text]
    H1 --> H2[Views label preview]
    H2 --> H3{Decision?}
    H3 -- Approve --> H4[Label locked for printing]
    H3 -- Revision needed --> H5[Sends revision request with feedback]

    B --> I[Admin → Orders: update statuses for today's fulfillment]
    I --> I1[Preparing → Ready for Pickup / Out for Delivery]
    I1 --> I2[After completion: Completed]
```

---

### 4.3 Order Status Lifecycle (Admin)

```mermaid
flowchart LR
    A([New]) --> B([Paid])
    A --> C([Pending Payment])
    C --> B
    B --> D([Preparing])
    D --> E([Ready for Pickup])
    D --> F([Out for Delivery])
    E --> G([Completed])
    F --> G
    A --> H([Cancelled])
    B --> H
    C --> H
    D --> H
    G --> I([Refunded])
    H --> I
```

---

### 4.4 Product & Inventory Management

```mermaid
flowchart TD
    A([Adam needs to add a new product]) --> B[Admin → Products → Add Product]
    B --> B1[Fills: name, category, price, size, status, allergens, description]
    B1 --> B2[Uploads product image to Supabase Storage]
    B2 --> B3[Saves product → visible on /shop immediately]

    A2([Adam baked a new batch]) --> C[Admin → Inventory → Add Batch]
    C --> C1[Selects flavour, size, category]
    C1 --> C2[Enters qty produced, bake date, expiry date]
    C2 --> C3[Optional: adds notes]
    C3 --> C4[Batch saved → stock levels recalculate]
    C4 --> C5[Dashboard low-stock count updates]
```

---

### 4.5 Availability Management

```mermaid
flowchart TD
    A([Adam manages available time slots]) --> B[Admin → Availability]
    B --> C[Views calendar of upcoming dates]
    C --> D{Action?}
    D -- Open a date --> E[Selects date → Toggles slots ON]
    D -- Block a date --> F[Selects date → Toggles ALL slots OFF]
    D -- Edit a slot --> G[Adjusts specific time slot: 11am / 1pm / 3pm / 5pm / 7pm]
    E --> H[Customers can now book that slot in checkout]
    F --> I[Slot hidden from customer date picker]
    G --> H
```

---

### 4.6 Promo Code Management

```mermaid
flowchart TD
    A([Adam creates a promo]) --> B[Admin → Promo Codes → Create Code]
    B --> B1[Enters code string e.g. SUMMER10]
    B1 --> B2[Selects type: Percentage / Fixed / Free Delivery]
    B2 --> B3[Enters value: e.g. 10 for 10% off]
    B3 --> B4[Optional: sets expiry date + usage limit]
    B4 --> B5[Activates code]
    B5 --> C[Code goes live — customers can use it at checkout]
    C --> D[Admin can view redemption count]
    D --> E{Deactivate?}
    E -- Yes --> F[Code deactivated — no longer valid]
    E -- No --> D
```

---

### 4.7 Settings Update

```mermaid
flowchart TD
    A([Adam updates store settings]) --> B[Admin → Settings]
    B --> C{What to update?}
    C -- Contact info --> D[Edits store email, phone, Instagram handle]
    C -- Pickup address --> E[Edits pickup area + exact private address]
    C -- GST rate --> F[Adjusts GST % — affects all new orders]
    C -- Delivery tiers --> G[Edits fee per distance bracket]
    C -- Delivery on/off --> H[Toggles delivery enabled checkbox]
    D --> I[Clicks Save Settings]
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J{Save result?}
    J -- Success --> K[Green toast: Settings saved successfully]
    J -- Error --> L[Error message shown — settings not persisted]
    K --> M[Settings live across all affected features]
```

---

## 5. Cross-Cutting Flows

### 5.1 Day / Night Theme Toggle

```mermaid
flowchart TD
    A([Any page]) --> B[User clicks theme toggle button in navbar]
    B --> C{Current theme?}
    C -- Day → Night --> D[data-theme=night set on html element]
    C -- Night → Day --> E[data-theme attribute removed]
    D --> F[localStorage layrd-theme = night]
    E --> G[localStorage layrd-theme removed]
    F --> H[All CSS variables switch instantly]
    G --> H
    H --> I[Next page load: inline script reads localStorage before paint — no flash]
```

---

### 5.2 Cart Sidebar Interaction

```mermaid
flowchart TD
    A([User on any page]) --> B[Clicks cart icon in navbar]
    B --> C[CartSidebar slides in from right — 420px]
    C --> D[Shows all cart items with quantity + price]
    D --> E{User action?}
    E -- Increase qty --> F[Qty increments — subtotal updates]
    E -- Decrease qty to 0 --> G[Item removed from cart]
    E -- Remove item --> G
    E -- Enter promo code --> H[Code validated — discount applied]
    E -- Close sidebar --> I[Sidebar slides out]
    E -- Click Checkout --> J[Navigates to /checkout]
    F --> D
    G --> D
    H --> D
```

---

### 5.3 New User Registration Flow

```mermaid
flowchart TD
    A([User visits /signup]) --> B[Fills registration form]
    B --> B1[Full name]
    B1 --> B2[Email address]
    B2 --> B3[Password]
    B3 --> B4[Submits form]
    B4 --> C{Email already registered?}
    C -- Yes --> D[Error: Account already exists — link to /login]
    C -- No --> E[Account created with role: customer]
    E --> F[Auto-logged in]
    F --> G{Came from?}
    G -- Events page --> H[Redirected back to /events — form now visible]
    G -- Direct signup --> I[Redirected to homepage or account dashboard]
```

---

### 5.4 Forgot Password Flow

```mermaid
flowchart TD
    A([User on /login]) --> B[Clicks Forgot password?]
    B --> C[Goes to /reset-password]
    C --> D[Enters email address]
    D --> E[Submits]
    E --> F[Supabase sends password reset email]
    F --> G[User clicks link in email]
    G --> H[Redirected to /reset-password/confirm with token]
    H --> I[Enters new password]
    I --> J[Password updated]
    J --> K[Auto-logged in → redirected to homepage]
```

---

## 6. Error & Edge Case Flows

### 6.1 Out-of-Stock Product

```mermaid
flowchart TD
    A[User browses /shop] --> B{Product status?}
    B -- Available --> C[Add to Cart button shown — enabled]
    B -- Coming Soon --> D[Coming Soon badge — no cart button]
    B -- Sold Out --> E[Sold Out badge — no cart button]
    C --> F[User adds to cart]
    F --> G[Checkout proceeds]
    G --> H{Stock check at order creation}
    H -- In stock --> I[Order created successfully]
    H -- Sold out since adding to cart --> J[Error returned: X is no longer available]
    J --> K[User prompted to remove item and retry]
```

---

### 6.2 Delivery Outside Calgary

```mermaid
flowchart TD
    A[User selects Delivery in checkout] --> B[Enters address]
    B --> C[Clicks Check button]
    C --> D[API call to /api/delivery-fee]
    D --> E{Address within Calgary?}
    E -- Yes, within range --> F[Distance + fee shown in gold]
    F --> G[User continues checkout with delivery]
    E -- Outside Calgary --> H[Red warning: Outside Calgary — pickup only]
    H --> I[User switches to Pickup option]
    I --> J[Delivery fee cleared — checkout continues]
    E -- API error --> K[Estimated fee shown with note]
    K --> G
```

---

### 6.3 Event Inquiry Below Minimum

```mermaid
flowchart TD
    A[User filling event inquiry form] --> B[Enters Core Cans + Limited Cans]
    B --> C{Total cans < 24?}
    C -- Yes --> D[Live estimate shows red warning: Min 24 cans]
    D --> E[Submit button disabled]
    E --> B
    C -- No → exactly 24+ --> F[Estimate shows total + price in gold]
    F --> G[Submit button enabled]
    G --> H[User submits inquiry]
```

---

## 7. Page Transition Map

This shows how pages connect to each other via navigation links and user actions.

```mermaid
flowchart TD
    HOME["/\nHomepage"] --> SHOP["/shop\nShop"]
    HOME --> EVENTS["/events\nEvents"]
    HOME --> WHOLESALE["/wholesale\nWholesale"]

    SHOP --> CART["Cart Sidebar"]
    SHOP --> BUNDLE4["/shop/bundle-4\nBundle 4-Pack"]
    SHOP --> BUNDLE6["/shop/bundle-6\nBundle 6-Pack"]
    BUNDLE4 --> CART
    BUNDLE6 --> CART

    CART --> CHECKOUT["/checkout\nCheckout"]
    CHECKOUT --> CONFIRMATION["/confirmation\nConfirmation"]
    CHECKOUT --> STRIPE["Stripe Hosted Checkout"]
    STRIPE --> CONFIRMATION

    EVENTS --> LOGIN["/login\nLogin"]
    EVENTS --> SIGNUP["/signup\nSignup"]
    LOGIN --> EVENTS
    SIGNUP --> EVENTS
    LOGIN --> HOME
    SIGNUP --> HOME

    EVENTS --> AILABEL["/ai-label-studio\nAI Label Studio"]

    WHOLESALE --> BUSINESS["/business\nBusiness Account"]

    HOME --> FAQ["/faq\nFAQ"]
    HOME --> CONTACT["/contact\nContact"]
    HOME --> LOGIN

    ADMINLOGIN["/admin/login\nAdmin Login"] --> ADMIN["/admin\nDashboard"]
    ADMIN --> ORDERS["/admin/orders\nOrders"]
    ADMIN --> PRODUCTS["/admin/products\nProducts"]
    ADMIN --> INVENTORY["/admin/inventory\nInventory"]
    ADMIN --> ADMINEVENTS["/admin/events\nEvent Inquiries"]
    ADMIN --> ADMINWHOLESALE["/admin/wholesale\nWholesale"]
    ADMIN --> BIZCODE["/admin/business-codes\nBiz Codes"]
    ADMIN --> PROMO["/admin/promo-codes\nPromo Codes"]
    ADMIN --> ADMINFAQ["/admin/faq\nFAQ"]
    ADMIN --> AVAIL["/admin/availability\nAvailability"]
    ADMIN --> ADMINAI["/admin/ai-labels\nAI Labels"]
    ADMIN --> SETTINGS["/admin/settings\nSettings"]
```

---

## 8. Notification Flow Summary

Every action that generates an email notification:

| Trigger | Who Gets Email | Content |
|---|---|---|
| Order placed (any payment) | Customer | Order #, items, total, pickup/delivery info, storage reminder |
| Order placed | Adam | New order notification: customer, items, total, payment method |
| E-Transfer order: Adam marks Paid | Customer | Payment confirmed + order now being prepared |
| Order status → Ready for Pickup | Customer | "Your LÄYRD order is ready" |
| Event inquiry submitted | Adam | Inquiry details: event type, date, cans, customer info |
| Event inquiry approved | Customer | Approval confirmed + 50% deposit instructions |
| Event inquiry rejected | Customer | Rejection with Adam's note |
| AI label approved | Customer | Label confirmed — info about print timeline |
| AI label: revision requested | Customer | Feedback from Adam + link back to AI Label Studio |
| Business application approved | Business | One-time verification code + 48-hour expiry warning |
| Business application rejected | Business | Rejection with note |

---

*This document reflects user flows as designed in the current codebase. Update whenever a page, route, or feature changes.*  
*Cross-reference: [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [project-brief.md](./project-brief.md)*
