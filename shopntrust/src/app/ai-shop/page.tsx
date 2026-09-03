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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';
import { useCart, getCartItemKey } from '@/store/cart-context';
import { useAISession } from '@/store/ai-context';
import { getProductById } from '@/lib/catalog';
import { getProductImageUrl } from '@/lib/product-images';
import { formatPrice } from '@/lib/format';
import type { Product, AgentProductMatch } from '@/types';

// ============================================================
// IN-CHAT PRODUCT CARD COMPONENT
// ============================================================

interface InChatCardProps {
  productId: string;
  matchData?: AgentProductMatch;
  onAdd: (product: Product) => void;
  isAdded: boolean;
}

function InChatProductCard({ productId, matchData, onAdd, isAdded }: InChatCardProps) {
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
              <ShoppingBag className="size-6 mb-1" />
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
                <Star className="size-2.5 fill-amber-500 text-amber-500" />
                {product.rating.toFixed(1)}
              </span>
            )}
            {product.deliveryEstimate && (
              <span className="text-emerald-700 font-medium">⚡ {product.deliveryEstimate}</span>
            )}
          </div>

          {/* Recommendation / Match Reason */}
          {matchData?.reasoning?.[0] ? (
            <p className="text-[10px] text-slate-600 line-clamp-2 bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100/60 mt-1 leading-relaxed">
              <span className="font-semibold text-indigo-700">Why recommended: </span>
              {matchData.reasoning[0]}
            </p>
          ) : product.description ? (
            <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 leading-relaxed">
              {product.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {itemInCart ? (
          /* ── Quantity Stepper (replaces "Add to Bag" once in cart) ── */
          <div className="flex-1 flex items-center justify-center h-7 rounded-lg border border-[#5B4DFB]/30 bg-[#5B4DFB]/5 gap-0 overflow-hidden">
            <button
              onClick={() => updateQuantity(itemKey, currentQty - 1)}
              className="flex items-center justify-center h-full px-2.5 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
              title={currentQty <= 1 ? 'Remove from bag' : 'Decrease quantity'}
            >
              {currentQty <= 1 ? <Trash2 className="size-3" /> : <Minus className="size-3" />}
            </button>
            <span className="flex items-center justify-center h-full px-3 text-[11px] font-extrabold text-[#5B4DFB] font-mono min-w-[28px] select-none">
              {currentQty}
            </span>
            <button
              onClick={() => updateQuantity(itemKey, currentQty + 1)}
              className="flex items-center justify-center h-full px-2.5 text-[#5B4DFB] hover:bg-[#5B4DFB]/10 transition-colors cursor-pointer"
              title="Increase quantity"
            >
              <Plus className="size-3" />
            </button>
          </div>
        ) : (
          /* ── Add to Bag Button (initial state) ── */
          <Button
            size="sm"
            onClick={() => onAdd(product)}
            className={`flex-1 h-7 text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-xs gap-1.5 ${
              isAdded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#5B4DFB] hover:bg-[#4d3ef7] text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="size-3.5" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="size-3" />
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
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// MAIN AI SHOP WORKSPACE PAGE
// ============================================================

export default function AIShopPage() {
  const router = useRouter();
  const { isMerchant, customerProfile, isCustomer, openAuthModal } = useAuth();
  const { state: cartState, summary: cartSummary, addItem, removeItem, updateQuantity } = useCart();
  const {
    messages,
    sendMessage,
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic loading indicator messages
  const loadingPhrases = [
    'Understanding your requirements…',
    'Querying verified catalog via n8n…',
    'Analyzing specifications & best matches…',
  ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Add to Bag with instant visual feedback
  const handleAddProduct = useCallback(
    (product: Product) => {
      const defaultVariant = product.variants?.[0];
      addItem(product, defaultVariant, 1, 'ai_primary');
      setAddedItemIds((prev) => ({ ...prev, [product.product_id]: true }));
      setTimeout(() => {
        setAddedItemIds((prev) => ({ ...prev, [product.product_id]: false }));
      }, 2000);
    },
    [addItem]
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
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5B4DFB] to-[#7952F5] text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  Shop<span className="text-[#5B4DFB]">N</span>Trust
                </span>
                <span className="rounded-md bg-indigo-50 text-[#5B4DFB] border border-indigo-200/60 px-1.5 py-0.2 text-[9px] font-extrabold uppercase">
                  AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Autonomous Shopping Agent</p>
            </div>
          </Link>
        </div>

        {/* Right: Mode Badge, Bag Indicator & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#5B4DFB]/10 border border-[#5B4DFB]/20 px-3.5 py-1 text-xs font-bold text-[#5B4DFB]">
            <Sparkles className="size-3.5" />
            <span>AI Shopping Mode</span>
          </div>

          {/* Shared Bag Icon with live badge */}
          <Link
            href="/cart"
            className="relative flex size-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="View Shared Cart"
          >
            <ShoppingBag className="size-4.5" />
            {cartSummary.itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-xs">
                {cartSummary.itemCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          {isCustomer ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-xs">
                {userName[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{userName}</p>
                <p className="text-[10px] font-medium text-emerald-600">Authenticated Customer</p>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={openAuthModal}
              className="h-8 px-3 text-xs font-bold bg-[#5B4DFB] hover:bg-[#4d3ef7] text-white rounded-lg shadow-xs cursor-pointer"
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN (3 cols): Navigation & Preferences */}
        {/* ============================================================ */}
        <aside className="lg:col-span-3 space-y-4 hidden lg:block">
          {/* Navigation Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-1">
            <div className="flex items-center gap-3 rounded-xl bg-[#5B4DFB]/10 p-3 text-[#5B4DFB]">
              <Sparkles className="size-5 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-tight">AI Assistant</p>
                <p className="text-[10px] text-[#5B4DFB]/80">Connected to Live n8n Agent</p>
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
                <p className="font-bold text-slate-800">54 Canonical Products</p>
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
        {/* CENTER COLUMN (6 cols): AI Chat & Live Recommendations */}
        {/* ============================================================ */}
        <section className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[calc(100vh-100px)] min-h-[650px] overflow-hidden">
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
                  REAL n8n AI AGENT • Connected
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
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#5B4DFB]/10 text-[#5B4DFB] shrink-0 mt-1">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs sm:text-[13px] text-slate-800 leading-relaxed space-y-3">
                      {/* REAL AI Customer-Facing Output */}
                      <p className="whitespace-pre-line text-slate-800 leading-relaxed font-normal">
                        {msg.content}
                      </p>

                      {/* Error Retry Option */}
                      {msg.status === 'error' && lastFailedQuery && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={retryLastQuery}
                            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="size-3" />
                            <span>Retry Query</span>
                          </Button>
                        </div>
                      )}

                      {/* Recommended Live Product Cards inside the Conversation */}
                      {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Recommended Canonical Products:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {msg.recommendedProductIds.map((pId) => {
                              const matchObj = msg.matches?.find((m) => m.productId === pId);
                              return (
                                <InChatProductCard
                                  key={pId}
                                  productId={pId}
                                  matchData={matchObj}
                                  onAdd={handleAddProduct}
                                  isAdded={!!addedItemIds[pId]}
                                />
                              );
                            })}
                          </div>
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
                            <span>Browse 54 Canonical Items in Catalog</span>
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
              All recommended products are verified against the ShopNTrust canonical 54-item catalog.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (3 cols): Your Shared Cart & Checkout */}
        {/* ============================================================ */}
        <aside className="lg:col-span-3 space-y-4">
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
