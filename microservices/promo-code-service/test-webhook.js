const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');


dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testWebhookIdempotency() {
  console.log("=== Setting up test data ===");
  // Create a fake order
  const orderId = 'ORD-test-idempotency-' + Date.now();
  
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([{
      customer_name: "Test Customer",
      customer_email: "test@example.com",
      status: "Pending Payment",
      payment_method: "stripe",
      payment_status: "Unpaid",
      promo_code: "NEWONE",
      fulfillment: "pickup",
      pickup_date: "2026-07-20",
      pickup_time: "10:00 AM",
      total: 10
    }])
    .select()
    .single();
    
  if (orderError) {
    console.error("Failed to insert mock order:", orderError);
    return;
  }
  
  const mockOrderDbId = orderData.id;
  console.log("Created mock order with DB ID:", mockOrderDbId);
  
  const { error: itemsError } = await supabase.from('order_items').insert([{
    order_id: mockOrderDbId,
    name: 'Test Item',
    quantity: 1,
    unit_price: 10,
    category: 'cake',
    type: 'can',
    flavour: 'Vanilla',
    size: '8oz'
  }]);
  if (itemsError) {
    console.error("Failed to insert mock order item:", itemsError);
  }

  // Check current times_used of NEWONE
  const { data: promoBefore } = await supabase
    .from('promo_codes')
    .select('times_used')
    .eq('code', 'NEWONE')
    .single();
    
  const usesBefore = promoBefore.times_used || 0;
  console.log(`Before Webhook: NEWONE times_used = ${usesBefore}`);

  // Create mock webhook payload
  const payload = {
    type: "checkout.session.completed",
    data: {
      object: {
        metadata: {
          orderId: mockOrderDbId
        }
      }
    }
  };

  console.log("\n=== Sending First Webhook ===");
  const res1 = await fetch('http://localhost:3010/api/stripe-webhook', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  console.log("Response 1 status:", res1.status);
  
  // Wait a little for promo service to process (it's called asynchronously inside the webhook)
  await new Promise(r => setTimeout(r, 1000));
  
  const { data: promoAfter1 } = await supabase
    .from('promo_codes')
    .select('times_used')
    .eq('code', 'NEWONE')
    .single();
  console.log(`After First Webhook: NEWONE times_used = ${promoAfter1.times_used}`);

  console.log("\n=== Sending Second (Duplicate) Webhook ===");
  const res2 = await fetch('http://localhost:3010/api/stripe-webhook', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  console.log("Response 2 status:", res2.status);
  
  await new Promise(r => setTimeout(r, 1000));
  
  const { data: promoAfter2 } = await supabase
    .from('promo_codes')
    .select('times_used')
    .eq('code', 'NEWONE')
    .single();
  console.log(`After Second Webhook: NEWONE times_used = ${promoAfter2.times_used}`);
  
  // Cleanup mock order
  await supabase.from('order_items').delete().eq('order_id', mockOrderDbId);
  await supabase.from('orders').delete().eq('id', mockOrderDbId);
}

testWebhookIdempotency();
