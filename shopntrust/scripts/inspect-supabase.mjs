// scripts/inspect-supabase.mjs
import { createClient } from '@supabase/supabase-js';

const url = 'https://qfjifooftpdcgvmlargl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmamlmb29mdHBkY2d2bWxhcmdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQxMTM4NiwiZXhwIjoyMTAzOTg3Mzg2fQ.9IFXjwyDpBaLY045ureCeL2MCaSIrHrs1mp2-FfIzjA';

const supabase = createClient(url, serviceKey);

async function inspect() {
  console.log('Testing Supabase Connection...');

  const tables = ['orders', 'order_items', 'campaigns', 'campaign_products', 'profiles', 'ai_commerce_events'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(3);
    if (error) {
      console.log(`Table '${t}': Error/Not Found (${error.message})`);
    } else {
      console.log(`Table '${t}': EXISTS! Count in sample: ${data.length}`);
      if (data.length > 0) {
        console.log(`  Sample row:`, Object.keys(data[0]));
      }
    }
  }
}

inspect().catch(console.error);
