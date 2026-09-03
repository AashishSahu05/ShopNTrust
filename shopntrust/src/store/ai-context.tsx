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
  const { user, isCustomer, customerProfile, viewedProductIds } = useAuth();
  const { state: cartState, addItem } = useCart();
  const cartItems = cartState.items;

  const userName = customerProfile?.name ? customerProfile.name.split(' ')[0] : 'Nathan';

  const defaultInitialMessages: AIMessage[] = useMemo(
    () => [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Hello ${userName}! 👋 I'm your AI shopping assistant connected directly to our 54-product catalog.\n\nI can help you find smartphones, audio, smartwatches, athletic gear, and wellness products under your exact budget. What are you looking for today?`,
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

        // Handle direct chat add to bag
        if (query.toLowerCase().includes('add to bag') || query.toLowerCase().includes('add to cart')) {
          const firstId = agentRes.recommendedProductIds[0];
          if (firstId) {
            const prod = getProductById(firstId);
            if (prod) {
              addItem(prod, prod.variants?.[0], 1, 'ai_primary');
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
      userId,
      historySessions,
      refreshHistorySessions,
    ]
  );

  // Quick Compare Products Trigger
  const compareProducts = useCallback(
    async (productIds: string[]) => {
      const validNames = productIds.map((id) => getProductById(id)?.name).filter(Boolean);
      if (validNames.length >= 2) {
        await sendMessage(`Compare ${validNames[0]} and ${validNames[1]}`);
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
