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
  Campaign,
} from '@/types';
import { getActiveCampaigns } from '@/lib/campaigns/campaign-service';

import type { AddedVia } from '@/types';

interface DbOrderItem {
  product_id: string;
  product_name: string;
  unit_price: number | string;
  quantity: number;
  variant_id?: string;
  variant_name?: string;
  added_via?: string;
  campaign_id?: string;
  created_at?: string;
}

function hydrateCartItem(di: DbOrderItem, currency: string): CartItem {
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

  const addedVia: AddedVia =
    di.added_via === 'ai_primary' ||
    di.added_via === 'ai_upsell' ||
    di.added_via === 'ai_cross_sell'
      ? di.added_via
      : 'manual';

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
    addedVia,
    campaignId: di.campaign_id || undefined,
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
  campaignId?: string;
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

  // Validate campaign attribution against active campaigns
  let activeCampaignsList: Campaign[] = [];
  try {
    activeCampaignsList = await getActiveCampaigns();
  } catch {
    // If active campaigns query fails, fallback list is empty
  }

  // Verify whether a given campaignId is currently active and legitimately covers the product
  const isValidCampaignItem = (cId?: string, pId?: string): boolean => {
    if (!cId || !pId) return false;
    const foundCamp = activeCampaignsList.find((c) => c.id === cId && c.status === 'ACTIVE');
    if (!foundCamp) return false;
    return Boolean(foundCamp.productIds?.includes(pId));
  };

  // Sanitize item campaignIds to ensure client cannot fabricate invalid campaign attribution
  const validatedItems: CartItem[] = input.items.map((item) => {
    if (item.campaignId && !isValidCampaignItem(item.campaignId, item.product.product_id)) {
      return { ...item, campaignId: undefined };
    }
    return item;
  });

  const orderCampaignId =
    input.campaignId && activeCampaignsList.some((c) => c.id === input.campaignId && c.status === 'ACTIVE')
      ? input.campaignId
      : (validatedItems.find((i) => Boolean(i.campaignId))?.campaignId || undefined);

  const { isAiAssisted, attributionType } = determineOrderAttribution(validatedItems);
  const now = Date.now();

  const newOrder: Order = {
    orderId,
    status: input.status || 'order_confirmed',
    paymentStatus: input.paymentStatus || 'successful',
    items: validatedItems,
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
    campaignId: orderCampaignId,
    createdAt: now,
    updatedAt: now,
  };

  // Try Supabase first
  try {
    const orderInsertPayload: Record<string, unknown> = {
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
    };

    if (newOrder.campaignId) {
      orderInsertPayload.campaign_id = newOrder.campaignId;
    }

    let { error: orderError } = await supabaseAdmin.from('orders').insert(orderInsertPayload);

    // If order insert failed because campaign_id column does not exist in DB yet, retry without it
    if (orderError && orderError.message && orderError.message.includes('campaign_id')) {
      delete orderInsertPayload.campaign_id;
      const retry = await supabaseAdmin.from('orders').insert(orderInsertPayload);
      orderError = retry.error;
    }

    if (!orderError) {
      // Insert items
      const itemRows = newOrder.items.map((item) => {
        const unitPrice = item.selectedVariant?.price ?? item.product.price;
        const row: Record<string, unknown> = {
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
        if (item.campaignId) {
          row.campaign_id = item.campaignId;
        }
        return row;
      });

      const { error: itemError } = await supabaseAdmin.from('order_items').insert(itemRows);
      if (itemError && itemError.message && itemError.message.includes('campaign_id')) {
        const cleanRows = itemRows.map((r) => {
          const c = { ...r };
          delete c.campaign_id;
          return c;
        });
        await supabaseAdmin.from('order_items').insert(cleanRows);
      }
    }
  } catch {
    // Graceful error handling
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
  const localOrders = readLocalOrders();
  const foundLocal = localOrders.find((o) => o.orderId === orderId);

  // Check Supabase first for authoritative real-time webhook updates
  try {
    const { data: dbOrder, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!error && dbOrder) {
      const { data: dbItems } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      const items: CartItem[] =
        dbItems && dbItems.length > 0
          ? dbItems.map((di) => hydrateCartItem(di, dbOrder.currency))
          : foundLocal?.items || [];

      const syncedOrder: Order = {
        orderId: dbOrder.id,
        status: dbOrder.status === 'completed' ? 'order_confirmed' : dbOrder.status,
        paymentStatus: dbOrder.payment_status,
        items,
        total: Number(dbOrder.total_amount),
        currency: dbOrder.currency,
        customerInfo: {
          name: dbOrder.customer_name || foundLocal?.customerInfo?.name || '',
          email: dbOrder.customer_email || foundLocal?.customerInfo?.email || '',
          phone: foundLocal?.customerInfo?.phone || '',
          address: dbOrder.delivery_address || foundLocal?.customerInfo?.address || '',
          city: foundLocal?.customerInfo?.city || '',
          state: foundLocal?.customerInfo?.state || '',
          pincode: foundLocal?.customerInfo?.pincode || '',
          country: 'India',
        },
        isAiAssisted: dbOrder.is_ai_assisted ?? foundLocal?.isAiAssisted ?? false,
        attributionType: dbOrder.attribution_type || foundLocal?.attributionType || 'manual',
        aiSessionId: dbOrder.ai_session_id || foundLocal?.aiSessionId,
        userId: dbOrder.user_id || foundLocal?.userId,
        paymentMethod: dbOrder.payment_method || foundLocal?.paymentMethod || 'razorpay',
        razorpayOrderId: dbOrder.razorpay_order_id || foundLocal?.razorpayOrderId,
        razorpayPaymentId: dbOrder.razorpay_payment_id || foundLocal?.razorpayPaymentId,
        campaignId: dbOrder.campaign_id || foundLocal?.campaignId,
        createdAt: new Date(dbOrder.created_at).getTime(),
        updatedAt: new Date(dbOrder.updated_at).getTime(),
      };

      // Keep local store in sync with authoritative Supabase update
      if (foundLocal) {
        const idx = localOrders.findIndex((o) => o.orderId === orderId);
        if (idx > -1) {
          localOrders[idx] = syncedOrder;
          writeLocalOrders(localOrders);
        }
      }

      return syncedOrder;
    }
  } catch {
    // Fall through to local fallback
  }

  // Local fallback
  return foundLocal || null;
}

/**
 * Retrieve all orders with optional time filtering
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
        const existingLocal = mergedMap.get(dbOrder.id);
        const items: CartItem[] = (dbOrder.order_items && dbOrder.order_items.length > 0)
          ? dbOrder.order_items.map((di: DbOrderItem) => hydrateCartItem(di, dbOrder.currency))
          : existingLocal?.items || [];

        mergedMap.set(dbOrder.id, {
          orderId: dbOrder.id,
          status: dbOrder.status === 'completed' ? 'order_confirmed' : dbOrder.status,
          paymentStatus: dbOrder.payment_status,
          items,
          total: Number(dbOrder.total_amount),
          currency: dbOrder.currency,
          customerInfo: {
            name: dbOrder.customer_name || existingLocal?.customerInfo?.name || '',
            email: dbOrder.customer_email || existingLocal?.customerInfo?.email || '',
            phone: existingLocal?.customerInfo?.phone || '',
            address: dbOrder.delivery_address || existingLocal?.customerInfo?.address || '',
            city: existingLocal?.customerInfo?.city || '',
            state: existingLocal?.customerInfo?.state || '',
            pincode: existingLocal?.customerInfo?.pincode || '',
            country: 'India',
          },
          isAiAssisted: dbOrder.is_ai_assisted ?? existingLocal?.isAiAssisted ?? false,
          attributionType: dbOrder.attribution_type || existingLocal?.attributionType || 'manual',
          aiSessionId: dbOrder.ai_session_id || existingLocal?.aiSessionId,
          userId: dbOrder.user_id || existingLocal?.userId,
          paymentMethod: dbOrder.payment_method || existingLocal?.paymentMethod || 'razorpay',
          razorpayOrderId: dbOrder.razorpay_order_id || existingLocal?.razorpayOrderId,
          razorpayPaymentId: dbOrder.razorpay_payment_id || existingLocal?.razorpayPaymentId,
          campaignId: dbOrder.campaign_id || existingLocal?.campaignId,
          createdAt: new Date(dbOrder.created_at).getTime(),
          updatedAt: new Date(dbOrder.updated_at).getTime(),
        });
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

/**
 * Retrieve orders for a specific authenticated customer.
 * Strictly guarantees customer isolation.
 */
export async function getOrdersByCustomerId(
  customerId: string,
  customerEmail?: string
): Promise<Order[]> {
  const allOrders = await getOrders();
  const lowerEmail = customerEmail?.trim().toLowerCase();
  return allOrders.filter((o) => {
    if (o.userId && o.userId === customerId) return true;
    if (lowerEmail && o.customerInfo?.email && o.customerInfo.email.trim().toLowerCase() === lowerEmail) {
      return true;
    }
    return false;
  });
}

/**
 * Retrieve a specific order for an authenticated customer, verifying ownership.
 * Returns isAuthorized: false if order exists but belongs to another customer.
 */
export async function getCustomerOrderById(
  orderId: string,
  customerId: string,
  customerEmail?: string
): Promise<{ order: Order | null; isAuthorized: boolean }> {
  const order = await getOrderById(orderId);
  if (!order) return { order: null, isAuthorized: true };

  const lowerEmail = customerEmail?.trim().toLowerCase();
  const isOwner =
    (order.userId && order.userId === customerId) ||
    (lowerEmail && order.customerInfo?.email && order.customerInfo.email.trim().toLowerCase() === lowerEmail);

  if (!isOwner) {
    return { order: null, isAuthorized: false };
  }

  return { order, isAuthorized: true };
}

