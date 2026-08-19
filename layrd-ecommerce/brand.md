# LÄYRD — Brand Guidelines

> **Single source of truth for every visual and voice decision across the LÄYRD e-commerce platform.**
> Drawn directly from `globals.css`, `layout.jsx`, `constants.js`, and all live components.

---

## 1. Brand Identity

| Field | Value |
|---|---|
| **Brand name** | LÄYRD (always uppercase, with umlaut Ä) |
| **Tagline** | *Cake in a Can \| Espresso Shots* |
| **Category** | Boutique dessert brand — Calgary, AB |
| **Neighbourhood** | Pineridge NE, Calgary |
| **Email** | info@layrd.org |
| **Phone** | 403-399-3903 |
| **Instagram** | @l.a.y.r.d |

### Voice & Tone
- **Elevated but approachable** — not pretentious, not casual
- Short sentences. No exclamation marks.
- Sub-headings use **Cormorant Garamond italic** for warmth
- Micro-labels and eyebrows (e.g., "Our Story", "Handcrafted") are ALL-CAPS, wide letter-spacing

---

## 2. Logo / Wordmark

The LÄYRD logo is a **pure typographic wordmark**. There is no icon or symbol — the name itself is the logo.

| Property | Specification |
|---|---|
| **Typeface** | Cormorant Garamond, fallback Georgia, serif |
| **Weight** | 700 (Bold) |
| **Case** | ALL CAPS |
| **Letter-spacing** | `0.25em` |
| **Colour — Day mode** | `var(--text-main)` → `#0E0E0E` |
| **Colour — Night mode** | `var(--text-main)` → `#FAF8F3` |
| **Size in Navbar** | `1.7rem` |
| **Size on Hero (h1)** | `clamp(4rem, 12vw, 10rem)` |

### Logo Rules
- ✅ Always render with the umlaut: **LÄYRD** not LAYRD
- ✅ Always `text-transform: uppercase`
- ✅ `user-select: none` on the wordmark
- ❌ Never stretch, rotate, or apply drop shadows to the wordmark
- ❌ Never use a colour other than `--text-main` or `--accent` for the wordmark
- ❌ Never set `letter-spacing` below `0.2em`

---

## 3. Colour Palette

### 3.1 Raw Brand Palette (never use these hex values directly in components — use semantic tokens below)

| Name | Hex | Usage |
|---|---|---|
| `--black` | `#0E0E0E` | Darkest text, night-mode background |
| `--charcoal` | `#1A1A1A` | Night-mode secondary background |
| `--cream` | `#F7F3EA` | Alternate section backgrounds |
| `--warm-white` | `#FAF8F3` | Primary page background (day) |
| `--soft-beige` | `#E8DFD2` | Borders, dividers |
| `--muted-gold` | `#B89B5E` | Accent — buttons, highlights, scrollbar |
| `--warm-grey` | `#77736B` | Secondary / muted text |
| `--white` | `#FFFFFF` | Cards, surfaces, modal backgrounds |

### 3.2 Semantic Tokens — Day Mode (default)

> Use **only** these variables inside components. Never hard-code raw hex.

| Token | Resolves to | Purpose |
|---|---|---|
| `--bg-main` | `#FAF8F3` | Page background |
| `--bg-soft` | `#F7F3EA` | Alternate section backgrounds |
| `--surface` | `#FFFFFF` | Cards, inputs, modals |
| `--surface-muted` | `#F7F3EA` | Subtle inset surfaces |
| `--text-main` | `#0E0E0E` | Headings, primary body text |
| `--text-muted` | `#77736B` | Labels, captions, secondary text |
| `--border-soft` | `#E8DFD2` | Card borders, dividers |
| `--accent` | `#B89B5E` | Gold — primary buttons, highlights |
| `--accent-hover` | `#A8894F` | Gold on hover (darker) |
| `--price-color` | `#7A6235` | Price text (darker gold for legibility) |

### 3.3 Semantic Tokens — Night Mode (`[data-theme="night"]`)

| Token | Resolves to | Purpose |
|---|---|---|
| `--bg-main` | `#0E0E0E` | Page background |
| `--bg-soft` | `#1A1A1A` | Alternate section backgrounds |
| `--surface` | `#161616` | Cards, inputs, modals |
| `--surface-muted` | `#1F1F1F` | Subtle inset surfaces |
| `--text-main` | `#FAF8F3` | Headings, primary body text |
| `--text-muted` | `#E8DFD2` | Labels, captions, secondary text |
| `--border-soft` | `rgba(232,223,210,0.22)` | Card borders, dividers |
| `--accent` | `#B89B5E` | Gold — unchanged in both modes |
| `--accent-hover` | `#C7AB6D` | Gold on hover (lighter in night) |
| `--price-color` | `#C7AB6D` | Price text (lighter gold for night) |

