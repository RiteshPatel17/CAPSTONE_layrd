// ─────────────────────────────────────────────
// LÄYRD – FAQ data
// Later: connect to Supabase admin panel
// ─────────────────────────────────────────────

export const FAQS = [
  {
    id: "what-is-layrd",
    category: "About",
    question: "What is LÄYRD?",
    answer:
      "LÄYRD is a Calgary-based boutique dessert brand specializing in handcrafted cheesecakes and tiramisus served in convenient 250ml cans. Each can is freshly prepared with premium ingredients and designed for maximum enjoyment at home or on the go.",
  },
  {
    id: "where-to-pickup",
    category: "Ordering",
    question: "Where can I pick up my order?",
    answer:
      "Our pickup location is in Pineridge NE, Calgary. The exact address will be shared with you in your order confirmation email after your order is placed and confirmed.",
  },
  {
    id: "delivery-area",
    category: "Delivery",
    question: "Do you deliver?",
    answer:
      "Yes! We deliver within Calgary. Delivery fees are calculated based on distance from our pickup location. Orders outside Calgary are pickup only. A minimum of 4 items (cans + espresso) is required for delivery.",
  },
  {
    id: "delivery-fee-how",
    category: "Delivery",
    question: "How is the delivery fee calculated?",
    answer:
      "Delivery fees are based on driving distance from our Pineridge NE location:\n• 0–5 km: $5\n• 5–10 km: $10\n• 10–15 km: $15\n• 15–20 km: $20\n• 20–25 km: $25\n• 25+ km: $30",
  },
  {
    id: "shelf-life",
    category: "Product",
    question: "How long do the cans last?",
    answer:
      "Keep them refrigerated. Sealed, the cans stay fresh for 3–5 days. Once opened, consume within 24–48 hours for the best experience.",
  },
  {
    id: "allergens",
    category: "Product",
    question: "What allergens are in LÄYRD products?",
    answer:
      "Our products contain dairy and gluten. Some flavours also contain nuts, eggs, and soy. Please check the individual product page for specific allergen information. If you have severe allergies, please contact us before ordering.",
  },
  {
    id: "payment-methods",
    category: "Ordering",
    question: "What payment methods do you accept?",
    answer:
      "We accept credit/debit cards via Stripe (secure online payment), Interac E-Transfer (pending manual approval), and cash on pickup.",
  },
  {
    id: "can-i-mix-flavours",
    category: "Ordering",
    question: "Can I mix flavours in a bundle?",
    answer:
      "Absolutely! Our 4-pack and 6-pack bundles let you mix and match any flavours. Core flavours are $8 each; if you include a limited flavour, it adds a $1 premium per limited can.",
  },
  {
    id: "events",
    category: "Events",
    question: "Do you cater private events?",
    answer:
      "Yes! We offer private catering for events using our 150ml cans with custom labels. Minimum order is 24 cans and requires at least 5 business days notice. Please submit an inquiry through the Events page.",
  },
  {
    id: "custom-labels",
    category: "Events",
    question: "Can I get custom labels for my event?",
    answer:
      "Custom labels are included with all approved event orders. Use our AI Label Studio to generate and customize label designs in the tone of your choice (Elegant, Romantic, Playful, Birthday, Wedding, etc.). All labels are reviewed and approved by our team.",
  },
  {
    id: "wholesale",
    category: "Wholesale",
    question: "Do you offer wholesale pricing?",
    answer:
      "Yes! We offer wholesale pricing for licensed retailers, cafés, restaurants, and food service operators. Minimum order is 24 × 250ml cans. Business account verification is required. See our Wholesale page for full details.",
  },
  {
    id: "wholesale-prices",
    category: "Wholesale",
    question: "What are the wholesale prices?",
    answer:
      "• 24–36 cans: $5.50/can\n• 37–47 cans: $5.25/can\n• 48+ cans: $5.00/can\n\nMix any flavours. 3–4 business days notice required.",
  },
  {
    id: "business-account",
    category: "Wholesale",
    question: "How do I get a business account?",
    answer:
      "Submit a business application through our Business page with your business details and license/proof of business. Adam reviews all applications and will issue a verification code upon approval. This code activates your business account.",
  },
  {
    id: "espresso-sweetness",
    category: "Product",
    question: "Can I customize my espresso shots?",
    answer:
      "Yes! Our espresso shots come in four sweetness options: Black (unsweetened), Sugar, Stevia, and Brown Sugar. Select your preference when adding to cart.",
  },
  {
    id: "contact-us",
    category: "General",
    question: "How can I reach you?",
    answer:
      "Email us at info@layrd.org, call 403-399-3903, or DM us on Instagram at @l.a.y.r.d. We try to respond within 24 hours.",
  },
];

// Category list for FAQ filtering
export const FAQ_CATEGORIES = ["All", "About", "Ordering", "Delivery", "Product", "Events", "Wholesale", "General"];
