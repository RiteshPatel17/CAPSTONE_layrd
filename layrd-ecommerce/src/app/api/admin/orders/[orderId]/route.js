// src/app/api/admin/orders/[orderId]/route.js
//
// WHY GET + PATCH in one file: this route handles both fetching a single
// order's full detail (with line items) AND updating its status — both
// operate on the same [orderId] resource, matching REST conventions.

import { getOrderWithItems, updateOrderStatus } from "@/lib/admin-orders";

export async function GET(request, { params }) {
  const { orderId } = await params;
  const order = await getOrderWithItems(orderId);

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json({ order });
}

export async function PATCH(request, { params }) {
  const { orderId } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status) {
    return Response.json({ error: "Missing status" }, { status: 400 });
  }

  const updated = await updateOrderStatus(orderId, status);

  if (!updated) {
    return Response.json({ error: "Failed to update order status" }, { status: 500 });
  }

  return Response.json({ order: updated });
}