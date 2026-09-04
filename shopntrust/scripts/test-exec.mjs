// scripts/test-exec.mjs
import { createClient } from '@supabase/supabase-js';

const url = 'https://qfjifooftpdcgvmlargl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmamlmb29mdHBkY2d2bWxhcmdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQxMTM4NiwiZXhwIjoyMTAzOTg3Mzg2fQ.9IFXjwyDpBaLY045ureCeL2MCaSIrHrs1mp2-FfIzjA';

const supabase = createClient(url, serviceKey);

async function test() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
  console.log('rpc exec_sql:', { data, error });
}
test();
