// ============================================================
// ShopNTrust — Centralized Supabase Browser Client
// ============================================================
// Singleton client instance for browser authentication and data operations.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/config';

declare global {
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: SupabaseClient | undefined;
}

/**
 * Returns a singleton instance of the Supabase client for browser usage.
 */
export function getSupabaseClient(): SupabaseClient {
  if (globalThis.__supabaseBrowserClient) {
    return globalThis.__supabaseBrowserClient;
  }

  const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'shopntrust-auth-token',
    },
  });

  globalThis.__supabaseBrowserClient = client;
  return client;
}

export const supabase = getSupabaseClient();
