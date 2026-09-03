// ============================================================
// ShopNTrust — Application Configuration
// ============================================================
// Centralized configuration. All environment variables and app-wide
// constants are accessed through this module.
//
// WHY: Prevents scattering process.env references across components
// and makes it easy to see what configuration the app depends on.
// ============================================================

/**
 * n8n webhook configuration.
 *
 * These URLs are read from environment variables.
 * If a URL is empty/missing, the integration layer will
 * return a clear error instead of making a bad request.
 */
export const n8nConfig = {
  /** AI Agent webhook URL */
  agentWebhookUrl:
    process.env.NEXT_PUBLIC_N8N_AGENT_WEBHOOK_URL ||
    'https://shopntrust.app.n8n.cloud/webhook/1f4f8f8b-a840-4d0f-8d99-96db0cee2865',

  /** Payment webhook URL */
  paymentWebhookUrl: process.env.NEXT_PUBLIC_N8N_PAYMENT_WEBHOOK_URL || '',

  /** Request timeout in milliseconds */
  requestTimeoutMs: 30_000,
} as const;

/**
 * Supabase client configuration.
 */
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfjifooftpdcgvmlargl.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_7TT8bexG_KxbIovXyAxi1Q_kdQsVYA8',
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

/**
 * Application-wide constants.
 */
export const appConfig = {
  /** Application name */
  name: 'ShopNTrust',

  /** Application tagline */
  tagline: 'AI-Powered Shopping, Real Results',

  /** Default currency */
  currency: 'INR',

  /** Currency symbol */
  currencySymbol: '₹',

  /** Maximum cart quantity per product */
  maxCartQuantity: 10,

  /** Local storage keys */
  storageKeys: {
    cart: 'shopntrust-cart',
    aiSession: 'shopntrust-ai-session',
  },
} as const;

/**
 * Check whether a required n8n integration is configured.
 */
export function isAgentConfigured(): boolean {
  return n8nConfig.agentWebhookUrl.length > 0;
}

export function isPaymentConfigured(): boolean {
  return n8nConfig.paymentWebhookUrl.length > 0;
}
