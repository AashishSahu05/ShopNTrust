// ============================================================
// ShopNTrust — AI Agent Server-Side Proxy Route Handler
// ============================================================
// Eliminates browser CORS issues and protects webhook credentials by
// executing n8n webhook communication securely on the server.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { n8nConfig } from '@/lib/config';
import { queryDemoAgent } from '@/lib/api/agent-demo';
import { getProductById, getAllProducts } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import type { AgentProductMatch } from '@/types';

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
          const responseText = await n8nRes.text();
          let raw: Record<string, unknown> = {};
          try {
            const parsed = JSON.parse(responseText);
            if (typeof parsed === 'string') {
              n8nRawText = parsed.trim();
            } else if (parsed && typeof parsed === 'object') {
              raw = parsed as Record<string, unknown>;
              if (typeof raw.output === 'string' && raw.output.trim()) {
                n8nRawText = raw.output.trim();
              } else if (typeof raw.message === 'string' && raw.message !== 'Workflow was started' && raw.message.trim()) {
                n8nRawText = raw.message.trim();
              } else if (typeof raw.text === 'string' && raw.text.trim()) {
                n8nRawText = raw.text.trim();
              } else if (typeof raw.response === 'string' && raw.response.trim()) {
                n8nRawText = raw.response.trim();
              }
            }
          } catch {
            // Response was plain text from n8n (Respond With: Text)
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

          // 2. Scan output text for canonical catalog product names (e.g. "OnePlus Nord CE6", "Samsung Galaxy S24")
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

    // If n8n returned valid text, build normalized response
    if (n8nRawText && n8nRawText !== 'Workflow was started') {
      const recommendedProductIds = Array.from(extractedIds).slice(0, 3);
      const matches: AgentProductMatch[] = [];

      for (let i = 0; i < recommendedProductIds.length; i++) {
        const p = getProductById(recommendedProductIds[i]);
        if (!p) continue;
        matches.push({
          productId: p.product_id,
          matchLabel: i === 0 ? 'Strong Match' : i === 1 ? 'Good Match' : 'Alternative Option',
          reasoning: [
            `Verified canonical catalog item under ${p.categoryDisplay || p.category}`,
            `Authentic direct retail price: ${formatPrice(p.price)}`,
            `Official ${p.brand} product with genuine manufacturer warranty`,
          ],
          keyAttributes: [p.brand, formatPrice(p.price)],
        });
      }

      if (recommendedProductIds.length === 0) {
        const all = getAllProducts();
        const lowerSearch = (trimmed + ' ' + n8nRawText).toLowerCase();

        // Match products by category, brand, or title keywords
        const matched = all.filter((p) => {
          const cat = (p.categoryDisplay || p.category).toLowerCase();
          const brand = p.brand.toLowerCase();
          const name = p.name.toLowerCase();

          if (lowerSearch.includes('shoe') || lowerSearch.includes('shoes') || lowerSearch.includes('sneaker') || lowerSearch.includes('footwear')) {
            return cat.includes('shoe') || cat.includes('footwear') || name.includes('shoe') || name.includes('sneaker') || name.includes('pegasus');
          }
          if (lowerSearch.includes('phone') || lowerSearch.includes('mobile') || lowerSearch.includes('smartphone')) {
            return cat.includes('phone') || cat.includes('mobile') || cat.includes('smartphones');
          }
          if (lowerSearch.includes('headphone') || lowerSearch.includes('earbud') || lowerSearch.includes('audio') || lowerSearch.includes('sound')) {
            return cat.includes('audio') || cat.includes('headphone') || name.includes('headphone') || name.includes('earbuds');
          }
          if (lowerSearch.includes('watch') || lowerSearch.includes('smartwatch')) {
            return cat.includes('watch') || name.includes('watch');
          }
          if (lowerSearch.includes('laptop') || lowerSearch.includes('macbook')) {
            return cat.includes('laptop') || name.includes('laptop') || name.includes('macbook');
          }
          if (lowerSearch.includes('shirt') || lowerSearch.includes('t-shirt') || lowerSearch.includes('cloth') || lowerSearch.includes('fashion') || lowerSearch.includes('apparel')) {
            return cat.includes('fashion') || cat.includes('apparel') || name.includes('shirt') || name.includes('polo');
          }

          return (
            (brand.length > 2 && lowerSearch.includes(brand)) ||
            name.split(' ').some((word) => word.length > 3 && lowerSearch.includes(word))
          );
        }).slice(0, 3);

        for (const p of matched) {
          recommendedProductIds.push(p.product_id);
          matches.push({
            productId: p.product_id,
            matchLabel: 'Good Match',
            reasoning: [
              `Direct catalog item under ${p.categoryDisplay || p.category}`,
              `Authentic direct price: ${formatPrice(p.price)}`,
            ],
            keyAttributes: [p.brand, formatPrice(p.price)],
          });
        }
      }

      return NextResponse.json({
        message: n8nRawText,
        extractedIntent: { priority: 'AI Recommendation' },
        recommendedProductIds,
        matches,
        suggestedPrompts: ['Compare these options', 'Show more details', 'Add to bag', 'Continue browsing'],
      });
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