### 3.4 Accent Gold — Special Cases

The gold accent is the **only colour that appears in both day and night modes unchanged** (except hover states). It is the single pop of warmth against cream or black.

```
Gold:        #B89B5E  (60% opacity for backgrounds: rgba(184,155,94,0.08-0.15))
Gold glow:   box-shadow 0 6px 20px rgba(184,155,94,0.28)
Gold border: rgba(184,155,94,0.3)
```

### 3.5 Status Colours

| Status | Day bg | Day text | Night text |
|---|---|---|---|
| Success / Green | `rgba(34,197,94,0.10)` | `#16a34a` | `#4ade80` |
| Error / Red | `rgba(239,68,68,0.10)` | `#dc2626` | `#f87171` |
| Neutral / Gray | `rgba(119,115,107,0.10)` | `var(--text-muted)` | same |
| Danger button | `#7f1d1d` bg | `#FAF8F3` text | — |

---

## 4. Typography

### 4.1 Typefaces

| Role | Font | Fallback |
|---|---|---|
| **Display / Headings** | Cormorant Garamond | Georgia, serif |
| **Body / UI** | Inter | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif |

Both fonts are loaded from Google Fonts in `layout.jsx`:
```
Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500
Inter:wght@300;400;500;600
```

### 4.2 Type Scale

| Element | Font | Size | Weight | Letter-spacing | Notes |
|---|---|---|---|---|---|
| `h1` | Cormorant Garamond | `clamp(2.5rem, 6vw, 5rem)` | 600 | `0.02em` | Brand hero: `clamp(4rem, 12vw, 10rem)` |
| `h2` | Cormorant Garamond | `clamp(1.8rem, 4vw, 3rem)` | 500 | `0.02em` | |
| `h3` | Cormorant Garamond | `clamp(1.3rem, 2.5vw, 2rem)` | 500 | `0.02em` | |
| `h4` | Cormorant Garamond | `1.25rem` | 500 | `0.02em` | |
| `h5` | Cormorant Garamond | `1rem` | 600 | `0.02em` | |
| `p` | Inter | `16px` base | 400 | normal | `line-height: 1.75`, colour `--text-muted` |
| **Nav links** | Inter | `0.78rem` | 500 | `0.12em` | ALL-CAPS |
| **Buttons** | Inter | `0.85rem` | 500 | `0.12em` | ALL-CAPS |
| **Labels / eyebrows** | Inter | `0.72–0.78rem` | 500–600 | `0.1–0.3em` | ALL-CAPS, `--accent` colour |
| **Table headers** | Inter | `0.75rem` | — | `0.1em` | ALL-CAPS, `--text-muted` |
| **Badges** | Inter | `0.7rem` | 600 | `0.1em` | ALL-CAPS |

### 4.3 Line Heights

| Context | Value |
|---|---|
| Headings (h1–h6) | `1.15` |
| Body text | `1.75` |
| Body (global) | `1.6` |

### 4.4 Italic Style Usage
- `<em>` tags in headings use Cormorant Garamond italic for warmth
- Taglines and subheadings under heroes are italic
- Never italicise body copy or button labels

---

## 5. Spacing & Layout

### 5.1 Key Layout Tokens

| Token | Value | Purpose |
|---|---|---|
| `--nav-height` | `72px` | Fixed navbar height |
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Global easing curve |
| Max content width | `1280px` | `.container` max-width |
| Container padding | `24px` (16px on mobile) | Horizontal gutter |

### 5.2 Section Spacing

| Class | Padding |
|---|---|
| `.section` | `80px 0` (48px on mobile) |
| `.section-sm` | `48px 0` |

### 5.3 Grid

```css
/* Product grid */
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 24px;

/* Mobile product grid */
grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
gap: 16px;
```

### 5.4 Breakpoints

| Breakpoint | Value |
|---|---|
| Mobile | `max-width: 768px` |

---

## 6. Component Specifications

### 6.1 Buttons

All buttons use the `.btn` base class plus a variant modifier.

