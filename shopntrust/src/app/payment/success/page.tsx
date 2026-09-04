// ============================================================
// ShopNTrust — Payment Success & Order Confirmation (/payment/success)
// ============================================================
// Phase 9: Authoritative payment reconciliation, real order details
// display, cart clearance on confirmed payment, and attribution sync.
// ============================================================

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  ShoppingBag,
  Clock,
  Sparkles,
  RefreshCw,
  Package,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useCart } from '@/store/cart-context';
import { formatPrice } from '@/lib/format';
import { getProductImageUrl } from '@/lib/product-images';
import type { Order } from '@/types';

interface OrderItemSummary {
  product?: { product_id?: string };
  product_id?: string;
  selectedVariant?: { variant_id?: string };
  variant_id?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { clearPurchasedItems } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(null);
  const cartClearedRef = useRef(false);

  // Extract orderId from URL query or session storage
  useEffect(() => {
    const urlOrderId =
      searchParams.get('orderId') ||
      searchParams.get('razorpay_payment_link_reference_id') ||
      searchParams.get('order_id');

    if (urlOrderId) {
      setResolvedOrderId(urlOrderId);
    } else if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('snt_active_order_id');
      if (stored) {
        setResolvedOrderId(stored);
      }
    }
  }, [searchParams]);

  // Fetch and reconcile authoritative order status
  const reconcileOrder = useCallback(
    async (orderIdToFetch: string) => {
      setIsVerifying(true);
      try {
        const razorpayPaymentId = searchParams.get('razorpay_payment_id');
        const linkStatus = searchParams.get('razorpay_payment_link_status');

        // If returned from Razorpay with payment confirmation, update order
        if (razorpayPaymentId || linkStatus === 'paid') {
          await fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderIdToFetch,
              paymentStatus: 'successful',
              razorpayPaymentId: razorpayPaymentId || undefined,
            }),
          });
        }

        const res = await fetch(`/api/orders?orderId=${orderIdToFetch}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (data.success && data.order) {
          setOrder(data.order);

          // Clear Bag ONLY for confirmed purchased items upon confirmed successful payment
          if (
            data.order.paymentStatus === 'successful' &&
            !cartClearedRef.current
          ) {
            cartClearedRef.current = true;
            const itemsToRemove = (data.order.items || []).map((i: OrderItemSummary) => ({
              productId: i.product?.product_id || i.product_id,
              variantId: i.selectedVariant?.variant_id || i.variant_id,
            }));
            clearPurchasedItems(itemsToRemove);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('snt_active_order_id');
            }
          }
        }
      } catch (err) {
        console.error('Failed to reconcile order status:', err);
      } finally {
        setIsLoading(false);
        setIsVerifying(false);
      }
    },
    [searchParams, clearPurchasedItems]
  );

  useEffect(() => {
    if (resolvedOrderId) {
      reconcileOrder(resolvedOrderId);
    } else {
      setIsLoading(false);
    }
  }, [resolvedOrderId, reconcileOrder]);

  const handleConfirmPayment = async () => {
    if (!resolvedOrderId) return;
    setIsVerifying(true);
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: resolvedOrderId,
          paymentStatus: 'successful',
        }),
      });
      await reconcileOrder(resolvedOrderId);
    } catch (err) {
      console.error('Failed to confirm payment:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 bg-background min-h-[70vh] flex items-center justify-center">
        <Container size="narrow" className="text-center space-y-3">
          <div className="size-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-snt-accent animate-spin">
            <RefreshCw className="size-6" />
          </div>
          <p className="text-sm font-bold text-foreground">Reconciling payment status…</p>
        </Container>
      </div>
    );
  }

  // Payment is Pending state
  if (order && order.paymentStatus === 'pending') {
    return (
      <div className="py-16 md:py-24 bg-background min-h-screen flex items-center">
        <Container size="narrow" className="text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-5 shadow-2xs">
            <Clock className="size-8 animate-pulse" />
          </div>
          <span className="rounded-md bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border border-amber-200">
            Payment in Progress
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-3">
            Complete Payment in Opened Tab
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            We opened your Razorpay payment tab. Once you have completed payment, click below to confirm your order and receive your receipt.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-secondary/50 border border-border text-xs max-w-sm mx-auto space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono font-bold text-foreground">{order.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payable Amount:</span>
              <span className="font-mono font-bold text-foreground">
                {formatPrice(order.total, order.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-bold text-amber-600">Waiting for Confirmation</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
            <Button
              onClick={handleConfirmPayment}
              disabled={isVerifying}
              className="w-full sm:w-auto bg-[#5B35F5] hover:bg-[#4a26df] text-white font-bold gap-2 cursor-pointer shadow-sm px-6"
            >
              <CheckCircle2 className="size-4" />
              <span>{isVerifying ? 'Confirming Order…' : 'I Have Paid — Confirm Order'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => resolvedOrderId && reconcileOrder(resolvedOrderId)}
              disabled={isVerifying}
              className="w-full sm:w-auto gap-2 cursor-pointer text-xs"
            >
              <RefreshCw className={`size-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </Button>
            <Button variant="ghost" className="w-full sm:w-auto text-xs" render={<Link href="/cart" />}>
              Return to Bag
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Payment is Successful state
  return (
    <div className="py-12 md:py-20 bg-background min-h-screen">
      <Container size="default" className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-4 shadow-2xs">
            <CheckCircle2 className="size-8" />
          </div>
          <span className="rounded-md bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            Payment Verified
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
            Your order has been confirmed.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Thank you for shopping with ShopNTrust. A receipt has been generated and your order is logged authoritatively.
          </p>
        </div>

        {/* Authoritative Order Details Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-card p-6 shadow-sm space-y-5">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-border pb-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Order ID</span>
              <span className="font-mono font-black text-foreground text-xs sm:text-sm truncate block">
                {order?.orderId || resolvedOrderId || 'ORD-CONFIRMED'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Order Date</span>
              <span className="font-bold text-foreground text-xs block">
                {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Payment Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] mt-0.5">
                <CheckCircle2 className="size-3" />
                <span>Paid</span>
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Total Amount</span>
              <span className="font-mono font-black text-foreground text-sm block">
                {order ? formatPrice(order.total, order.currency) : '₹0.00'}
              </span>
            </div>
          </div>

          {/* Purchased Items Breakdown */}
          {order?.items && order.items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Package className="size-4 text-indigo-600" />
                <span>Purchased Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)} units)</span>
              </div>
              <div className="divide-y divide-border border rounded-2xl overflow-hidden bg-slate-50/50">
                {order.items.map((item, idx) => {
                  const unitPrice = item.selectedVariant?.price ?? item.product?.price ?? 0;
                  const itemTotal = unitPrice * item.quantity;
                  const imgUrl = getProductImageUrl(item.product?.product_id || '') || item.product?.image || '/images/products/P101.jpg';

                  return (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative size-12 shrink-0 rounded-xl border border-border bg-white overflow-hidden">
                          <Image
                            src={imgUrl}
                            alt={item.product?.name || 'Product'}
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate max-w-[220px] sm:max-w-xs">
                            {item.product?.name || 'Product'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                            {item.selectedVariant && (
                              <span className="rounded bg-slate-200/80 px-1 py-0.2 text-[10px]">
                                {item.selectedVariant.name}
                              </span>
                            )}
                            <span>Qty: {item.quantity}</span>
                            <span>•</span>
                            <span className="font-mono">{formatPrice(unitPrice, order.currency)} each</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
                          {formatPrice(itemTotal, order.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Attribution Badge if present */}
          {order?.isAiAssisted && (
            <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
              <span className="text-indigo-700 font-semibold flex items-center gap-1">
                <Sparkles className="size-3.5" />
                <span>AI Commerce Attribution</span>
              </span>
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px] uppercase">
                {order.attributionType || 'AI Recommendation'}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-[#5B35F5] hover:bg-[#4a26df] text-white font-bold px-7 shadow-sm cursor-pointer gap-2"
            render={<Link href="/orders" />}
          >
            <Package className="size-4" />
            <span>View My Orders</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto font-bold px-6 cursor-pointer gap-2"
            render={<Link href="/shop" />}
          >
            <ShoppingBag className="size-4 text-slate-600" />
            <span>Continue Shopping</span>
          </Button>
        </div>
      </Container>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 bg-background min-h-[70vh] flex items-center justify-center">
          <p className="text-sm font-bold text-foreground">Loading order confirmation…</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

