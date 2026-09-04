// ============================================================
// ShopNTrust — Authoritative Payment Webhook Handler (/api/payment/webhook)
// ============================================================
// Accepts incoming webhook events from Razorpay / n8n workflows:
// - payment.captured / payment_link.paid / order.paid -> Marks order successful
// - payment.failed -> Marks order failed
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, getOrderById } from '@/lib/orders/order-service';
import { recordCommerceEvent } from '@/lib/analytics/events-service';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // 1. Extract event type and payload fields
    // Handles direct Razorpay webhook payloads and forwarded n8n structured events
    const event = (rawBody.event || rawBody.eventType || '').toLowerCase();
    const payload = rawBody.payload || rawBody;

    let orderId: string | undefined =
      rawBody.order_id ||
      rawBody.orderId ||
      rawBody.Order_ID ||
      payload?.payment?.entity?.notes?.['Order ID '] ||
      payload?.payment_link?.entity?.notes?.['Order ID '] ||
      payload?.payment_link?.entity?.reference_id ||
      payload?.order?.entity?.receipt;

    const razorpayPaymentId: string | undefined =
      rawBody.payment_id ||
      rawBody.razorpay_payment_id ||
      payload?.payment?.entity?.id ||
      payload?.payment_link?.entity?.payment_id;

    // Determine target payment status
    let paymentStatus: 'successful' | 'failed' | 'cancelled' = 'successful';
    if (
      event.includes('fail') ||
      rawBody.status === 'failed' ||
      rawBody.payment_status === 'failed'
    ) {
      paymentStatus = 'failed';
    } else if (
      event.includes('cancel') ||
      rawBody.status === 'cancelled' ||
      rawBody.payment_status === 'cancelled'
    ) {
      paymentStatus = 'cancelled';
    }

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID could not be identified from webhook payload.' },
        { status: 400 }
      );
    }

    // Clean order ID string
    orderId = orderId.trim();

    // 2. Authoritative database update
    const updatedOrder = await updateOrderStatus(
      orderId,
      paymentStatus === 'successful' ? 'order_confirmed' : 'checkout',
      paymentStatus,
      razorpayPaymentId
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found.` },
        { status: 404 }
      );
    }

    // 3. Trigger AI Analytics event if AI assisted order was confirmed
    if (paymentStatus === 'successful' && updatedOrder.isAiAssisted && updatedOrder.aiSessionId) {
      await recordCommerceEvent({
        sessionId: updatedOrder.aiSessionId,
        eventType: 'AI_PAYMENT_SUCCESS',
        userId: updatedOrder.userId || null,
        orderId: updatedOrder.orderId,
        metadata: {
          totalAmount: updatedOrder.total,
          attributionType: updatedOrder.attributionType,
          itemCount: updatedOrder.items.length,
          source: 'n8n_razorpay_webhook',
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.orderId,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
    });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
