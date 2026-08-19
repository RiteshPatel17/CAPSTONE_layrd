// ─────────────────────────────────────────────
// LÄYRD – notifications-service (Express, port 3003)
//
// WHAT THIS DOES: sends every transactional/notification email in the
// app via Resend — order confirmations, admin new-order alerts, event/
// wholesale/AI-label status updates to customers, and "new submission"
// alerts to the admin. Each email is its own route (see the numbered
// comments below), called by the main Next.js app right after whatever
// database change triggered it.
//
// WHY A SEPARATE SERVICE: centralizes the Resend API key and every email
// template in one place, so there's exactly one spot to update sender
// address, branding, or the email provider itself — instead of that logic
// being scattered across every API route that needs to notify someone.
//
// FAILURE MODE BY DESIGN: the main app always calls these email routes
// "fire and forget" (the fetch() call's result is only logged on error,
// never awaited in a way that blocks the customer's request). A dead
// notifications-service should never be able to fail an order, an event
// submission, or anything else — the customer-facing action already
// succeeded in the database before the email attempt even happens.
//
// SECURITY: every request must carry the shared `x-internal-key` header
// (see the middleware below).
// ─────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Resend } = require('resend');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);
const supportEmail = process.env.ADMIN_EMAIL || "info@layrd.org";
const fromEmail = process.env.FROM_EMAIL || `LÄYRD <${supportEmail}>`;

function getAdminEmail() {
  if (process.env.NOTIFICATION_TEST_MODE === 'true') {
    console.log('[Notifications] TEST MODE active. Redirecting admin email.');
    return 'test-admin-safe@example.com';
  }
  return supportEmail;
}

// Middleware: Verify Internal Service Key
app.use((req, res, next) => {
  const internalKey = req.headers['x-internal-key'];
  if (!internalKey || internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid x-internal-key header' });
  }
  next();
});

// Helper for sending or stubbing
async function sendOrStub(options) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[EMAIL STUB] Email to ${options.to} (Subject: ${options.subject})`);
    return { success: true };
  }
  try {
    await resend.emails.send(options);
    return { success: true };
  } catch (error) {
    console.error('[Resend Error]', error);
    throw error;
  }
}

// 1. Order Confirmation
app.post('/api/emails/order-confirmation', async (req, res) => {
  const { to, orderNumber, items, total, pickupDate, deliveryMethod } = req.body;
  if (!to || !orderNumber || !items) return res.status(400).json({ error: 'Missing required fields' });

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eaeaea;">${i.product_name || i.name} ${i.sweetness ? `(${i.sweetness})` : ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eaeaea; text-align: center;">${i.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eaeaea; text-align: right;">$${(i.unit_price || i.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const isDelivery = deliveryMethod === 'delivery';

  const html = `
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
        If you have any questions, reply to this email or contact us at ${supportEmail}.
      </p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to,
      subject: `LÄYRD Order Confirmed – #${orderNumber}`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 2. New Order Notification (Admin)
