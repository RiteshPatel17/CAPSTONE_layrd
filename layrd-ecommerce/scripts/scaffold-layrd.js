// LÄYRD E-Commerce — Project Scaffold Script (Node.js version)
// Run this INSIDE your Next.js project root (after `npx create-next-app@latest`)
// Usage: node scaffold-layrd.js

const fs = require("fs");
const path = require("path");

const dirs = [
  "src/app/shop/bundle-4",
  "src/app/shop/bundle-6",
  "src/app/checkout",
  "src/app/confirmation",
  "src/app/events",
  "src/app/ai-label-studio",
  "src/app/wholesale",
  "src/app/business",
  "src/app/login",
  "src/app/signup",
  "src/app/faq",
  "src/app/contact",
  "src/app/admin/login",
  "src/app/admin/orders",
  "src/app/admin/products",
  "src/app/admin/inventory",
  "src/app/admin/events",
  "src/app/admin/wholesale",
  "src/app/admin/business-codes",
  "src/app/admin/promo-codes",
  "src/app/admin/faq",
  "src/app/admin/availability",
  "src/app/admin/ai-labels",
  "src/app/admin/settings",
  "src/app/api/ai-labels",
  "src/app/api/contact",
  "src/app/api/delivery-fee",
  "src/app/api/events",
  "src/app/api/orders",
  "src/app/api/products",
  "src/app/api/stripe/create-checkout-session",
  "src/app/api/stripe/webhook",
  "src/components/layout",
  "src/components/products",
  "src/components/cart",
  "src/components/admin",
  "src/lib",
  "src/data",
];

const pages = {
  "src/app/shop/page.jsx": "Shop",
  "src/app/shop/bundle-4/page.jsx": "Bundle 4-Pack Customiser",
  "src/app/shop/bundle-6/page.jsx": "Bundle 6-Pack Customiser",
  "src/app/checkout/page.jsx": "Checkout",
  "src/app/confirmation/page.jsx": "Confirmation",
  "src/app/events/page.jsx": "Events",
  "src/app/ai-label-studio/page.jsx": "AI Label Studio",
  "src/app/wholesale/page.jsx": "Wholesale",
  "src/app/business/page.jsx": "Business Account",
  "src/app/login/page.jsx": "Login",
  "src/app/signup/page.jsx": "Signup",
  "src/app/faq/page.jsx": "FAQ",
  "src/app/contact/page.jsx": "Contact",
  "src/app/admin/login/page.jsx": "Admin Login",
  "src/app/admin/page.jsx": "Admin Dashboard",
  "src/app/admin/orders/page.jsx": "Admin Orders",
  "src/app/admin/products/page.jsx": "Admin Products",
  "src/app/admin/inventory/page.jsx": "Admin Inventory",
  "src/app/admin/events/page.jsx": "Admin Events",
  "src/app/admin/wholesale/page.jsx": "Admin Wholesale",
  "src/app/admin/business-codes/page.jsx": "Admin Business Codes",
  "src/app/admin/promo-codes/page.jsx": "Admin Promo Codes",
  "src/app/admin/faq/page.jsx": "Admin FAQ",
  "src/app/admin/availability/page.jsx": "Admin Availability",
  "src/app/admin/ai-labels/page.jsx": "Admin AI Labels",
  "src/app/admin/settings/page.jsx": "Admin Settings",
};

const routes = {
  "src/app/api/ai-labels/route.js": "AI Labels API",
  "src/app/api/contact/route.js": "Contact API",
  "src/app/api/delivery-fee/route.js": "Delivery Fee API",
  "src/app/api/events/route.js": "Events API",
  "src/app/api/orders/route.js": "Orders API",
  "src/app/api/products/route.js": "Products API",
  "src/app/api/stripe/create-checkout-session/route.js": "Stripe Checkout Session",
  "src/app/api/stripe/webhook/route.js": "Stripe Webhook",
};

