// ─────────────────────────────────────────────
// LÄYRD – Resend email client (real implementation)
// ─────────────────────────────────────────────
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// WHY we send FROM onboarding@resend.dev instead of orders@layrd.org:
// Resend requires you to verify a domain's DNS records before you can send
// FROM an address on that domain. layrd.org isn't a domain we control DNS
// for (it's the client's eventual production domain, not something we've
// set up yet) — so real domain verification is out of scope for this dev/
// testing phase. Resend's onboarding@resend.dev is a pre-verified sandbox
// address specifically provided for testing without domain setup. This is
// fine for capstone demo purposes; swapping to a real from-address later
// is a one-line change once a real domain is verified.
const FROM_ADDRESS = 'LÄYRD <onboarding@resend.dev>';

/**
 * Builds a simple, readable HTML email body for order confirmation.
 * Kept as a plain string template (no external templating library) since
 * the content is short and doesn't need to be reused elsewhere yet.
 */
function buildOrderConfirmationHtml({ orderNumber, items, total, pickupDate }) {
  const itemsHtml = items
    .map((item) => `<li>${item.quantity} × ${item.name || item.flavour} — $${Number(item.unit_price ?? item.price ?? 0).toFixed(2)}</li>`)
    .join('');

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0E0E0E;">Order Confirmed — #${orderNumber}</h2>
      <p>Thank you for your LÄYRD order! Here's a summary:</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: $${Number(total).toFixed(2)}</strong></p>
      <p>Pickup/Delivery date: ${pickupDate}</p>
      <p>We'll be in touch with any further details closer to your date.</p>
      <p style="color: #77736B; font-size: 0.85rem;">— LÄYRD, Pineridge NE, Calgary</p>
    </div>
  `;
}

/**
 * Send order confirmation email to customer.
 * WHY this is wrapped in try/catch and never throws: per TRD 16 (Error
 * Handling Strategy), email send failures must be non-blocking — the
 * order itself must still succeed even if Resend is down or misconfigured.
 * The caller (e.g. /api/orders) should NOT await this in a way that could
 * fail the order creation response.
 * @param {{ to: string, orderNumber: string, items: Array, total: number, pickupDate: string }} params
 */
export async function sendOrderConfirmationEmail({ to, orderNumber, items, total, pickupDate }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Order Confirmed – #${orderNumber}`,
      html: buildOrderConfirmationHtml({ orderNumber, items, total, pickupDate }),
    });

    if (error) {
      console.error('resend.js: sendOrderConfirmationEmail failed:', error);
      return { success: false, error };
    }

    console.log(`[EMAIL SENT] Order confirmation sent to ${to} for order #${orderNumber} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('resend.js: sendOrderConfirmationEmail threw:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Builds a simple HTML email body notifying Adam of a new order.
 */
function buildNewOrderNotificationHtml({ orderNumber, items, total, customerEmail, paymentMethod }) {
  const itemsHtml = items
    .map((item) => `<li>${item.quantity} × ${item.name || item.flavour}</li>`)
    .join('');

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0E0E0E;">New Order — #${orderNumber}</h2>
      <p>A new order was just placed.</p>
      <p><strong>Customer:</strong> ${customerEmail}</p>
      <p><strong>Payment method:</strong> ${paymentMethod}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total: $${Number(total).toFixed(2)}</strong></p>
      <p>Check the admin dashboard for full details.</p>
    </div>
  `;
}

/**
 * Send new order notification to Adam.
 * WHY same non-blocking pattern as sendOrderConfirmationEmail: this must
 * never delay or fail the order-creation response, per TRD 16.
 */
