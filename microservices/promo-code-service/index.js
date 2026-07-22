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
    const { error } = await supabase.rpc('increment_promo_usage', {
      promo_code_text: code
    });

    if (error) {
      throw error;
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
