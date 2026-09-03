// ============================================================
// ShopNTrust — Authoritative Order Service & Persistence
// ============================================================
// Manages real order creation, item attribution, idempotency,
// and dual persistence (Supabase with resilient local JSON fallback).
// ============================================================

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/config';
import { getProductById } from '@/lib/catalog';
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  CartItem,
  CustomerInfo,
  AttributionType,
  AnalyticsDateRange,
  Product,
} from '@/types';

function hydrateCartItem(di: any, currency: string): CartItem {
  const canonical = getProductById(di.product_id);
  const product: Product = canonical || {
    product_id: di.product_id,
    name: di.product_name,
    price: Number(di.unit_price),
    currency,
    brand: 'Canonical',
    category: 'phones',
    description: '',
    image: '',
    stockStatus: 'in_stock',
  };

  return {
    product,
    selectedVariant: di.variant_id
      ? {
          variant_id: di.variant_id,
          name: di.variant_name || '',
          type: 'other',
          price: Number(di.unit_price),
        }
      : undefined,
    quantity: di.quantity,
    addedVia: di.added_via,
    addedAt: di.created_at ? new Date(di.created_at).getTime() : Date.now(),
  };
}

// Server-side privileged Supabase client for analytics and order persistence
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseConfig.anonKey;

const supabaseAdmin = createClient(supabaseConfig.url, serviceRoleKey, {
  auth: { persistSession: false },
});

// Local persistent file fallback path
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'persisted-orders.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalOrders(): Order[] {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: Order[]): void {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

export interface CreateOrderInput {
  orderId?: string;
  items: CartItem[];
  total: number;
  currency: string;
  customerInfo: CustomerInfo;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  aiSessionId?: string;
  userId?: string;
}

/**
 * Determine deterministic attribution classification based on cart items
 */
export function determineOrderAttribution(items: CartItem[]): {
  isAiAssisted: boolean;
  attributionType: AttributionType;
} {
  const addedVias = new Set(items.map((i) => i.addedVia || 'manual'));
  const hasAi =
    addedVias.has('ai_primary') ||
    addedVias.has('ai_upsell') ||
    addedVias.has('ai_cross_sell');

  if (!hasAi) {
    return { isAiAssisted: false, attributionType: 'manual' };
  }

  const aiTypes = Array.from(addedVias).filter((v) => v !== 'manual');
  if (aiTypes.length > 1) {
    return { isAiAssisted: true, attributionType: 'ai_mixed' };
  }

  if (aiTypes[0] === 'ai_upsell') {
    return { isAiAssisted: true, attributionType: 'ai_upsell' };
  }
  if (aiTypes[0] === 'ai_cross_sell') {
    return { isAiAssisted: true, attributionType: 'ai_cross_sell' };
  }

  return { isAiAssisted: true, attributionType: 'ai_recommendation' };
}

/**
 * Create a new order with itemized attribution.
 * Idempotent: does not duplicate if orderId already exists.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderId =
    input.orderId ||
    `ord_snt_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Check existing to enforce idempotency
  const existing = await getOrderById(orderId);
  if (existing) {
    return existing;
  }

  const { isAiAssisted, attributionType } = determineOrderAttribution(input.items);
  const now = Date.now();

  const newOrder: Order = {
    orderId,
    status: input.status || 'order_confirmed',
    paymentStatus: input.paymentStatus || 'successful',
    items: input.items,
    total: input.total,
    currency: input.currency || 'INR',
    customerInfo: input.customerInfo,
    deliveryEstimate: '3-5 Business Days',
    isAiAssisted,
    attributionType,
    aiSessionId: input.aiSessionId,
    userId: input.userId,
    paymentMethod: input.paymentMethod || 'razorpay',
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    createdAt: now,
    updatedAt: now,
  };

  // Try Supabase first
  let savedToSupabase = false;
  try {
    const { error: orderError } = await supabaseAdmin.from('orders').insert({
      id: newOrder.orderId,
      user_id: newOrder.userId || null,
      customer_name: newOrder.customerInfo.name,
      customer_email: newOrder.customerInfo.email,
      total_amount: newOrder.total,
      currency: newOrder.currency,
      status: newOrder.status === 'order_confirmed' ? 'completed' : newOrder.status,
      payment_status: newOrder.paymentStatus,
      payment_method: newOrder.paymentMethod,
      razorpay_order_id: newOrder.razorpayOrderId || null,
      razorpay_payment_id: newOrder.razorpayPaymentId || null,
      is_ai_assisted: newOrder.isAiAssisted,
      ai_session_id: newOrder.aiSessionId || null,
      attribution_type: newOrder.attributionType,
      delivery_address: `${newOrder.customerInfo.address}, ${newOrder.customerInfo.city}, ${newOrder.customerInfo.state} - ${newOrder.customerInfo.pincode}`,
      created_at: new Date(newOrder.createdAt).toISOString(),
      updated_at: new Date(newOrder.updatedAt).toISOString(),
    });

    if (!orderError) {
      // Insert items
      const itemRows = newOrder.items.map((item) => {
        const unitPrice = item.selectedVariant?.price ?? item.product.price;
        return {
          order_id: newOrder.orderId,
          product_id: item.product.product_id,
          product_name: item.product.name,
          variant_id: item.selectedVariant?.variant_id || null,
          variant_name: item.selectedVariant?.name || null,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
          added_via: item.addedVia || 'manual',
          is_ai_attributed: item.addedVia !== 'manual',
          created_at: new Date(newOrder.createdAt).toISOString(),
        };
      });

      await supabaseAdmin.from('order_items').insert(itemRows);
      savedToSupabase = true;
    }
  } catch {
    savedToSupabase = false;
  }

  // Always sync to local persistent storage for resilient zero-downtime consistency
  const localOrders = readLocalOrders();
  const existingIdx = localOrders.findIndex((o) => o.orderId === orderId);
  if (existingIdx > -1) {
    localOrders[existingIdx] = newOrder;
  } else {
    localOrders.unshift(newOrder);
  }
  writeLocalOrders(localOrders);

  return newOrder;
}

/**
 * Retrieve an order by its ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  // Check local store
  const localOrders = readLocalOrders();
  const foundLocal = localOrders.find((o) => o.orderId === orderId);
  if (foundLocal) return foundLocal;

  // Check Supabase
  try {
    const { data: dbOrder, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !dbOrder) return null;

    const { data: dbItems } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    const items: CartItem[] = (dbItems || []).map((di) =>
      hydrateCartItem(di, dbOrder.currency)
    );

    return {
      orderId: dbOrder.id,
      status: dbOrder.status === 'completed' ? 'order_confirmed' : dbOrder.status,
      paymentStatus: dbOrder.payment_status,
      items,
      total: Number(dbOrder.total_amount),
      currency: dbOrder.currency,
      customerInfo: {
        name: dbOrder.customer_name,
        email: dbOrder.customer_email,
        phone: '',
        address: dbOrder.delivery_address || '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      },
      isAiAssisted: dbOrder.is_ai_assisted,
      attributionType: dbOrder.attribution_type,
      aiSessionId: dbOrder.ai_session_id,
      userId: dbOrder.user_id,
      paymentMethod: dbOrder.payment_method,
      razorpayOrderId: dbOrder.razorpay_order_id,
      razorpayPaymentId: dbOrder.razorpay_payment_id,
      createdAt: new Date(dbOrder.created_at).getTime(),
      updatedAt: new Date(dbOrder.updated_at).getTime(),
    };
  } catch {
    return null;
  }
}

/**
 * Retrieve all orders, optionally filtered by date range.
 * Merges Supabase and local storage seamlessly.
 */
