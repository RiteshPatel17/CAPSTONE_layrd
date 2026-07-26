// src/app/api/admin/inventory/route.js
//
// WHY this route exists: same reason as /api/admin/orders — admin-
// inventory.js uses getSupabaseAdmin() (service role key), which per
// TRD 7.1 must only run server-side. This bridges the "use client"
// admin/inventory/page.jsx to that service layer safely.

import { getBatches, calculateStock, createBatch } from "@/lib/admin-inventory";

export async function GET() {
  const batches = await getBatches();
  const stock = await calculateStock();
  return Response.json({ batches, stock });
}

export async function POST(request) {
  const body = await request.json();
  try {
    const batch = await createBatch(body);
    return Response.json({ batch }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}