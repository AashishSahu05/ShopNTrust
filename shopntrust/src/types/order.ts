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

  /** Timestamp of order creation */
  createdAt: number;

  /** Timestamp of last status update */
  updatedAt: number;
}

/**
 * Payment webhook request — what we send to n8n for payment.
 *
 * PENDING: Adapt when actual n8n payment workflow contract is confirmed.
 */
export interface PaymentWebhookRequest {
  /** Items with product IDs and quantities */
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;

  /** Total amount */
  total: number;

  /** Currency */
  currency: string;

  /** Customer information */
  customerInfo: CustomerInfo;

  /** Session/reference ID */
  sessionId?: string;
}

/**
 * Payment webhook response — what we receive from n8n.
 *
 * PENDING: This is a placeholder. Adapt when real contract is known.
 */
export interface PaymentWebhookResponse {
  /** Raw response — shape TBD */
  [key: string]: unknown;
}
