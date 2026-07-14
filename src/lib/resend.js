import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'LÄYRD <orders@layrd.org>';

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail({ to, orderNumber, items, total, pickupDate, deliveryMethod }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] Order confirmation sent to ${to} for order #${orderNumber}`);
    return { success: true };
  }

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eaeaea;">${i.product_name || i.name} ${i.sweetness ? `(${i.sweetness})` : ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eaeaea; text-align: center;">${i.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eaeaea; text-align: right;">$${(i.unit_price || i.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const isDelivery = deliveryMethod === 'delivery';

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `LÄYRD Order Confirmed – #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #bc9363; font-family: Georgia, serif;">Thank you for your order!</h1>
          <p>Hi there,</p>
          <p>Your order <strong>#${orderNumber}</strong> has been successfully placed.</p>
          
          <h3>Order Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background-color: #f9f9f9; padding: 16px; border-radius: 4px; margin-top: 24px;">
            <h4 style="margin-top: 0;">Fulfillment Information</h4>
            <p style="margin: 4px 0;"><strong>Method:</strong> ${isDelivery ? 'Delivery' : 'Pickup'}</p>
            ${pickupDate ? `<p style="margin: 4px 0;"><strong>Date:</strong> ${pickupDate}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Status:</strong> We will notify you when your order is ready!</p>
          </div>

          <p style="margin-top: 32px; font-size: 0.9em; color: #666;">
            If you have any questions, reply to this email or contact us at info@layrd.org.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Resend Error]', error);
    return { success: false, error };
  }
}

/**
 * Send new order notification to Adam
 */
export async function sendNewOrderNotification({ orderNumber, items, total, customerEmail }) {
  const adminEmail = process.env.ADMIN_EMAIL || "info@layrd.org";
  
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] New order notification sent to ${adminEmail} for order #${orderNumber}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🚨 New Order Received – #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>New Order: #${orderNumber}</h2>
          <p><strong>Customer:</strong> ${customerEmail}</p>
          <p><strong>Total:</strong> $${total.toFixed(2)}</p>
          <p><strong>Items:</strong> ${items.length}</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders">Log into Admin Panel to view details</a></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Resend Error]', error);
    return { success: false, error };
  }
}

/**
 * Send event inquiry notification to Adam
 */
export async function sendEventInquiryNotification({ inquiryId, customerName, eventDate, canCount }) {
  const adminEmail = process.env.ADMIN_EMAIL || "info@layrd.org";
  
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] Event inquiry #${inquiryId} notification sent to ${adminEmail}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🎉 New Event Inquiry – #${inquiryId}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Event Inquiry: #${inquiryId}</h2>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Event Date:</strong> ${eventDate}</p>
          <p><strong>Estimated Cans:</strong> ${canCount}</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/events">Log into Admin Panel to review</a></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Resend Error]', error);
    return { success: false, error };
  }
}

/**
 * Send contact form submission to Adam
 */
export async function sendContactEmail({ name, email, subject, message }) {
  const adminEmail = process.env.ADMIN_EMAIL || "info@layrd.org";
  
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] Contact form from ${name} sent to ${adminEmail}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      replyTo: email,
      subject: `✉️ Contact Form: ${subject || 'New Message'}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Resend Error]', error);
    return { success: false, error };
  }
}

/**
 * Send business code to approved business
 */
export async function sendBusinessCode({ to, businessName, code, expiresAt }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] Business code ${code} sent to ${to}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `LÄYRD Wholesale Approved – Your Access Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Wholesale Account Approved</h2>
          <p>Hi ${businessName},</p>
          <p>Your wholesale application has been approved! Use the following code to access the wholesale shop:</p>
          
          <div style="background-color: #f1f1f1; padding: 20px; text-align: center; margin: 24px 0; border-radius: 8px;">
            <strong style="font-size: 24px; letter-spacing: 2px;">${code}</strong>
          </div>
          
          <p>This code is valid until ${new Date(expiresAt).toLocaleDateString()}.</p>
          <p>Go to <a href="${process.env.NEXT_PUBLIC_SITE_URL}/business">layrd.org/business</a> to enter your code and start shopping.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Resend Error]', error);
    return { success: false, error };
  }
}
