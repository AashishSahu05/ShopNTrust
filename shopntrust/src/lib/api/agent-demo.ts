// ============================================================
// ShopNTrust — Phase 4 Demo Agent Service
// ============================================================
// Simulates an intelligent shopping agent by extracting structured intent,
// deriving query constraints, matching against the canonical 66-product catalog,
// and generating transparent reasoning bullets.
//
// NOTE: In Phase 5, this will be replaced by the real n8n webhook service
// via the same NormalizedAIResponse signature.
// ============================================================

import { getAllProducts, getProductById } from '@/lib/catalog';
import type {
  NormalizedAIResponse,
  AgentExtractedIntent,
  AgentProductMatch,
  AgentContextPayload,
  UpsellRecommendation,
  CrossSellRecommendation,
  AIAction,
} from '@/types';
import { formatPrice } from '@/lib/format';

/**
 * Parses user input for explicit constraints without hallucinating.
 */
function extractQueryIntent(query: string): AgentExtractedIntent {
  const lower = query.toLowerCase();
  const intent: AgentExtractedIntent = {};
  const constraints: string[] = [];

  // 1. Category Detection
  if (lower.includes('phone') || lower.includes('smartphone') || lower.includes('mobile') || lower.includes('galaxy') || lower.includes('iphone') || lower.includes('oneplus')) {
    intent.category = 'phones';
    constraints.push('Category: Smartphones');
  } else if (lower.includes('headphone') || lower.includes('earbud') || lower.includes('earphone') || lower.includes('audio') || lower.includes('sound') || lower.includes('anc') || lower.includes('noise cancel')) {
    intent.category = 'headphones';
    constraints.push('Category: Headphones & Audio');
  } else if (lower.includes('watch') || lower.includes('smartwatch') || lower.includes('wearable') || lower.includes('fitness tracker') || lower.includes('band')) {
    intent.category = 'wearables';
    constraints.push('Category: Smartwatches & Wearables');
  } else if (lower.includes('shoe') || lower.includes('running') || lower.includes('sneaker') || lower.includes('pegasus') || lower.includes('ultraboost') || lower.includes('fitness')) {
    intent.category = 'fitness';
    constraints.push('Category: Athletic & Running Gear');
  } else if (lower.includes('skin') || lower.includes('serum') || lower.includes('gel') || lower.includes('face') || lower.includes('acne') || lower.includes('skincare')) {
    intent.category = 'skincare';
    constraints.push('Category: Skincare & Wellness');
  } else if (lower.includes('laptop') || lower.includes('macbook') || lower.includes('computer')) {
    intent.category = 'laptops';
    constraints.push('Category: Laptops & Computing');
  }

  // 2. Budget Extraction (Strictly from current query, not stored in profile)
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

  // 3. Priorities & Feature Signals
  if (lower.includes('zoom') || lower.includes('camera') || lower.includes('photo') || lower.includes('video')) {
    intent.priority = 'Pro Photography & Optical Zoom';
    constraints.push('Priority: Camera & Zoom Optics');
  } else if (lower.includes('battery') || lower.includes('all-day') || lower.includes('long lasting')) {
    intent.priority = 'Extended All-Day Battery';
    constraints.push('Priority: High Battery Capacity');
  } else if (lower.includes('noise cancel') || lower.includes('anc') || lower.includes('quiet')) {
    intent.priority = 'Active Noise Cancellation (ANC)';
    constraints.push('Priority: Premium Noise Cancellation');
  } else if (lower.includes('cushion') || lower.includes('marathon') || lower.includes('comfort')) {
    intent.priority = 'High Impact Cushioning';
    constraints.push('Priority: Running Comfort & Cushioning');
  } else if (lower.includes('acne') || lower.includes('salicylic') || lower.includes('gentle')) {
    intent.priority = 'Targeted Blemish & Gentle Formulation';
    constraints.push('Priority: Gentle Acne Care');
  }

  // 4. Use Case
  if (lower.includes('flight') || lower.includes('travel') || lower.includes('commute')) {
    intent.useCase = 'Frequent Travel & Commuting';
  } else if (lower.includes('marathon') || lower.includes('workout') || lower.includes('training')) {
    intent.useCase = 'Daily Fitness & Long-Distance Training';
  } else if (lower.includes('work') || lower.includes('office') || lower.includes('coding')) {
    intent.useCase = 'Productivity & Work';
  }

  intent.keyConstraints = constraints;
  return intent;
}

