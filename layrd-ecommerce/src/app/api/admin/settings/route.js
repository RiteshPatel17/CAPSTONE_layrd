// src/app/api/admin/settings/route.js
//
// WHY this route exists: same reason as /api/admin/orders and
// /api/admin/inventory — admin-settings.js uses getSupabaseAdmin() (the
// service role key), which per TRD 7.1 must only run server-side. This
// bridges the "use client" admin/settings/page.jsx to that service layer
// safely.
//
// TODO (Day 6, per TRD 20 known technical debt): add real admin role
// verification here (check session + profiles.role === 'admin') before
// allowing reads or writes — same known gap flagged in the other admin
// bridge routes, not fixed today.

import { getSettings, updateSettings } from "@/lib/admin-settings";

export async function GET() {
  const settings = await getSettings();

  if (!settings) {
    return Response.json({ error: "Failed to load settings" }, { status: 500 });
  }

  return Response.json({ settings });
}

export async function PATCH(request) {
  const body = await request.json();

  try {
    const settings = await updateSettings(body);
    return Response.json({ settings });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}