app.post('/api/emails/new-order-admin', async (req, res) => {
  const { orderNumber, items, total, customerEmail } = req.body;
  if (!orderNumber || !items) return res.status(400).json({ error: 'Missing fields' });

  const adminEmail = getAdminEmail();
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Order: #${orderNumber}</h2>
      <p><strong>Customer:</strong> ${customerEmail}</p>
      <p><strong>Total:</strong> $${total.toFixed(2)}</p>
      <p><strong>Items:</strong> ${items.length}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010'}/admin/orders">Log into Admin Panel to view details</a></p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to: adminEmail,
      subject: `🚨 New Order Received – #${orderNumber}`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 3. Event Inquiry — fires only after the customer's 50% deposit is
// actually confirmed paid (see stripe-webhook/route.js), not at submission.
app.post('/api/emails/event-inquiry', async (req, res) => {
  const { inquiryId, customerName, eventDate, canCount, depositAmount } = req.body;
  const adminEmail = getAdminEmail();

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Event Booking: #${inquiryId}</h2>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Event Date:</strong> ${eventDate}</p>
      <p><strong>Estimated Cans:</strong> ${canCount}</p>
      <p><strong>50% Deposit Received:</strong> $${Number(depositAmount || 0).toFixed(2)}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010'}/admin/events">Log into Admin Panel to review</a></p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to: adminEmail,
      subject: `🎉 New Event Inquiry – #${inquiryId}`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 3b. Wholesale Application — New Inquiry (Admin)
app.post('/api/emails/wholesale-inquiry', async (req, res) => {
  const { businessName, contactName, email, phone, businessType, expectedVolume, expectedFrequency } = req.body;
  if (!businessName || !contactName || !email) return res.status(400).json({ error: 'Missing required fields' });

  const adminEmail = getAdminEmail();
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Wholesale Application: ${businessName}</h2>
      <p><strong>Contact:</strong> ${contactName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || '—'}</p>
      <p><strong>Business Type:</strong> ${businessType || '—'}</p>
      <p><strong>Expected Volume:</strong> ${expectedVolume || '—'}</p>
      <p><strong>Expected Frequency:</strong> ${expectedFrequency || '—'}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010'}/admin/wholesale">Log into Admin Panel to review</a></p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to: adminEmail,
      subject: `🧾 New Wholesale Application – ${businessName}`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 3c. AI Label Request — New Submission (Admin)
app.post('/api/emails/ai-label-inquiry', async (req, res) => {
  const { eventInquiryId, customerEmail, customerName, tone, eventType, quantity } = req.body;
  if (!eventInquiryId || !customerEmail) return res.status(400).json({ error: 'Missing required fields' });

  const adminEmail = getAdminEmail();
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New AI Label Submission</h2>
      <p><strong>Customer:</strong> ${customerEmail}</p>
      <p><strong>Event Inquiry:</strong> #${eventInquiryId}</p>
      <p><strong>Name on Label:</strong> ${customerName || '—'}</p>
      <p><strong>Tone:</strong> ${tone || '—'}</p>
      <p><strong>Event Type:</strong> ${eventType || '—'}</p>
      <p><strong>Quantity:</strong> ${quantity || '—'}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010'}/admin/ai-labels">Log into Admin Panel to review</a></p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to: adminEmail,
      subject: `🏷️ New AI Label Submission`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 4. Contact Form
app.post('/api/emails/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  const adminEmail = getAdminEmail();

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p style="white-space: pre-wrap;">${message}</p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to: adminEmail,
      replyTo: email,
      subject: `✉️ Contact Form: ${subject || 'New Message'}`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 5. Business Code
app.post('/api/emails/business-code', async (req, res) => {
  const { to, businessName, code, expiresAt } = req.body;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Wholesale Account Approved</h2>
      <p>Hi ${businessName},</p>
      <p>Your wholesale application has been approved! Use the following code to access the wholesale shop:</p>
      
      <div style="background-color: #f1f1f1; padding: 20px; text-align: center; margin: 24px 0; border-radius: 8px;">
        <strong style="font-size: 24px; letter-spacing: 2px;">${code}</strong>
      </div>
      
      <p>This code is valid until ${new Date(expiresAt).toLocaleDateString()}.</p>
      <p>Go to <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010'}/business">layrd.org/business</a> to enter your code and start shopping.</p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to,
      subject: `LÄYRD Wholesale Approved – Your Access Code`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 6. Event Approved
app.post('/api/emails/event-approved', async (req, res) => {
  const { to, inquiryId, customerName } = req.body;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #bc9363; font-family: Georgia, serif;">Event Inquiry Approved</h1>
      <p>Hi ${customerName},</p>
      <p>Great news! Your event inquiry <strong>#${inquiryId}</strong> has been approved. Your deposit is already on file — there's nothing further to pay right now.</p>
      <p><strong>Your AI Label Studio is now unlocked.</strong> Log in to your account to design a custom label for your event.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010'}/ai-label-studio">Start designing your label</a></p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to,
      subject: `LÄYRD Event Approved – #${inquiryId}`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 7. Event Rejected
app.post('/api/emails/event-rejected', async (req, res) => {
  const { to, inquiryId, customerName, adminNote } = req.body;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #bc9363; font-family: Georgia, serif;">Event Inquiry Update</h1>
      <p>Hi ${customerName},</p>
      <p>Thank you for reaching out regarding your event <strong>#${inquiryId}</strong>.</p>
      <p>Unfortunately, we are unable to accommodate your request at this time.</p>
      ${adminNote ? `<p><strong>Note from our team:</strong><br/>${adminNote}</p>` : ''}
      <p>We appreciate your interest in LÄYRD and hope to serve you in the future.</p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to,
      subject: `LÄYRD Event Inquiry Update – #${inquiryId}`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 8. Label Approved
app.post('/api/emails/label-approved', async (req, res) => {
  const { to, customerName, generatedText } = req.body;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #bc9363; font-family: Georgia, serif;">Label Approved</h1>
      <p>Hi ${customerName},</p>
      <p>Your custom label text has been approved and is ready for printing!</p>
      <div style="background-color: #f9f9f9; padding: 16px; border-radius: 4px; margin: 24px 0; font-style: italic;">
        "${generatedText}"
      </div>
      <p>We're excited to see your custom cans at your event.</p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to,
      subject: `LÄYRD Label Approved`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// 9. Label Revision
app.post('/api/emails/label-revision', async (req, res) => {
  const { to, customerName, adminNote } = req.body;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #bc9363; font-family: Georgia, serif;">Label Revision Required</h1>
      <p>Hi ${customerName},</p>
      <p>Our team has reviewed your custom label text submission and requested a revision before we can proceed.</p>
      ${adminNote ? `<p><strong>Note from our team:</strong><br/>${adminNote}</p>` : ''}
      <p>Please log in to your account and submit an updated label text.</p>
    </div>
  `;

  try {
    await sendOrStub({
      from: fromEmail,
      to,
      subject: `LÄYRD Label Revision Required`,
      html
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.listen(PORT, () => {
  console.log(`notifications-service running on port ${PORT}`);
});

// Wholesale Application — Approved / Qualified
app.post('/api/emails/wholesale-approved', async (req, res) => {
  const { to, businessName, contactName } = req.body;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #bc9363; font-family: Georgia, serif;">Wholesale Application Update</h1>
      <p>Hi ${contactName},</p>
      <p>Thank you for applying for a LÄYRD wholesale account on behalf of <strong>${businessName}</strong>.</p>
      <p>Good news — your application looks like a great fit. Someone from the LÄYRD team will be in touch directly to discuss next steps, pricing, and fulfilment.</p>
    </div>
  `;

  try {
    await sendOrStub({ from: fromEmail, to, subject: `LÄYRD Wholesale — Application Update for ${businessName}`, html });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Wholesale Application — Not a Fit / Rejected
app.post('/api/emails/wholesale-declined', async (req, res) => {
  const { to, businessName, contactName } = req.body;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #bc9363; font-family: Georgia, serif;">Wholesale Application Update</h1>
      <p>Hi ${contactName},</p>
      <p>Thank you for your interest in a LÄYRD wholesale partnership for <strong>${businessName}</strong>.</p>
      <p>After review, we're not able to move forward with a wholesale account at this time. We appreciate you thinking of LÄYRD, and you're welcome to reach out again in the future.</p>
    </div>
  `;

  try {
    await sendOrStub({ from: fromEmail, to, subject: `LÄYRD Wholesale — Application Update for ${businessName}`, html });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});