// ============================================================
// ShopNTrust — Authoritative Payment Status Check via n8n Webhook (/api/payment/status-check)
// ============================================================
// Queries n8n webhook (708c49a9-8acd-4cbf-9bdd-81dcf61830f8) with:
// - Order ID
// - Customer Name
// - Customer Phone Number
// Updates the order status to confirmed/failed in real-time.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { n8nConfig } from '@/lib/config';
import { getOrderById, updateOrderStatus } from '@/lib/orders/order-service';
import { recordCommerceEvent } from '@/lib/analytics/events-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required.' },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found.` },
        { status: 404 }
      );
    }

    // If order is already successful, return immediately
    if (order.paymentStatus === 'successful') {
      return NextResponse.json({
        success: true,
        order,
        status: 'successful',
      });
    }

    const customerName = order.customerInfo?.name || 'Customer';
    const customerPhone = order.customerInfo?.phone || '+919876543210';

    const payload = {
      order_id: order.orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer: {
        name: customerName,
        email: order.customerInfo?.email || '',
        contact: customerPhone,
      },
      notes: {
        'Order ID ': order.orderId,
        'Customer Name': customerName,
        'Customer Phone Number': customerPhone,
        order_id: order.orderId,
        customer_name: customerName,
        customer_phone: customerPhone,
      },
    };

    // Query n8n status check webhook (try production first, fallback to test url)
    const primaryUrl = n8nConfig.paymentStatusCheckUrl;
    const fallbackUrl = n8nConfig.paymentStatusCheckTestUrl;

    const callStatusWebhook = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s for n8n AI Agent + Google Sheets
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }
        return null;
      } catch {
        clearTimeout(timeoutId);
        return null;
      }
    };

    let webhookResponse = await callStatusWebhook(primaryUrl);
    if (!webhookResponse) {
      webhookResponse = await callStatusWebhook(fallbackUrl);
    }

    // Parse status from webhook response (handles plain text, AI agent sentences, and JSON objects)
    if (webhookResponse) {
      let rawStatus = '';
      let razorpayPaymentId: string | undefined = undefined;

      if (typeof webhookResponse === 'string') {
        rawStatus = webhookResponse.toLowerCase();
      } else if (typeof webhookResponse === 'object' && webhookResponse !== null) {
        // Full stringified search across all properties
        rawStatus = JSON.stringify(webhookResponse).toLowerCase();

        const record = webhookResponse as Record<string, unknown>;
        const rawPaymentId = record.payment_id || record.razorpay_payment_id || record.razorpayPaymentId;
        if (typeof rawPaymentId === 'string') {
          razorpayPaymentId = rawPaymentId;
        }
      }

      const isSuccess =
        rawStatus.includes('paid') ||
        rawStatus.includes('capture') ||
        rawStatus.includes('success') ||
        rawStatus.includes('confirm');

      const isFailure =
        rawStatus.includes('fail') ||
        rawStatus.includes('cancel') ||
        rawStatus.includes('decline');

      if (isSuccess) {
        const updated = await updateOrderStatus(
          order.orderId,
          'order_confirmed',
          'successful',
          razorpayPaymentId
        );

        if (updated && updated.isAiAssisted && updated.aiSessionId) {
          await recordCommerceEvent({
            sessionId: updated.aiSessionId,
            eventType: 'AI_PAYMENT_SUCCESS',
            userId: updated.userId || null,
            orderId: updated.orderId,
            metadata: {
              totalAmount: updated.total,
              attributionType: updated.attributionType,
              source: 'n8n_status_check_webhook',
            },
          });
        }

        return NextResponse.json({
          success: true,
          order: updated,
          status: 'successful',
        });
      } else if (isFailure) {
        const updated = await updateOrderStatus(
          order.orderId,
          'checkout',
          'failed',
          razorpayPaymentId
        );
        return NextResponse.json({
          success: true,
          order: updated,
          status: 'failed',
        });
      }
    }

    // Re-check order directly from database
    const freshOrder = await getOrderById(orderId);
    return NextResponse.json({
      success: true,
      order: freshOrder,
      status: freshOrder?.paymentStatus || 'pending',
    });
  } catch (error) {
    console.error('Error in /api/payment/status-check:', error);
    return NextResponse.json(
      { success: false, error: 'Status check failed.' },
      { status: 500 }
    );
  }
}
