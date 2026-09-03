// ============================================================
// ShopNTrust — Orders API Endpoint (/api/orders)
// ============================================================

import { NextResponse } from 'next/server';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '@/lib/orders/order-service';
import { recordCommerceEvent } from '@/lib/analytics/events-service';
import type { CartItem, CustomerInfo, PaymentStatus } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      items,
      total,
      currency,
      customerInfo,
      paymentStatus,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      aiSessionId,
      userId,
    } = body as {
      orderId?: string;
      items: CartItem[];
      total: number;
      currency?: string;
      customerInfo: CustomerInfo;
      paymentStatus?: PaymentStatus;
      paymentMethod?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      aiSessionId?: string;
      userId?: string;
    };

    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'Order must contain at least one item.' },
        { status: 400 }
      );
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.email) {
      return NextResponse.json(
        { error: 'Customer information is required.' },
        { status: 400 }
      );
    }

    const order = await createOrder({
      orderId,
      items,
      total,
      currency: currency || 'INR',
      customerInfo,
      paymentStatus: paymentStatus || 'successful',
      paymentMethod: paymentMethod || 'razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      aiSessionId,
      userId,
    });

    // If successfully paid and AI-assisted, record AI_PAYMENT_SUCCESS event
    if (order.paymentStatus === 'successful' && order.isAiAssisted && order.aiSessionId) {
      await recordCommerceEvent({
        sessionId: order.aiSessionId,
        eventType: 'AI_PAYMENT_SUCCESS',
        userId: order.userId || null,
        orderId: order.orderId,
        metadata: {
          totalAmount: order.total,
          attributionType: order.attributionType,
          itemCount: order.items.length,
        },
      });
    }

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Error in /api/orders:', error);
    return NextResponse.json(
      { error: 'Failed to process order.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const order = await getOrderById(orderId);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const orders = await getOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve orders.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, paymentStatus, razorpayPaymentId } = body as {
      orderId: string;
      status?: 'draft' | 'checkout' | 'payment_pending' | 'payment_successful' | 'payment_failed' | 'order_confirmed';
      paymentStatus: PaymentStatus;
      razorpayPaymentId?: string;
    };

    if (!orderId || !paymentStatus) {
      return NextResponse.json(
        { error: 'orderId and paymentStatus are required.' },
        { status: 400 }
      );
    }

    const resolvedStatus =
      status || (paymentStatus === 'successful' ? 'order_confirmed' : 'payment_failed');

    const updated = await updateOrderStatus(
      orderId,
      resolvedStatus,
      paymentStatus,
      razorpayPaymentId
    );

    if (!updated) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If successfully paid and AI-assisted, record AI_PAYMENT_SUCCESS event
    if (updated.paymentStatus === 'successful' && updated.isAiAssisted && updated.aiSessionId) {
      await recordCommerceEvent({
        sessionId: updated.aiSessionId,
        eventType: 'AI_PAYMENT_SUCCESS',
        userId: updated.userId || null,
        orderId: updated.orderId,
        metadata: {
          totalAmount: updated.total,
          attributionType: updated.attributionType,
          itemCount: updated.items.length,
        },
      });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order status.' },
      { status: 500 }
    );
  }
}

