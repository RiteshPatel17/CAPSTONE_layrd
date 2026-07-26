const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

if (process.env.ALLOW_LIVE_DB_SCRIPT !== 'true') {
  console.error('This script reads live promo_codes data and prints a real code to stdout.');
  console.error('Set ALLOW_LIVE_DB_SCRIPT=true if you really mean to run this against .env.local\'s database.');
  process.exit(1);
}

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