/**
 * Execute demo agent matching logic against the canonical catalog.
 */
export async function queryDemoAgent(
  userQuery: string,
  context?: AgentContextPayload
): Promise<NormalizedAIResponse> {
  // Use context if provided for session tracking
  void context;
  // Simulate rapid, realistic response time (250ms)
  await new Promise((resolve) => setTimeout(resolve, 250));

  const trimmed = userQuery.trim();
  const lower = trimmed.toLowerCase();
  const intent = extractQueryIntent(trimmed);

  // Check for out-of-catalog items (refrigerators, furniture, vehicles)
  const outOfCatalogKeywords = ['refrigerator', 'fridge', 'washing machine', 'couch', 'sofa', 'car', 'tire', 'drone', 'television', 'tv'];
  const isOutOfCatalog = outOfCatalogKeywords.some((k) => lower.includes(k)) && !lower.includes('phone') && !lower.includes('mobile');

  if (isOutOfCatalog) {
    return {
      message: `I searched our 66-product canonical catalog, but ShopNTrust currently specializes in Smartphones, Audio & Earbuds, Smartwatches & Wearables, Laptops & Computers, Athletic Footwear, Skincare & Wellness, Chargers & Accessories, Sports Nutrition, Tablets, Cameras, and Gaming. We don't have this product category in stock.`,
      extractedIntent: intent,
      recommendedProductIds: [],
      matches: [],
      suggestedPrompts: [
        'Find flagship smartphones',
        'Noise-cancelling headphones for travel',
        'Smartwatches for daily fitness',
        'Explore all 66 catalog items',
      ],
    };
  }

  // Matching Logic based on detected intent
  const allProducts = getAllProducts();
  const matches: AgentProductMatch[] = [];
  const recommendedIds: string[] = [];
  const reasons: Record<string, string> = {};

  // Extract explicit canonical product IDs mentioned in query (P101-P166)
  const queryIdMatches = trimmed.match(/P1\d{2}/gi) || [];
  const validQueryIds: string[] = [];
  queryIdMatches.forEach((id) => {
    const canonicalId = id.toUpperCase();
    if (getProductById(canonicalId) && !validQueryIds.includes(canonicalId)) {
      validQueryIds.push(canonicalId);
    }
  });

  // If user explicitly mentioned valid product IDs, prioritize them
  if (validQueryIds.length > 0) {
    for (const qId of validQueryIds) {
      const p = getProductById(qId);
      if (p && !recommendedIds.includes(qId)) {
        recommendedIds.push(qId);
        matches.push({
          productId: qId,
          matchLabel: 'Strong Match',
          reasoning: [
            `Verified canonical catalog item under ${p.categoryDisplay || p.category}`,
            `Direct authentic price: ${formatPrice(p.price)}`,
            p.rating ? `Rated ${p.rating.toFixed(1)}/5 by verified customers` : 'Authentic manufacturer warranty',
          ],
          keyAttributes: [p.brand, p.categoryDisplay || p.category, formatPrice(p.price)],
        });
        reasons[qId] = `Verified canonical product: ${p.name} (${p.brand}).`;
      }
    }
  }

  // Case 1: Flagship phone with zoom / camera / battery (e.g. P106, P114, P101)
  if (intent.category === 'phones' || lower.includes('phone') || lower.includes('camera') || lower.includes('zoom')) {
    // Top match: P106 Samsung S24 Ultra
    const p106 = getProductById('P106');
    if (p106 && (!intent.budget || p106.price <= intent.budget)) {
      recommendedIds.push('P106');
      matches.push({
        productId: 'P106',
        matchLabel: 'Strong Match',
        reasoning: [
          '200MP Quad Telephoto Camera with 5x Optical Zoom for crystal-clear long-range shots',
          '5,000 mAh all-day battery optimized for sustained performance',
          `Direct retail price of ${formatPrice(p106.price)} fits within your budget`,
        ],
        keyAttributes: ['200MP Zoom Camera', '5,000 mAh Battery', 'Snapdragon 8 Gen 3', 'Titanium Frame'],
      });
      reasons['P106'] = 'Best flagship optical zoom system paired with high-capacity battery life.';
    }

    // Alternative: P114 OnePlus 12
    const p114 = getProductById('P114');
    if (p114 && (!intent.budget || p114.price <= intent.budget)) {
      recommendedIds.push('P114');
      matches.push({
        productId: 'P114',
        matchLabel: 'Good Match',
        reasoning: [
          'Hasselblad 4th Gen Camera system with 64MP 3x Periscope Zoom',
          '5,400 mAh high-capacity battery with ultra-fast 100W SUPERVOOC charging',
          `Exceptional value flagship at ${formatPrice(p114.price)}`,
        ],
        keyAttributes: ['64MP Periscope', '5,400 mAh Battery', '100W SuperVOOC', 'Hasselblad Optics'],
      });
      reasons['P114'] = 'Superior battery capacity (5,400 mAh) and 100W fast charging at a lower price point.';
    }

    // Value Tier: P101 OnePlus Nord CE4 / CE6
    const p101 = getProductById('P101');
    if (p101 && (lower.includes('budget') || lower.includes('under 30000') || lower.includes('value') || (!intent.budget || p101.price <= intent.budget))) {
      if (recommendedIds.length < 3) {
        recommendedIds.push('P101');
        matches.push({
          productId: 'P101',
          matchLabel: 'Alternative Option',
          reasoning: [
            'Sony LYT-600 50MP OIS main camera with 4K recording',
            'Massive 5,500 mAh battery with 100W charging',
            `Accessible retail pricing at ${formatPrice(p101.price)}`,
          ],
          keyAttributes: ['50MP Sony OIS', '5,500 mAh Battery', '100W Charging', 'Sub-₹25k Value'],
        });
        reasons['P101'] = 'Outstanding battery capacity and Sony OIS sensor at an accessible mid-range price.';
      }
    }
  }

  // Case 2: Headphones & Audio (P117 Sony XM5, P143 Bose QC, P137 boAt)
  else if (intent.category === 'headphones' || lower.includes('flight') || lower.includes('anc') || lower.includes('headphone') || lower.includes('earbud')) {
    const p117 = getProductById('P117'); // Sony XM5
    if (p117) {
      recommendedIds.push('P117');
      matches.push({
        productId: 'P117',
        matchLabel: 'Strong Match',
        reasoning: [
          'Industry-leading Auto NC Optimizer with dual processors for near-silent flight travel',
          '30-hour battery life with quick charging (3 min charge = 3 hours playback)',
          'Ultra-comfortable lightweight fit designed for extended listening',
        ],
        keyAttributes: ['Industry Top ANC', '30-Hour Battery', 'Dual V1/QN1 Processors', 'Hi-Res Audio'],
      });
      reasons['P117'] = 'Benchmark active noise cancellation and comfort for long flights and commuting.';
    }

    const p137 = getProductById('P137'); // boAt Airdopes
    if (p137) {
      recommendedIds.push('P137');
      matches.push({
        productId: 'P137',
        matchLabel: 'Alternative Option',
        reasoning: [
          'Compact true-wireless form factor for daily mobility',
          'ENx environmental noise cancellation for clear voice calls',
          `High-value entry price at ${formatPrice(p137.price)}`,
        ],
        keyAttributes: ['True Wireless', 'ENx Call Clarity', 'IPX4 Water Resistant', 'Pocketable Form'],
      });
      reasons['P137'] = 'Compact everyday wireless earbuds with low latency and punchy sound.';
    }
  }

  // Case 3: Wearables & Smartwatches (P107 Apple Watch, P119 Galaxy Watch)
  else if (intent.category === 'wearables' || lower.includes('watch') || lower.includes('fitness tracker')) {
    const p107 = getProductById('P107'); // Apple Watch
    if (p107) {
      recommendedIds.push('P107');
      matches.push({
        productId: 'P107',
        matchLabel: 'Strong Match',
        reasoning: [
          'Advanced fitness tracking, ECG sensor, and precision blood oxygen monitoring',
          'Double-tap gesture navigation for seamless one-handed operation',
          'Seamless daily health analytics with automatic workout detection',
        ],
        keyAttributes: ['ECG & SpO2', 'Double Tap Gesture', 'Always-On Retina Display', 'Crash Detection'],
      });
      reasons['P107'] = 'Comprehensive health metrics and ecosystem integration for active lifestyles.';
    }

    const p119 = getProductById('P119'); // Galaxy Watch 6
    if (p119) {
      recommendedIds.push('P119');
      matches.push({
        productId: 'P119',
        matchLabel: 'Good Match',
        reasoning: [
          'BioActive sensor for Body Composition (BIA) and personalized heart rate zones',
          'Comprehensive sleep coaching with detailed sleep stage tracking',
          `Competitive price at ${formatPrice(p119.price)}`,
        ],
        keyAttributes: ['BIA Body Composition', 'Sleep Coaching', 'Sapphire Crystal', 'Wear OS'],
      });
      reasons['P119'] = 'In-depth body composition and personalized sleep coaching.';
    }
  }

  // Case 4: Fitness & Athletic Gear (P133 Nike Pegasus, P141 Adidas Ultraboost)
  else if (intent.category === 'fitness' || lower.includes('shoe') || lower.includes('running') || lower.includes('marathon')) {
    const p133 = getProductById('P133'); // Nike Pegasus 40
    if (p133) {
      recommendedIds.push('P133');
      matches.push({
        productId: 'P133',
        matchLabel: 'Strong Match',
        reasoning: [
          'Dual Nike Zoom Air units (forefoot and heel) providing responsive, springy energy return',
          'Engineered mesh upper for high breathability on long-distance runs',
          'Durable waffle-inspired outsole for superior multi-surface traction',
        ],
        keyAttributes: ['Dual Zoom Air', 'Engineered Mesh', 'Springy Cushioning', 'Daily Trainer Workhorse'],
      });
      reasons['P133'] = 'Reliable workhorse running shoe engineered for daily training and long distances.';
    }
  }

  // Case 5: Skincare & Wellness (P124 Minimalist, P135 Dot & Key)
  else if (intent.category === 'skincare' || lower.includes('skin') || lower.includes('serum') || lower.includes('acne')) {
    const p124 = getProductById('P124'); // Minimalist Salicylic Acid
    if (p124) {
      recommendedIds.push('P124');
      matches.push({
        productId: 'P124',
        matchLabel: 'Strong Match',
        reasoning: [
          '2% Salicylic Acid formulation with pure Aloe Vera extract for gentle pore unclogging',
          'Effective reduction of blackheads, excess sebum, and active blemishes',
          `Budget-friendly price of ${formatPrice(p124.price)}`,
        ],
        keyAttributes: ['2% Salicylic Acid', 'Aloe Base', 'Sebum Control', 'Fragrance Free'],
      });
      reasons['P124'] = 'Clinically proven, non-comedogenic serum formulated for acne-prone skin.';
    }
  }

  // Generic Fallback: Search all products by keyword if no explicit category branch was triggered
  if (recommendedIds.length === 0) {
    const matchingProducts = allProducts.filter((p) => {
      const matchName = p.name.toLowerCase().includes(lower);
      const matchDesc = p.description.toLowerCase().includes(lower);
      const matchBrand = p.brand.toLowerCase().includes(lower);
      const matchBudget = !intent.budget || p.price <= intent.budget;
      return (matchName || matchDesc || matchBrand) && matchBudget;
    }).slice(0, 3);

    for (const p of matchingProducts) {
      recommendedIds.push(p.product_id);
      matches.push({
        productId: p.product_id,
        matchLabel: 'Good Match',
        reasoning: [
          `Matches your keyword query for "${p.name}"`,
          `Authentic retail price: ${formatPrice(p.price)}`,
          `Verified official catalog item under ${p.categoryDisplay || p.category}`,
        ],
        keyAttributes: [p.brand, p.categoryDisplay || p.category, formatPrice(p.price)],
      });
      reasons[p.product_id] = `Matched based on keyword criteria and verified catalog specifications.`;
    }
  }

  // Phase 16: Direct Commerce Actions Check (Open Bag, Checkout)
  if (lower.includes('checkout') || lower.includes('proceed to checkout') || lower.includes('go to checkout')) {
    return {
      message: 'Navigating you to checkout. Please review your order details and delivery address to proceed.',
      extractedIntent: intent,
      recommendedProductIds: [],
      actions: [{ type: 'OPEN_CHECKOUT' }],
      matches: [],
      suggestedPrompts: ['Complete Order', 'Review Bag', 'Continue Shopping'],
    };
  }

  if (
    lower.includes('open cart') ||
    lower.includes('open bag') ||
    lower.includes('open my bag') ||
    lower.includes('view bag') ||
    lower.includes('view cart') ||
    lower.includes('show cart') ||
    lower.includes('show bag')
  ) {
    return {
      message: 'Opening your shared bag now. You can review items, adjust quantities, or proceed to checkout.',
      extractedIntent: intent,
      recommendedProductIds: [],
      actions: [{ type: 'OPEN_CART' }],
      matches: [],
      suggestedPrompts: ['Proceed to Checkout', 'Add more items', 'Clear bag'],
    };
  }

  // Phase 21 P0: Deterministic ADD_TO_BAG Structured Action Fallback
  const sessionRecIds = (Array.isArray(context?.session?.recommendedProductIds)
    ? (context.session.recommendedProductIds as unknown[])
    : []
  )
    .map(String)
    .map((s) => s.toUpperCase().trim())
    .filter((id) => !!getProductById(id));

  const isAddIntent =
    lower.includes('add') ||
    lower.includes('buy this') ||
    lower.includes('buy it') ||
    lower.includes('i want the first') ||
    lower.includes('i want the second') ||
    lower.includes('take option') ||
    lower.includes('put in bag') ||
    lower.includes('put in cart');

  if (isAddIntent) {
    let targetId: string | undefined = validQueryIds[0];
    if (!targetId) {
      if (/\b(?:option\s*1|first\s*option|first\s*one|1st\s*option|1st\s*one)\b/i.test(lower)) {
        targetId = sessionRecIds[0] || recommendedIds[0];
      } else if (/\b(?:option\s*2|second\s*option|second\s*one|2nd\s*option|2nd\s*one)\b/i.test(lower)) {
        targetId = sessionRecIds[1] || sessionRecIds[0] || recommendedIds[0];
      } else if (/\b(?:option\s*3|third\s*option|third\s*one|3rd\s*option|3rd\s*one)\b/i.test(lower)) {
        targetId = sessionRecIds[2] || sessionRecIds[0] || recommendedIds[0];
      } else {
        targetId = sessionRecIds[0] || recommendedIds[0];
      }
    }

    if (targetId && getProductById(targetId)) {
      const p = getProductById(targetId)!;
      const qtyMatch = trimmed.match(/\b(?:quantity|qty|count)\s*[:=]?\s*(\d+)\b/i) || trimmed.match(/\b(\d+)\s*(?:items?|units?|pieces?)\b/i);
      const qty = qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10)) : 1;

      return {
        message: `Great choice! I've added **${p.name}** (${p.product_id}) to your bag.`,
        extractedIntent: intent,
        recommendedProductIds: [targetId],
        recommendations: [
          {
            productId: targetId,
            reason: `Directly added to your bag: ${p.name}`,
            matchPoints: [
              `Verified canonical catalog item under ${p.categoryDisplay || p.category}`,
              `Direct authentic price: ${formatPrice(p.price)}`,
              `In Stock with authentic warranty`,
            ],
            matchLabel: 'Strong Match',
          },
        ],
        actions: [
          {
            type: 'ADD_TO_BAG',
            productIds: [targetId],
            quantity: qty,
          },
        ],
        matches: [
          {
            productId: targetId,
            matchLabel: 'Strong Match',
            reasoning: [`Added to your shopping bag: ${p.name}`],
            keyAttributes: [p.brand, p.categoryDisplay || p.category, formatPrice(p.price)],
          },
        ],
        suggestedPrompts: ['Proceed to Checkout', 'View Bag', 'Continue Shopping'],
      };
    }
  }

  // If still empty, return polite no-match
  if (recommendedIds.length === 0) {
    return {
      message: `I couldn't find a direct match for your request in our current 66-product canonical catalog. Try adjusting your criteria or search by popular categories.`,
      extractedIntent: intent,
      recommendedProductIds: [],
      recommendations: [],
      matches: [],
      suggestedPrompts: [
        'Find flagship smartphones',
        'Show travel headphones with ANC',
        'Find running shoes for daily training',
        'Browse full catalog',
      ],
    };
  }

  // Build StructuredRecommendation array
  const structuredRecs = matches.map((m) => {
    const prod = getProductById(m.productId);
    return {
      productId: m.productId,
      reason: reasons[m.productId] || `Verified catalog recommendation under ${prod?.categoryDisplay || prod?.category || 'Electronics'}.`,
      matchPoints: m.reasoning,
      matchLabel: m.matchLabel,
    };
  });

  const matchFactors: Record<string, string[]> = {};
  for (const m of matches) {
    matchFactors[m.productId] = m.reasoning;
  }

  // Detect explicit comparison requests
  const isComparisonQuery =
    lower.includes('compare') ||
    lower.includes('comparison') ||
    lower.includes('difference') ||
    lower.includes('which is better') ||
    lower.includes('vs') ||
    lower.includes('versus');

  let comparison = undefined;
  if (isComparisonQuery && validQueryIds.length >= 2) {
    const compIds = validQueryIds.slice(0, 2);
    const p1 = getProductById(compIds[0]);
    const p2 = getProductById(compIds[1]);
    comparison = {
      enabled: true,
      productIds: compIds,
      title: 'Side-by-Side Comparison',
      summary: `Comparing ${p1?.name || compIds[0]} vs ${p2?.name || compIds[1]} based on verified canonical catalog specifications.`,
    };
    for (let i = compIds.length - 1; i >= 0; i--) {
      const qId = compIds[i];
      const idx = recommendedIds.indexOf(qId);
      if (idx > -1) recommendedIds.splice(idx, 1);
      recommendedIds.unshift(qId);
    }
  } else if (isComparisonQuery && recommendedIds.length >= 2) {
    const comparedProducts = recommendedIds.slice(0, 2).map((id) => getProductById(id)?.name).join(' vs ');
    comparison = {
      enabled: true,
      productIds: recommendedIds.slice(0, 2),
      title: 'Product Comparison Matrix',
      summary: `Comparing ${comparedProducts} based on verified canonical catalog specifications.`,
    };
  }

  // Phase 7: Contextual Upsell & Cross-Sell Generation
  const cartProductIds = new Set<string>(
    (context?.session?.cartProductIds || []).map((id) => id.toUpperCase().trim())
  );
  const recommendedSet = new Set<string>(recommendedIds);

  const upsell: UpsellRecommendation[] = [];
  const crossSell: CrossSellRecommendation[] = [];

  if (recommendedIds.length > 0) {
    const primaryId = recommendedIds[0];
    const primaryProd = getProductById(primaryId);

    if (primaryProd) {
      // Upsell Opportunities
      if (primaryProd.category === 'phones' && primaryId !== 'P106') {
        const up = getProductById('P106');
        if (up && !recommendedSet.has('P106') && !cartProductIds.has('P106')) {
          upsell.push({
            productId: 'P106',
            sourceProductId: primaryId,
            label: 'Worth the Upgrade',
            reason: 'Upgrade to flagship 200MP Quad Zoom & titanium frame for professional-grade photography and sustained performance.',
            benefits: [
              '200MP Quad Optical Zoom Camera',
              'Snapdragon 8 Gen 3 with 5,000 mAh all-day battery',
              'Grade 5 Titanium frame with S-Pen stylus included',
            ],
          });
        }
      } else if ((primaryProd.category === 'footwear' || primaryProd.category === 'apparel') && primaryId === 'P133') {
        const up = getProductById('P134');
        if (up && !recommendedSet.has('P134') && !cartProductIds.has('P134')) {
          upsell.push({
            productId: 'P134',
            sourceProductId: 'P133',
            label: 'Worth the Upgrade',
            reason: 'Step up to max-cushion ZoomX foam for maximum joint protection and effortless long-distance recovery runs.',
            benefits: [
              'Full-length Nike ZoomX maximum cushioning',
              'Wider platform midsole for enhanced lateral stability',
              'Engineered Flyknit upper for adaptive breathability',
            ],
          });
        }
      } else if (primaryProd.category === 'headphones' && primaryId !== 'P117') {
        const up = getProductById('P117');
        if (up && !recommendedSet.has('P117') && !cartProductIds.has('P117')) {
          upsell.push({
            productId: 'P117',
            sourceProductId: primaryId,
            label: 'Worth the Upgrade',
            reason: 'Upgrade to industry-benchmark Auto NC Optimizer dual-processor Active Noise Cancellation.',
            benefits: [
              'Industry-leading 8-microphone ANC with dual V1/QN1 processors',
              '30-hour battery life with 3-minute quick charging',
              'Hi-Res Audio Wireless with LDAC support',
            ],
          });
        }
      }

      const upsellSet = new Set<string>(upsell.map((u) => u.productId));

      // Cross-Sell Opportunities
      if (primaryProd.category === 'phones') {
        const earbud = getProductById('P137');
        if (earbud && !recommendedSet.has('P137') && !upsellSet.has('P137') && !cartProductIds.has('P137')) {
          crossSell.push({
            productId: 'P137',
            sourceProductId: primaryId,
            label: 'Pairs Well With',
            reason: 'Complete your mobile setup with pocketable true wireless earbuds featuring ENx call noise isolation.',
            benefits: [
              'Low latency gaming & video sync',
              'IPX4 splash and sweat resistance for daily commuting',
            ],
          });
        }
        const watch = getProductById('P113');
        if (watch && !recommendedSet.has('P113') && !upsellSet.has('P113') && !cartProductIds.has('P113')) {
          crossSell.push({
            productId: 'P113',
            sourceProductId: primaryId,
            label: 'Complete Your Setup',
            reason: 'Track real-time fitness metrics and get notifications on your wrist synced to your smartphone.',
            benefits: [
              'Body composition BIA sensor & sleep coaching',
              'Sapphire crystal display with Wear OS seamless sync',
            ],
          });
        }
      } else if (primaryProd.category === 'footwear' || primaryProd.category === 'apparel') {
        const watch = getProductById('P116');
        if (watch && !recommendedSet.has('P116') && !upsellSet.has('P116') && !cartProductIds.has('P116')) {
          crossSell.push({
            productId: 'P116',
            sourceProductId: primaryId,
            label: 'Essential Workout Add-on',
            reason: 'Track pace, heart rate zones, and GPS running routes during your training sessions.',
            benefits: [
              'Precision GPS route & pace tracking',
              'Cardio heart rate zones and elevation metrics',
            ],
          });
        }
      } else if (primaryProd.category === 'headphones') {
        const watch = getProductById('P113');
        if (watch && !recommendedSet.has('P113') && !upsellSet.has('P113') && !cartProductIds.has('P113')) {
          crossSell.push({
            productId: 'P113',
            sourceProductId: primaryId,
            label: 'Pairs Well With',
            reason: 'Control offline music and volume directly from your wrist while running or working out.',
            benefits: [
              'Standalone Spotify & YouTube Music offline playback',
              'Hands-free Bluetooth audio controls',
            ],
          });
        }
      }
    }
  }

  // Phase 16: Structured AI Actions Generation
  const actions: AIAction[] = [];

  // 1. Direct Commerce Actions based on user intent
  if (lower.includes('checkout') || lower.includes('proceed to checkout') || lower.includes('go to checkout')) {
    actions.push({ type: 'OPEN_CHECKOUT' });
  } else if (
    lower.includes('open cart') ||
    lower.includes('open bag') ||
    lower.includes('open my bag') ||
    lower.includes('view bag') ||
    lower.includes('view cart') ||
    lower.includes('show cart') ||
    lower.includes('show bag')
  ) {
    actions.push({ type: 'OPEN_CART' });
  } else if (
    (lower.includes('remove') || lower.includes('delete')) &&
    (lower.includes('bag') || lower.includes('cart') || validQueryIds.length > 0)
  ) {
    const targetId = validQueryIds[0] || recommendedIds[0];
    if (targetId) {
      actions.push({ type: 'REMOVE_FROM_BAG', productIds: [targetId] });
    }
  } else if (
    (lower.includes('quantity') || lower.includes('set') || lower.includes('change')) &&
    /\d+/.test(lower)
  ) {
    const targetId = validQueryIds[0] || recommendedIds[0];
    const qtyMatch = trimmed.match(/(?:quantity|qty|to|set)\s*(?:to|=)?\s*(\d+)/i) || trimmed.match(/(\d+)\s*(?:units|items|pieces)/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
    if (targetId) {
      actions.push({ type: 'UPDATE_QUANTITY', productIds: [targetId], quantity: qty });
    }
  } else if (
    lower.includes('add to bag') ||
    lower.includes('add to cart') ||
    lower.includes('add option') ||
    lower.includes('add first') ||
    lower.includes('buy this') ||
    lower.includes('add')
  ) {
    const sessionRecIds = (Array.isArray(context?.session?.recommendedProductIds)
      ? (context.session.recommendedProductIds as unknown[])
      : []
    )
      .map(String)
      .map((s) => s.toUpperCase().trim())
      .filter((id) => !!getProductById(id));

    let targetId: string | undefined = validQueryIds[0];
    if (!targetId) {
      if (/\b(?:option\s*1|first\s*option|first\s*one|1st\s*option|1st\s*one)\b/i.test(lower)) {
        targetId = sessionRecIds[0] || recommendedIds[0];
      } else if (/\b(?:option\s*2|second\s*option|second\s*one|2nd\s*option|2nd\s*one)\b/i.test(lower)) {
        targetId = sessionRecIds[1] || recommendedIds[1] || sessionRecIds[0];
      } else {
        targetId = sessionRecIds[0] || recommendedIds[0];
      }
    }
    if (targetId && getProductById(targetId)) {
      actions.push({ type: 'ADD_TO_BAG', productIds: [targetId], quantity: 1 });
      const p = getProductById(targetId);
      if (p && !recommendedIds.includes(targetId)) {
        recommendedIds.push(targetId);
        matches.push({
          productId: targetId,
          matchLabel: 'Strong Match',
          reasoning: [`Added to your shopping bag: ${p.name}`],
          keyAttributes: [p.brand, p.categoryDisplay || p.category, formatPrice(p.price)],
        });
        reasons[targetId] = `Added to bag: ${p.name}`;
      }
    }
  }

  // 2. Presentation Actions
  if (comparison) {
    actions.push({ type: 'SHOW_COMPARISON', productIds: comparison.productIds });
  } else if (recommendedIds.length > 0) {
    actions.push({ type: 'SHOW_PRODUCTS', productIds: recommendedIds });
  }
  if (upsell.length > 0) {
    actions.push({ type: 'SHOW_UPSELL', productIds: upsell.map((u) => u.productId) });
  }
  if (crossSell.length > 0) {
    actions.push({ type: 'SHOW_CROSS_SELL', productIds: crossSell.map((c) => c.productId) });
  }

  const primaryMatch = matches[0];
  const primaryProduct = primaryMatch ? getProductById(primaryMatch.productId) : undefined;
  let message = '';
  if (actions.some((a) => a.type === 'ADD_TO_BAG')) {
    const addedAction = actions.find((a) => a.type === 'ADD_TO_BAG');
    const p = addedAction?.productIds?.[0] ? getProductById(addedAction.productIds[0]) : null;
    message = p ? `Added **${p.name}** (${p.product_id}) to your bag.` : `Added item to your bag.`;
  } else if (isComparisonQuery && comparison) {
    message = `Here is a side-by-side comparison of **${comparison.productIds.map((id) => getProductById(id)?.name).join('** and **')}** directly from our verified catalog:`;
  } else if (primaryProduct) {
    message = `Based on your request, I matched **${primaryProduct.name}** from our canonical catalog. Here is a breakdown of why these options fit your stated requirements:`;
  } else {
    message = `I searched our 66-product canonical catalog for your request.`;
  }

  return {
    message,
    extractedIntent: intent,
    recommendedProductIds: recommendedIds,
    recommendations: structuredRecs,
    comparison,
    upsell: upsell.length > 0 ? upsell : undefined,
    crossSell: crossSell.length > 0 ? crossSell : undefined,
    actions,
    matches,
    recommendationReasons: reasons,
    matchFactors,
    suggestedPrompts: comparison
      ? [
          'Add first item to bag',
          'Add second item to bag',
          'Which one has faster delivery?',
          'Continue browsing catalog',
        ]
      : [
          'Compare these options',
          'What are the charging specs?',
          'Show more budget-friendly alternatives',
          'Look for matching accessories',
        ],
  };
}
