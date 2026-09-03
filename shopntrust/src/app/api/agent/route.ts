// ============================================================
// ShopNTrust — AI Agent Server-Side Proxy Route Handler (Phase 7A)
// ============================================================
// Eliminates browser CORS issues and protects webhook credentials by
// executing n8n webhook communication securely on the server.
//
// Implements:
// - Approach B Structured Recommendations & Explainability (Phase 6)
// - Inline Product Comparison Matrix (Phase 6)
// - AI-Powered Contextual Upsell & Cross-Sell Engine (Phase 7)
// - Clean presentation: 100% hidden raw JSON, safe links, no svg artifacts (Phase 7A)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { n8nConfig } from '@/lib/config';
import { queryDemoAgent } from '@/lib/api/agent-demo';
import { getProductById, getAllProducts } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import type {
  AgentProductMatch,
  StructuredRecommendation,
  AIComparisonData,
  UpsellRecommendation,
  CrossSellRecommendation,
  AIAction,
  NormalizedAIResponse,
} from '@/types';

/**
 * Strips raw JSON objects, technical schema fields, localhost URLs, and serialization
 * artifacts from customer-facing text, while preserving natural conversational explanations.
 */
function sanitizeCustomerFacingMessage(
  rawText: string,
  recommendations: StructuredRecommendation[]
): string {
  let text = (rawText || '').trim();

  // 1. Unwrap markdown code blocks containing JSON
  text = text.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '');
  text = text.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/gi, '');

  // 2. Remove raw JSON object or array blocks embedded inside text
  text = text.replace(/\{[\s\r\n]*"(?:recommendations|actions|comparison|upsell|cross_sell|crossSell)"[\s\S]*?\}(?:\s*,?\s*\}*)*/gi, '');
  text = text.replace(/\[\s*\{[\s\S]*?"(?:product_id|productId)"[\s\S]*?\}\s*\]/gi, '');

  // 3. Remove raw localhost URLs or convert them to clean internal product links
  text = text.replace(/https?:\/\/(?:localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)\/product\/([a-zA-Z0-9_-]+)/gi, '/product/$1');
  text = text.replace(/https?:\/\/(?:localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)\S*/gi, '');

  // 4. Remove any stray 'svg' artifact tokens
  text = text.replace(/\bsvg\b/gi, '').replace(/\[svg\]/gi, '');

  text = text.trim();

  // 5. If the message was purely a raw JSON object (or empty after stripping JSON),
  // construct a clean, human-readable conversational message preserving all product details.
  if (!text || text.startsWith('{') || text.startsWith('[') || text.includes('"recommendations":')) {
    if (recommendations.length > 0) {
      const parts: string[] = [
        `We have ${recommendations.length > 1 ? `${recommendations.length} great options` : 'a great option'} currently available in our catalog:`,
      ];
      const bullets: string[] = [];
      for (const rec of recommendations) {
        const p = getProductById(rec.productId);
        const name = p?.name || rec.productId;
        const reason = rec.reason || rec.matchPoints?.[0] || 'Verified canonical catalog item.';
        bullets.push(`• **${name}** (${rec.productId}): ${reason}`);
      }
      parts.push(bullets.join('\n\n'));
      parts.push(`Let me know if you would like to explore or compare any of these!`);
      return parts.join('\n\n');
    }
    return 'I found these verified options in our catalog that match your request:';
  }

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, context } = body;
    const trimmed = (message || '').trim();

    if (!trimmed) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Attempt Server-Side fetch to real n8n Webhook directly
    let n8nRawText = '';
    let n8nStructuredRecommendations: StructuredRecommendation[] = [];
    let n8nComparison: AIComparisonData | undefined = undefined;
    let n8nUpsell: UpsellRecommendation[] = [];
    let n8nCrossSell: CrossSellRecommendation[] = [];
    let n8nActions: AIAction[] = [];
    const extractedIds = new Set<string>();

    if (n8nConfig.agentWebhookUrl) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for AI reasoning

      try {
        const n8nRes = await fetch(n8nConfig.agentWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: trimmed,
            chatInput: trimmed,
            sessionId: sessionId || 'ai-shop-session',
            context,
          }),
          signal: controller.signal,
        });

        if (n8nRes.ok) {
          let responseText = await n8nRes.text();

          // If responseText is wrapped in ```json ... ``` code fence, unwrap it
          const codeBlockMatch = responseText.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
          if (codeBlockMatch) {
            responseText = codeBlockMatch[1].trim();
          }

          let raw: Record<string, unknown> = {};
          try {
            const parsed = JSON.parse(responseText);
            if (typeof parsed === 'string') {
              try {
                const innerParsed = JSON.parse(parsed);
                if (innerParsed && typeof innerParsed === 'object') {
                  raw = innerParsed as Record<string, unknown>;
                } else {
                  n8nRawText = parsed.trim();
                }
              } catch {
                n8nRawText = parsed.trim();
              }
            } else if (parsed && typeof parsed === 'object') {
              raw = parsed as Record<string, unknown>;

            // Extract natural message text while checking if output is a JSON string
            if (typeof raw.output === 'string') {
              const trimmedOutput = raw.output.trim();
              if (trimmedOutput.startsWith('{') || trimmedOutput.startsWith('```json')) {
                try {
                  const unwrap = trimmedOutput.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();
                  const innerOutput = JSON.parse(unwrap);
                  if (innerOutput && typeof innerOutput === 'object') {
                    raw = { ...innerOutput, ...raw };
                    if (typeof innerOutput.output === 'string') {
                      n8nRawText = innerOutput.output.trim();
                    } else if (typeof innerOutput.message === 'string') {
                      n8nRawText = innerOutput.message.trim();
                    }
                  } else {
                    n8nRawText = trimmedOutput;
                  }
                } catch {
                  n8nRawText = trimmedOutput;
                }
              } else {
                n8nRawText = trimmedOutput;
              }
            } else if (typeof raw.message === 'string' && raw.message !== 'Workflow was started' && raw.message.trim()) {
              n8nRawText = raw.message.trim();
            } else if (typeof raw.text === 'string' && raw.text.trim()) {
              n8nRawText = raw.text.trim();
            } else if (typeof raw.response === 'string' && raw.response.trim()) {
              n8nRawText = raw.response.trim();
            }

            // Approach B: Parse structured recommendations if provided by n8n
            if (Array.isArray(raw.recommendations)) {
                for (const item of raw.recommendations) {
                  if (item && typeof item === 'object') {
                    const r = item as Record<string, unknown>;
                    const pId = String(r.product_id || r.productId || '').toUpperCase().trim();
                    if (pId && getProductById(pId)) {
                      extractedIds.add(pId);
                      const rawPoints = Array.isArray(r.match_points) ? r.match_points : Array.isArray(r.matchPoints) ? r.matchPoints : undefined;
                      n8nStructuredRecommendations.push({
                        productId: pId,
                        reason: typeof r.reason === 'string' ? r.reason : undefined,
                        matchPoints: rawPoints ? (rawPoints as unknown[]).map(String) : undefined,
                      });
                    }
                  }
                }
              }

              // Approach B: Parse structured comparison metadata if provided by n8n
              if (raw.comparison && typeof raw.comparison === 'object') {
                const comp = raw.comparison as Record<string, unknown>;
                const rawArray = Array.isArray(comp.product_ids) ? comp.product_ids : Array.isArray(comp.productIds) ? comp.productIds : [];
                const rawCompIds = (rawArray as unknown[]).map(String).map((id: string) => id.toUpperCase().trim());
                const validCompIds = rawCompIds.filter((id: string) => !!getProductById(id));
                if (validCompIds.length >= 2) {
                  n8nComparison = {
                    enabled: comp.enabled !== false,
                    productIds: validCompIds,
                    title: typeof comp.title === 'string' ? comp.title : 'Product Comparison',
                    summary: typeof comp.summary === 'string' ? comp.summary : undefined,
                  };
                }
              }

              // Phase 7: Parse structured upsell from n8n
              const rawUpsells = Array.isArray(raw.upsell) ? raw.upsell : Array.isArray(raw.upsells) ? raw.upsells : undefined;
              if (rawUpsells) {
                for (const item of rawUpsells as unknown[]) {
                  if (item && typeof item === 'object') {
                    const u = item as Record<string, unknown>;
                    const pId = String(u.product_id || u.productId || '').toUpperCase().trim();
                    if (pId && getProductById(pId)) {
                      n8nUpsell.push({
                        productId: pId,
                        sourceProductId: u.source_product_id || u.sourceProductId ? String(u.source_product_id || u.sourceProductId).toUpperCase().trim() : undefined,
                        reason: typeof u.reason === 'string' ? u.reason : undefined,
                        benefits: Array.isArray(u.benefits) ? (u.benefits as unknown[]).map(String) : undefined,
                        label: typeof u.label === 'string' ? u.label : 'Worth the Upgrade',
                      });
                    }
                  }
                }
              }

              // Phase 7: Parse structured cross-sell from n8n
              const rawCrossSells = Array.isArray(raw.cross_sell) ? raw.cross_sell : Array.isArray(raw.crossSell) ? raw.crossSell : Array.isArray(raw.crossSells) ? raw.crossSells : undefined;
              if (rawCrossSells) {
                for (const item of rawCrossSells as unknown[]) {
                  if (item && typeof item === 'object') {
                    const c = item as Record<string, unknown>;
                    const pId = String(c.product_id || c.productId || '').toUpperCase().trim();
                    if (pId && getProductById(pId)) {
                      n8nCrossSell.push({
                        productId: pId,
                        sourceProductId: c.source_product_id || c.sourceProductId ? String(c.source_product_id || c.sourceProductId).toUpperCase().trim() : undefined,
                        reason: typeof c.reason === 'string' ? c.reason : undefined,
                        benefits: Array.isArray(c.benefits) ? (c.benefits as unknown[]).map(String) : undefined,
                        label: typeof c.label === 'string' ? c.label : 'Pairs Well With',
                      });
                    }
                  }
                }
              }

              // Approach B: Parse structured actions if provided by n8n
              if (Array.isArray(raw.actions)) {
                for (const act of raw.actions) {
                  if (act && typeof act === 'object' && typeof (act as Record<string, unknown>).type === 'string') {
                    const a = act as Record<string, unknown>;
                    const actArray = Array.isArray(a.product_ids) ? a.product_ids : Array.isArray(a.productIds) ? a.productIds : undefined;
                    n8nActions.push({
                      type: a.type as AIAction['type'],
                      productIds: actArray ? (actArray as unknown[]).map(String).map((id: string) => id.toUpperCase()) : undefined,
                      quantity: typeof a.quantity === 'number' ? a.quantity : undefined,
                    });
                  }
                }
              }
            }
          } catch {
            // Plain text response from n8n
            if (responseText && responseText !== 'Workflow was started') {
              n8nRawText = responseText.trim();
            }
          }

          // 1. Parse canonical product IDs (P101-P154) from output text or intermediate steps
          const combinedSearch = n8nRawText + ' ' + JSON.stringify(raw.intermediateSteps || '');
          const idMatches = combinedSearch.match(/P1\d{2}/gi);
          if (idMatches) {
            idMatches.forEach((id) => {
              const canonicalId = id.toUpperCase();
              if (getProductById(canonicalId)) {
                extractedIds.add(canonicalId);
              }
            });
          }

          // 2. Scan output text for canonical catalog product names
          const allCatalog = getAllProducts();
          const sortedByNameLength = [...allCatalog].sort((a, b) => b.name.length - a.name.length);
          const lowerOutput = n8nRawText.toLowerCase();

          for (const prod of sortedByNameLength) {
            if (prod.name.length >= 4 && lowerOutput.includes(prod.name.toLowerCase())) {
              extractedIds.add(prod.product_id);
            }
          }
        }
      } catch (err) {
        console.error('n8n fetch error:', err);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // If n8n returned valid text, build normalized Phase 6 & Phase 7 response
    if (n8nRawText && n8nRawText !== 'Workflow was started') {
      const recommendedProductIds = Array.from(extractedIds).slice(0, 3);
      const matches: AgentProductMatch[] = [];
      const structuredRecommendations: StructuredRecommendation[] = [];
      const reasons: Record<string, string> = {};
      const matchFactors: Record<string, string[]> = {};

      // Detect user intent & budget constraints
      const lowerQuery = trimmed.toLowerCase();
      const budgetMatch = trimmed.match(/(?:under|below|budget|within|less than|<=?)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
      const statedBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, ''), 10) : undefined;

      for (let i = 0; i < recommendedProductIds.length; i++) {
        const pId = recommendedProductIds[i];
        const p = getProductById(pId);
        if (!p) continue;

        const label = i === 0 ? 'Strong Match' : i === 1 ? 'Good Match' : 'Alternative Option';
        const existingStructured = n8nStructuredRecommendations.find((sr) => sr.productId === pId);

        const reasoningBullets: string[] = existingStructured?.matchPoints || [
          `Verified canonical catalog item under ${p.categoryDisplay || p.category}`,
          `Direct authentic price: ${formatPrice(p.price)}`,
        ];

        if (statedBudget && p.price <= statedBudget) {
          reasoningBullets.push(`Fits within stated budget of ${formatPrice(statedBudget)}`);
        }
        if (p.rating && p.rating >= 4.0) {
          reasoningBullets.push(`Rated ${p.rating.toFixed(1)}/5 by verified customers`);
        }

        const reasonSummary =
          existingStructured?.reason ||
          (i === 0
            ? `Top match for your ${p.categoryDisplay || p.category} request with authentic warranty.`
            : `Strong alternative with competitive specs in ${p.brand}.`);

        matches.push({
          productId: p.product_id,
          matchLabel: label,
          reasoning: reasoningBullets,
          keyAttributes: [p.brand, p.categoryDisplay || p.category, formatPrice(p.price)],
        });

        structuredRecommendations.push({
          productId: p.product_id,
          reason: reasonSummary,
          matchPoints: reasoningBullets,
          matchLabel: label,
        });

        reasons[p.product_id] = reasonSummary;
        matchFactors[p.product_id] = reasoningBullets;
      }

      // Check if user specifically requested a comparison
      const isComparisonQuery =
        lowerQuery.includes('compare') ||
        lowerQuery.includes('difference') ||
        lowerQuery.includes('which is better') ||
        lowerQuery.includes('vs') ||
        lowerQuery.includes('versus');

      let comparison = n8nComparison;
      if (!comparison && isComparisonQuery && recommendedProductIds.length >= 2) {
        comparison = {
          enabled: true,
          productIds: recommendedProductIds.slice(0, 2),
          title: 'Side-by-Side Comparison',
          summary: `Comparing ${recommendedProductIds.slice(0, 2).map((id) => getProductById(id)?.name).join(' vs ')} based on canonical catalog specifications.`,
        };
      }

      // Phase 7: Contextual Upsell & Cross-Sell Generation with Duplicate Prevention
      const cartProductIds = new Set<string>(
        (context?.session?.cartProductIds || []).map((id: string) => id.toUpperCase().trim())
      );
      const recommendedSet = new Set<string>(recommendedProductIds);

      // Intelligent Upsell Rules if not explicitly provided by n8n
      const finalUpsell: UpsellRecommendation[] = [...n8nUpsell];
      if (finalUpsell.length === 0 && recommendedProductIds.length > 0) {
        const primaryId = recommendedProductIds[0];
        const primaryProd = getProductById(primaryId);

        if (primaryProd) {
          if (primaryProd.category === 'phones' && primaryId !== 'P106') {
            const upProd = getProductById('P106'); // S24 Ultra
            if (upProd && !recommendedSet.has('P106') && !cartProductIds.has('P106')) {
              finalUpsell.push({
                productId: 'P106',
                sourceProductId: primaryId,
                label: 'Worth the Upgrade',
                reason: `Upgrade to flagship 200MP Quad Zoom & titanium frame for professional-grade photography and sustained performance.`,
                benefits: [
                  '200MP Quad Optical Zoom Camera',
                  'Snapdragon 8 Gen 3 with 5,000 mAh all-day battery',
                  'Grade 5 Titanium frame with S-Pen stylus included',
                ],
              });
            }
          } else if ((primaryProd.category === 'footwear' || primaryProd.category === 'apparel') && primaryId === 'P133') {
            const upProd = getProductById('P134'); // Nike Invincible 3
            if (upProd && !recommendedSet.has('P134') && !cartProductIds.has('P134')) {
              finalUpsell.push({
                productId: 'P134',
                sourceProductId: 'P133',
                label: 'Worth the Upgrade',
                reason: `Step up to max-cushion ZoomX foam for maximum joint protection and effortless long-distance recovery runs.`,
                benefits: [
                  'Full-length Nike ZoomX maximum cushioning',
                  'Wider platform midsole for enhanced lateral stability',
                  'Engineered Flyknit upper for adaptive breathability',
                ],
              });
            }
          } else if (primaryProd.category === 'headphones' && primaryId !== 'P117') {
            const upProd = getProductById('P117'); // Sony XM5
            if (upProd && !recommendedSet.has('P117') && !cartProductIds.has('P117')) {
              finalUpsell.push({
                productId: 'P117',
                sourceProductId: primaryId,
                label: 'Worth the Upgrade',
                reason: `Upgrade to industry-benchmark Auto NC Optimizer dual-processor Active Noise Cancellation.`,
                benefits: [
                  'Industry-leading 8-microphone ANC with dual V1/QN1 processors',
                  '30-hour battery life with 3-minute quick charging',
                  'Hi-Res Audio Wireless with LDAC support',
                ],
              });
            }
          }
        }
      }

      // Filter duplicate upsells
      const cleanUpsell = finalUpsell.filter(
        (u) => !recommendedSet.has(u.productId) && !cartProductIds.has(u.productId)
      );
      const upsellSet = new Set<string>(cleanUpsell.map((u) => u.productId));

      // Intelligent Cross-Sell Rules if not explicitly provided by n8n
      const finalCrossSell: CrossSellRecommendation[] = [...n8nCrossSell];
      if (finalCrossSell.length === 0 && recommendedProductIds.length > 0) {
        const primaryId = recommendedProductIds[0];
        const primaryProd = getProductById(primaryId);

        if (primaryProd) {
          if (primaryProd.category === 'phones') {
            const earbud = getProductById('P137'); // boAt Airdopes or Sony XM5
            if (earbud && !recommendedSet.has('P137') && !upsellSet.has('P137') && !cartProductIds.has('P137')) {
              finalCrossSell.push({
                productId: 'P137',
                sourceProductId: primaryId,
                label: 'Pairs Well With',
                reason: `Complete your mobile setup with pocketable true wireless earbuds featuring ENx call noise isolation.`,
                benefits: [
                  'Low latency gaming & video sync',
                  'IPX4 splash and sweat resistance for daily commuting',
                ],
              });
            }
            const watch = getProductById('P119'); // Galaxy Watch 6
            if (watch && !recommendedSet.has('P119') && !upsellSet.has('P119') && !cartProductIds.has('P119')) {
              finalCrossSell.push({
                productId: 'P119',
                sourceProductId: primaryId,
                label: 'Complete Your Setup',
                reason: `Track real-time fitness metrics and get notifications on your wrist synced to your smartphone.`,
                benefits: [
                  'Body composition BIA sensor & sleep coaching',
                  'Sapphire crystal display with Wear OS seamless sync',
                ],
              });
            }
          } else if (primaryProd.category === 'footwear' || primaryProd.category === 'apparel') {
            const watch = getProductById('P107'); // Apple Watch
            if (watch && !recommendedSet.has('P107') && !upsellSet.has('P107') && !cartProductIds.has('P107')) {
              finalCrossSell.push({
                productId: 'P107',
                sourceProductId: primaryId,
                label: 'Essential Workout Add-on',
                reason: `Track pace, heart rate zones, and GPS running routes during your training sessions.`,
                benefits: [
                  'Precision GPS route & pace tracking',
                  'Cardio heart rate zones and elevation metrics',
                ],
              });
            }
          } else if (primaryProd.category === 'headphones') {
            const watch = getProductById('P119');
            if (watch && !recommendedSet.has('P119') && !upsellSet.has('P119') && !cartProductIds.has('P119')) {
              finalCrossSell.push({
                productId: 'P119',
                sourceProductId: primaryId,
                label: 'Pairs Well With',
                reason: `Control offline music and volume directly from your wrist while running or working out.`,
                benefits: [
                  'Standalone Spotify & YouTube Music offline playback',
                  'Hands-free Bluetooth audio controls',
                ],
              });
            }
          }
        }
      }

      // Filter duplicate cross-sells
      const cleanCrossSell = finalCrossSell.filter(
        (c) => !recommendedSet.has(c.productId) && !upsellSet.has(c.productId) && !cartProductIds.has(c.productId)
      );

      // Phase 7 Actions
      const actions: AIAction[] = [...n8nActions];
      if (actions.length === 0) {
        if (comparison) {
          actions.push({ type: 'SHOW_COMPARISON', productIds: comparison.productIds });
        } else {
          actions.push({ type: 'SHOW_PRODUCTS', productIds: recommendedProductIds });
        }
        if (cleanUpsell.length > 0) {
          actions.push({ type: 'SHOW_UPSELL', productIds: cleanUpsell.map((u) => u.productId) });
        }
        if (cleanCrossSell.length > 0) {
          actions.push({ type: 'SHOW_CROSS_SELL', productIds: cleanCrossSell.map((c) => c.productId) });
        }
      }

      const responsePayload: NormalizedAIResponse = {
        message: sanitizeCustomerFacingMessage(n8nRawText, structuredRecommendations),
        extractedIntent: {
          priority: 'AI Recommendation',
          budget: statedBudget,
        },
        recommendedProductIds,
        recommendations: structuredRecommendations,
        comparison,
        upsell: cleanUpsell.length > 0 ? cleanUpsell : undefined,
        crossSell: cleanCrossSell.length > 0 ? cleanCrossSell : undefined,
        actions,
        matches,
        recommendationReasons: reasons,
        matchFactors,
        suggestedPrompts: comparison
          ? ['Add first item to bag', 'Add second item to bag', 'Show more budget options', 'Continue browsing']
          : ['Compare these options', 'Which one has better battery life?', 'Add to bag', 'Show alternatives'],
      };

      return NextResponse.json(responsePayload);
    }

    // Default: Fallback to fast, intelligent catalog engine
    const catalogRes = await queryDemoAgent(trimmed, context);
    return NextResponse.json(catalogRes);
  } catch (error) {
    console.error('API /api/agent error:', error);
    const fallback = await queryDemoAgent('phones', undefined);
    return NextResponse.json(fallback);
  }
}
