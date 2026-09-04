/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  RefreshCw,
  User,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';
import { formatPrice } from '@/lib/format';
import { getProductImageUrl } from '@/lib/product-images';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/types';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'paid' | 'pending' | 'failed';

export default function MyOrdersPage() {
  const { user, isCustomer, isGuest, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchCustomerOrders = useCallback(async () => {
    if (!isCustomer || user.role !== 'customer') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token =
        sessionData.session?.access_token ||
        (user.profile?.id ? `customer-${user.profile.id}` : 'demo-customer');

      const res = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load your order history.');
      }

      setOrders(data.orders || []);
    } catch (err: unknown) {
      console.error('Error fetching customer orders:', err);
      setError('Unable to load order history right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isCustomer, user]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchCustomerOrders();
    }
  }, [isAuthLoading, fetchCustomerOrders]);

  // Guest State: prompt customer sign in
  if (!isAuthLoading && isGuest) {
    return (
      <div className="py-20 md:py-28 bg-background min-h-[75vh] flex items-center">
        <Container size="narrow" className="text-center">
          <div className="flex size-20 mx-auto items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 mb-5 shadow-xs">
            <User className="size-10 text-snt-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Sign In to View Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Please sign in to your ShopNTrust account to view your confirmed purchases, order statuses, and receipts.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button
              size="lg"
              onClick={openAuthModal}
              className="bg-[#5B35F5] hover:bg-[#4a26df] text-white font-bold px-7 shadow-sm cursor-pointer gap-2"
            >
              <User className="size-4" />
              <span>Sign In / Register</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-bold px-6 cursor-pointer gap-2"
              render={<Link href="/shop" />}
            >
              <span>Explore Catalog</span>
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // Filter orders according to active tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'paid') return o.paymentStatus === 'successful';
    if (activeTab === 'pending') return o.paymentStatus === 'pending';
    if (activeTab === 'failed') return o.paymentStatus === 'failed' || o.paymentStatus === 'cancelled';
    return true;
  });

  return (
    <div className="py-8 md:py-14 bg-background min-h-screen">
      <Container size="default" className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-indigo-50 text-snt-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                Customer Account
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Orders
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review your purchase history, transaction statuses, and itemized receipts.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomerOrders}
            disabled={isLoading}
            className="self-start sm:self-auto gap-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {(
            [
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'paid', label: 'Paid', count: orders.filter((o) => o.paymentStatus === 'successful').length },
              { id: 'pending', label: 'Pending', count: orders.filter((o) => o.paymentStatus === 'pending').length },
              {
                id: 'failed',
                label: 'Failed / Cancelled',
                count: orders.filter((o) => o.paymentStatus === 'failed' || o.paymentStatus === 'cancelled').length,
              },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-[#5B35F5] text-white shadow-2xs'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-3xl border border-border bg-card p-6 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                </div>
                <div className="h-8 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6 text-center text-xs space-y-2">
            <AlertCircle className="size-6 text-rose-600 mx-auto" />
            <p className="font-bold text-rose-900">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchCustomerOrders} className="cursor-pointer">
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card p-8">
            <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-indigo-50 text-[#5B35F5] border border-indigo-100 mb-4 shadow-2xs">
              <Package className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {activeTab === 'all'
                ? 'When you complete purchases, your order history and live status tracking will be displayed here.'
                : `There are currently no orders in the ${activeTab} category.`}
            </p>
            <div className="mt-6">
              <Button
                className="bg-[#5B35F5] hover:bg-[#4a26df] text-white font-bold px-6 shadow-sm cursor-pointer gap-2"
                render={<Link href="/shop" />}
              >
                <ShoppingBag className="size-4" />
                <span>Start Shopping</span>
              </Button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              // Status badge configuration
              let statusBadge = (
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                  <Clock className="size-3" />
                  <span>Pending</span>
                </span>
              );

              if (order.paymentStatus === 'successful') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    <CheckCircle2 className="size-3" />
                    <span>Paid</span>
                  </span>
                );
              } else if (order.paymentStatus === 'failed') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                    <XCircle className="size-3" />
                    <span>Failed</span>
                  </span>
                );
              } else if (order.paymentStatus === 'cancelled') {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                    <AlertCircle className="size-3" />
                    <span>Cancelled</span>
                  </span>
                );
              }

              return (
                <div
                  key={order.orderId}
                  className="rounded-3xl border border-slate-200/80 bg-card p-5 sm:p-6 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Top Bar: Order ID, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5 text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Order ID</span>
                        <span className="font-mono font-black text-foreground text-xs sm:text-sm">
                          {order.orderId}
                        </span>
                      </div>
                      <div className="hidden sm:block h-6 w-px bg-border" />
                      <div className="hidden sm:block">
                        <span className="text-muted-foreground block text-[10px]">Date Placed</span>
                        <span className="font-bold text-foreground text-xs">{formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {statusBadge}
                      {order.isAiAssisted && (
                        <span className="hidden sm:inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px] uppercase">
                          <Sparkles className="size-3" />
                          <span>AI</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Bar: Products Preview & Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Products Thumbnail Strip */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {(order.items || []).slice(0, 4).map((item, idx) => {
                        const img = getProductImageUrl(item.product?.product_id || '') || item.product?.image || '/images/products/P101.jpg';
                        return (
                          <div
                            key={idx}
                            className="relative size-12 shrink-0 rounded-xl border border-border bg-white overflow-hidden"
                            title={item.product?.name}
                          >
                            <Image
                              src={img}
                              alt={item.product?.name || 'Product'}
                              fill
                              className="object-contain p-1"
                              sizes="48px"
                            />
                            {item.quantity > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 rounded-full bg-slate-900/85 text-white text-[9px] font-bold px-1 leading-tight">
                                ×{item.quantity}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {(order.items?.length || 0) > 4 && (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-secondary text-muted-foreground font-bold text-xs">
                          +{(order.items?.length || 0) - 4}
                        </div>
                      )}
                      <div className="ml-2 text-xs">
                        <p className="font-bold text-foreground">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                          {order.items?.map((i) => i.product?.name).filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Total & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-muted-foreground block">Total Amount</span>
                        <span className="font-mono font-black text-foreground text-sm sm:text-base">
                          {formatPrice(order.total, order.currency)}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 font-bold cursor-pointer hover:border-[#5B35F5] hover:text-[#5B35F5]"
                        render={<Link href={`/orders/${order.orderId}`} />}
                      >
                        <span>View Details</span>
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
