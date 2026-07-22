const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function runTests() {
  console.log("=== STARTING AUTH TESTS ===");

  // 1. Create a fake user
  const email = `test-jwt-${Date.now()}@example.com`;
  const password = 'Password123!';
  console.log(`Creating test user: ${email}`);

  const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (signUpError) {
    console.error("Failed to create user", signUpError);
    return;
  }
  const userId = userData.user.id;

  // Ensure profile exists (in case trigger fails in test env)
  const { error: profileErr } = await supabaseAdmin.from('profiles').insert({ id: userId, full_name: 'Test User' });
  if (profileErr && profileErr.code !== '23505') { // ignore unique violation if trigger worked
    console.error("Failed to insert profile:", profileErr);
  }

  // 2. Sign in to get JWT
  const { data: signInData, error: signInErr } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });
  const token = signInData.session.access_token;

  // 3. Create a pending event inquiry
  const { data: eventData, error: eventErr } = await supabaseAdmin
    .from('event_inquiries')
    .insert({
      customer_id: userId,
      event_type: 'Test Event',
      event_date: '2026-08-01',
      core_cans: 50,
      status: 'Pending'
    })
    .select()
    .single();

  if (eventErr) {
    console.error("Failed to insert event inquiry:", eventErr);
    return;
  }
  const eventId = eventData.id;
  console.log(`Created test event inquiry (ID: ${eventId}) with status: Pending`);

  // Helper for making requests
  async function makeRequest(jwt, bodyParams) {
    const res = await fetch('http://localhost:3004/api/ai-labels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_SERVICE_KEY,
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(bodyParams)
    });
    return { status: res.status, body: await res.text() };
  }

  // TEST 1: Invalid Token
  console.log("\n--- TEST 1: Invalid Token ---");
  const t1 = await makeRequest("invalid.jwt.token", { action: "generate", eventInquiryId: eventId, tone: "Elegant" });
  console.log(`Expected: 401 | Actual: ${t1.status}`);
  console.log(`Response: ${t1.body}`);

  // TEST 2: Valid Token, Event is Pending (Not Approved)
  console.log("\n--- TEST 2: Valid Token, Pending Event ---");
  const t2 = await makeRequest(token, { action: "generate", eventInquiryId: eventId, tone: "Elegant" });
  console.log(`Expected: 403 | Actual: ${t2.status}`);
  console.log(`Response: ${t2.body}`);

  // --- SECOND USER SETUP (for Test 5) ---
  const email2 = `test-jwt-2-${Date.now()}@example.com`;
  const { data: user2Data } = await supabaseAdmin.auth.admin.createUser({ email: email2, password, email_confirm: true });
  const userId2 = user2Data.user.id;
  await supabaseAdmin.from('profiles').insert({ id: userId2, full_name: 'Test User 2' });

  const { data: event2Data } = await supabaseAdmin.from('event_inquiries').insert({
    customer_id: userId2, event_type: 'Test Event 2', event_date: '2026-08-01', core_cans: 50, status: 'Approved'
  }).select().single();
  const eventId2 = event2Data.id;
  console.log(`\nCreated second test user & event inquiry (ID: ${eventId2}) with status: Approved`);

  // TEST 5: Valid Token for User A, but targeting Event B (Ownership violation)
  console.log("\n--- TEST 5: Valid Token (User A), Event Owned by User B ---");
  const t5 = await makeRequest(token, { action: "generate", eventInquiryId: eventId2, tone: "Elegant" });
  console.log(`Expected: 403 | Actual: ${t5.status}`);
  console.log(`Response: ${t5.body}`);

  // 4. Update Event A to Approved
  const { data: updatedEvent, error: updateErr } = await supabaseAdmin.from('event_inquiries').update({ status: 'Approved' }).eq('id', eventId).select().single();
  if (updateErr) {
    console.error("Failed to update event:", updateErr);
  }
  console.log(`\nUpdated test event inquiry to status: ${updatedEvent?.status}`);

  // TEST 3: Valid Token, Event is Approved (Succeeds)
  console.log("\n--- TEST 3: Valid Token, Approved Event ---");
  const t3 = await makeRequest(token, { action: "generate", eventInquiryId: eventId, tone: "Elegant" });
  console.log(`Expected: 200 | Actual: ${t3.status}`);
  console.log(`Response: ${t3.body}`);

  // TEST 4: Submit a Label
  console.log("\n--- TEST 4: Submit Label (Approved Event) ---");
  const t4 = await makeRequest(token, {
    action: "submit",
    eventInquiryId: eventId,
    tone: "Elegant",
    eventType: "Test Event",
    editedText: "Test Submission"
  });
  console.log(`Expected: 200 | Actual: ${t4.status}`);
  console.log(`Response: ${t4.body}`);

  // Wait for submission to be saved
  await new Promise(r => setTimeout(r, 1000));

  // CLEANUP
  console.log("\n--- CLEANUP ---");
  // Delete ai_label_requests for both events
  let { count } = await supabaseAdmin.from('ai_label_requests').delete({ count: 'exact' }).eq('event_inquiry_id', eventId);
  let { count: count2 } = await supabaseAdmin.from('ai_label_requests').delete({ count: 'exact' }).eq('event_inquiry_id', eventId2);
  console.log(`Deleted ${count + count2} test rows from ai_label_requests`);

  // Delete event inquiries
  await supabaseAdmin.from('event_inquiries').delete().in('id', [eventId, eventId2]);
  console.log(`Deleted 2 test event inquiries`);

  // Delete users
  await supabaseAdmin.auth.admin.deleteUser(userId);
  await supabaseAdmin.auth.admin.deleteUser(userId2);
  console.log(`Deleted 2 test users`);

  console.log("=== TESTS COMPLETE ===");
}

runTests().catch(console.error);
