// ─────────────────────────────────────────────
// LÄYRD – promo-code-service (Express, port 3002)
//
// WHAT THIS DOES: validates a promo code (active? not expired? under its
// usage cap? order meets its minimum spend?) and atomically increments a
// code's usage count once an order using it is confirmed. Admin CRUD for
// creating/editing promo codes stays in the main Next.js app — this
// service only handles the customer-facing validate/redeem path.
//
// WHY A SEPARATE SERVICE: extracted out of the main app (see
// microservices/EXTRACTION-PLAN.md) so every caller — the storefront
// today, anything else later — goes through the exact same validation
// rules and the exact same atomic increment, instead of that logic being
// duplicated. The main app's /api/promo route is a thin proxy to this
// service, with an identical-logic local fallback if the service is down.
//
// THE RACE CONDITION THIS WAS BUILT TO AVOID: two customers checking out
// with the same code at nearly the same instant must not both be able to
// slip in under a usage cap that only has one spot left. increment_promo_usage()
// (see migrations/002_increment_promo_usage_atomic_cap.sql) does the
// "is there room left?" check and the increment as one atomic database
// UPDATE, so there's no window between checking and incrementing where a
// second request could sneak through.
//
// SECURITY: every request must carry the shared `x-internal-key` header
// (see the middleware below) — this proves the caller is a trusted
// backend service, not a specific end user.
// ─────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware: Verify Internal Service Key
app.use((req, res, next) => {
  const internalKey = req.headers['x-internal-key'];
  if (!internalKey || internalKey !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid x-internal-key header' });
  }
  next();
});

// GET /api/promo?code=XYZ
// Validates a promo code
app.get('/api/promo', async (req, res) => {
  const rawCode = req.query.code?.trim();
  const orderTotal = req.query.orderTotal !== undefined ? parseFloat(req.query.orderTotal) : null;

  if (!rawCode) {
    return res.status(400).json({ error: "Missing promo code" });
  }

  try {
    // Try exact match first
    let { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", rawCode)
      .single();

    // If no exact match, try uppercase (case-insensitive)
    if (error || !promo) {
      const upperCode = rawCode.toUpperCase();
      const { data: promoUpper, error: upperError } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", upperCode)
        .single();
      
      if (!upperError && promoUpper && !promoUpper.case_sensitive) {
        promo = promoUpper;
        error = null;
      }
    }

    if (error || !promo) {
      return res.status(404).json({ error: "Invalid promo code" });
    }

    if (!promo.is_active) {
      return res.status(400).json({ error: "Promo code is no longer active" });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(400).json({ error: "Promo code has expired" });
    }

    if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
      return res.status(400).json({ error: "Promo code usage limit reached" });
    }

    if (promo.min_order_amount && orderTotal !== null && !Number.isNaN(orderTotal) && orderTotal < parseFloat(promo.min_order_amount)) {
      return res.status(400).json({ error: `This promo code requires a minimum order of $${parseFloat(promo.min_order_amount).toFixed(2)}` });
    }

    return res.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: parseFloat(promo.value),
      discount: parseFloat(promo.value),
      min_order_amount: promo.min_order_amount ? parseFloat(promo.min_order_amount) : null,
      message: "Valid promo code"
    });
  } catch (err) {
    console.error("[Promo API] Error validating code:", err);
    return res.status(500).json({ error: "Failed to validate promo code" });
  }
});

// POST /api/promo/increment
// Atomically increments the usage count of a promo code via RPC
app.post('/api/promo/increment', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Missing promo code" });
  }

  try {
    const { data: incremented, error } = await supabase.rpc('increment_promo_usage', {
      promo_code_text: code
    });

    if (error) {
      throw error;
    }

    if (!incremented) {
      return res.status(400).json({ error: `Could not increment usage for ${code} — code not found or usage limit already reached` });
    }

    return res.json({ success: true, message: `Incremented usage for ${code}` });
  } catch (err) {
    console.error("[Promo API] Error incrementing usage:", err);
    return res.status(500).json({ error: "Failed to increment promo usage" });
  }
});

app.listen(PORT, () => {
  console.log(`promo-code-service running on port ${PORT}`);
});
