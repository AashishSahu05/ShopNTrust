// ============================================================
// ShopNTrust — n8n Payment API Integration
// ============================================================
// Centralized integration layer for the n8n Payment webhook.
//
// FLOW:
// Cart + CustomerInfo → requestPaymentLink() → n8n webhook
//   → Razorpay Payment Link creation → payment link URL
//   → Frontend opens/redirects customer → payment
//   → Backend verifies → order state update
// ============================================================

import { n8nConfig, isPaymentConfigured } from '@/lib/config';
import type {
  PaymentWebhookRequest,
  PaymentWebhookResponse,
  CustomerInfo,
  CartItem,
} from '@/types';

/**
 * Errors specific to the payment integration.
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_CONFIGURED'
      | 'NETWORK_ERROR'
      | 'TIMEOUT'
      | 'INVALID_RESPONSE'
      | 'SERVER_ERROR'
      | 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Normalized payment response — internal frontend model.
 *
 * PENDING: Adapt when real n8n payment response is known.
 */
export interface NormalizedPaymentResponse {
  /** Whether the payment link was successfully created */
  success: boolean;

  /** The Razorpay payment link URL */
  paymentLink?: string;

  /** Order ID from backend */
  orderId?: string;

  /** Error message if not successful */
  error?: string;
}

/**
 * Request a Razorpay Payment Link through n8n.
 *
 * @param items - Cart items to pay for
 * @param total - Total amount
 * @param currency - Currency code
 * @param customerInfo - Customer checkout information
 * @param sessionId - Optional session reference
 * @returns Normalized payment response with the payment link
 * @throws PaymentError with a specific error code
 */
export async function requestPaymentLink(
  items: CartItem[],
  total: number,
  currency: string,
  customerInfo: CustomerInfo,
  sessionId?: string
): Promise<NormalizedPaymentResponse> {
  if (!isPaymentConfigured()) {
    throw new PaymentError(
      'Payment webhook URL is not configured. Please set NEXT_PUBLIC_N8N_PAYMENT_WEBHOOK_URL.',
      'NOT_CONFIGURED'
    );
  }

  const requestBody: PaymentWebhookRequest = {
    items: items.map((item) => ({
      product_id: item.product.product_id,
      quantity: item.quantity,
      price: item.product.price,
    })),
    total,
    currency,
    customerInfo,
    sessionId,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    n8nConfig.requestTimeoutMs
  );

  try {
    const response = await fetch(n8nConfig.paymentWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new PaymentError(
        `Payment request failed with status ${response.status}`,
        'SERVER_ERROR'
      );
    }

    const rawResponse: PaymentWebhookResponse = await response.json();
    return normalizePaymentResponse(rawResponse);
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new PaymentError(
        'Payment request timed out. Your order is safe — no payment was charged.',
        'TIMEOUT'
      );
    }

    throw new PaymentError(
      'Unable to connect to payment service. Please try again.',
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normalize a raw n8n payment response.
 *
 * PENDING: Update when actual n8n payment response shape is confirmed.
 */
export function normalizePaymentResponse(
  raw: PaymentWebhookResponse | Record<string, unknown>
): NormalizedPaymentResponse {
  const r = (raw || {}) as Record<string, unknown>;

  // Try to extract a payment link from various possible response shapes
  const paymentLink =
    typeof r.payment_link === 'string'
      ? r.payment_link
      : typeof r.paymentLink === 'string'
        ? r.paymentLink
        : typeof r.short_url === 'string'
          ? r.short_url
          : typeof r.url === 'string'
            ? r.url
            : undefined;

  const orderId =
    typeof r.order_id === 'string'
      ? r.order_id
      : typeof r.orderId === 'string'
        ? r.orderId
        : undefined;

  const error =
    typeof r.error === 'string'
      ? r.error
      : typeof r.message === 'string' && !paymentLink
        ? r.message
        : undefined;

  return {
    success: !!paymentLink,
    paymentLink,
    orderId,
    error,
  };
}
