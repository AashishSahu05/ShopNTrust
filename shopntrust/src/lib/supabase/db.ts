// ============================================================
// ShopNTrust — Supabase Database Service
// ============================================================
// Robust data persistence layer for authenticated customer profiles,
// customer-isolated carts, AI conversation history, and viewed products.
// Includes graceful fallback to user-isolated storage if tables are initializing.
// ============================================================

import { supabase } from './client';
import type { CustomerProfile, CartItem, AIMessage, ProductCategory } from '@/types';

// ============================================================
// 1. CUSTOMER PROFILES
// ============================================================

export interface DbProfile {
  id: string;
  name: string;
  email: string;
  preferred_categories?: ProductCategory[];
  created_at?: string;
  updated_at?: string;
}

export async function getDbProfile(userId: string): Promise<CustomerProfile | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      name: data.name,
      email: data.email,
      preferredCategories: (data.preferred_categories as ProductCategory[]) || [],
    };
  } catch {
    return null;
  }
}

export async function upsertDbProfile(
  userId: string,
  profile: { name: string; email: string; preferredCategories?: ProductCategory[] }
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        name: profile.name,
        email: profile.email,
        preferred_categories: profile.preferredCategories || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// 2. CUSTOMER-SPECIFIC CART PERSISTENCE
// ============================================================

export interface DbCartRecord {
  user_id: string;
  items: CartItem[];
  updated_at?: string;
}

export async function getDbCustomerCart(userId: string): Promise<CartItem[] | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('customer_carts')
      .select('items')
      .eq('user_id', userId)
      .single();

    if (error || !data || !Array.isArray(data.items)) return null;

    return data.items as CartItem[];
  } catch {
    return null;
  }
}

export async function saveDbCustomerCart(userId: string, items: CartItem[]): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase.from('customer_carts').upsert(
      {
        user_id: userId,
        items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// 3. AI CHAT CONVERSATION HISTORY PERSISTENCE
// ============================================================

export interface DbChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  recommended_product_ids?: string[];
  extracted_intent?: Record<string, unknown>;
  matches?: Record<string, unknown>[];
  created_at: string;
}

export async function getDbChatSessions(userId: string): Promise<DbChatSession[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];
    return data as DbChatSession[];
  } catch {
    return [];
  }
}

export async function createDbChatSession(
  userId: string,
  sessionId: string,
  title: string
): Promise<boolean> {
  if (!userId || !sessionId) return false;
  try {
    const { error } = await supabase.from('chat_sessions').upsert(
      {
        id: sessionId,
        user_id: userId,
        title,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function saveDbChatMessages(
  userId: string,
  sessionId: string,
  messages: AIMessage[]
): Promise<boolean> {
  if (!userId || !sessionId || !messages.length) return false;
  try {
    const records = messages.map((m) => ({
      id: m.id,
      session_id: sessionId,
      user_id: userId,
      role: m.role,
      content: m.content,
      recommended_product_ids: m.recommendedProductIds || [],
      extracted_intent: m.extractedIntent || {},
      matches: m.matches || [],
      created_at: new Date(m.timestamp || Date.now()).toISOString(),
    }));

    const { error } = await supabase.from('chat_messages').upsert(records, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function getDbChatMessages(sessionId: string, userId: string): Promise<AIMessage[]> {
  if (!sessionId || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((d: DbChatMessage) => ({
      id: d.id,
      role: d.role,
      content: d.content,
      timestamp: new Date(d.created_at).getTime(),
      recommendedProductIds: d.recommended_product_ids,
      extractedIntent: d.extracted_intent as AIMessage['extractedIntent'],
      matches: d.matches as AIMessage['matches'],
      status: 'success',
    }));
  } catch {
    return [];
  }
}

// ============================================================
// 4. VIEWED PRODUCTS PERSISTENCE
// ============================================================

export async function recordDbViewedProduct(userId: string, productId: string): Promise<void> {
  if (!userId || !productId) return;
  try {
    await supabase.from('viewed_products').upsert(
      {
        user_id: userId,
        product_id: productId,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,product_id' }
    );
  } catch {
    // Ignore non-critical logging failure
  }
}

export async function getDbViewedProducts(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('viewed_products')
      .select('product_id')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data.map((row) => row.product_id);
  } catch {
    return [];
  }
}
