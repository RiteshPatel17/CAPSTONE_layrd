# LÄYRD — UX/UI Brief

> **Document Type:** UX/UI Guidelines & Design Brief  
> **Version:** 1.0  
> **Folder:** `g:/layrd-v1/imp doc/`  
> **Last Updated:** July 2026  
> **Cross-reference:** [brand.md](../brand.md) · [PRD.md](./PRD.md)

---

## 1. Design Philosophy

The LÄYRD e-commerce platform aims to deliver a **boutique, premium digital experience** that mirrors the physical product ("Cake in a Can"). The interface must feel elevated but approachable. 

**Key UX Principles:**
- **Minimalist & Content-First:** The UI should get out of the way to let product photography and typography shine.
- **Warm & Tactile:** Use serif typography, subtle gold accents, and warm cream/charcoal backgrounds to avoid the cold, sterile feel of typical tech interfaces.
- **Fluid & Seamless:** Transitions between day/night modes, page loads, and cart interactions should be smooth (utilising the global `--ease` curve).
- **Accessible & Clear:** High contrast text, clear error states, and large legible click targets.

---

## 2. Visual Language

### 2.1 Typography

LÄYRD relies on a stark contrast between a classic serif for display and a clean sans-serif for UI.

- **Display (Headings & Logo):** `Cormorant Garamond` (fallback: Georgia).
  - Used for h1-h6, hero text, and the brand wordmark.
  - Characterised by high contrast and elegance. 
  - *Note:* Italic weights are used specifically for subheadings and taglines to inject warmth.
- **UI & Body:** `Inter` (fallback: system-ui).
  - Used for all paragraphs, buttons, navigation links, and form labels.
  - Ensures maximum legibility for functional elements.
  - *Note:* UI micro-copy (labels, nav links, badges) is typically set in ALL-CAPS with wide letter-spacing (`0.1em` to `0.12em`).

### 2.2 Color System & Theming

The platform supports a robust Day/Night theme system. **Gold (`#B89B5E`) is the unifying accent color**, remaining consistent across both modes.

**Day Mode (Default)**
- **Background:** Warm White (`#FAF8F3`) with Soft Beige (`#F7F3EA`) for section contrast.
- **Text:** Near Black (`#0E0E0E`) for primary, Warm Grey (`#77736B`) for secondary.
- **Surfaces:** Pure White (`#FFFFFF`) for cards and modals.

**Night Mode**
- **Background:** Deep Black (`#0E0E0E`) with Charcoal (`#1A1A1A`) for section contrast.
- **Text:** Warm White (`#FAF8F3`) for primary, Soft Beige (`#E8DFD2`) for secondary.
- **Surfaces:** Dark Grey (`#161616`) for cards and modals.

*Rule: Never hard-code hex values in CSS/components. Always use semantic CSS variables (e.g., `var(--bg-main)`, `var(--text-main)`).*

---

## 3. UI Component System

### 3.1 Buttons
- **Primary:** Gold background (`var(--accent)`), white text. Hover state deepens the gold and adds a subtle gold glow box-shadow.
- **Outline (Secondary):** Transparent background with text-colored border. On hover, the button fills with the text color and text inverts.
- **Ghost (Tertiary):** Text only, no borders. Used for subtle actions.
- **Typography:** Inter, Medium (500), `0.85rem`, ALL-CAPS, `0.12em` letter-spacing.
- **Shape:** Sharp/minimal rounding (`border-radius: 2px`).

### 3.2 Cards (Products & Info)
- **Styling:** Surface color background, soft 1px border (`var(--border-soft)`), 4px border-radius.
- **Interaction:** On hover, the card elevates slightly (`translateY(-3px)`), the border color turns gold, and a soft gold shadow appears. This provides a premium, tactile feel.

### 3.3 Form Inputs
- **Styling:** Surface background, soft border, 2px radius. 
- **Focus State:** Border changes to Gold (`var(--accent)`). Outline is removed.
- **Labels:** Inter, ALL-CAPS, wide letter-spacing, muted text color. Placed above the input field.

### 3.4 Badges & Status Indicators
- Used for product status ("Coming Soon", "Sold Out") and order statuses.
- **Styling:** Small text (`0.7rem`), Bold (600), ALL-CAPS.
- **Colors:** Semi-transparent backgrounds with matching text/border colors (Gold for neutral/accent, Green for success, Red for error, Gray for inactive).

---

## 4. Layout & Spacing

- **Grid:** Responsive auto-fill grid for products. Minimum column width `280px` on desktop, `220px` on mobile. Gap `24px` (desktop) / `16px` (mobile).
- **Max Width:** Content is constrained to `1280px` (`.container`).
- **Section Padding:** Generous vertical rhythm. Standard sections have `80px` vertical padding (desktop) and `48px` (mobile).
- **Navigation:** Fixed sticky top navbar, `72px` height. Uses a translucent background with background blur (`backdrop-filter: blur(12px)`) for a modern, glassy effect.

---

## 5. Motion & Interaction

Animations should feel deliberate and unhurried. 
- **Global Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` is used for all transitions to ensure a natural, snappy yet smooth feel.
- **Page Load:** Elements utilize a `fadeIn` animation (`opacity 0` to `1` + slight upward translation `translateY(12px)`).
- **Loading States:** Skeletons use a `shimmer` effect (a 200% wide gradient sweep over 1.4s) instead of traditional spinners where possible.
- **Theme Toggle:** Background and text colors transition smoothly over `0.3s` to prevent harsh visual snapping.

---

## 6. Key User Interfaces

### 6.1 Homepage & Shop
- **Hero Section:** Large, impactful typography (Cormorant Garamond). Subtle gradient backgrounds depending on the theme. Decorative gold rings and vertical scroll hint lines add visual interest.
- **Product Grid:** Clean cards. Action buttons (Add to Cart) only appear if the item is available. Badges clearly communicate status.

### 6.2 Cart Sidebar
- Slides in from the right. Takes up `420px` on desktop, full width on mobile. 
- Must feel like an overlay, dimming the background page slightly.

### 6.3 AI Label Studio
- A focused, step-by-step interface.
- Step 2 (Selection) highlights the chosen label option with a distinct gold border.
- Step 3 (Preview) dynamically renders the user's text in Cormorant Garamond italic on a dark background to simulate the final physical can label.

### 6.4 Admin Dashboard
- The Admin sidebar remains dark (`#0E0E0E`) regardless of the global day/night theme, ensuring it feels like a distinct "back-of-house" control center.
- Focus is on data density and clear status indicators (colored badges for order states).

---

*This document serves as the UX/UI reference for developers and designers working on LÄYRD. For exact CSS values and technical implementation details, refer to `brand.md` and `globals.css`.*