export async function sendNewOrderNotification({ orderNumber, items, total, customerEmail, paymentMethod }) {
  const adminEmail = process.env.ADMIN_EMAIL || "info@layrd.org";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `New Order – #${orderNumber}`,
      html: buildNewOrderNotificationHtml({ orderNumber, items, total, customerEmail, paymentMethod }),
    });

    if (error) {
      console.error('resend.js: sendNewOrderNotification failed:', error);
      return { success: false, error };
    }

    console.log(`[EMAIL SENT] New order notification sent to ${adminEmail} for order #${orderNumber} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('resend.js: sendNewOrderNotification threw:', err.message);
    return { success: false, error: err.message };
  }
}
/**
 * Builds a simple HTML email body notifying Adam of a new event inquiry.
 */
function buildEventInquiryNotificationHtml({ inquiryId, customerName, eventDate, canCount }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0E0E0E;">New Event Inquiry — #${inquiryId}</h2>
      <p>A new private event inquiry was just submitted.</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Event date:</strong> ${eventDate}</p>
      <p><strong>Total cans:</strong> ${canCount}</p>
      <p>Review it in Admin → Events to approve or reject.</p>
    </div>
  `;
}

/**
 * Send event inquiry notification to Adam.
 * WHY same non-blocking pattern as the order emails: per TRD 16, this must
 * never delay or fail the inquiry-creation response back to the customer.
 */
export async function sendEventInquiryNotification({ inquiryId, customerName, eventDate, canCount }) {
  const adminEmail = process.env.ADMIN_EMAIL || "info@layrd.org";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `New Event Inquiry – #${inquiryId}`,
      html: buildEventInquiryNotificationHtml({ inquiryId, customerName, eventDate, canCount }),
    });

    if (error) {
      console.error('resend.js: sendEventInquiryNotification failed:', error);
      return { success: false, error };
    }

    console.log(`[EMAIL SENT] Event inquiry notification sent to ${adminEmail} for inquiry #${inquiryId} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('resend.js: sendEventInquiryNotification threw:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Builds a simple HTML email body notifying the customer of Adam's
 * decision on their event inquiry.
 */
function buildEventDecisionHtml({ customerName, eventType, status, adminNote }) {
  const isApproved = status === "Approved";

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0E0E0E;">
        Your ${eventType} Event Inquiry Was ${isApproved ? "Approved" : "Not Approved"}
      </h2>
      <p>Hi ${customerName},</p>
      ${
        isApproved
          ? `<p>Great news — your event inquiry has been approved! A 50% non-refundable deposit is required to confirm your booking. Once your deposit is received, you'll be able to design your custom can labels in our AI Label Studio.</p>`
          : `<p>Unfortunately, we're unable to approve your event inquiry at this time.</p>`
      }
      ${adminNote ? `<p><strong>Note from LÄYRD:</strong> ${adminNote}</p>` : ""}
      <p>If you have any questions, feel free to reach out.</p>
      <p style="color: #77736B; font-size: 0.85rem;">— LÄYRD, Pineridge NE, Calgary</p>
    </div>
  `;
}

/**
 * Send the approve/reject decision email to the customer.
 * WHY same non-blocking pattern as the other emails: per TRD 16, this must
 * never delay or fail the admin's status-update response.
 * @param {{ to: string, customerName: string, eventType: string, status: "Approved"|"Rejected", adminNote?: string }} params
 */
export async function sendEventDecisionEmail({ to, customerName, eventType, status, adminNote }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Your Event Inquiry Was ${status === "Approved" ? "Approved" : "Not Approved"} – LÄYRD`,
      html: buildEventDecisionHtml({ customerName, eventType, status, adminNote }),
    });

    if (error) {
      console.error('resend.js: sendEventDecisionEmail failed:', error);
      return { success: false, error };
    }

    console.log(`[EMAIL SENT] Event decision (${status}) sent to ${to} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('resend.js: sendEventDecisionEmail threw:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send business code to approved business.
 * TODO: still a stub — Day 6 scope (wholesale isn't wired up yet).
 */
export async function sendBusinessCode({ to, businessName, code, expiresAt }) {
  console.log(`[EMAIL STUB] Business code ${code} sent to ${to}`);
  return { success: true };
}