export async function getOrders(filter?: {
  dateRange?: AnalyticsDateRange;
}): Promise<Order[]> {
  const localOrders = readLocalOrders();
  const mergedMap = new Map<string, Order>();

  for (const o of localOrders) {
    mergedMap.set(o.orderId, o);
  }

  // Attempt to fetch from Supabase
  try {
    const { data: dbOrders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(dbOrders)) {
      for (const dbOrder of dbOrders) {
        if (!mergedMap.has(dbOrder.id)) {
          const items: CartItem[] = (dbOrder.order_items || []).map((di: any) =>
            hydrateCartItem(di, dbOrder.currency)
          );

          mergedMap.set(dbOrder.id, {
            orderId: dbOrder.id,
            status: dbOrder.status === 'completed' ? 'order_confirmed' : dbOrder.status,
            paymentStatus: dbOrder.payment_status,
            items,
            total: Number(dbOrder.total_amount),
            currency: dbOrder.currency,
            customerInfo: {
              name: dbOrder.customer_name,
              email: dbOrder.customer_email,
              phone: '',
              address: dbOrder.delivery_address || '',
              city: '',
              state: '',
              pincode: '',
              country: 'India',
            },
            isAiAssisted: dbOrder.is_ai_assisted,
            attributionType: dbOrder.attribution_type,
            aiSessionId: dbOrder.ai_session_id,
            userId: dbOrder.user_id,
            paymentMethod: dbOrder.payment_method,
            razorpayOrderId: dbOrder.razorpay_order_id,
            razorpayPaymentId: dbOrder.razorpay_payment_id,
            createdAt: new Date(dbOrder.created_at).getTime(),
            updatedAt: new Date(dbOrder.updated_at).getTime(),
          });
        }
      }
    }
  } catch {
    // Graceful fallback to local orders map
  }

  let allOrders = Array.from(mergedMap.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  // Apply date range filter
  if (filter?.dateRange && filter.dateRange !== 'all') {
    const now = Date.now();
    let cutoffMs = 0;
    if (filter.dateRange === '7d') cutoffMs = 7 * 24 * 60 * 60 * 1000;
    else if (filter.dateRange === '30d') cutoffMs = 30 * 24 * 60 * 60 * 1000;
    else if (filter.dateRange === '90d') cutoffMs = 90 * 24 * 60 * 60 * 1000;

    const threshold = now - cutoffMs;
    allOrders = allOrders.filter((o) => o.createdAt >= threshold);
  }

  return allOrders;
}

/**
 * Update payment status of an order (e.g. from Razorpay confirmation or failure)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentStatus: PaymentStatus,
  razorpayPaymentId?: string
): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const now = Date.now();
  order.status = status;
  order.paymentStatus = paymentStatus;
  if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
  order.updatedAt = now;

  // Update local store
  const localOrders = readLocalOrders();
  const idx = localOrders.findIndex((o) => o.orderId === orderId);
  if (idx > -1) {
    localOrders[idx] = order;
  } else {
    localOrders.unshift(order);
  }
  writeLocalOrders(localOrders);

  // Update Supabase
  try {
    await supabaseAdmin
      .from('orders')
      .update({
        status: status === 'order_confirmed' ? 'completed' : status,
        payment_status: paymentStatus,
        razorpay_payment_id: razorpayPaymentId || null,
        updated_at: new Date(now).toISOString(),
      })
      .eq('id', orderId);
  } catch {
    // Local fallback safe
  }

  return order;
}
