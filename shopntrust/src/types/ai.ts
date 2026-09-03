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
 * Structured recommendation item provided by n8n or catalog reasoning.
 */
export interface StructuredRecommendation {
  /** Canonical product ID (P101–P154) */
  productId: string;

  /** Concise customer-facing explanation of why this product matches */
  reason?: string;

  /** Specific match factors / bullets derived from query & session */
  matchPoints?: string[];

  /** Qualitative match assessment */
  matchLabel?: MatchLabel;
}

/**
 * Structured comparison metadata for inline product comparison.
 */
export interface AIComparisonData {
  /** Whether comparison mode is active/enabled */
  enabled: boolean;

  /** Canonical product IDs to compare */
  productIds: string[];

  /** Optional comparison title (e.g. "Flagship Camera Comparison") */
  title?: string;

  /** Optional summary highlight from AI reasoning */
  summary?: string;
}

/**
 * Structured upsell recommendation (better / premium alternative).
 */
export interface UpsellRecommendation {
  /** Canonical product ID of the upgrade (P101–P154) */
  productId: string;

  /** Canonical product ID of the product being upgraded (if applicable) */
  sourceProductId?: string;

  /** Customer-facing reason why this upgrade is worth considering */
  reason?: string;

  /** Concrete improvement bullets / benefits */
  benefits?: string[];

  /** Display badge label (e.g. "Worth the Upgrade", "Premium Alternative") */
  label?: string;
}

/**
 * Structured cross-sell recommendation (complementary product / accessory).
 */
export interface CrossSellRecommendation {
  /** Canonical product ID of the complementary item (P101–P154) */
  productId: string;

  /** Canonical product ID of the item it pairs with */
  sourceProductId?: string;

  /** Customer-facing reason why this add-on complements the setup */
  reason?: string;

  /** Complementary utility bullets */
  benefits?: string[];

  /** Display badge label (e.g. "Pairs Well With", "Complete Your Setup") */
  label?: string;
}

/** Supported structured agent action types */
export type AIActionType =
  | 'SHOW_PRODUCTS'
  | 'SHOW_COMPARISON'
  | 'SHOW_UPSELL'
  | 'SHOW_CROSS_SELL'
  | 'ADD_TO_BAG'
  | 'REMOVE_FROM_BAG'
  | 'UPDATE_QUANTITY'
  | 'OPEN_CART'
  | 'OPEN_CHECKOUT';

/** Structured action returned by agent */
export interface AIAction {
  type: AIActionType;
  productIds?: string[];
  quantity?: number;
  metadata?: Record<string, unknown>;
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

  /** Structured recommendation items with reason & match points (assistant only) */
  recommendations?: StructuredRecommendation[];

  /** Detailed match data per product (assistant only) */
  matches?: AgentProductMatch[];

  /** Structured inline comparison data (assistant only) */
  comparison?: AIComparisonData;

  /** Structured upsell upgrade items (assistant only - Phase 7) */
  upsell?: UpsellRecommendation[];

  /** Structured complementary cross-sell items (assistant only - Phase 7) */
  crossSell?: CrossSellRecommendation[];

  /** Structured actions dispatched by the agent (assistant only) */
  actions?: AIAction[];

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

  /** Structured recommendation items with reasons & match points */
  recommendations?: StructuredRecommendation[];

  /** Structured comparison data */
  comparison?: AIComparisonData;

  /** Structured upsell recommendations (Phase 7) */
  upsell?: UpsellRecommendation[];

  /** Structured cross-sell recommendations (Phase 7) */
  crossSell?: CrossSellRecommendation[];

  /** Structured agent actions */
  actions?: AIAction[];

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
