// ============================================================
// ShopNTrust — Futuristic AI-Commerce Product Card
// ============================================================
// High-end technology brand aesthetic with clean studio presentation,
// genuine product photography, bold INR pricing, and frictionless
// Quick Add to Bag micro-interactions.
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingBag, Check, ArrowRight, Trash2, Minus, Plus, Zap, Flame } from 'lucide-react';
import type { Product, AddedVia } from '@/types';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useCart, getCartItemKey } from '@/store/cart-context';
import { useCampaigns } from '@/store/campaign-context';
import { getProductImageUrl } from '@/lib/product-images';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
  showQuickAdd?: boolean;
  addedVia?: AddedVia;
  campaignDiscount?: number;
}

export function ProductCard({
  product,
  className,
  showQuickAdd = true,
  addedVia = 'manual',
  campaignDiscount,
}: ProductCardProps) {
  const { addItem, isInCart, getQuantity, updateQuantity } = useCart();
  const { getCampaignForProduct } = useCampaigns();
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imageError, setImageError] = useState(false);

  const campaignInfo = getCampaignForProduct(product.product_id);
  const activeCampaignDiscount = campaignDiscount ?? campaignInfo?.discountPercent;

  const imageUrl = getProductImageUrl(product.product_id);
  const inCart = isInCart(product.product_id);
  const currentQty = getQuantity(product.product_id);
  const itemKey = getCartItemKey(product.product_id, product.variants?.[0]?.variant_id);

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

  const keyFeature =
    product.featuresList?.[0] ||
    product.subCategory ||
    product.productType ||
    product.description;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultVariant =
      product.variants && product.variants.length > 0
        ? product.variants[0]
        : undefined;

    addItem(product, defaultVariant, 1, addedVia, campaignInfo?.campaignId);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_0_rgba(0,0,0,0.02),0_4px_16px_-4px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/8',
        className
      )}
    >
      <Link
        href={`/product/${product.product_id}`}
        className="flex flex-1 flex-col"
      >
        {/* Real Product Image Showcase */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 border-b border-slate-100 p-5 flex items-center justify-center">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            /* Fallback State */
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="size-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2 border border-slate-200/80 shadow-2xs">
                <ShoppingBag className="size-5 text-slate-400" />
              </div>
              <span className="text-[11px] font-semibold text-slate-600">{product.brand || 'Verified Item'}</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">{product.categoryDisplay || product.category}</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span className="inline-flex items-center rounded-md bg-white/95 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-800 shadow-2xs border border-slate-200/80 backdrop-blur-xs">
              {product.brand || product.categoryDisplay || product.category}
            </span>
            {activeCampaignDiscount && activeCampaignDiscount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-rose-600 to-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs border border-rose-500/80 animate-pulse">
                <Flame className="size-2.5 text-white fill-white" />
                <span>{activeCampaignDiscount}% OFF</span>
              </span>
            ) : discountPercent && discountPercent > 0 ? (
              <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-200/70 shadow-2xs">
                {discountPercent}% OFF
              </span>
            ) : null}
          </div>

          {/* Stock Status Indicator */}
          <div className="absolute top-3 right-3 z-10">
            {product.stockStatus === 'low_stock' ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/80 shadow-2xs">
                Low stock
              </span>
            ) : product.stockStatus === 'out_of_stock' ? (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200/80 shadow-2xs">
                Sold out
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50/95 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/70 shadow-2xs">
                In stock
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-4.5">
          {/* Product Name */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </div>

          {/* Feature Snippet / Key Spec */}
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {keyFeature}
          </p>

          {/* Verified Rating & Fast Delivery Pill */}
          <div className="mt-3.5 flex items-center justify-between gap-2 text-xs">
            {product.rating !== undefined && product.rating > 0 ? (
              <div className="flex items-center gap-1 bg-amber-50/90 px-2 py-0.5 rounded-md border border-amber-200/60 text-amber-900 shadow-2xs">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span className="font-bold text-[11px] text-slate-800">{product.rating.toFixed(1)}</span>
                {product.reviewCount !== undefined && product.reviewCount > 0 && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({product.reviewCount})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {product.subCategory || 'Curated'}
              </span>
            )}

            {product.deliveryEstimate ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs">
                <Zap className="size-2.5 fill-emerald-600 text-emerald-600" />
                <span>{product.deliveryEstimate}</span>
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Card Action & Price Row */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4.5 py-3">
        <div>
          {product.price > 0 ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(product.mrp, product.currency)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-500">
              Official Catalog
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showQuickAdd && product.price > 0 && product.stockStatus !== 'out_of_stock' && (
            <>
              {inCart && !addedAnimation ? (
                /* ── Quantity Stepper (replaces Add button once in cart) ── */
                <div className="flex items-center h-8 rounded-xl border border-indigo-300 bg-indigo-50/80 overflow-hidden shadow-2xs">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(itemKey, currentQty - 1); }}
                    className="flex items-center justify-center h-full px-2 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                    title={currentQty <= 1 ? 'Remove from bag' : 'Decrease quantity'}
                    aria-label="Decrease quantity"
                  >
                    {currentQty <= 1 ? <Trash2 className="size-3" /> : <Minus className="size-3" />}
                  </button>
                  <span className="flex items-center justify-center h-full px-2 text-xs font-extrabold text-indigo-800 font-mono min-w-[24px] select-none">
                    {currentQty}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(itemKey, currentQty + 1); }}
                    className="flex items-center justify-center h-full px-2 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                    title="Increase quantity"
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              ) : (
                /* ── Add / Added Button ── */
                <Button
                  size="sm"
                  onClick={handleQuickAdd}
                  className={cn(
                    'h-8 px-3.5 text-xs font-bold transition-all shadow-xs gap-1.5 cursor-pointer rounded-xl',
                    addedAnimation
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-2xs hover:shadow-xs'
                  )}
                  aria-label={`Add ${product.name} to bag`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-3.5" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          <Link
            href={`/product/${product.product_id}`}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 hover:border-indigo-400/60 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-2xs"
            aria-label={`View details for ${product.name}`}
          >
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
