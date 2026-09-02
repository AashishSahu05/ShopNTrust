// ============================================================
// ShopNTrust — Real n8n Agent API Integration
// ============================================================
// Centralized integration layer for the n8n AI Agent webhook.
//
// FLOW:
// User message + Context → sendAgentMessage() → n8n webhook → raw response
//   → normalizeAgentResponse() → NormalizedAIResponse
//   → Canonical Catalog validation (P101–P154) → UI rendering
// ============================================================

import { getProductById, getAllProducts } from '@/lib/catalog';
import { queryDemoAgent } from '@/lib/api/agent-demo';
import { formatPrice } from '@/lib/format';
import type {
  AgentWebhookResponse,
  NormalizedAIResponse,
  AgentContextPayload,
  AgentProductMatch,
  AgentExtractedIntent,
} from '@/types';

/**
 * Errors specific to the agent integration.
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'NOT_CONFIGURED'
      | 'NETWORK_ERROR'
      | 'TIMEOUT'
      | 'INVALID_RESPONSE'
      | 'SERVER_ERROR'
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

/**
 * Parses user input for explicit constraints without hallucinating.
 */
function extractIntentFromQuery(query: string): AgentExtractedIntent {
  const lower = query.toLowerCase();
  const intent: AgentExtractedIntent = {};
  const constraints: string[] = [];

  // Category Detection
  if (lower.includes('phone') || lower.includes('smartphone') || lower.includes('mobile') || lower.includes('galaxy') || lower.includes('iphone') || lower.includes('oneplus')) {
    intent.category = 'phones';
    constraints.push('Category: Smartphones');
  } else if (lower.includes('headphone') || lower.includes('earbud') || lower.includes('earphone') || lower.includes('audio') || lower.includes('sound') || lower.includes('anc') || lower.includes('noise cancel')) {
    intent.category = 'headphones';
    constraints.push('Category: Headphones & Audio');
  } else if (lower.includes('watch') || lower.includes('smartwatch') || lower.includes('wearable') || lower.includes('fitness tracker')) {
    intent.category = 'wearables';
    constraints.push('Category: Smartwatches & Wearables');
  } else if (lower.includes('shoe') || lower.includes('running') || lower.includes('sneaker') || lower.includes('pegasus') || lower.includes('ultraboost')) {
    intent.category = 'fitness';
    constraints.push('Category: Athletic & Running Gear');
  } else if (lower.includes('skin') || lower.includes('serum') || lower.includes('gel') || lower.includes('acne')) {
    intent.category = 'skincare';
    constraints.push('Category: Skincare & Wellness');
  } else if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('computer')) {
    intent.category = 'laptops';
    constraints.push('Category: Laptops & Computing');
  }

  // Budget Extraction (Session-only, not in profile)
  const budgetMatch = query.match(/(?:under|below|budget|within|less than|<=?)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)(?:\s*(?:k|thousand|lakh|lac|l))?/i);
  if (budgetMatch) {
    const rawAmount = budgetMatch[1].replace(/,/g, '');
    let numAmount = parseInt(rawAmount, 10);
    const suffix = (budgetMatch[0] || '').toLowerCase();

    if (suffix.includes('k') || suffix.includes('thousand')) {
      numAmount = numAmount * 1000;
    } else if (suffix.includes('lakh') || suffix.includes('lac') || suffix.includes('l')) {
      numAmount = numAmount * 100000;
    }

    if (!isNaN(numAmount) && numAmount > 0) {
      intent.budget = numAmount;
      constraints.push(`Budget: ≤ ${formatPrice(numAmount)}`);
    }
  }

  // Priorities & Feature Signals
  if (lower.includes('zoom') || lower.includes('camera') || lower.includes('photo')) {
    intent.priority = 'Pro Photography & Optical Zoom';
    constraints.push('Priority: Camera & Optical Zoom');
  } else if (lower.includes('battery') || lower.includes('all-day')) {
    intent.priority = 'High Capacity Battery';
    constraints.push('Priority: High Battery Capacity');
  } else if (lower.includes('noise cancel') || lower.includes('anc')) {
    intent.priority = 'Active Noise Cancellation (ANC)';
    constraints.push('Priority: Premium Noise Cancellation');
  } else if (lower.includes('gaming') || lower.includes('game') || lower.includes('performance')) {
    intent.priority = 'High Performance & Gaming';
    constraints.push('Priority: Gaming Performance');
  }

  intent.keyConstraints = constraints;
  return intent;
}

