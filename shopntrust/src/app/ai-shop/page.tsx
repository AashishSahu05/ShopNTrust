// ============================================================
// ShopNTrust — AI Shopping Assistant Workspace (/ai-shop)
// ============================================================
// Phase 5.1: Real Supabase Auth + Global Session Persistence + Chat History
// - Survives route navigation seamlessly via global AISessionProvider
// - Real n8n Webhook: https://shopntrust.app.n8n.cloud/webhook/1f4f8f8b-a840-4d0f-8d99-96db0cee2865
// - In-chat canonical product recommendations
// - Shared cart with instant Add to Bag & zero ghost duplicate bugs
// ============================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Send,
  ShoppingBag,
  Heart,
  Trash2,
  Plus,
  Minus,
  Paperclip,
  Volume2,
  VolumeX,
  Lock,
  CheckCircle2,
  Camera,
  ArrowRight,
  PlusCircle,
  Store,
  Check,
  RotateCcw,
  Star,
  ShieldCheck,
  ExternalLink,
  History,
  X,
  Clock,
  ChevronRight,
  Scale,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';
import { useCart, getCartItemKey } from '@/store/cart-context';
import { useAISession } from '@/store/ai-context';
import { getProductById } from '@/lib/catalog';
import { getProductImageUrl } from '@/lib/product-images';
import { formatPrice } from '@/lib/format';
import type {
  Product,
  CartItem,
  AddedVia,
  AgentProductMatch,
  StructuredRecommendation,
  AIComparisonData,
  UpsellRecommendation,
  CrossSellRecommendation,
} from '@/types';

// ============================================================
// CLEAN CUSTOMER-FACING AI MESSAGE RENDERER (PHASE 7A)
// ============================================================
// Ensures that raw JSON, backend field names, raw URLs, and markdown
// syntax are cleanly formatted and 100% human-readable.

function renderInlineMarkdown(text: string): React.ReactNode {
  // Strip any accidental 'svg' or '[svg]' tokens from text
  const clean = text.replace(/\bsvg\b/gi, '').replace(/\[svg\]/gi, '').trim();

  // Pattern to find **bold**, [link](url)
  const tokens = clean.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);

  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const href = linkMatch[2];
      const cleanHref = href.replace(/^https?:\/\/(?:localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)/i, '');
      const finalHref = cleanHref.startsWith('/product/') ? cleanHref : '#';
      return (
        <Link
          key={i}
          href={finalHref}
          className="text-[#5B4DFB] font-semibold hover:underline inline-flex items-center gap-0.5"
        >
          {label}
        </Link>
      );
    }
    return tok;
  });
}

function CleanAIMessageRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Split into lines
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: { text: string; key: number }[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <div key={`list-${elements.length}`} className="space-y-1.5 my-1.5 pl-1">
          {currentList.map(({ text, key }) => (
            <div key={key} className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
              <span className="size-1.5 rounded-full bg-[#5B4DFB] shrink-0 mt-2" aria-hidden="true" />
              <span className="flex-1">{renderInlineMarkdown(text)}</span>
            </div>
          ))}
        </div>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    let trimmed = line.trim();

    // 1. Never render raw JSON brackets, technical metadata lines, or unbracketed JSON property lines
    if (
      trimmed.startsWith('{') ||
      trimmed.startsWith('}') ||
      trimmed.startsWith('[') ||
      trimmed.startsWith(']') ||
      /^"(?:reason|product_ids?|type|actions?|recommendations?|match_points?|matchPoints|benefits|label|source_product_id)":/i.test(trimmed) ||
      /^"(?:SHOW_PRODUCTS|SHOW_COMPARISON|SHOW_UPSELL|SHOW_CROSS_SELL)"/i.test(trimmed) ||
      /^"[^"]+",?\s*$/.test(trimmed) ||
      /^[{}\[\],]+$/.test(trimmed) ||
      trimmed.includes('"product_ids":') ||
      trimmed.includes('"product_id":') ||
      trimmed.includes('"recommendations":') ||
      trimmed.includes('"actions":') ||
      trimmed.includes('"reason":')
    ) {
      return;
    }

    // 2. Clean technical "(Product ID: P117)" to elegant "(P117)"
    trimmed = trimmed.replace(/\(Product ID:\s*(P1\d{2})\)/gi, '($1)');

    // 3. Check for bullet list lines (•, -, *, 1.)
    const bulletMatch = trimmed.match(/^[\u2022\-\*]\s+(.*)$/);
    if (bulletMatch) {
      currentList.push({ text: bulletMatch[1], key: idx });
      return;
    }

    // If it's a regular line, flush any pending list
    flushList();

    if (!trimmed) {
      return;
    }

    elements.push(
      <p key={idx} className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-normal">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-2">{elements}</div>;
}

// ============================================================
// IN-CHAT PRODUCT CARD COMPONENT (PHASE 6: EXPLAINABILITY)
// ============================================================

interface InChatCardProps {
  productId: string;
  matchData?: AgentProductMatch;
  recommendationData?: StructuredRecommendation;
  onAdd: (product: Product) => void;
  onCompare?: (productId: string) => void;
  isAdded: boolean;
}

