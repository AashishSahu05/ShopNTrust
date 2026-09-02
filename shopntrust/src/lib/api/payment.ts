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
  raw: PaymentWebhookResponse
): NormalizedPaymentResponse {
  // Try to extract a payment link from various possible response shapes
  const paymentLink =
    typeof raw.paymentLink === 'string'
      ? raw.paymentLink
      : typeof raw.payment_link === 'string'
        ? raw.payment_link
        : typeof raw.short_url === 'string'
          ? raw.short_url
          : typeof raw.url === 'string'
            ? raw.url
            : undefined;

  const orderId =
    typeof raw.orderId === 'string'
      ? raw.orderId
      : typeof raw.order_id === 'string'
        ? raw.order_id
        : undefined;

  const error =
    typeof raw.error === 'string'
      ? raw.error
      : typeof raw.message === 'string' && !paymentLink
        ? raw.message
        : undefined;

  return {
    success: !!paymentLink,
    paymentLink,
    orderId,
    error,
  };
}
