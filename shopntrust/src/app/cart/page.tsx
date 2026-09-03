// ============================================================
// ShopNTrust — Shopping Bag (/cart)
// ============================================================
// Phase 3 Hardened: Variant-aware cart rendering, canonical pricing,
// reliable quantity controls [1..10], line subtotal, and checkout flow.
// ============================================================

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Sparkles,
  Tag,
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

export default function CartPage() {
  const router = useRouter();
  const { isMerchant } = useAuth();
  const { state, summary, updateQuantity, removeItem, clearCart } = useCart();

  // Role Guard: Merchants are isolated from customer cart
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  if (isMerchant) {
    return null;
  }

  if (state.items.length === 0) {
    return (
      <div className="py-20 md:py-28 bg-background min-h-[75vh] flex items-center">
        <Container size="narrow" className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex size-20 mx-auto items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100/80 shadow-xs">
              <ShoppingBag className="size-10 text-snt-accent" />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Your shopping bag is empty
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Discover authentic smartphones, smart wearables, personal audio, and wellness essentials directly from our canonical catalog.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="h-12 bg-snt-accent hover:bg-snt-accent-hover text-white font-bold px-7 shadow-sm cursor-pointer gap-2"
                render={<Link href="/shop" />}
              >
                <span>Explore Storefront</span>
                <ArrowRight className="size-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 border-border/90 bg-card hover:bg-secondary font-semibold px-6 cursor-pointer gap-2"
                render={<Link href="/ai-shop" />}
              >
                <Sparkles className="size-4 text-snt-accent" />
                <span>Ask AI Shopping Assistant</span>
              </Button>
            </div>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 bg-background min-h-screen">
      <Container>
        {/* Header with Breadcrumb & Clear Action */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/shop" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ArrowLeft className="size-3" />
                <span>Continue Shopping</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Shopping Bag ({summary.totalQuantity} {summary.totalQuantity === 1 ? 'item' : 'items'})
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review your items and configuration before proceeding to checkout.
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer self-start sm:self-auto"
            aria-label="Clear all items from bag"
          >
            Clear Entire Bag
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence>
              {state.items.map((item) => {
                const canonical = getProductById(item.product.product_id) || item.product;
                const itemKey = getCartItemKey(
                  canonical.product_id,
                  item.selectedVariant?.variant_id
                );
                const unitPrice = item.selectedVariant?.price ?? canonical.price;
                const unitMrp = item.selectedVariant?.mrp ?? canonical.mrp;
                const lineTotal = unitPrice * item.quantity;
                const imageUrl = getProductImageUrl(canonical.product_id);

                return (
                  <motion.div
                    key={itemKey}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_4px_16px_-4px_rgba(15,23,42,0.03)] hover:border-slate-300 transition-all"
                  >
                    {/* Thumbnail & Product Details */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Link
                        href={`/product/${canonical.product_id}`}
                        className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/60 p-2 flex items-center justify-center group shadow-2xs"
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={canonical.name}
                            fill
                            className="object-contain p-1.5 transition-transform group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex size-full flex-col items-center justify-center bg-slate-100 text-slate-400 p-1 text-center">
                            <ShoppingBag className="size-6 text-slate-400 mb-0.5" />
                            <span className="text-[8px] font-mono text-slate-400">ID: {canonical.product_id}</span>
                          </div>
                        )}
                      </Link>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded shadow-2xs">
                            {canonical.brand || canonical.category}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                            {canonical.product_id}
                          </span>
                        </div>

                        <Link
                          href={`/product/${canonical.product_id}`}
                          className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate"
                        >
                          {canonical.name}
                        </Link>

                        {item.selectedVariant && (
                          <div className="flex items-center gap-1">
                            <Tag className="size-3 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              Config: {item.selectedVariant.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2 pt-0.5">
                          <span className="text-xs font-extrabold text-slate-900 font-mono">
                            {formatPrice(unitPrice, canonical.currency)}
                          </span>
                          {unitMrp && unitMrp > unitPrice && (
                            <span className="text-[11px] text-slate-400 line-through font-mono">
                              {formatPrice(unitMrp, canonical.currency)}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            each
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper, Line Total & Remove Action */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Stepper with Bounds [1..10] */}
                      <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-50/60 p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <span className="text-base font-extrabold text-slate-900 min-w-[90px] text-right font-mono">
                        {formatPrice(lineTotal, canonical.currency)}
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(itemKey)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        aria-label={`Remove ${canonical.name} from bag`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] space-y-5">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal ({summary.totalQuantity} {summary.totalQuantity === 1 ? 'item' : 'items'})</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatPrice(summary.subtotal, summary.currency)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Standard Delivery</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Taxes (GST Included)</span>
                  <span className="font-semibold text-slate-900">₹0.00</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                    {formatPrice(summary.subtotal, summary.currency)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold shadow-md shadow-indigo-600/20 gap-2 cursor-pointer rounded-xl"
                render={<Link href="/checkout" />}
              >
                <Lock className="size-4" />
                <span>Proceed to Checkout</span>
                <ArrowRight className="size-4" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground text-center">
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                <span>Protected by Razorpay Checkout Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
