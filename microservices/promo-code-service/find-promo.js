const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function findPromo() {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('is_active', true)
    .limit(1);
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Valid promo code:", data[0]?.code);
  }
}

findPromo();
