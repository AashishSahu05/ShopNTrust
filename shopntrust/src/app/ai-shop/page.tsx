// ============================================================
// ShopNTrust — AI Shopping Assistant Workspace (/ai-shop)
// ============================================================
// Exact 3-column AI Shopping Interface matching the provided design:
// Left: Nav & Preferences | Center: AI Chat & Top Recommendations | Right: Your AI Cart & Checkout
// Webhook: https://shopntrust.app.n8n.cloud/webhook/1f4f8f8b-a840-4d0f-8d99-96db0cee2865
// ============================================================

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  MoreHorizontal,
  Lock,
  CheckCircle2,
  Camera,
  ArrowRight,
  PlusCircle,
  History,
  Bookmark,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';
import { useCart, getCartItemKey } from '@/store/cart-context';
import { getProductById } from '@/lib/catalog';
import { getProductImageUrl } from '@/lib/product-images';
import { formatPrice } from '@/lib/format';
import { sendAgentMessage } from '@/lib/api/agent';
import type { AIMessage, AgentContextPayload, CartItem } from '@/types';

export default function AIShopPage() {
  const router = useRouter();
  const { isMerchant, customerProfile, viewedProductIds, isCustomer } = useAuth();
  const { state: cartState, summary: cartSummary, addItem, removeItem, updateQuantity } = useCart();
  const cartItems = cartState.items;

  // Role Guard: Merchants redirected to /merchant
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  // Active User Display Name
  const userName = customerProfile?.name ? customerProfile.name.split(' ')[0] : 'Nathan';

  // Initial Welcome Message
  const initialMessages: AIMessage[] = useMemo(
    () => [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Hello ${userName}! 👋 I'm your AI shopping assistant. I can help you find the perfect products, compare options, and even help you complete your purchase.\n\nWhat are you looking for today?`,
        timestamp: 0,
      },
    ],
    [userName]
  );

  // Conversation & Workspace State
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savedProductIds] = useState<string[]>([]);
  const [activeBudget, setActiveBudget] = useState('₹10,000 - ₹50,000');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(1);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Reset Chat to Initial Greeting
  const handleNewChat = () => {
    setMessages(initialMessages);
  };

  // Handle Query Submission (Connects to n8n Webhook)
  const handleSubmitQuery = useCallback(
    async (queryToRun?: string) => {
      const query = (queryToRun || inputText).trim();
      if (!query || isLoading) return;

      setInputText('');

      const msgId = ++messageIdCounter.current;
      const userMsg: AIMessage = {
        id: `user-${msgId}`,
        role: 'user',
        content: query,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Check if user stated a new budget
      const budgetMatch = query.match(/(?:under|below|budget|within|less than)\s*(?:₹|rs\.?)?\s*([\d,]+)/i);
      if (budgetMatch) {
        const val = budgetMatch[1].replace(/,/g, '');
        setActiveBudget(`Up to ${formatPrice(parseInt(val, 10))}`);
      }

      try {
        const contextPayload: AgentContextPayload = {
          profile: isCustomer && customerProfile ? {
            name: customerProfile.name,
            email: customerProfile.email,
            preferredCategories: customerProfile.preferredCategories,
          } : undefined,
          session: {
            viewedProductIds: viewedProductIds,
            cartProductIds: cartItems.map((i: CartItem) => i.product.product_id),
          },
          conversation: {
            query,
          },
        };

        // Call Centralized n8n Agent Client
        const agentRes = await sendAgentMessage(query, 'ai-shop-session', contextPayload);

        // Handle specific action chips: "Add first to cart"
        if (query.toLowerCase().includes('add first to cart') || query.toLowerCase().includes('add to cart')) {
          const firstId = agentRes.recommendedProductIds[0] || 'P101';
          const p = getProductById(firstId);
          if (p) {
            addItem(p, p.variants?.[0], 1, 'ai_primary');
          }
        }

        const respId = ++messageIdCounter.current;
        const assistantMsg: AIMessage = {
          id: `assistant-${respId}`,
          role: 'assistant',
          content: agentRes.message,
          timestamp: Date.now(),
          extractedIntent: agentRes.extractedIntent,
          recommendedProductIds: agentRes.recommendedProductIds,
          matches: agentRes.matches,
          recommendationReasons: agentRes.recommendationReasons,
          suggestedPrompts: agentRes.suggestedPrompts,
          status: 'success',
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errId = ++messageIdCounter.current;
        const errorMsg: AIMessage = {
          id: `error-${errId}`,
          role: 'assistant',
          content:
            'Something went wrong while reaching your shopping assistant. Please try again.',
          timestamp: Date.now(),
          status: 'error',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputText, isLoading, isCustomer, customerProfile, viewedProductIds, cartItems, addItem]
  );

  if (isMerchant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5B4DFB] to-[#7952F5] text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900">ShopNTrust</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">AI Shopping Assistant</p>
          </div>
        </div>

        {/* Right: Mode Badge & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#5B4DFB]/10 border border-[#5B4DFB]/20 px-3.5 py-1 text-xs font-bold text-[#5B4DFB]">
            <Sparkles className="size-3.5" />
            <span>AI Shopping</span>
          </div>

          {/* Cart Icon with badge */}
          <Link
            href="/cart"
            className="relative flex size-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ShoppingBag className="size-4.5" />
            {cartSummary.itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-xs">
                {cartSummary.itemCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-xs">
              {userName[0]}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{userName}</p>
              <p className="text-[10px] font-medium text-slate-500">Premium Member</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN (3 cols): Navigation & Preferences */}
        {/* ============================================================ */}
        <aside className="lg:col-span-3 space-y-4 hidden lg:block">
          {/* Nav Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-1">
            {/* Active AI Shopping */}
            <div className="flex items-center gap-3 rounded-xl bg-[#5B4DFB]/10 p-3 text-[#5B4DFB]">
              <Sparkles className="size-5 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-tight">AI Shopping</p>
                <p className="text-[10px] text-[#5B4DFB]/80">Your AI Shopping Assistant</p>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <PlusCircle className="size-4 text-slate-400" />
              <span>New Chat</span>
            </button>

            <button
              onClick={() => handleSubmitQuery('Show me previous chat history')}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <History className="size-4 text-slate-400" />
              <span>Chat History</span>
            </button>

            <button
              onClick={() => {
                if (savedProductIds.length > 0) {
                  handleSubmitQuery(`Show my ${savedProductIds.length} saved items`);
                }
              }}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bookmark className="size-4 text-slate-400" />
                <span>Saved Items</span>
              </div>
              {savedProductIds.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {savedProductIds.length}
                </span>
              )}
            </button>
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
                <span>Be specific about your needs for better recommendations</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Heart className="size-4 text-purple-500 shrink-0 mt-0.5" />
                <span>Mention your budget for accurate suggestions</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShoppingBag className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Ask for comparisons to make informed choices</span>
              </li>
            </ul>
          </div>

          {/* Your Preferences Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Sparkles className="size-4" />
              <span>Your Preferences</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Budget Range</p>
                <p className="font-bold text-slate-800">{activeBudget}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Categories</p>
                <p className="font-bold text-slate-800">
                  {customerProfile?.preferredCategories?.length
                    ? customerProfile.preferredCategories.join(', ')
                    : 'Electronics, Fashion'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Style</p>
                <p className="font-bold text-slate-800">Premium, Modern</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER COLUMN (6 cols): AI Chat & Top Recommendations */}
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
                <h2 className="text-sm font-bold text-slate-900 leading-tight">ShopNTrust AI</h2>
                <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  n8n AI AGENT ACTIVE • Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute' : 'Unmute'}
              >
                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              <button
                onClick={handleNewChat}
                className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Clear Chat"
              >
                <Trash2 className="size-4" />
              </button>
              <button
                className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Options"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          {/* Chat Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                {msg.role === 'assistant' ? (
                  /* Bot Message */
                  <div className="flex items-start gap-3 max-w-xl">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#5B4DFB]/10 text-[#5B4DFB] shrink-0 mt-1">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs sm:text-[13px] text-slate-800 leading-relaxed space-y-2">
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {/* Recommended Product Cards inside Chat Message */}
                      {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                        <div className="pt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.recommendedProductIds.map((pId) => {
                            const product = getProductById(pId);
                            if (!product) return null;
                            const img = getProductImageUrl(product.product_id);
                            const defaultVariant = product.variants?.[0];

                            return (
                              <div
                                key={product.product_id}
                                className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs hover:border-[#5B4DFB]/50 hover:shadow-xs transition-all text-left"
                              >
                                <Link
                                  href={`/product/${product.product_id}`}
                                  className="relative size-12 rounded-lg bg-slate-50 border border-slate-100 p-1 shrink-0 overflow-hidden flex items-center justify-center"
                                >
                                  {img ? (
                                    <Image
                                      src={img}
                                      alt={product.name}
                                      fill
                                      className="object-contain"
                                      unoptimized
                                    />
                                  ) : (
                                    <ShoppingBag className="size-4 text-slate-400" />
                                  )}
                                </Link>

                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/product/${product.product_id}`}
                                    className="text-xs font-bold text-slate-900 hover:text-[#5B4DFB] truncate block"
                                  >
                                    {product.name}
                                  </Link>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                                      {formatPrice(product.price)}
                                    </span>
                                    <Button
                                      size="sm"
                                      onClick={() => addItem(product, defaultVariant, 1, 'ai_primary')}
                                      className="h-6 px-2 text-[10px] font-bold bg-[#5B4DFB] hover:bg-[#4d3ef7] text-white rounded-md cursor-pointer shadow-xs"
                                    >
                                      + Add to Bag
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Out of catalog browse link */}
                      {msg.recommendedProductIds && msg.recommendedProductIds.length === 0 && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 bg-white border-slate-200"
                            render={<Link href="/shop" />}
                          >
                            <Store className="size-3.5 mr-1.5" />
                            <span>Browse 54 Canonical Items</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* User Message */
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

            {/* Follow-up Prompts */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {[
                'Compare smartphones',
                'Best battery life under ₹50,000',
                'Show noise-cancelling headphones',
                'Show more options',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSubmitQuery(prompt)}
                  className="rounded-full bg-slate-100 hover:bg-[#5B4DFB]/10 hover:text-[#5B4DFB] border border-slate-200/60 px-3 py-1 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-[#5B4DFB]/5 border border-[#5B4DFB]/20 p-3.5 text-xs font-semibold text-[#5B4DFB]">
                <Sparkles className="size-4 animate-spin" />
                <span>Thinking & querying verified catalog...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar at Bottom */}
          <div className="p-3.5 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitQuery();
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 focus-within:border-[#5B4DFB] focus-within:bg-white transition-all"
            >
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Attach item"
              >
                <Paperclip className="size-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask me anything about products, compare, or help with purchase..."
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
              AI recommendations are based on product data. Please verify details before purchasing.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (3 cols): Your AI Cart & Checkout */}
        {/* ============================================================ */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Cart Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShoppingBag className="size-4 text-[#5B4DFB]" />
                <span>Your AI Cart</span>
              </div>
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {cartSummary.itemCount}
              </span>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <ShoppingBag className="size-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Your AI Cart is empty</p>
                <p className="text-[11px] text-slate-400">
                  Ask the AI assistant for recommendations or click &quot;+ Add to Bag&quot;.
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

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.product.name}
                          </p>
                          <button
                            onClick={() => removeItem(itemKey)}
                            className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
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

            {/* Cart Summary */}
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

                {/* Primary Checkout Button */}
                <Button
                  onClick={() => router.push('/checkout')}
                  className="w-full h-10 bg-gradient-to-r from-[#5B4DFB] to-[#7952F5] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer gap-2 mt-2"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight className="size-3.5" />
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-emerald-700 pt-1">
                  <Lock className="size-3" />
                  <span>Secure Checkout with Razorpay</span>
                </div>
              </div>
            )}
          </div>

          {/* Why Shop with AI? Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="size-4" />
              <span>Why Shop with AI?</span>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Personalized Recommendations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Real-time Product Information</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Expert Buying Guidance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Secure & Fast Checkout</span>
              </li>
            </ul>
          </div>
        </aside>

      </main>
    </div>
  );
}