| Class | Background | Text | Border | Usage |
|---|---|---|---|---|
| `.btn-primary` | `--accent` (#B89B5E) | `#FFFFFF` | `--accent` | Primary CTA |
| `.btn-outline` | Transparent | `--text-main` | `--text-main` | Secondary CTA |
| `.btn-ghost` | Transparent | `--text-muted` | Transparent | Tertiary / text actions |
| `.btn-danger` | `#7f1d1d` | `#FAF8F3` | `#7f1d1d` | Destructive actions |

| Size modifier | Padding | Font size |
|---|---|---|
| Default | `12px 28px` | `0.85rem` |
| `.btn-sm` | `8px 18px` | `0.78rem` |
| `.btn-lg` | `16px 36px` | `0.9rem` |

**Hover effects:**
- `.btn-primary` → darker gold + `translateY(-1px)` + gold glow shadow
- `.btn-outline` → fills with `--text-main`, text becomes `--bg-main`
- All buttons: `border-radius: 2px`

### 6.2 Cards

```css
background:    var(--surface)
border:        1px solid var(--border-soft)
border-radius: 4px
transition:    border-color, transform, box-shadow — 0.25s var(--ease)

/* Hover */
border-color:  var(--accent)
transform:     translateY(-3px)
box-shadow:    0 8px 32px rgba(184,155,94,0.12)
```

### 6.3 Inputs & Forms

```css
/* .input */
padding:       12px 16px
background:    var(--surface)
border:        1px solid var(--border-soft)
border-radius: 2px
color:         var(--text-main)
font-family:   Inter, sans-serif
font-size:     0.9rem
outline:       none

/* Focus */
border-color:  var(--accent)

/* Placeholder */
color:         var(--text-muted)
opacity:       0.6
```

```css
/* .label (form labels) */
font-size:      0.78rem
font-weight:    500
letter-spacing: 0.1em
text-transform: uppercase
color:          var(--text-muted)
margin-bottom:  6px
```

### 6.4 Badges

| Class | Background | Text | Border |
|---|---|---|---|
| `.badge-gold` | `rgba(184,155,94,0.15)` | `--accent` | `rgba(184,155,94,0.3)` |
| `.badge-green` | `rgba(34,197,94,0.10)` | `#16a34a` | `rgba(34,197,94,0.25)` |
| `.badge-red` | `rgba(239,68,68,0.10)` | `#dc2626` | `rgba(239,68,68,0.2)` |
| `.badge-gray` | `rgba(119,115,107,0.10)` | `--text-muted` | `--border-soft` |

All badges: `border-radius: 2px`, `font-size: 0.7rem`, `font-weight: 600`, ALL-CAPS, `letter-spacing: 0.1em`

### 6.5 Tags / Filter Pills

```css
padding:       4px 12px
border:        1px solid var(--border-soft)
border-radius: 999px   /* fully rounded */
font-size:     0.78rem
color:         var(--text-muted)

/* Active / hover */
border-color:  var(--accent)
color:         var(--accent)
background:    rgba(184,155,94,0.08)
```

### 6.6 Dividers

```css
/* .divider — full-width horizontal rule */
width: 100%; height: 1px;
background: var(--border-soft);
margin: 32px 0;

/* .divider-accent — gold brand separator */
width: 48px; height: 2px;
background: var(--accent);
margin: 16px 0;
```

### 6.7 Navbar

```css
height:           72px (--nav-height)
position:         sticky top-0
z-index:          100
background:       rgba(250,248,243,0.96)  /* day */
                  rgba(26,26,26,0.96)     /* night */
backdrop-filter:  blur(12px)
border-bottom:    1px solid var(--border-soft)
transition:       background 0.3s, border-color 0.3s
```

**Logo in Navbar**: Cormorant Garamond, 700, `1.7rem`, `letter-spacing: 0.25em`
**Nav links**: Inter, 500, `0.78rem`, `letter-spacing: 0.12em`, ALL-CAPS
**Icons**: Lucide — `size={22}`, `strokeWidth={1.5}`

### 6.8 Admin Sidebar

The admin sidebar is **always dark** regardless of day/night mode.

```css
width:        240px
background:   #0E0E0E
border-right: 1px solid rgba(232,223,210,0.12)
padding:      24px 0

/* Nav links */
font-size:    0.875rem
color:        #77736B (inactive)
padding:      10px 24px
border-left:  2px solid transparent

/* Active / hover */
color:         #FAF8F3
background:    rgba(184,155,94,0.08)
border-left:   2px solid var(--accent)
```

### 6.9 Cart Sidebar

```css
width:      420px (100vw on mobile)
background: var(--bg-soft)
border-left: 1px solid var(--border-soft)
z-index:    300
transition: transform 0.35s var(--ease)
```

### 6.10 Theme Toggle Button

```css
width: 34px; height: 34px;
border-radius: 2px;
border: 1px solid var(--border-soft);
background: transparent;
color: var(--text-muted);

/* Hover */
border-color: var(--accent);
color: var(--accent);
background: rgba(184,155,94,0.08);
```

### 6.11 Hero / Decorative Elements

**Decorative rings (hero):**
```css
border: 1px solid rgba(184,155,94,0.12);  /* inner ring */
border: 1px solid rgba(184,155,94,0.06);  /* outer ring */
border-radius: 50%;
```

**Gold accent divider (hero):**
```css
width: 60px; height: 2px;
background: var(--accent);
margin: 0 auto;
```

**Scroll hint line:**
```css
width: 1px; height: 40px;
background: linear-gradient(to bottom, var(--accent), transparent);
```

---

## 7. Animations & Motion

| Name | Definition | Usage |
|---|---|---|
| `fadeIn` | `opacity: 0 + translateY(12px)` → natural | Page sections, hero content |
| `shimmer` | 200%-wide gradient sweep | Skeleton loading states |

```css
/* Standard fade-in */
.animate-fade-in { animation: fadeIn 0.5s var(--ease) both; }

/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg,
    var(--border-soft) 25%,
    var(--surface) 50%,
    var(--border-soft) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 2px;
}
```

**Transition standards:**
- Interactive elements: `0.2–0.25s var(--ease)`
- Sidebar / overlays: `0.35s var(--ease)`
- Theme switching: `0.3s var(--ease)` (background + color)

---

## 8. Backgrounds & Gradients

| Class / Context | Value |
|---|---|
| `.hero-gradient` (day) | `linear-gradient(135deg, #FAF8F3 0%, #EDE5D8 50%, #FAF8F3 100%)` |
| `.hero-gradient` (night) | `linear-gradient(135deg, #0E0E0E 0%, #1a1208 50%, #0E0E0E 100%)` |
| CTA gold overlay | `linear-gradient(135deg, rgba(184,155,94,0.06) 0%, transparent 60%)` |
| Modal overlay | `rgba(14,14,14,0.65)` + `backdrop-filter: blur(4px)` |

---

## 9. Iconography

Library: **Lucide React**

| Context | Size | strokeWidth |
|---|---|---|
| Navbar (cart, menu, user) | `22` | `1.5` |
| Service icons (homepage) | `22` | `1.25` |
| Small / inline | `15` | `1.5` |

Rule: always use `strokeWidth={1.5}` for consistency unless a heavier icon is intentional.

Decorative accent character: `✦` (used inline in bullet lists, coloured `--accent`)

---

## 10. Scrollbar

```css
::-webkit-scrollbar       { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-main); }
::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }
```

---

## 11. Tables

```css
/* th */
font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase;
color: var(--text-muted); border-bottom: 1px solid var(--border-soft);

/* td */
font-size: 0.9rem; color: var(--text-main);
padding: 14px 16px; border-bottom: 1px solid var(--border-soft);

/* Row hover */
background: rgba(184,155,94,0.04);
```

---

## 12. Theme System

The site supports **Day** (default) and **Night** modes, stored in `localStorage` as `'layrd-theme'`.

| Key | Value |
|---|---|
| Storage key | `layrd-theme` |
| Attribute | `data-theme="night"` on `<html>` |
| Init script | Inline in `<head>` (before first paint to prevent flash) |

Transition: `background-color 0.3s var(--ease)`, `color 0.3s var(--ease)` on `body`

---

## 13. SEO & Meta

```
title:       "LÄYRD – Cake in a Can | Espresso Shots"
description: "LÄYRD is a Calgary boutique dessert brand. Handcrafted cheesecakes
              and tiramisus in 250ml cans. Order online for pickup or delivery in Calgary."
lang:        "en"
charset:     "UTF-8"
viewport:    "width=device-width, initial-scale=1"
```

---

## 14. Navigation Structure

| Label | Route |
|---|---|
| Shop | `/shop` |
| Events | `/events` |
| Wholesale | `/wholesale` |
| FAQ | `/faq` |
| Contact | `/contact` |
| Login | `/login` |
| Admin | `/admin` |

---

## 15. File Locations (Design System)

| Asset | Path |
|---|---|
| CSS design tokens + utilities | `src/app/globals.css` |
| Brand constants (name, tagline, pricing) | `src/lib/constants.js` |
| Root layout (fonts, meta, theme init) | `src/app/layout.jsx` |
| Navbar / logo | `src/components/layout/Navbar.jsx` |
| Theme toggle | `src/components/layout/ThemeToggle.jsx` |
| Product card | `src/components/products/ProductCard.jsx` |
| Admin sidebar | `src/components/admin/AdminSidebar.jsx` |
| Cart context | `src/components/cart/CartContext.jsx` |

---

*Last updated: July 2026. Sync this file whenever `globals.css` or `constants.js` changes.*
