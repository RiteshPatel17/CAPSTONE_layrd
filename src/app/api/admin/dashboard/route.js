import { NextResponse } from "next/server";
import { verifyAdminRequest } from "../../../../lib/admin-server-auth.js";
import { getOrders } from "../../../../lib/admin-orders.js";
import { getCurrentStock } from "../../../../lib/admin-inventory.js";
import { getEventInquiriesCount, getWholesaleAppsCount } from "../../../../lib/admin-stats.js";

export async function GET(request) {
const admin = await verifyAdminRequest(request);
if (!admin) {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

const authHeader = request.headers.get("authorization") || "";
const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  try {
    const [orders, stock, newEventInquiries, newWholesaleApplications] = await Promise.all([
      getOrders(),
      getCurrentStock(accessToken),
      getEventInquiriesCount(),
      getWholesaleAppsCount(),
    ]);

    const pendingPayment = orders.filter((o) => o.status === "Pending Payment").length;
    const preparing = orders.filter((o) => o.status === "Preparing").length;
    const lowStock = stock.filter((s) => s.status === "Low").length;
    const outOfStock = stock.filter((s) => s.status === "Out").length;
    const pendingAiLabels = 0; // TODO: wire up once ai_label_requests admin flow exists

    const attentionItems = [];
    if (outOfStock > 0) {
      attentionItems.push({
        id: "out-of-stock",
        type: "inventory",
        title: `${outOfStock} flavour${outOfStock !== 1 ? "s" : ""} out of stock`,
        description: "Log a new production batch to restore availability.",
        severity: "high",
        count: outOfStock,
        href: "/admin/inventory",
      });
    }
    if (lowStock > 0) {
      attentionItems.push({
        id: "low-stock",
        type: "inventory",
        title: `${lowStock} flavour${lowStock !== 1 ? "s" : ""} running low`,
        description: "Consider baking a new batch soon.",
        severity: "medium",
        count: lowStock,
        href: "/admin/inventory",
      });
    }
    if (newEventInquiries > 0) {
      attentionItems.push({
        id: "event-inquiries",
        type: "events",
        title: `${newEventInquiries} new event inquir${newEventInquiries !== 1 ? "ies" : "y"}`,
        description: "Review and approve or decline.",
        severity: "medium",
        count: newEventInquiries,
        href: "/admin/events",
      });
    }
    if (newWholesaleApplications > 0) {
      attentionItems.push({
        id: "wholesale-apps",
        type: "wholesale",
        title: `${newWholesaleApplications} new wholesale application${newWholesaleApplications !== 1 ? "s" : ""}`,
        description: "Review and follow up with the business.",
        severity: "medium",
        count: newWholesaleApplications,
        href: "/admin/wholesale",
      });
    }
    if (pendingPayment > 0) {
      attentionItems.push({
        id: "pending-payment",
        type: "orders",
        title: `${pendingPayment} order${pendingPayment !== 1 ? "s" : ""} awaiting payment`,
        description: "Confirm E-Transfer payments to move orders forward.",
        severity: "high",
        count: pendingPayment,
        href: "/admin/orders",
      });
    }

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      stats: {
        totalOrders: orders.length,
        pendingPayment,
        preparing,
        lowStock,
        outOfStock,
        newEventInquiries,
        newWholesaleApplications,
        pendingAiLabels,
      },
      recentOrders: orders.slice(0, 6).map((o) => ({
        id: o.id,
        orderNumber: o.id,
        customerName: o.customer_name || o.customer || "Unknown",
        deliveryMethod: o.delivery_method || o.type || "pickup",
        paymentStatus: o.payment_status || (o.status === "Pending Payment" ? "Pending" : "Paid"),
        status: o.status,
        total: o.total_amount || o.total || 0,
        createdAt: o.created_at || o.date || new Date().toISOString(),
      })),
      attentionItems,
    });
  } catch (error) {
    console.error("[Admin Dashboard] Error:", error.message);
    return NextResponse.json({ ok: false, error: "Failed to load dashboard data" }, { status: 500 });
  }
}