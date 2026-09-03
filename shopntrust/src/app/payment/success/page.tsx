// ============================================================
// ShopNTrust — Payment Success & Order Confirmation (/payment/success)
// ============================================================
// Phase 9: Authoritative payment reconciliation, real order details
// display, cart clearance on confirmed payment, and attribution sync.
// ============================================================

'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ShoppingBag,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useCart } from '@/store/cart-context';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/types';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

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

          // Clear Bag ONLY upon confirmed successful payment
          if (
            data.order.paymentStatus === 'successful' &&
            !cartClearedRef.current
          ) {
            cartClearedRef.current = true;
            clearCart();
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
    [searchParams, clearCart]
  );

  useEffect(() => {
    if (resolvedOrderId) {
      reconcileOrder(resolvedOrderId);
    } else {
      setIsLoading(false);
    }
  }, [resolvedOrderId, reconcileOrder]);

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
            Payment Pending
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-3">
            Your payment is being verified
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            We have received your transaction request and are waiting for confirmation from Razorpay.
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
              <span className="font-bold text-amber-600">Pending Verification</span>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Button
              onClick={() => resolvedOrderId && reconcileOrder(resolvedOrderId)}
              disabled={isVerifying}
              className="gap-2 cursor-pointer"
            >
              <RefreshCw className={`size-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </Button>
            <Button variant="outline" render={<Link href="/cart" />}>
              Return to Bag
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Payment is Successful state
  return (
    <div className="py-16 md:py-24 bg-background min-h-screen flex items-center">
      <Container size="narrow" className="text-center">
        <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-5 shadow-2xs">
          <CheckCircle2 className="size-8" />
        </div>
        <span className="rounded-md bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border border-emerald-200">
          Payment Verified
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-3">
          Order Placed Successfully
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Thank you for shopping with ShopNTrust. Your order has been confirmed and logged in our system.
        </p>

        {/* Authoritative Order Details Card */}
        <div className="mt-6 p-5 rounded-2xl bg-card border border-border text-xs max-w-md mx-auto space-y-3 text-left shadow-xs">
          <div className="flex justify-between items-center border-b border-border pb-2.5">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-black text-foreground text-sm">
              {order?.orderId || resolvedOrderId || 'ORD-CONFIRMED'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-mono font-black text-foreground text-base">
              {order ? formatPrice(order.total, order.currency) : '₹0.00'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Payment Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
              <CheckCircle2 className="size-3" />
              <span>Paid</span>
            </span>
          </div>

          {order?.isAiAssisted && (
            <div className="flex justify-between items-center pt-2 border-t border-border/80">
              <span className="text-indigo-700 font-semibold flex items-center gap-1">
                <Sparkles className="size-3" />
                <span>AI Commerce Attribution</span>
              </span>
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px] uppercase">
                {order.attributionType || 'AI Recommendation'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Button
            size="lg"
            className="bg-snt-accent hover:bg-snt-accent-hover text-white font-bold px-6 shadow-sm cursor-pointer gap-2"
            render={<Link href="/shop" />}
          >
            <ShoppingBag className="size-4" />
            <span>Continue Shopping</span>
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/" />}>
            Home
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
