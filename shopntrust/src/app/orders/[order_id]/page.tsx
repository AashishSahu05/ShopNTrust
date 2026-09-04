/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  CreditCard,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';
import { formatPrice } from '@/lib/format';
import { getProductImageUrl } from '@/lib/product-images';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/types';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ order_id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.order_id;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsUnauthorized(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token =
        sessionData.session?.access_token ||
        (user.role === 'customer' && user.profile?.id ? `customer-${user.profile.id}` : undefined);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`, {
        headers,
        cache: 'no-store',
      });

      if (res.status === 403) {
        setIsUnauthorized(true);
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || 'Order not found.');
      }

      setOrder(data.order);
    } catch (err: unknown) {
      console.error('Error fetching order details:', err);
      const msg = err instanceof Error ? err.message : 'Unable to load order details.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, user]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchOrderDetail();
    }
  }, [isAuthLoading, fetchOrderDetail]);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-24 bg-background min-h-[70vh] flex items-center justify-center">
        <Container size="narrow" className="text-center space-y-3">
          <div className="size-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-snt-accent animate-spin">
            <RefreshCw className="size-6" />
          </div>
          <p className="text-sm font-bold text-foreground">Loading order details…</p>
        </Container>
      </div>
    );
  }

  // Unauthorized state (Customer Isolation Guard)
  if (isUnauthorized) {
    return (
      <div className="py-20 md:py-28 bg-background min-h-[70vh] flex items-center">
        <Container size="narrow" className="text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-4 shadow-2xs">
            <ShieldCheck className="size-8" />
          </div>
          <span className="rounded-md bg-rose-50 text-rose-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border border-rose-200">
            Access Restricted
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2">
            Unauthorized Order Access
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You do not have permission to view this order. For customer security, orders can only be accessed by the authenticated purchaser.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              className="bg-[#5B35F5] hover:bg-[#4a26df] text-white font-bold px-6 shadow-sm cursor-pointer"
              render={<Link href="/orders" />}
            >
              <span>Back to My Orders</span>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Not Found / Error state
  if (errorMessage || !order) {
    return (
      <div className="py-20 md:py-28 bg-background min-h-[70vh] flex items-center">
        <Container size="narrow" className="text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 mb-4 shadow-2xs">
            <Package className="size-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Order Not Found</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
            {errorMessage || 'The requested order could not be located in our system.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" render={<Link href="/orders" />}>
              <span>Back to My Orders</span>
            </Button>
            <Button
              className="bg-[#5B35F5] hover:bg-[#4a26df] text-white font-bold px-6 shadow-sm cursor-pointer"
              render={<Link href="/shop" />}
            >
              <span>Explore Store</span>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Status badge
  let statusBadge = (
    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-xs">
      <Clock className="size-3.5" />
      <span>Payment Pending</span>
    </span>
  );

  if (order.paymentStatus === 'successful') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded text-xs">
        <CheckCircle2 className="size-3.5" />
        <span>Paid</span>
      </span>
    );
  } else if (order.paymentStatus === 'failed') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded text-xs">
        <XCircle className="size-3.5" />
        <span>Payment Failed</span>
      </span>
    );
  } else if (order.paymentStatus === 'cancelled') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
        <AlertCircle className="size-3.5" />
        <span>Cancelled</span>
      </span>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="py-8 md:py-14 bg-background min-h-screen">
      <Container size="default" className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="space-y-3 border-b border-border pb-5">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to My Orders</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground">Order Reference</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
                {order.orderId}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Placed on {formattedDate}</p>
            </div>
            <div className="self-start sm:self-auto">{statusBadge}</div>
          </div>
        </div>

        {/* Order Content Card */}
        <div className="space-y-6">
          {/* 1. Itemized Purchased Products */}
          <div className="rounded-3xl border border-slate-200/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <Package className="size-4 text-indigo-600" />
                <span>Purchased Products ({order.items.reduce((sum, i) => sum + i.quantity, 0)} units)</span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {order.items.map((item, idx) => {
                const unitPrice = item.selectedVariant?.price ?? item.product?.price ?? 0;
                const itemTotal = unitPrice * item.quantity;
                const img = getProductImageUrl(item.product?.product_id || '') || item.product?.image || '/images/products/P101.jpg';

                return (
                  <div key={idx} className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative size-14 shrink-0 rounded-2xl border border-border bg-white overflow-hidden">
                        <Image
                          src={img}
                          alt={item.product?.name || 'Product'}
                          fill
                          className="object-contain p-1.5"
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.product?.product_id}`}
                          className="font-bold text-foreground hover:text-[#5B35F5] transition-colors truncate block max-w-[240px] sm:max-w-md"
                        >
                          {item.product?.name || 'Product'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          {item.selectedVariant && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-700">
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
                      <span className="font-mono font-black text-foreground text-sm">
                        {formatPrice(itemTotal, order.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Order Summary & Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Delivery Info */}
            <div className="rounded-3xl border border-slate-200/80 bg-card p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <MapPin className="size-4 text-indigo-600" />
                <span>Delivery Information</span>
              </div>
              <div className="space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground">{order.customerInfo?.name || 'Valued Customer'}</p>
                <p>{order.customerInfo?.email}</p>
                {order.customerInfo?.phone && <p>{order.customerInfo.phone}</p>}
                {order.customerInfo?.address && (
                  <p className="pt-1">
                    {order.customerInfo.address}
                    {order.customerInfo.city ? `, ${order.customerInfo.city}` : ''}
                    {order.customerInfo.state ? `, ${order.customerInfo.state}` : ''}
                    {order.customerInfo.pincode ? ` - ${order.customerInfo.pincode}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-3xl border border-slate-200/80 bg-card p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <CreditCard className="size-4 text-indigo-600" />
                <span>Payment Summary</span>
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatPrice(order.total, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-600 uppercase text-[11px] font-bold">Free</span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-2">
                  <span className="font-bold text-foreground text-sm">Grand Total</span>
                  <span className="font-mono font-black text-foreground text-base">
                    {formatPrice(order.total, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI Attribution Indicator if present */}
          {order.isAiAssisted && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-indigo-600" />
                <span className="font-bold text-indigo-950">AI Commerce Attribution</span>
              </div>
              <span className="rounded-md bg-white border border-indigo-200 px-2 py-0.5 font-bold text-indigo-700 text-[11px] uppercase">
                {order.attributionType || 'AI Assisted'}
              </span>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
