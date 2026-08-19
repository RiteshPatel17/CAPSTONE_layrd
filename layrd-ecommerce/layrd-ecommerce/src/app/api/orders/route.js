// src/app/api/orders/route.js
//
// WHY this route is now thin: order-creation logic lives in src/lib/orders.js
// (shared with /api/stripe/create-checkout-session) per TRD 4.3 service
// layer pattern. This route's job is just: validate → call createOrder() →
// shape the HTTP response.

import { createOrder, validateOrderInput } from "@/lib/orders";
import { sendOrderConfirmationEmail, sendNewOrderNotification } from "@/lib/resend";

export async function POST(request) {
  const body = await request.json();

  const validationError = validateOrderInput(body);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { order, error } = await createOrder(body);

  if (error) {
    return Response.json({ error, orderId: order?.id }, { status: 500 });
  }

  // WHY we don't await these (fire-and-forget, not blocking the response):
  // per TRD 16 (Error Handling Strategy), email failures must never block
  // order creation. Both send functions already catch their own errors
  // internally and never throw, but we ALSO intentionally don't await them
  // here so a slow Resend API call can't delay the customer's order
  // confirmation response. We just log if either fails, via .catch as a
  // safety net in case something unexpected still throws.
  sendOrderConfirmationEmail({
    to: order.customer_email,
    orderNumber: order.id,
    items: body.items,
    total: order.total,
    pickupDate: order.pickup_date,
  }).catch((err) => console.error("/api/orders: customer email send threw unexpectedly:", err));

  sendNewOrderNotification({
    orderNumber: order.id,
    items: body.items,
    total: order.total,
    customerEmail: order.customer_email,
    paymentMethod: order.payment_method,
  }).catch((err) => console.error("/api/orders: admin notification email threw unexpectedly:", err));

  return Response.json({ success: true, orderId: order.id, total: order.total }, { status: 201 });
}

export async function GET(request) {
  // TODO (Day 5/6 — Admin Orders): verify admin role via session, then
  // return orders from Supabase for the real /admin/orders page.
  return Response.json({ message: "TODO: Return orders from Supabase (admin only)" });
}