// ============================================================
// ShopNTrust — Payment Failed Feedback (/payment/failed)
// ============================================================
// Phase 9: Clean transaction failure feedback, order reference,
// safe retry options, and zero premature cart clearing.
// ============================================================

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/types';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const id =
      searchParams.get('orderId') ||
      searchParams.get('order_id') ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('snt_active_order_id') : null);

    if (id) {
      setOrderId(id);
      fetch(`/api/orders?orderId=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setOrder(data.order);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  return (
    <div className="py-16 md:py-24 bg-background min-h-screen flex items-center">
      <Container size="narrow" className="text-center">
        <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-5 shadow-2xs">
          <XCircle className="size-8" />
        </div>
        <span className="rounded-md bg-rose-50 text-rose-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border border-rose-200">
          Transaction Incomplete
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-3">
          Payment Was Not Completed
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          The transaction could not be processed. No funds were debited from your account. Your shopping bag has been preserved.
        </p>

        {orderId && (
          <div className="mt-6 p-4 rounded-2xl bg-card border border-border text-xs max-w-sm mx-auto space-y-2 text-left shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Reference:</span>
              <span className="font-mono font-bold text-foreground">{orderId}</span>
            </div>
            {order && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Attempted Amount:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatPrice(order.total, order.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-bold text-rose-600">Failed / Cancelled</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-snt-accent hover:bg-snt-accent-hover text-white font-bold px-6 shadow-sm cursor-pointer gap-2"
            render={<Link href="/checkout" />}
          >
            <RefreshCw className="size-4" />
            <span>Retry Checkout</span>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold px-5 cursor-pointer" render={<Link href="/cart" />}>
            <ShoppingBag className="size-4 mr-1.5" />
            <span>Back to Bag</span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto text-xs font-semibold px-4 cursor-pointer gap-1.5"
            render={<Link href="/" />}
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Website</span>
          </Button>
        </div>
      </Container>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 bg-background min-h-[70vh] flex items-center justify-center">
          <p className="text-sm font-bold text-foreground">Loading payment status…</p>
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
