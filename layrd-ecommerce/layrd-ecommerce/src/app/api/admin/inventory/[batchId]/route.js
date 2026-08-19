// src/app/api/admin/inventory/[batchId]/route.js

import { updateBatch, deleteBatch } from "@/lib/admin-inventory";

export async function PATCH(request, { params }) {
  const { batchId } = await params;
  const body = await request.json();

  try {
    const batch = await updateBatch(batchId, body);
    return Response.json({ batch });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { batchId } = await params;

  try {
    await deleteBatch(batchId);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}