function InChatProductCard({
  productId,
  matchData,
  recommendationData,
  onAdd,
  onCompare,
  isAdded,
}: InChatCardProps) {
  const product = getProductById(productId);
  const { isInCart, getQuantity, updateQuantity } = useCart();
  if (!product) return null;

  const imageUrl = getProductImageUrl(product.product_id);
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

  const itemInCart = isInCart(product.product_id);
  const currentQty = getQuantity(product.product_id);
  const itemKey = getCartItemKey(product.product_id, product.variants?.[0]?.variant_id);

  // Structured explainability details
  const matchPoints =
    recommendationData?.matchPoints ||
    matchData?.reasoning ||
    [];

  const matchReason =
    recommendationData?.reason ||
    (matchData?.reasoning?.[0] ? matchData.reasoning[0] : null);

  const matchLabel =
    recommendationData?.matchLabel ||
    matchData?.matchLabel ||
    'Strong Match';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:border-[#5B4DFB]/40 hover:shadow-md transition-all text-left">
      <div>
        {/* Top Image + Badges */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag aria-hidden="true" focusable="false" className="size-6 mb-1" />
              <span className="text-[10px] font-mono">{product.product_id}</span>
            </div>
          )}

          {/* Brand & Stock Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-2xs border border-slate-200/60 backdrop-blur-xs">
              {product.brand || product.categoryDisplay || product.category}
            </span>
          </div>

          {discountPercent && (
            <div className="absolute top-2 right-2 z-10">
              <span className="rounded-md bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold border border-emerald-200/80">
                {discountPercent}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="mt-2.5 space-y-1">
          <div className="flex items-start justify-between gap-1.5">
            <Link
              href={`/product/${product.product_id}`}
              className="text-xs font-bold text-slate-900 group-hover:text-[#5B4DFB] line-clamp-1 transition-colors"
            >
              {product.name}
            </Link>
            <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
              {product.product_id}
            </span>
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-sm font-extrabold font-mono text-slate-900">
              {formatPrice(product.price)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-[11px] text-slate-400 line-through font-mono">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>

          {/* Rating & Delivery */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
            {product.rating && (
              <span className="flex items-center gap-0.5 text-amber-600 font-semibold bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-100/80">
                <Star aria-hidden="true" focusable="false" className="size-2.5 fill-amber-500 text-amber-500" />
                {product.rating.toFixed(1)}
              </span>
            )}
            {product.deliveryEstimate && (
              <span className="text-emerald-700 font-medium">⚡ {product.deliveryEstimate}</span>
            )}
          </div>

          {/* PHASE 6: WHY THIS MATCHES EXPLAINABILITY BOX */}
          {(matchReason || matchPoints.length > 0) && (
            <div className="mt-2 rounded-xl bg-indigo-50/60 border border-indigo-100/70 p-2 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-900">
                  <Sparkles aria-hidden="true" focusable="false" className="size-3 text-[#5B4DFB] shrink-0" />
                  <span>Why this matches</span>
                </div>
                <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full border border-indigo-200/50">
                  {matchLabel}
                </span>
              </div>

              {matchReason && (
                <p className="text-[10px] text-slate-700 leading-snug font-medium line-clamp-2">
                  {matchReason}
                </p>
              )}

              {matchPoints.length > 0 && (
                <ul className="space-y-0.5 pt-0.5">
                  {matchPoints.slice(0, 2).map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[9.5px] text-slate-600 leading-tight">
                      <CheckCircle2 aria-hidden="true" focusable="false" className="size-2.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
        {itemInCart ? (
          /* ── Quantity Stepper (replaces "Add to Bag" once in cart) ── */
          <div className="flex-1 flex items-center justify-center h-7 rounded-lg border border-[#5B4DFB]/30 bg-[#5B4DFB]/5 gap-0 overflow-hidden">
            <button
              onClick={() => updateQuantity(itemKey, currentQty - 1)}
              className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
              title={currentQty <= 1 ? 'Remove from bag' : 'Decrease quantity'}
            >
              {currentQty <= 1 ? <Trash2 aria-hidden="true" focusable="false" className="size-3" /> : <Minus aria-hidden="true" focusable="false" className="size-3" />}
            </button>
            <span className="flex items-center justify-center h-full px-2 text-[11px] font-extrabold text-[#5B4DFB] font-mono min-w-[24px] select-none">
              {currentQty}
            </span>
            <button
              onClick={() => updateQuantity(itemKey, currentQty + 1)}
              className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
              title="Increase quantity"
            >
              <Plus aria-hidden="true" focusable="false" className="size-3" />
            </button>
          </div>
        ) : (
          /* ── Add to Bag Button (initial state) ── */
          <Button
            size="sm"
            onClick={() => onAdd(product)}
            className={`flex-1 h-7 text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-xs gap-1 ${
              isAdded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#5B4DFB] hover:bg-[#4d3ef7] text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check aria-hidden="true" focusable="false" className="size-3" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag aria-hidden="true" focusable="false" className="size-3" />
                <span>Add to Bag</span>
              </>
            )}
          </Button>
        )}

        {/* Quick Compare Button */}
        {onCompare && (
          <button
            onClick={() => onCompare(product.product_id)}
            className="flex size-7 items-center justify-center rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Compare this product"
          >
            <Scale aria-hidden="true" focusable="false" className="size-3" />
          </button>
        )}

        <Link
          href={`/product/${product.product_id}`}
          className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#5B4DFB] hover:border-[#5B4DFB]/40 transition-colors shadow-2xs shrink-0"
          title="View Product Details"
        >
          <ExternalLink aria-hidden="true" focusable="false" className="size-3" />
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// IN-CHAT COMPARISON MATRIX COMPONENT (PHASE 6)
// ============================================================

interface InChatComparisonTableProps {
  productIds: string[];
  title?: string;
  summary?: string;
  onAdd: (product: Product) => void;
  onClose?: () => void;
}

function InChatComparisonTable({
  productIds,
  title = 'Product Comparison Matrix',
  summary,
  onAdd,
  onClose,
}: InChatComparisonTableProps) {
  const { isInCart, getQuantity, updateQuantity } = useCart();
  const validProducts = productIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => !!p);

  if (validProducts.length < 2) return null;

  return (
    <div className="mt-3 rounded-2xl border border-indigo-200/80 bg-white overflow-hidden shadow-xs">
      {/* Comparison Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50/50 to-white px-3.5 py-2.5 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-[#5B4DFB] text-white">
            <Scale aria-hidden="true" focusable="false" className="size-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{title}</h4>
            <p className="text-[10px] text-slate-500">Verified side-by-side canonical specs</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
            title="Hide comparison"
          >
            <X aria-hidden="true" focusable="false" className="size-3.5" />
          </button>
        )}
      </div>

      {summary && (
        <div className="px-3.5 py-2 bg-indigo-50/30 border-b border-indigo-50 text-[11px] text-slate-700 leading-snug">
          <span className="font-bold text-indigo-700">AI Conclusion: </span>
          {summary}
        </div>
      )}

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-28 shrink-0">
                Attributes
              </th>
              {validProducts.map((p) => {
                const img = getProductImageUrl(p.product_id);
                const itemInCart = isInCart(p.product_id);
                const currentQty = getQuantity(p.product_id);
                const itemKey = getCartItemKey(p.product_id, p.variants?.[0]?.variant_id);

                return (
                  <th key={p.product_id} className="p-3 min-w-[180px] align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-12 rounded-lg bg-white border border-slate-200/80 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        {img ? (
                          <Image src={img} alt={p.name} fill className="object-contain" unoptimized />
                        ) : (
                          <ShoppingBag aria-hidden="true" focusable="false" className="size-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          {p.brand}
                        </span>
                        <Link
                          href={`/product/${p.product_id}`}
                          className="font-bold text-slate-900 hover:text-[#5B4DFB] line-clamp-1 block transition-colors"
                        >
                          {p.name}
                        </Link>
                        <span className="text-[9px] font-mono text-slate-400">{p.product_id}</span>
                      </div>
                    </div>

                    {/* In-Table Add to Bag / Stepper Button */}
                    <div className="mt-2.5">
                      {itemInCart ? (
                        <div className="flex items-center justify-center h-6 rounded-md border border-[#5B4DFB]/30 bg-[#5B4DFB]/5 gap-0 overflow-hidden w-full">
                          <button
                            onClick={() => updateQuantity(itemKey, currentQty - 1)}
                            className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
                          >
                            {currentQty <= 1 ? <Trash2 aria-hidden="true" focusable="false" className="size-2.5" /> : <Minus aria-hidden="true" focusable="false" className="size-2.5" />}
                          </button>
                          <span className="flex items-center justify-center h-full px-2 text-[10px] font-extrabold text-[#5B4DFB] font-mono min-w-[20px] select-none">
                            {currentQty}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemKey, currentQty + 1)}
                            className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
                          >
                            <Plus aria-hidden="true" focusable="false" className="size-2.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onAdd(p)}
                          className="w-full h-6 text-[10px] font-bold bg-[#5B4DFB] hover:bg-[#4d3ef7] text-white rounded-md cursor-pointer gap-1 shadow-2xs"
                        >
                          <ShoppingBag aria-hidden="true" focusable="false" className="size-2.5" />
                          <span>Add to Bag</span>
                        </Button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px]">
            {/* Price Row */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Price</td>
              {validProducts.map((p) => (
                <td key={p.product_id} className="p-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold font-mono text-slate-900 text-xs">
                      {formatPrice(p.price)}
                    </span>
                    {p.mrp && p.mrp > p.price && (
                      <span className="text-[10px] text-slate-400 line-through font-mono">
                        {formatPrice(p.mrp)}
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Rating Row */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Rating</td>
              {validProducts.map((p) => (
                <td key={p.product_id} className="p-3">
                  {p.rating ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 text-[10px]">
                      <Star aria-hidden="true" focusable="false" className="size-2.5 fill-amber-500 text-amber-500" />
                      {p.rating.toFixed(1)} {p.reviewCount ? `(${p.reviewCount} reviews)` : ''}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Key Highlights Row */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Key Highlights</td>
              {validProducts.map((p) => {
                const highlights = p.featuresList?.slice(0, 2) || p.benefits?.slice(0, 2) || [p.description];
                return (
                  <td key={p.product_id} className="p-3 text-slate-700">
                    <ul className="space-y-1">
                      {highlights.map((h, idx) => (
                        <li key={idx} className="flex items-start gap-1 leading-tight text-[10px]">
                          <Check aria-hidden="true" focusable="false" className="size-2.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>

            {/* Delivery Row */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Delivery</td>
              {validProducts.map((p) => (
                <td key={p.product_id} className="p-3 text-emerald-700 font-medium text-[10px]">
                  ⚡ {p.deliveryEstimate || 'Standard 3-5 days'}
                </td>
              ))}
            </tr>

            {/* Return Policy */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/30">Return Policy</td>
              {validProducts.map((p) => (
                <td key={p.product_id} className="p-3 text-slate-600 text-[10px]">
                  {p.returnable !== false ? `${p.returnWindowDays || 7} Days Return Window` : 'Non-returnable'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// IN-CHAT UPSELL COMPONENT (PHASE 7: UPGRADE OPPORTUNITY)
// ============================================================

interface InChatUpsellCardProps {
  upsell: UpsellRecommendation;
  onAdd: (product: Product, addedVia?: CartItem['addedVia'], sourceProductId?: string) => void;
  isAdded: boolean;
}

function InChatUpsellCard({ upsell, onAdd, isAdded }: InChatUpsellCardProps) {
  const product = getProductById(upsell.productId);
  const { isInCart, getQuantity, updateQuantity } = useCart();
  if (!product) return null;

  const imageUrl = getProductImageUrl(product.product_id);
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : null;

  const itemInCart = isInCart(product.product_id);
  const currentQty = getQuantity(product.product_id);
  const itemKey = getCartItemKey(product.product_id, product.variants?.[0]?.variant_id);

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-3.5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all">
      {/* Premium Header Badge */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-amber-100">
        <div className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-md bg-amber-500 text-white shadow-2xs">
            <Sparkles aria-hidden="true" focusable="false" className="size-3" />
          </span>
          <span className="text-xs font-extrabold text-amber-950">
            {upsell.label || 'Worth the Upgrade'}
          </span>
        </div>
        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200/80">
          Premium Alternative
        </span>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-3">
        {/* Product Image */}
        <div className="relative aspect-[16/11] sm:w-36 shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200/80 p-2 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-contain p-1"
              unoptimized
            />
          ) : (
            <ShoppingBag aria-hidden="true" focusable="false" className="size-8 text-slate-400" />
          )}
          {discountPercent && (
            <span className="absolute top-1.5 right-1.5 rounded-md bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[9.5px] font-bold border border-emerald-200/80">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Product Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1.5">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  {product.brand}
                </span>
                <Link
                  href={`/product/${product.product_id}`}
                  className="text-xs font-bold text-slate-900 hover:text-[#5B4DFB] line-clamp-1 transition-colors"
                >
                  {product.name}
                </Link>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                {product.product_id}
              </span>
            </div>

            {/* Price & Rating */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-sm font-extrabold font-mono text-slate-900">
                {formatPrice(product.price)}
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-[11px] text-slate-400 line-through font-mono">
                  {formatPrice(product.mrp)}
                </span>
              )}
              {product.rating && (
                <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  <Star aria-hidden="true" focusable="false" className="size-2.5 fill-amber-500 text-amber-500" />
                  {product.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* "Why this upgrade?" Box */}
            <div className="mt-2 rounded-xl bg-amber-50/70 border border-amber-200/60 p-2 space-y-1">
              <p className="text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                <TrendingUp aria-hidden="true" focusable="false" className="size-3 text-amber-600" />
                <span>Why this upgrade?</span>
              </p>
              {upsell.reason && (
                <p className="text-[10px] text-slate-700 leading-snug font-medium">
                  {upsell.reason}
                </p>
              )}
              {upsell.benefits && upsell.benefits.length > 0 && (
                <ul className="space-y-0.5 pt-0.5">
                  {upsell.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[9.5px] text-slate-600 leading-tight">
                      <CheckCircle2 aria-hidden="true" focusable="false" className="size-2.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3 pt-2 border-t border-amber-100/70 flex items-center justify-between gap-1.5">
            {itemInCart ? (
              <div className="flex-1 flex items-center justify-center h-7 rounded-lg border border-[#5B4DFB]/30 bg-[#5B4DFB]/5 gap-0 overflow-hidden">
                <button
                  onClick={() => updateQuantity(itemKey, currentQty - 1)}
                  className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
                  title={currentQty <= 1 ? 'Remove from bag' : 'Decrease quantity'}
                >
                  {currentQty <= 1 ? <Trash2 aria-hidden="true" focusable="false" className="size-3" /> : <Minus aria-hidden="true" focusable="false" className="size-3" />}
                </button>
                <span className="flex items-center justify-center h-full px-2 text-[11px] font-extrabold text-[#5B4DFB] font-mono min-w-[24px] select-none">
                  {currentQty}
                </span>
                <button
                  onClick={() => updateQuantity(itemKey, currentQty + 1)}
                  className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus aria-hidden="true" focusable="false" className="size-3" />
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => onAdd(product, 'ai_upsell', upsell.sourceProductId)}
                className={`flex-1 h-7 text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-xs gap-1 ${
                  isAdded
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check aria-hidden="true" focusable="false" className="size-3" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag aria-hidden="true" focusable="false" className="size-3" />
                    <span>Add to Bag</span>
                  </>
                )}
              </Button>
            )}

            <Link
              href={`/product/${product.product_id}`}
              className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#5B4DFB] hover:border-[#5B4DFB]/40 transition-colors shadow-2xs shrink-0"
              title="View Product Details"
            >
              <ExternalLink aria-hidden="true" focusable="false" className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// IN-CHAT CROSS-SELL COMPONENT (PHASE 7: COMPLEMENTARY ADD-ONS)
// ============================================================

interface InChatCrossSellSectionProps {
  items: CrossSellRecommendation[];
  onAdd: (product: Product, addedVia?: CartItem['addedVia']) => void;
  addedItemIds: Record<string, boolean>;
}

function InChatCrossSellSection({
  items,
  onAdd,
  addedItemIds,
}: InChatCrossSellSectionProps) {
  const { isInCart, getQuantity, updateQuantity } = useCart();
  const validItems = items
    .map((item) => ({ ...item, product: getProductById(item.productId) }))
    .filter((item): item is typeof item & { product: Product } => !!item.product);

  if (validItems.length === 0) return null;

  return (
    <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 p-3.5 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
        <div className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs">
            <PlusCircle aria-hidden="true" focusable="false" className="size-3" />
          </span>
          <span className="text-xs font-extrabold text-emerald-950">
            {items[0]?.label || 'Complete Your Setup'}
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200/80">
          Pairs Well With Selection
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {validItems.map(({ product, reason, benefits }) => {
          const imageUrl = getProductImageUrl(product.product_id);
          const itemInCart = isInCart(product.product_id);
          const currentQty = getQuantity(product.product_id);
          const itemKey = getCartItemKey(product.product_id, product.variants?.[0]?.variant_id);

          return (
            <div
              key={product.product_id}
              className="flex flex-col justify-between rounded-xl border border-emerald-100 bg-white p-2.5 shadow-2xs hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className="relative size-12 rounded-lg bg-slate-50 border border-slate-100 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={product.name} fill className="object-contain" unoptimized />
                    ) : (
                      <ShoppingBag aria-hidden="true" focusable="false" className="size-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {product.brand}
                    </span>
                    <Link
                      href={`/product/${product.product_id}`}
                      className="text-xs font-bold text-slate-900 hover:text-[#5B4DFB] line-clamp-1 block transition-colors"
                    >
                      {product.name}
                    </Link>
                    <span className="text-[11px] font-extrabold font-mono text-slate-900">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>

                {/* "Why this add-on?" Section */}
                {(reason || (benefits && benefits.length > 0)) && (
                  <div className="mt-2 rounded-lg bg-emerald-50/60 border border-emerald-100/80 p-1.5 space-y-0.5">
                    <p className="text-[9px] font-bold text-emerald-900">Why this add-on?</p>
                    {reason && (
                      <p className="text-[9.5px] text-slate-600 leading-snug line-clamp-2">
                        {reason}
                      </p>
                    )}
                    {benefits && benefits.length > 0 && (
                      <p className="text-[9px] text-slate-500 flex items-center gap-1 line-clamp-1 pt-0.5">
                        <CheckCircle2 aria-hidden="true" focusable="false" className="size-2.5 text-emerald-600 shrink-0" />
                        <span>{benefits[0]}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Add to Bag Stepper Button */}
              <div className="mt-2 pt-2 border-t border-slate-100">
                {itemInCart ? (
                  <div className="flex items-center justify-center h-6 rounded-md border border-[#5B4DFB]/30 bg-[#5B4DFB]/5 gap-0 overflow-hidden w-full">
                    <button
                      onClick={() => updateQuantity(itemKey, currentQty - 1)}
                      className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
                    >
                      {currentQty <= 1 ? <Trash2 aria-hidden="true" focusable="false" className="size-2.5" /> : <Minus aria-hidden="true" focusable="false" className="size-2.5" />}
                    </button>
                    <span className="flex items-center justify-center h-full px-2 text-[10px] font-extrabold text-[#5B4DFB] font-mono min-w-[20px] select-none">
                      {currentQty}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemKey, currentQty + 1)}
                      className="flex items-center justify-center h-full px-2 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
                    >
                      <Plus aria-hidden="true" focusable="false" className="size-2.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onAdd(product, 'ai_cross_sell')}
                    className="w-full h-6 text-[10px] font-bold bg-[#5B4DFB] hover:bg-[#4d3ef7] text-white rounded-md cursor-pointer gap-1 shadow-2xs"
                  >
                    {addedItemIds[product.product_id] ? (
                      <>
                        <Check aria-hidden="true" focusable="false" className="size-2.5" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag aria-hidden="true" focusable="false" className="size-2.5" />
                        <span>Add Add-on</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN AI SHOP WORKSPACE PAGE
// ============================================================

export default function AIShopPage() {
  const router = useRouter();
  const { isMerchant, customerProfile, isCustomer, openAuthModal, user } = useAuth();
  const { state: cartState, summary: cartSummary, addItem, removeItem, updateQuantity } = useCart();
  const {
    messages,
    activeSessionId,
    sendMessage,
    compareProducts,
    isLoading,
    loadingStep,
    activeBudget,
    lastFailedQuery,
    retryLastQuery,
    startNewChat,
    historySessions,
    loadHistorySession,
    isHistoryOpen,
    openHistoryDrawer,
    closeHistoryDrawer,
  } = useAISession();

  const cartItems = cartState.items;

  // Role Guard: Merchants redirected to /merchant
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  // Active User Display Name
  const userName = customerProfile?.name ? customerProfile.name.split(' ')[0] : 'Guest';

  // Component UI State
  const [inputText, setInputText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [expandedComparisons, setExpandedComparisons] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic loading indicator messages
  const loadingPhrases = [
    'Understanding your requirements…',
    'Scanning verified catalog in real-time…',
    'Analyzing specifications & best matches…',
  ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Add to Bag with instant visual feedback & Phase 8 event attribution
  const handleAddProduct = useCallback(
    (product: Product, addedVia: CartItem['addedVia'] = 'ai_primary', sourceProductId?: string) => {
      const defaultVariant = product.variants?.[0];
      addItem(product, defaultVariant, 1, addedVia);
      setAddedItemIds((prev) => ({ ...prev, [product.product_id]: true }));
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [product.product_id]: false }));
      }, 2000);

      // Phase 8 non-blocking event logging
      let eventType = 'AI_PRODUCT_ADDED';
      if (addedVia === 'ai_upsell') eventType = 'AI_UPSELL_ACCEPTED';
      if (addedVia === 'ai_cross_sell') eventType = 'AI_CROSS_SELL_ACCEPTED';

      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          eventType,
          productId: product.product_id,
          sourceProductId,
          userId: isCustomer && user.role === 'customer' ? user.profile.id : null,
          metadata: { price: product.price, name: product.name },
        }),
      }).catch(() => {});
    },
    [addItem, activeSessionId, isCustomer, user]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    sendMessage(text);
  };

  if (isMerchant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-900 flex flex-col font-sans">
      {/* Main 3-Column Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 py-4 sm:px-6 sm:py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN (3 cols lg / 2 cols 2xl): Navigation & Preferences */}
        {/* ============================================================ */}
        <aside className="lg:col-span-3 2xl:col-span-2 space-y-4 hidden lg:block sticky top-20">
          {/* Navigation Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-1">
            <div className="flex items-center gap-3 rounded-xl bg-[#5B4DFB]/10 p-3 text-[#5B4DFB]">
              <Sparkles className="size-5 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-tight">AI Assistant</p>
                <p className="text-[10px] text-[#5B4DFB]/80">Autonomous Shopping Intelligence</p>
              </div>
            </div>

            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <PlusCircle className="size-4 text-slate-400" />
              <span>New Conversation</span>
            </button>

            <button
              onClick={openHistoryDrawer}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <History className="size-4 text-slate-400" />
                <span>Chat History</span>
              </div>
              {historySessions.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {historySessions.length}
                </span>
              )}
            </button>

            <Link
              href="/shop"
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Store className="size-4 text-slate-400" />
              <span>Manual Storefront Catalog</span>
            </Link>

            <Link
              href="/cart"
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="size-4 text-slate-400" />
                <span>Shared Bag</span>
              </div>
              {cartSummary.itemCount > 0 && (
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  {cartSummary.itemCount} items
                </span>
              )}
            </Link>
          </div>

          {/* AI Shopping Tips Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B4DFB]">
              <Sparkles className="size-4" />
              <span>AI Shopping Tips</span>
            </div>

            <ul className="space-y-2.5 text-[11px] text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <Camera className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Specify your exact price range (e.g. &quot;under ₹50,000&quot;)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Heart className="size-4 text-purple-500 shrink-0 mt-0.5" />
                <span>Mention key priorities (e.g. &quot;gaming&quot;, &quot;battery&quot;, &quot;ANC&quot;)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShoppingBag className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Click &quot;+ Add to Bag&quot; to add directly to your shared cart</span>
              </li>
            </ul>
          </div>

          {/* Session Preferences Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="size-4" />
              <span>Session Preferences</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Budget Constraint</p>
                <p className="font-bold text-slate-800">{activeBudget}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Verified Catalog</p>
                <p className="font-bold text-slate-800">66 Canonical Products</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Preferred Categories</p>
                <p className="font-bold text-slate-800">
                  {customerProfile?.preferredCategories?.length
                    ? customerProfile.preferredCategories.join(', ')
                    : 'Smartphones, Audio & Wearables'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER COLUMN (6 cols lg / 7 cols 2xl): AI Chat & Live Recommendations (Focal Point) */}
        {/* ============================================================ */}
        <section className="lg:col-span-6 2xl:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[calc(100vh-5.5rem)] min-h-[720px] overflow-hidden">
          {/* Agent Header Bar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5B4DFB] to-[#7952F5] text-white shadow-xs">
                <Sparkles className="size-5" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">ShopNTrust AI Assistant</h2>
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Live Catalog Intelligence • Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              <button
                onClick={openHistoryDrawer}
                className="p-1.5 hover:text-[#5B4DFB] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Chat History"
              >
                <History className="size-4" />
              </button>
              <button
                onClick={startNewChat}
                className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Clear Chat / New Session"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          {/* Chat Scroll Container (Maintains full history without refresh) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.role === 'assistant' ? (
                  /* Assistant Message Bubble */
                  <div className="flex items-start gap-3 w-full max-w-3xl">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#5B4DFB]/10 text-[#5B4DFB] shrink-0 mt-1">
                      <Sparkles aria-hidden="true" focusable="false" className="size-4" />
                    </div>
                    <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs sm:text-[13px] text-slate-800 leading-relaxed space-y-3">
                      {/* REAL AI Customer-Facing Output rendered cleanly */}
                      <CleanAIMessageRenderer content={msg.content} />

                      {/* Error Retry Option */}
                      {msg.status === 'error' && lastFailedQuery && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={retryLastQuery}
                            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1.5 cursor-pointer"
                          >
                            <RotateCcw aria-hidden="true" focusable="false" className="size-3" />
                            <span>Retry Query</span>
                          </Button>
                        </div>
                      )}

                      {/* Recommended Live Product Cards inside the Conversation (Phase 6) */}
                      {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                        <div className="pt-2 space-y-2.5">
                          {/* Section Header with Comparison Trigger */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <Sparkles aria-hidden="true" focusable="false" className="size-3.5 text-[#5B4DFB] shrink-0" />
                              <span>Recommended Products ({msg.recommendedProductIds.length})</span>
                            </div>
                            {msg.recommendedProductIds.length >= 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedComparisons((prev) => ({
                                    ...prev,
                                    [msg.id]: !prev[msg.id],
                                  }));
                                }}
                                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#5B4DFB] hover:text-[#4d3ef7] bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                              >
                                <Scale aria-hidden="true" focusable="false" className="size-3.5 shrink-0" />
                                <span>
                                  {expandedComparisons[msg.id] || msg.comparison?.enabled
                                    ? 'Hide Comparison'
                                    : 'Compare Options'}
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Recommendation Product Cards Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {msg.recommendedProductIds.map((pId) => {
                              const matchObj = msg.matches?.find((m) => m.productId === pId);
                              const recObj = msg.recommendations?.find((r) => r.productId === pId);
                              return (
                                <InChatProductCard
                                  key={pId}
                                  productId={pId}
                                  matchData={matchObj}
                                  recommendationData={recObj}
                                  onAdd={(prod) => handleAddProduct(prod, 'ai_primary')}
                                  onCompare={(selectedId) => {
                                    const otherId = msg.recommendedProductIds?.find((id) => id !== selectedId);
                                    if (otherId) {
                                      compareProducts([selectedId, otherId]);
                                    } else {
                                      compareProducts([selectedId]);
                                    }
                                  }}
                                  isAdded={!!addedItemIds[pId]}
                                />
                              );
                            })}
                          </div>

                          {/* In-Chat Comparison Table Component */}
                          {(msg.comparison?.enabled || expandedComparisons[msg.id]) && (
                            <InChatComparisonTable
                              productIds={msg.comparison?.productIds || msg.recommendedProductIds.slice(0, 2)}
                              title={msg.comparison?.title || 'Side-by-Side Product Comparison'}
                              summary={msg.comparison?.summary}
                              onAdd={(prod) => handleAddProduct(prod, 'ai_primary')}
                              onClose={() =>
                                setExpandedComparisons((prev) => ({ ...prev, [msg.id]: false }))
                              }
                            />
                          )}
                        </div>
                      )}

                      {/* Phase 7: AI-Powered Contextual Upsell ("Worth the Upgrade") */}
                      {msg.upsell && msg.upsell.length > 0 && (
                        <div className="pt-1">
                          {msg.upsell.map((u) => (
                            <InChatUpsellCard
                              key={u.productId}
                              upsell={u}
                              onAdd={(prod) => handleAddProduct(prod, 'ai_upsell', u.sourceProductId)}
                              isAdded={!!addedItemIds[u.productId]}
                            />
                          ))}
                        </div>
                      )}

                      {/* Phase 7: AI-Powered Contextual Cross-Sell ("Pairs Well With") */}
                      {msg.crossSell && msg.crossSell.length > 0 && (
                        <div className="pt-1">
                          <InChatCrossSellSection
                            items={msg.crossSell}
                            onAdd={(prod) => handleAddProduct(prod, 'ai_cross_sell')}
                            addedItemIds={addedItemIds}
                          />
                        </div>
                      )}

                      {/* Browse Catalog Link when no explicit items match */}
                      {msg.recommendedProductIds && msg.recommendedProductIds.length === 0 && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 bg-white border-slate-200 text-slate-700"
                            render={<Link href="/shop" />}
                          >
                            <Store className="size-3.5 mr-1.5 text-slate-500" />
                            <span>Browse 66 Canonical Items in Catalog</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* User Message Bubble */
                  <div className="flex items-start justify-end gap-3 ml-auto max-w-xl">
                    <div className="rounded-2xl bg-gradient-to-r from-[#5B4DFB] to-[#7952F5] text-white p-4 text-xs sm:text-[13px] font-medium leading-relaxed shadow-sm shadow-indigo-500/10">
                      <p>{msg.content}</p>
                    </div>
                    <div className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs shrink-0 mt-1">
                      {userName[0]}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Quick Follow-up Prompts */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {[
                'Compare these options',
                'Which one has better battery life?',
                'Best noise-cancelling earbuds under ₹15,000',
                'Show athletic running shoes',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full bg-slate-100 hover:bg-[#5B4DFB]/10 hover:text-[#5B4DFB] border border-slate-200/60 px-3 py-1 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* AI Agent Loading State */}
            {isLoading && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-[#5B4DFB]/5 border border-[#5B4DFB]/20 p-3.5 text-xs font-semibold text-[#5B4DFB]">
                <Sparkles className="size-4 animate-spin text-[#5B4DFB]" />
                <span>{loadingPhrases[loadingStep]}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar at Bottom */}
          <div className="p-3.5 border-t border-slate-100 bg-white">
            <form
              onSubmit={handleFormSubmit}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 focus-within:border-[#5B4DFB] focus-within:bg-white transition-all"
            >
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Catalog reference"
              >
                <Paperclip className="size-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about products, budget constraints, or specifications..."
                className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="size-8 rounded-full bg-[#5B4DFB] hover:bg-[#4d3ef7] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
              >
                <Send className="size-3.5 ml-0.5" />
              </button>
            </form>

            <p className="text-[10px] text-center text-slate-400 mt-2">
              All recommended products are verified against the ShopNTrust canonical 66-item catalog.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (3 cols lg / 3 cols 2xl): Your Shared Cart & Checkout */}
        {/* ============================================================ */}
        <aside className="lg:col-span-3 2xl:col-span-3 space-y-4 sticky top-20">
          {/* Shared Bag Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShoppingBag className="size-4 text-[#5B4DFB]" />
                <span>Your Shared Bag</span>
              </div>
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {cartSummary.itemCount}
              </span>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <ShoppingBag className="size-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Your Bag is empty</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ask the AI assistant for recommendations or click &quot;+ Add to Bag&quot; on any card.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const imageUrl = getProductImageUrl(item.product.product_id);
                  const itemKey = getCartItemKey(item.product.product_id, item.selectedVariant?.variant_id);

                  return (
                    <div
                      key={itemKey}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5"
                    >
                      {/* Thumbnail */}
                      <div className="relative size-12 rounded-lg bg-white border border-slate-200/70 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.product.name}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <ShoppingBag className="size-4 text-slate-400" />
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.product.name}
                          </p>
                          <button
                            onClick={() => removeItem(itemKey)}
                            className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-500 truncate">
                          {item.selectedVariant?.name || 'Standard Edition'}
                        </p>

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-extrabold font-mono text-slate-900">
                            {formatPrice(item.product.price)}
                          </span>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 rounded-md bg-white border border-slate-200 px-1 py-0.5">
                            <button
                              onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                              className="text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              <Minus className="size-2.5" />
                            </button>
                            <span className="text-[10px] font-bold font-mono px-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                              className="text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              <Plus className="size-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cart Summary & Primary Checkout Button */}
            {cartItems.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Items ({cartSummary.itemCount})</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatPrice(cartSummary.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Delivery</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>

                <div className="flex items-center justify-between text-slate-900 font-extrabold pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-sm font-mono text-slate-900">
                    {formatPrice(cartSummary.subtotal)}
                  </span>
                </div>

                {/* Checkout Button: Navigates to /checkout ONLY without triggering payment */}
                <Button
                  onClick={() => router.push('/checkout')}
                  className="w-full h-10 bg-gradient-to-r from-[#5B4DFB] to-[#7952F5] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer gap-2 mt-2"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight className="size-3.5" />
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-emerald-700 pt-1">
                  <Lock className="size-3" />
                  <span>Verified 256-bit Secure Checkout</span>
                </div>
              </div>
            )}
          </div>

          {/* Why Shop with AI Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="size-4" />
              <span>Verified Agentic Commerce</span>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Direct canonical catalog synchronization</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Transparent match reasoning</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Customer-isolated private cart</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Persistent AI conversation memory</span>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Chat History Modal Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <History className="size-4 text-snt-accent" />
                <span>Your Past AI Shopping Chats</span>
              </div>
              <button
                onClick={closeHistoryDrawer}
                className="size-7 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {historySessions.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
                  <Clock className="size-8 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No saved conversations yet</p>
                  <p>Conversations automatically save for authenticated customers.</p>
                  {!isCustomer && (
                    <Button
                      size="sm"
                      onClick={() => {
                        closeHistoryDrawer();
                        openAuthModal();
                      }}
                      className="mt-2 h-8 text-xs bg-snt-accent hover:bg-snt-accent-hover text-white"
                    >
                      Sign In to Save History
                    </Button>
                  )}
                </div>
              ) : (
                historySessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadHistorySession(session.id)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/60 p-3 hover:border-snt-accent/40 hover:bg-secondary/60 transition-all text-left cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground group-hover:text-snt-accent truncate">
                        {session.title || 'Shopping Inquiry'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(session.updated_at || session.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-snt-accent shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