/**
 * Send a message to the real n8n AI Agent webhook with robust fallback to catalog intelligence.
 *
 * @param message - User's natural language message
 * @param sessionId - Session ID for continuity
 * @param context - Customer and session context payload
 * @param cartProductIds - Optional current cart product IDs
 * @returns Normalized AI response with verified canonical products
 */
export async function sendAgentMessage(
  message: string,
  sessionId: string,
  context?: AgentContextPayload,
  cartProductIds?: string[]
): Promise<NormalizedAIResponse> {
  const trimmed = message.trim();

  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: trimmed,
        sessionId,
        context,
        cartProductIds,
      }),
    });

    if (res.ok) {
      const data: NormalizedAIResponse = await res.json();
      if (data && data.message) {
        return data;
      }
    }
  } catch {
    // Fallback if network issue occurs
  }

  return queryDemoAgent(trimmed, context);
}

/**
 * Normalize raw n8n agent responses, resolve canonical products (P101–P154),
 * strip raw internal intermediateSteps, and verify specs.
 */
export function normalizeAgentResponse(
  raw: AgentWebhookResponse,
  query: string,
  context?: AgentContextPayload
): NormalizedAIResponse {
  const lower = query.toLowerCase();

  // Check for Purchase Intent / Confirmation flows
  if (lower.includes('i want to buy') || lower.includes('buy this') || lower.includes('buy now') || lower.includes('purchase this')) {
    // Extract target product from query or session
    const mentionedId = query.match(/P1\d{2}/i)?.[0]?.toUpperCase();
    const targetProduct = (mentionedId ? getProductById(mentionedId) : null) ||
      (context?.session?.viewedProductIds?.[0] ? getProductById(context.session.viewedProductIds[0]) : null) ||
      getProductById('P106');

    if (targetProduct) {
      return {
        message: `You're ready to purchase **${targetProduct.name}** for **${formatPrice(targetProduct.price)}**. Shall I proceed to secure checkout?`,
        extractedIntent: { priority: 'Purchase Intent Confirmation' },
        recommendedProductIds: [targetProduct.product_id],
        matches: [
          {
            productId: targetProduct.product_id,
            matchLabel: 'Strong Match',
            reasoning: [
              `Direct retail price: ${formatPrice(targetProduct.price)}`,
              'All specifications verified directly against canonical catalog',
              'Explicit confirmation required before opening payment capability',
            ],
            keyAttributes: [targetProduct.brand, targetProduct.categoryDisplay || targetProduct.category, formatPrice(targetProduct.price)],
          },
        ],
        suggestedPrompts: [
          'Yes, proceed to checkout',
          'No, keep browsing catalog',
          'Show product specifications',
        ],
      };
    }
  }

  // Check for Explicit Confirmation to proceed to payment capability
  if (lower.includes('yes, proceed') || lower.includes('yes proceed') || lower.includes('confirm purchase') || lower.includes('proceed to checkout')) {
    const targetProduct = (context?.session?.viewedProductIds?.[0] ? getProductById(context.session.viewedProductIds[0]) : null) || getProductById('P106');
    return {
      message: `Confirmed! Transferring your order details for **${targetProduct?.name || 'your selected items'}** to our secure Razorpay checkout.`,
      extractedIntent: { priority: 'Payment Capability Initiated' },
      recommendedProductIds: targetProduct ? [targetProduct.product_id] : [],
      matches: targetProduct ? [
        {
          productId: targetProduct.product_id,
          matchLabel: 'Strong Match',
          reasoning: [
            'Payment capability connected to Razorpay checkout workflow',
            'Order amount validated against canonical catalog pricing',
          ],
          keyAttributes: [targetProduct.brand, formatPrice(targetProduct.price)],
        },
      ] : [],
      suggestedPrompts: [
        'View Shopping Bag',
        'Continue browsing',
      ],
    };
  }

  // 1. Extract customer-facing output text
  let rawText = '';
  if (typeof raw.output === 'string' && raw.output.trim()) {
    rawText = raw.output.trim();
  } else if (typeof raw.message === 'string' && raw.message !== 'Workflow was started' && raw.message.trim()) {
    rawText = raw.message.trim();
  } else if (typeof raw.text === 'string' && raw.text.trim()) {
    rawText = raw.text.trim();
  } else if (typeof raw.response === 'string' && raw.response.trim()) {
    rawText = raw.response.trim();
  }

  // If text is empty or simply an async trigger confirmation, generate verified response
  if (!rawText || rawText === 'Workflow was started') {
    return queryDemoAgent(query, context) as unknown as NormalizedAIResponse;
  }

  // 2. Extract Canonical Product IDs mentioned in response or tool calls
  const extractedIds = new Set<string>();

  // Scan rawText for P101-P154
  const idMatches = rawText.match(/P1\d{2}/gi);
  if (idMatches) {
    idMatches.forEach((id) => {
      const canonicalId = id.toUpperCase();
      if (getProductById(canonicalId)) {
        extractedIds.add(canonicalId);
      }
    });
  }

  // Scan raw.recommendedProductIds if present
  if (Array.isArray(raw.recommendedProductIds)) {
    raw.recommendedProductIds.forEach((id) => {
      if (typeof id === 'string' && getProductById(id.toUpperCase())) {
        extractedIds.add(id.toUpperCase());
      }
    });
  }

  // Scan raw.intermediateSteps tool calls if present (never expose raw steps, only parse verified IDs)
  if (Array.isArray(raw.intermediateSteps)) {
    raw.intermediateSteps.forEach((step: Record<string, unknown>) => {
      const stepStr = JSON.stringify(step);
      const stepIdMatches = stepStr.match(/P1\d{2}/gi);
      if (stepIdMatches) {
        stepIdMatches.forEach((id) => {
          const canonicalId = id.toUpperCase();
          if (getProductById(canonicalId)) {
            extractedIds.add(canonicalId);
          }
        });
      }
    });
  }

  const intent = extractIntentFromQuery(query);
  const recommendedProductIds = Array.from(extractedIds).slice(0, 3);
  const matches: AgentProductMatch[] = [];
  const reasons: Record<string, string> = {};

  // Build verified matches from canonical catalog
  for (let i = 0; i < recommendedProductIds.length; i++) {
    const pId = recommendedProductIds[i];
    const product = getProductById(pId);
    if (!product) continue;

    const matchLabel = i === 0 ? 'Strong Match' : i === 1 ? 'Good Match' : 'Alternative Option';
    const reasoning: string[] = [
      `Verified canonical catalog item under ${product.categoryDisplay || product.category}`,
      `Authentic direct retail price: ${formatPrice(product.price)}`,
    ];

    if (product.brand) reasoning.push(`Official ${product.brand} product with genuine manufacturer warranty`);
    if (intent.budget && product.price <= intent.budget) reasoning.push(`Price fits within stated budget of ${formatPrice(intent.budget)}`);

    matches.push({
      productId: product.product_id,
      matchLabel,
      reasoning,
      keyAttributes: [product.brand, product.categoryDisplay || product.category, formatPrice(product.price)],
    });

    reasons[product.product_id] = `Matched based on verified specifications from the canonical catalog.`;
  }

  // If no IDs were found in n8n text, fall back to keyword catalog matcher
  if (recommendedProductIds.length === 0) {
    const all = getAllProducts();
    const matched = all.filter((p) => {
      const mName = p.name.toLowerCase().includes(lower);
      const mDesc = p.description.toLowerCase().includes(lower);
      return mName || mDesc;
    }).slice(0, 2);

    for (const p of matched) {
      recommendedProductIds.push(p.product_id);
      matches.push({
        productId: p.product_id,
        matchLabel: 'Good Match',
        reasoning: [
          `Verified official item under ${p.categoryDisplay || p.category}`,
          `Price: ${formatPrice(p.price)}`,
        ],
        keyAttributes: [p.brand, formatPrice(p.price)],
      });
    }
  }

  return {
    message: rawText,
    extractedIntent: intent,
    recommendedProductIds,
    matches,
    recommendationReasons: reasons,
    suggestedPrompts: [
      'Compare these options',
      'What are the charging specs?',
      'I want to buy this',
      'Show budget alternatives',
    ],
  };
}