const libFiles = {
  "src/components/Providers.jsx": "Cart + Navbar + Footer shell",
  "src/components/layout/Navbar.jsx": "Navbar",
  "src/components/layout/Footer.jsx": "Footer",
  "src/components/layout/ThemeToggle.jsx": "Theme Toggle",
  "src/components/products/ProductCard.jsx": "Product Card",
  "src/components/cart/CartContext.jsx": "Cart Context",
  "src/components/cart/CartSidebar.jsx": "Cart Sidebar",
  "src/components/admin/AdminAuthGuard.jsx": "Admin Auth Guard",
  "src/components/admin/AdminLayout.jsx": "Admin Layout",
  "src/components/admin/AdminSidebar.jsx": "Admin Sidebar",
  "src/components/admin/AdminCard.jsx": "Admin Card",
  "src/components/admin/AdminPageHeader.jsx": "Admin Page Header",
  "src/components/admin/AdminFormField.jsx": "Admin Form Field",
  "src/components/admin/AdminTable.jsx": "Admin Table",
  "src/components/admin/ConfirmModal.jsx": "Confirm Modal",
  "src/components/admin/EmptyState.jsx": "Empty State",
  "src/components/admin/StatusBadge.jsx": "Status Badge",
  "src/lib/constants.js": "Brand values, pricing constants, nav links",
  "src/lib/pricing.js": "Delivery fee, GST, cart totals, bundle pricing",
  "src/lib/supabase.js": "Supabase client (DB + Auth)",
  "src/lib/auth.js": "Customer auth helpers",
  "src/lib/admin-auth.js": "Admin session (localStorage stub -> Supabase)",
  "src/lib/stripe.js": "Stripe client",
  "src/lib/resend.js": "Email client",
  "src/lib/gemini.js": "AI label generation (Gemini API)",
  "src/lib/maps.js": "Google Maps distance calc",
  "src/lib/admin-orders.js": "Order CRUD",
  "src/lib/admin-order-items.js": "Order item CRUD",
  "src/lib/admin-products.js": "Product CRUD",
  "src/lib/admin-inventory.js": "Inventory + stock calc",
  "src/lib/admin-settings.js": "Settings (localStorage -> Supabase)",
  "src/data/seed-products.js": "Product + bundle + espresso seed data",
  "src/data/faqs.js": "FAQ seed data",
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeIfMissing(filePath, content) {
  const full = path.join(process.cwd(), filePath);
  ensureDir(path.dirname(full));
  if (fs.existsSync(full)) {
    console.log(`skip (exists): ${filePath}`);
    return;
  }
  fs.writeFileSync(full, content);
  console.log(`created: ${filePath}`);
}

console.log("Scaffolding LÄYRD folder structure...\n");

// Create all directories up front (covers empty dirs too)
dirs.forEach((d) => ensureDir(path.join(process.cwd(), d)));

// Pages
Object.entries(pages).forEach(([filePath, label]) => {
  const content = `"use client";

// TODO: ${label}
// Owner: see jira-reference.md for assignment

export default function Page() {
  return (
    <div>
      <h1>${label} — Placeholder</h1>
    </div>
  );
}
`;
  writeIfMissing(filePath, content);
});

// API routes
Object.entries(routes).forEach(([filePath, label]) => {
  const content = `// TODO: ${label}

export async function GET(request) {
  return Response.json({ message: "${label} — not yet implemented" });
}

export async function POST(request) {
  return Response.json({ message: "${label} — not yet implemented" });
}
`;
  writeIfMissing(filePath, content);
});

// Lib / component stub files
Object.entries(libFiles).forEach(([filePath, label]) => {
  const content = `// ${label}
// TODO: replace stub with real implementation — see TRD.md for spec
`;
  writeIfMissing(filePath, content);
});

// .env.local.example
const envExample = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (email)
RESEND_API_KEY=
ADMIN_EMAIL=info@layrd.org

# Gemini (AI labels)
GEMINI_API_KEY=

# Google Maps (delivery distance)
GOOGLE_MAPS_API_KEY=
`;
writeIfMissing(".env.local.example", envExample);

console.log("\nScaffold complete. Next steps:");
console.log("1. cp .env.local.example .env.local   (fill in real keys — never commit .env.local)");
console.log("2. git add . && git commit -m 'chore: scaffold project structure'");
console.log("3. git push origin main");
