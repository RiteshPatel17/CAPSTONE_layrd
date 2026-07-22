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
const fromEmail = 'LÄYRD <orders@layrd.org>';

function getAdminEmail() {
  if (process.env.NOTIFICATION_TEST_MODE === 'true') {
    console.log('[Notifications] TEST MODE active. Redirecting admin email.');
    return 'test-admin-safe@example.com';
  }
  return process.env.ADMIN_EMAIL || "info@layrd.org";
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
        If you have any questions, reply to this email or contact us at info@layrd.org.
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

// 3. Event Inquiry
app.post('/api/emails/event-inquiry', async (req, res) => {
  const { inquiryId, customerName, eventDate, canCount } = req.body;
  const adminEmail = getAdminEmail();

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Event Inquiry: #${inquiryId}</h2>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Event Date:</strong> ${eventDate}</p>
      <p><strong>Estimated Cans:</strong> ${canCount}</p>
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
  const { to, inquiryId, customerName, depositAmount } = req.body;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #bc9363; font-family: Georgia, serif;">Event Inquiry Approved</h1>
      <p>Hi ${customerName},</p>
      <p>Great news! Your event inquiry <strong>#${inquiryId}</strong> has been approved.</p>
      <p>To finalize your booking, a deposit of <strong>$${depositAmount.toFixed(2)}</strong> is required.</p>
      <p>Please log in to your account to review the details and complete the deposit payment.</p>
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
