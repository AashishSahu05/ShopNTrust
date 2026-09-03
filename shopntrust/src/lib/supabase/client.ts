// ============================================================
// ShopNTrust — Centralized Supabase Browser Client
// ============================================================
// Singleton client instance for browser authentication and data operations.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/config';

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton instance of the Supabase client for browser usage.
 */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'shopntrust-auth-token',
    },
  });

  return browserClient;
}

export const supabase = getSupabaseClient();
