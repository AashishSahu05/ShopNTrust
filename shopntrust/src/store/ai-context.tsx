// ============================================================
// ShopNTrust — Global AI Session Provider (Survives Route Navigation)
// ============================================================
// Persists active AI conversations across route transitions (/ai-shop ↔ /product ↔ /cart)
// and synchronizes persistent chat history for authenticated customers in Supabase.
// ============================================================

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AIMessage, AgentContextPayload, CartItem } from '@/types';
import { useAuth } from '@/store/auth-context';
import { useCart } from '@/store/cart-context';
import { sendAgentMessage } from '@/lib/api/agent';
import { getProductById } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import {
  getDbChatSessions,
  createDbChatSession,
  saveDbChatMessages,
  getDbChatMessages,
  type DbChatSession,
} from '@/lib/supabase/db';

interface AIContextValue {
  messages: AIMessage[];
  activeSessionId: string;
  isLoading: boolean;
  loadingStep: number;
  activeBudget: string;
  lastFailedQuery: string | null;
  historySessions: DbChatSession[];
  isHistoryOpen: boolean;
  sendMessage: (query: string) => Promise<void>;
  compareProducts: (productIds: string[]) => Promise<void>;
  startNewChat: () => void;
  loadHistorySession: (sessionId: string) => Promise<void>;
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  retryLastQuery: () => Promise<void>;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function AISessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isCustomer, customerProfile, viewedProductIds } = useAuth();
  const { state: cartState, addItem, removeItem, updateQuantity } = useCart();
  const cartItems = cartState.items;

  const userName = customerProfile?.name ? customerProfile.name.split(' ')[0] : 'Nathan';

  const defaultInitialMessages: AIMessage[] = useMemo(
    () => [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Hello ${userName}! 👋 I'm your AI shopping assistant connected directly to our 66-product catalog.\n\nI can help you find smartphones, audio, smartwatches, athletic gear, and wellness products under your exact budget. What are you looking for today?`,
        timestamp: 0,
      },
    ],
    [userName]
  );

  const [activeSessionId, setActiveSessionId] = useState<string>('snt-active-session');
  const [messages, setMessages] = useState<AIMessage[]>(defaultInitialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeBudget, setActiveBudget] = useState('₹10,000 - ₹50,000');
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [historySessions, setHistorySessions] = useState<DbChatSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const messageIdCounter = useRef(1);
  const userId = isCustomer && user.role === 'customer' ? user.profile.id : null;

  // Sync / Load Chat History for Authenticated Customer
  const refreshHistorySessions = useCallback(async () => {
    if (userId) {
      const sessions = await getDbChatSessions(userId);
      setHistorySessions(sessions);
    } else {
      setHistorySessions([]);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    async function fetchSessions() {
      if (userId) {
        const sessions = await getDbChatSessions(userId);
        if (active) setHistorySessions(sessions);
      } else if (active) {
        setHistorySessions([]);
      }
    }
    fetchSessions();
    return () => {
      active = false;
    };
  }, [userId]);

  // Dynamic loading indicator cycle
  const loadingPhrasesCount = 3;
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingPhrasesCount);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Start New Chat Session
  const startNewChat = useCallback(() => {
    const newSessionId = `snt-session-${Date.now()}`;
    setActiveSessionId(newSessionId);
    setMessages(defaultInitialMessages);
    setLastFailedQuery(null);
  }, [defaultInitialMessages]);

  // Load a Past History Session
  const loadHistorySession = useCallback(
    async (sessionId: string) => {
      if (!userId || !sessionId) return;
      setIsLoading(true);
      try {
        const pastMessages = await getDbChatMessages(sessionId, userId);
        if (pastMessages && pastMessages.length > 0) {
          setActiveSessionId(sessionId);
          setMessages(pastMessages);
          setIsHistoryOpen(false);
        }
      } catch (err) {
        console.error('Failed to load past chat session:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Send Message
  const sendMessage = useCallback(
    async (queryText: string) => {
      const query = queryText.trim();
      if (!query || isLoading) return;

      setLastFailedQuery(null);

      const msgId = ++messageIdCounter.current;
      const userMsg: AIMessage = {
        id: `user-${msgId}`,
        role: 'user',
        content: query,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      // Extract budget if stated
      const budgetMatch = query.match(/(?:under|below|budget|within|less than)\s*(?:₹|rs\.?)?\s*([\d,]+)/i);
      if (budgetMatch) {
        const val = budgetMatch[1].replace(/,/g, '');
        setActiveBudget(`Up to ${formatPrice(parseInt(val, 10))}`);
      }

      try {
        const contextPayload: AgentContextPayload = {
          profile:
            isCustomer && customerProfile
              ? {
                  name: customerProfile.name,
                  email: customerProfile.email,
                  preferredCategories: customerProfile.preferredCategories,
                }
              : undefined,
          session: {
            viewedProductIds: viewedProductIds,
            cartProductIds: cartItems.map((i: CartItem) => i.product.product_id),
          },
          conversation: {
            query,
          },
        };

        const agentRes = await sendAgentMessage(query, activeSessionId, contextPayload);

        // Phase 16: Priority 1 - Structured AI Action Dispatcher
        // Source of truth: agentRes.actions (NOT brittle natural language matching)
        if (Array.isArray(agentRes.actions) && agentRes.actions.length > 0) {
          for (const action of agentRes.actions) {
            if (!action || !action.type) continue;

            switch (action.type) {
              case 'ADD_TO_BAG': {
                const targetIds = (action.productIds && action.productIds.length > 0)
                  ? action.productIds
                  : (agentRes.recommendedProductIds && agentRes.recommendedProductIds.length > 0 ? [agentRes.recommendedProductIds[0]] : []);
                const qty = typeof action.quantity === 'number' && action.quantity > 0 ? action.quantity : 1;

                for (const pId of targetIds) {
                  const canonical = getProductById(pId);
                  if (canonical) {
                    addItem(canonical, canonical.variants?.[0], qty, 'ai_primary');
                  }
                }
                break;
              }

              case 'REMOVE_FROM_BAG': {
                const targetIds = action.productIds || [];
                for (const pId of targetIds) {
                  if (pId) {
                    removeItem(pId);
                  }
                }
                break;
              }

              case 'UPDATE_QUANTITY': {
                const targetIds = action.productIds || [];
                const qty = typeof action.quantity === 'number' ? action.quantity : 1;
                if (qty > 0) {
                  for (const pId of targetIds) {
                    if (pId) {
                      updateQuantity(pId, qty);
                    }
                  }
                }
                break;
              }

              case 'OPEN_CART': {
                if (typeof window !== 'undefined') {
                  const bagEl = document.getElementById('shared-bag-sidebar');
                  if (bagEl) {
                    bagEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    bagEl.classList.add('ring-2', 'ring-[#5B4DFB]', 'ring-offset-2');
                    setTimeout(() => {
                      bagEl.classList.remove('ring-2', 'ring-[#5B4DFB]', 'ring-offset-2');
                    }, 2000);
                  } else {
                    router.push('/cart');
                  }
                  window.dispatchEvent(new CustomEvent('snt:open-cart'));
                }
                break;
              }

              case 'OPEN_CHECKOUT': {
                // Strictly opens /checkout page without calling or initiating any payment flow
                router.push('/checkout');
                break;
              }

              default:
                // Non-commerce UI display instructions (e.g. SHOW_PRODUCTS, SHOW_COMPARISON)
                break;
            }
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
          recommendations: agentRes.recommendations,
          comparison: agentRes.comparison,
          upsell: agentRes.upsell,
          crossSell: agentRes.crossSell,
          actions: agentRes.actions,
          matches: agentRes.matches,
          recommendationReasons: agentRes.recommendationReasons,
          matchFactors: agentRes.matchFactors,
          suggestedPrompts: agentRes.suggestedPrompts,
          status: 'success',
        };

        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);

        // Phase 8: Emit non-blocking AI commerce events for merchant attribution
        try {
          if (messages.length <= 1) {
            fetch('/api/analytics/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: activeSessionId,
                eventType: 'AI_SESSION_STARTED',
                userId,
              }),
            }).catch(() => {});
          }

          if (agentRes.recommendedProductIds && agentRes.recommendedProductIds.length > 0) {
            fetch('/api/analytics/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: activeSessionId,
                eventType: 'AI_RECOMMENDATION_SHOWN',
                userId,
                metadata: { productIds: agentRes.recommendedProductIds },
              }),
            }).catch(() => {});
          }

          if (agentRes.upsell && agentRes.upsell.length > 0) {
            fetch('/api/analytics/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: activeSessionId,
                eventType: 'AI_UPSELL_SHOWN',
                userId,
                metadata: { productIds: agentRes.upsell.map((u) => u.productId) },
              }),
            }).catch(() => {});
          }

          if (agentRes.crossSell && agentRes.crossSell.length > 0) {
            fetch('/api/analytics/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: activeSessionId,
                eventType: 'AI_CROSS_SELL_SHOWN',
                userId,
                metadata: { productIds: agentRes.crossSell.map((c) => c.productId) },
              }),
            }).catch(() => {});
          }
        } catch {
          // Non-blocking analytics logging
        }

        // Persist to Supabase if authenticated
        if (userId) {
          const sessionTitle =
            messages.length <= 1
              ? query.slice(0, 40)
              : historySessions.find((s) => s.id === activeSessionId)?.title || query.slice(0, 40);

          await createDbChatSession(userId, activeSessionId, sessionTitle);
          await saveDbChatMessages(userId, activeSessionId, [userMsg, assistantMsg]);
          refreshHistorySessions();
        }

      } catch {
        setLastFailedQuery(query);
        const errId = ++messageIdCounter.current;
        const errorMsg: AIMessage = {
          id: `error-${errId}`,
          role: 'assistant',
          content: 'Something went wrong while reaching your shopping assistant. Please try again.',
          timestamp: Date.now(),
          status: 'error',
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages,
      isLoading,
      isCustomer,
      customerProfile,
      viewedProductIds,
      cartItems,
      activeSessionId,
      addItem,
      removeItem,
      updateQuantity,
      router,
      userId,
      historySessions,
      refreshHistorySessions,
    ]
  );

  // Quick Compare Products Trigger
  const compareProducts = useCallback(
    async (productIds: string[]) => {
      const validIds = productIds.filter((id) => !!getProductById(id));
      if (validIds.length >= 2) {
        await sendMessage(`Compare ${validIds[0]} and ${validIds[1]}`);
      } else {
        await sendMessage(`Compare these recommended options`);
      }
    },
    [sendMessage]
  );

  const retryLastQuery = useCallback(async () => {
    if (lastFailedQuery) {
      await sendMessage(lastFailedQuery);
    }
  }, [lastFailedQuery, sendMessage]);

  const openHistoryDrawer = useCallback(() => setIsHistoryOpen(true), []);
  const closeHistoryDrawer = useCallback(() => setIsHistoryOpen(false), []);

  const value = useMemo<AIContextValue>(
    () => ({
      messages,
      activeSessionId,
      isLoading,
      loadingStep,
      activeBudget,
      lastFailedQuery,
      historySessions,
      isHistoryOpen,
      sendMessage,
      compareProducts,
      startNewChat,
      loadHistorySession,
      openHistoryDrawer,
      closeHistoryDrawer,
      retryLastQuery,
    }),
    [
      messages,
      activeSessionId,
      isLoading,
      loadingStep,
      activeBudget,
      lastFailedQuery,
      historySessions,
      isHistoryOpen,
      sendMessage,
      compareProducts,
      startNewChat,
      loadHistorySession,
      openHistoryDrawer,
      closeHistoryDrawer,
      retryLastQuery,
    ]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAISession(): AIContextValue {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAISession must be used within an AISessionProvider');
  }
  return context;
}
