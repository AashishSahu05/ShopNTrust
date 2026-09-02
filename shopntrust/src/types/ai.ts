// ============================================================
// ShopNTrust — AI/Agent Types
// ============================================================
// Types for the AI shopping experience and n8n agent integration.
// ============================================================

import type { ProductCategory } from './product';

/** Role of a message in the conversation */
export type MessageRole = 'user' | 'assistant';

/** Status of an AI request */
export type AIRequestStatus = 'idle' | 'loading' | 'success' | 'error';

/** Qualitative match confidence */
export type MatchLabel = 'Strong Match' | 'Good Match' | 'Alternative Option';

/**
 * Structured intent extracted from the user's natural language request.
 * Only populated with criteria explicitly stated by the user.
 */
export interface AgentExtractedIntent {
  /** Target product category if mentioned */
  category?: ProductCategory | string;

  /** Primary priority/feature mentioned (e.g. "Camera & Zoom", "Active Noise Cancellation") */
  priority?: string;

  /** Session/Query-specific budget limit if specified (NOT stored in profile) */
  budget?: number;

  /** Intended use case if stated (e.g. "Long flights", "Marathon training") */
  useCase?: string;

  /** Key requirements / constraints identified */
  keyConstraints?: string[];
}

/**
 * Detailed match reasoning and attributes for a recommended product.
 */
export interface AgentProductMatch {
  /** Canonical product ID (P101–P154) */
  productId: string;

  /** Qualitative match assessment */
  matchLabel: MatchLabel;

  /** Transparent, verified reasons why this product matches the query */
  reasoning: string[];

  /** Key highlights derived from canonical product specs */
  keyAttributes: string[];
}

/**
 * Explicit context payload ready for future agent transmission.
 */
export interface AgentContextPayload {
  profile?: {
    name?: string;
    email?: string;
    preferredCategories: ProductCategory[];
  };
  session: {
    viewedProductIds: string[];
    cartProductIds: string[];
  };
  conversation: {
    query: string;
    extractedIntent?: AgentExtractedIntent;
  };
}

/**
 * A single message in the AI conversation.
 */
export interface AIMessage {
  /** Unique message ID */
  id: string;

  /** Who sent this message */
  role: MessageRole;

  /** Text content of the message */
  content: string;

  /** Timestamp */
  timestamp: number;

  /** Structured intent parsed from user query (assistant only) */
  extractedIntent?: AgentExtractedIntent;

  /** Product IDs recommended in this message (assistant only) */
  recommendedProductIds?: string[];

  /** Detailed match data per product (assistant only) */
  matches?: AgentProductMatch[];

  /** Recommendation reasons per product (keyed by product_id) */
  recommendationReasons?: Record<string, string>;

  /** Match factors per product (keyed by product_id) */
  matchFactors?: Record<string, string[]>;

  /** Upsell product references (assistant only) */
  upsellProductIds?: string[];

  /** Cross-sell product references (assistant only) */
  crossSellProductIds?: string[];

  /** Suggested follow-up prompts (assistant only) */
  suggestedPrompts?: string[];

  /** Request status (for the message that triggered this response) */
  status?: AIRequestStatus;
}

/**
 * AI session state — tracks the full conversation.
 */
export interface AISessionState {
  /** Session identifier for n8n context continuity */
  sessionId: string;

  /** All messages in this session */
  messages: AIMessage[];

  /** Current request status */
  status: AIRequestStatus;

  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Normalized AI response — the frontend's internal model
 * after processing a raw n8n response or demo agent.
 */
export interface NormalizedAIResponse {
  /** The assistant's text message */
  message: string;

  /** Structured intent parsed from user query */
  extractedIntent?: AgentExtractedIntent;

  /** Product IDs recommended by the agent */
  recommendedProductIds: string[];

  /** Detailed match data */
  matches?: AgentProductMatch[];

  /** Recommendation reasons per product_id */
  recommendationReasons?: Record<string, string>;

  /** Match factors per product_id */
  matchFactors?: Record<string, string[]>;

  /** Upsell product IDs */
  upsellProductIds?: string[];

  /** Cross-sell product IDs */
  crossSellProductIds?: string[];

  /** Suggested follow-up prompts */
  suggestedPrompts?: string[];
}

/**
 * Raw n8n agent webhook request — what we send TO n8n in Phase 5.
 */
export interface AgentWebhookRequest {
  /** The user's message */
  message: string;

  /** Session ID for conversation continuity */
  sessionId: string;

  /** Optional: current cart product IDs for context */
  cartProductIds?: string[];

  /** Optional: customer context payload */
  context?: AgentContextPayload;
}

/**
 * Raw n8n agent webhook response.
 */
export interface AgentWebhookResponse {
  /** Raw response — shape TBD based on actual n8n output */
  [key: string]: unknown;
}
