// src/app/api/admin/orders/route.js
//
// WHY this route exists: admin-orders.js's getOrders() uses
// getSupabaseAdmin() (service role key), which per TRD 7.1 must ONLY run
// server-side. admin/orders/page.jsx is a "use client" component — it
// cannot safely call admin-orders.js directly (this was tried and failed
// with "supabaseKey is required", since NEXT_PUBLIC_-less env vars are
// never sent to the browser). This route is the server-side bridge.
//
// TODO (Day 6, per TRD 20 known technical debt): add real admin role
// verification here (check session + profiles.role === 'admin') before
// returning data. Currently ANY caller who knows this URL can read all
// orders — acceptable only because AdminAuthGuard blocks the PAGE from
// rendering for non-admins client-side, but the API route itself has no
// server-side check yet. Flagged, not fixed today, per existing roadmap.

import { getOrders } from "@/lib/admin-orders";

export async function GET() {
  const orders = await getOrders();
  return Response.json({ orders });
}