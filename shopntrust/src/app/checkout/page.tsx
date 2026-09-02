// ============================================================
// ShopNTrust — Express Checkout (/checkout)
// ============================================================
// Phase 3 Hardened: Connected to authoritative cart state, empty cart
// guard, itemized checkout summary, and customer context.
// ============================================================

'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  CreditCard,
  Truck,
  ArrowLeft,
  Lock,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useCart, getCartItemKey } from '@/store/cart-context';
import { useAuth } from '@/store/auth-context';
import { formatPrice } from '@/lib/format';
import { getProductImageUrl } from '@/lib/product-images';
import { getProductById } from '@/lib/catalog';

export default function CheckoutPage() {
  const router = useRouter();
  const { state, summary } = useCart();
  const { customerProfile, isCustomer, isMerchant } = useAuth();

  // Role Guard: Merchants are isolated from checkout
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  if (isMerchant) {
    return null;
  }

  // Empty cart guard
  if (state.items.length === 0) {
    return (
      <div className="py-20 md:py-28 bg-background min-h-[70vh] flex items-center">
        <Container size="narrow" className="text-center">
          <div className="flex size-20 mx-auto items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 mb-5 shadow-xs">
            <ShoppingBag className="size-10 text-snt-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Your shopping bag is empty
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Please add items to your shopping bag before proceeding to express checkout.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="bg-snt-accent hover:bg-snt-accent-hover text-white font-bold px-7 shadow-sm cursor-pointer gap-2"
              render={<Link href="/shop" />}
            >
              <span>Explore Storefront Catalog</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-14 bg-background min-h-screen">
      <Container size="default">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-indigo-50 text-snt-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                Phase 3 Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Express Checkout
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review order items, delivery information, and payment method.
            </p>
          </div>

          <Button variant="ghost" size="sm" render={<Link href="/cart" />} className="cursor-pointer">
            <ArrowLeft className="size-4 mr-1" />
            Back to Bag
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Details & Items */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Itemized Cart Summary */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <ShoppingBag className="size-4 text-snt-accent" />
                  <span>1. Order Items ({summary.totalQuantity} units)</span>
                </div>
                <Link href="/cart" className="text-xs font-semibold text-snt-accent hover:underline">
                  Edit Bag
                </Link>
              </div>

              <div className="divide-y divide-border/80">
                {state.items.map((item) => {
                  const canonical = getProductById(item.product.product_id) || item.product;
                  const itemKey = getCartItemKey(
                    canonical.product_id,
                    item.selectedVariant?.variant_id
                  );
                  const unitPrice = item.selectedVariant?.price ?? canonical.price;
                  const lineTotal = unitPrice * item.quantity;
                  const imageUrl = getProductImageUrl(canonical.product_id);

                  return (
                    <div key={itemKey} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative size-12 shrink-0 rounded-lg bg-slate-50 border border-border p-1 overflow-hidden">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={canonical.name}
                              fill
                              className="object-contain p-0.5"
                              unoptimized
                            />
                          ) : (
                            <ShoppingBag className="size-5 text-slate-400 m-auto" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{canonical.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            {item.selectedVariant && (
                              <span className="text-snt-accent font-semibold">{item.selectedVariant.name} • </span>
                            )}
                            <span>Qty: {item.quantity} × {formatPrice(unitPrice, canonical.currency)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold font-mono text-foreground shrink-0 text-sm">
                        {formatPrice(lineTotal, canonical.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Contact & Shipping Address */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
                <Truck className="size-4 text-snt-accent" />
                <span>2. Shipping & Contact Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    disabled
                    value={isCustomer && customerProfile?.name ? customerProfile.name : 'Demo Customer'}
                    className="w-full h-9 rounded-xl border border-border bg-secondary/50 px-3 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={isCustomer && customerProfile?.email ? customerProfile.email : 'customer@example.com'}
                    className="w-full h-9 rounded-xl border border-border bg-secondary/50 px-3 text-slate-800 font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Delivery Address</label>
                  <input
                    type="text"
                    disabled
                    value="Plot 42, Tech Park Avenue, Bengaluru, Karnataka - 560001"
                    className="w-full h-9 rounded-xl border border-border bg-secondary/50 px-3 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method Preparation */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground border-b border-border pb-3">
                <CreditCard className="size-4 text-snt-accent" />
                <span>3. Payment Gateway Architecture (Razorpay Activation in Phase 5)</span>
              </div>

              <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Razorpay Standard Checkout Flow</span>
                  <span className="text-[10px] font-mono bg-indigo-100 text-snt-accent px-2 py-0.5 rounded font-bold">
                    UPI / Cards / NetBanking
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Real payment tokenization, server order generation, and signature verification will be fully connected in Phase 5.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-foreground border-b border-border pb-3">
                Order Summary
              </h2>

              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span className="font-bold text-foreground">{summary.totalQuantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground font-mono">
                    {formatPrice(summary.subtotal, summary.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Delivery Charge</span>
                  <span className="font-bold">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (GST Inclusive)</span>
                  <span className="font-semibold text-foreground">₹0.00</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Total Payable</span>
                <span className="text-2xl font-black text-foreground font-mono">
                  {formatPrice(summary.subtotal, summary.currency)}
                </span>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 leading-relaxed">
                <p className="font-bold mb-0.5">Phase 3 Preparation Shell</p>
                <span>Live payment transaction processing is scheduled for Phase 5 integration.</span>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="size-3.5 text-emerald-600" />
                <span>256-bit Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
