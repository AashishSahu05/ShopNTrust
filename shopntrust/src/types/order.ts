// ============================================================
// ShopNTrust — Order & Payment Types
// ============================================================

import { type CartItem } from './cart';

/** Order status — reflects backend/n8n truth */
export type OrderStatus =
  | 'draft'
  | 'checkout'
  | 'payment_pending'
  | 'payment_successful'
  | 'payment_failed'
  | 'order_confirmed';

/** Payment status — reflects Razorpay/backend truth */
export type PaymentStatus =
  | 'idle'
  | 'creating'
  | 'link_created'
  | 'pending'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'unknown'
  | 'network_error';

/**
 * Customer information collected at checkout.
 */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

/**
 * Checkout state — tracks the checkout flow.
 */
export interface CheckoutState {
  /** Customer information */
  customerInfo: CustomerInfo | null;

  /** Items being checked out (snapshot from cart) */
  items: CartItem[];

  /** Order total (validated by backend) */
  total: number;

  /** Currency */
  currency: string;

  /** Whether checkout form is valid */
  isValid: boolean;

  /** Whether customer has confirmed the order */
  isConfirmed: boolean;
}

/**
 * Payment state — tracks the Razorpay payment flow.
 */
export interface PaymentState {
  /** Current payment status */
  status: PaymentStatus;

  /** Razorpay payment link URL (from n8n) */
  paymentLink?: string;

  /** Error message if payment failed */
  error?: string;

  /** Whether a retry is available */
  canRetry: boolean;
}

/**
 * Order — represents a completed or in-progress order.
 */
export interface Order {
  /** Order ID (from backend) */
  orderId: string;

  /** Order status */
  status: OrderStatus;

  /** Items in the order */
  items: CartItem[];

  /** Order total */
  total: number;

  /** Currency */
  currency: string;

  /** Customer information */
  customerInfo: CustomerInfo;

  /** Payment status */
  paymentStatus: PaymentStatus;

  /** Delivery estimate */
  deliveryEstimate?: string;

  /** AI Attribution tracking */
  isAiAssisted?: boolean;
  attributionType?: 'manual' | 'ai_recommendation' | 'ai_upsell' | 'ai_cross_sell' | 'ai_mixed';
  aiSessionId?: string;
  userId?: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  /** Campaign attribution tracking */
  campaignId?: string;

  /** Timestamp of order creation */
  createdAt: number;

  /** Timestamp of last status update */
  updatedAt: number;
}

/**
 * Payment workflow response — what n8n Payment Workflow returns.
 * Structure: { success: boolean, order_id?: string, payment_link?: string, error?: string }
 */
export interface PaymentWorkflowResponse {
  /** Whether the payment link was successfully created by n8n */
  success: boolean;

  /** Authoritative Order ID returned by n8n/Razorpay */
  order_id?: string;

  /** Razorpay short URL payment link */
  payment_link?: string;

  /** Optional clean error explanation */
  error?: string;
}

/**
 * Payment webhook request — payload sent to n8n Payment Workflow.
 */
export interface PaymentWebhookRequest {
  /** Items with product IDs, quantities, and prices */
  items: Array<{
    product_id: string;
    name?: string;
    quantity: number;
    price: number;
    added_via?: string;
  }>;

  /** Total amount */
  total: number;
  amount?: number;

  /** Currency code (default 'INR') */
  currency: string;

  /** Customer information */
  customerInfo: CustomerInfo;

  /** Simplified customer contact for Razorpay */
  customer?: {
    name: string;
    email: string;
    contact?: string;
  };

  /** Order identifier */
  order_id?: string;
  orderId?: string;

  /** Razorpay notes object */
  notes?: Record<string, string>;

  /** Session and attribution context */
  sessionId?: string;
  aiSessionId?: string;
  userId?: string;
  isAiAssisted?: boolean;
  attributionType?: string;
}

/**
 * Legacy raw response mapping
 */
export type PaymentWebhookResponse = PaymentWorkflowResponse;

