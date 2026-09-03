// ============================================================
// ShopNTrust — Realistic Product Card (Amazon / E-Commerce Grade)
// ============================================================
// Real product photography, crisp white/studio presentation,
// bold INR pricing, genuine ratings, and fast Add-to-Cart.
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingBag, Check, ArrowRight, Trash2, Minus, Plus } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useCart, getCartItemKey } from '@/store/cart-context';
import { getProductImageUrl } from '@/lib/product-images';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
  showQuickAdd?: boolean;
}

export function ProductCard({
  product,
  className,
  showQuickAdd = true,
}: ProductCardProps) {
  const { addItem, isInCart, getQuantity, updateQuantity } = useCart();
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = getProductImageUrl(product.product_id);
  const inCart = isInCart(product.product_id);
  const currentQty = getQuantity(product.product_id);
  const itemKey = getCartItemKey(product.product_id, product.variants?.[0]?.variant_id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultVariant =
      product.variants && product.variants.length > 0
        ? product.variants[0]
        : undefined;

    addItem(product, defaultVariant, 1, 'manual');
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-snt-accent/40 hover:shadow-xl hover:shadow-snt-accent/5',
        className
      )}
    >
      <Link
        href={`/product/${product.product_id}`}
        className="flex flex-1 flex-col"
      >
        {/* Real Product Image Showcase */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50/70 border-b border-border/40 p-4 flex items-center justify-center">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="size-10 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 mb-1.5 border border-slate-200/60">
                <ShoppingBag className="size-5 text-slate-400" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">Image Reference Pending</span>
              <span className="text-[10px] text-slate-300 font-mono">{product.product_id}</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span className="inline-flex items-center rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-xs border border-slate-200/60 backdrop-blur-xs">
              {product.brand || product.categoryDisplay || product.category}
            </span>
            {product.variants && product.variants.length > 0 && (
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-snt-accent border border-indigo-200/60">
                {product.variants.length} tiers
              </span>
            )}
          </div>

          {/* Stock status indicator */}
          <div className="absolute top-3 right-3 z-10">
            {product.stockStatus === 'low_stock' ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                Low stock
              </span>
            ) : product.stockStatus === 'out_of_stock' ? (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200">
                Out of stock
              </span>
            ) : null}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-4.5">
          {/* Name & ID */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-snug text-foreground group-hover:text-snt-accent transition-colors line-clamp-1">
              {product.name}
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground font-medium shrink-0 bg-secondary/80 px-1.5 py-0.5 rounded">
              {product.product_id}
            </span>
          </div>

          {/* Description */}
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Verified Rating & Delivery */}
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            {product.rating !== undefined ? (
              <div className="flex items-center gap-1 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-100">
                <Star className="size-3 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-slate-800 text-[11px]">{product.rating.toFixed(1)}</span>
                {product.reviewCount !== undefined && (
                  <span className="text-[10px] text-muted-foreground">
                    ({product.reviewCount})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground/80">
                {product.subCategory || 'Official Catalog'}
              </span>
            )}

            {product.deliveryEstimate && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                ⚡ {product.deliveryEstimate}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Card Action & Price Row */}
      <div className="flex items-center justify-between border-t border-border/60 bg-secondary/30 px-4.5 py-3">
        <div>
          {product.price > 0 ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-foreground tracking-tight">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.mrp, product.currency)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">
              Official Item
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showQuickAdd && product.price > 0 && product.stockStatus !== 'out_of_stock' && (
            <>
              {inCart && !addedAnimation ? (
                /* ── Quantity Stepper (replaces Add button once in cart) ── */
                <div className="flex items-center h-8 rounded-lg border border-snt-accent/30 bg-snt-accent/5 overflow-hidden">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(itemKey, currentQty - 1); }}
                    className="flex items-center justify-center h-full px-2 text-snt-accent hover:bg-snt-accent/10 transition-colors cursor-pointer"
                    title={currentQty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                  >
                    {currentQty <= 1 ? <Trash2 className="size-3" /> : <Minus className="size-3" />}
                  </button>
                  <span className="flex items-center justify-center h-full px-2 text-xs font-extrabold text-snt-accent font-mono min-w-[24px] select-none">
                    {currentQty}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(itemKey, currentQty + 1); }}
                    className="flex items-center justify-center h-full px-2 text-snt-accent hover:bg-snt-accent/10 transition-colors cursor-pointer"
                    title="Increase quantity"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              ) : (
                /* ── Add / Added Button ── */
                <Button
                  size="sm"
                  variant={addedAnimation ? 'default' : 'default'}
                  onClick={handleQuickAdd}
                  className={cn(
                    'h-8 px-3 text-xs font-semibold transition-all shadow-xs gap-1.5 cursor-pointer',
                    addedAnimation
                      ? 'bg-snt-success text-white border-snt-success'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                  )}
                  aria-label={`Add ${product.name} to cart`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          <Link
            href={`/product/${product.product_id}`}
            className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-card text-muted-foreground hover:border-snt-accent/40 hover:text-snt-accent transition-colors shadow-xs"
            aria-label={`View ${product.name}`}
          >
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
