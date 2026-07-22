const http = require('http');

const headers = {
  'Content-Type': 'application/json',
  'x-internal-key': 'layrd_internal_service_token_9x8d7f'
};

async function testEndpoint(path, body) {
  console.log(`\n=== Testing ${path} ===`);
  try {
    const res = await fetch(`http://localhost:3003${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const json = await res.json();
    console.log(`Status: ${res.status}`);
    console.log('Response:', json);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  const safeEmail = 'test-notification-safe@example.com';

  await testEndpoint('/api/emails/order-confirmation', {
    to: safeEmail,
    orderNumber: 'ORD-TEST-1',
    items: [{ name: 'Test Cake', quantity: 1, price: 10 }],
    total: 10,
    deliveryMethod: 'pickup'
  });

  await testEndpoint('/api/emails/new-order-admin', {
    orderNumber: 'ORD-TEST-1',
    items: [{ name: 'Test Cake', quantity: 1, price: 10 }],
    total: 10,
    customerEmail: safeEmail
  });

  await testEndpoint('/api/emails/event-inquiry', {
    inquiryId: 'EVT-INQ-1',
    customerName: 'Test Customer',
    eventDate: '2026-10-31',
    canCount: 100
  });

  await testEndpoint('/api/emails/contact', {
    name: 'Test Contact',
    email: safeEmail,
    subject: 'Test Subject',
    message: 'Test message body.'
  });

  await testEndpoint('/api/emails/business-code', {
    to: safeEmail,
    businessName: 'Test Business',
    code: 'TEST-CODE',
    expiresAt: new Date().toISOString()
  });

  await testEndpoint('/api/emails/event-approved', {
    to: safeEmail,
    inquiryId: 'EVT-TEST-1',
    customerName: 'Test Customer',
    depositAmount: 50
  });

  await testEndpoint('/api/emails/event-rejected', {
    to: safeEmail,
    inquiryId: 'EVT-TEST-2',
    customerName: 'Test Customer',
    adminNote: 'Not enough capacity.'
  });

  await testEndpoint('/api/emails/label-approved', {
    to: safeEmail,
    customerName: 'Test Customer',
    generatedText: 'Happy Birthday!'
  });

  await testEndpoint('/api/emails/label-revision', {
    to: safeEmail,
    customerName: 'Test Customer',
    adminNote: 'Please use less text.'
  });
}

run();
