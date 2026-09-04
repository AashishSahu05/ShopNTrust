// ============================================================
// ShopNTrust — Merchant Campaigns & Sales Analytics API (/api/merchant/campaigns)
// ============================================================
// Exposes factual inputs for n8n AI Campaign Orchestrator:
// 1. type=active: Retrieves active campaigns
// 2. type=coverage: Checks active campaign coverage for a specific product
// 3. type=sales: Returns product sales comparison (units sold, revenue, % change)
// 4. type=candidates: Returns campaign candidates (sales facts + campaign coverage)
// ============================================================

import { NextResponse } from 'next/server';
import {
  getActiveCampaigns,
  getActiveCampaignForProduct,
  getProductSalesComparison,
  getCampaignCandidates,
  saveCampaign,
} from '@/lib/campaigns/campaign-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'candidates';
    const days = parseInt(searchParams.get('days') || '7', 10);
    const merchantId = searchParams.get('merchantId') || undefined;
    const productId = searchParams.get('productId') || undefined;

    if (type === 'active') {
      const activeCampaigns = await getActiveCampaigns(merchantId);
      return NextResponse.json({
        type: 'active_campaigns',
        count: activeCampaigns.length,
        campaigns: activeCampaigns,
      });
    }

    if (type === 'coverage') {
      if (!productId) {
        return NextResponse.json(
          { error: 'productId parameter is required for coverage check.' },
          { status: 400 }
        );
      }
      const activeCampaign = await getActiveCampaignForProduct(productId, merchantId);
      return NextResponse.json({
        productId,
        isCovered: !!activeCampaign,
        activeCampaign,
      });
    }

    if (type === 'sales') {
      const salesComparison = await getProductSalesComparison(days, merchantId);
      return NextResponse.json({
        type: 'product_sales_comparison',
        periodDays: days,
        productCount: salesComparison.length,
        sales: salesComparison,
      });
    }

    // Default: 'candidates'
    const candidates = await getCampaignCandidates(days, merchantId);
    return NextResponse.json({
      type: 'campaign_candidate_facts',
      periodDays: days,
      candidateCount: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error('API /api/merchant/campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve campaign facts.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, discountType, discountValue, productIds, status, goal, reason, merchantId } = body;

    if (!name || !discountType) {
      return NextResponse.json(
        { error: 'Campaign name and discountType are required.' },
        { status: 400 }
      );
    }

    const saved = await saveCampaign({
      name,
      discountType,
      discountValue: Number(discountValue || 0),
      productIds: Array.isArray(productIds) ? productIds : [],
      status: status || 'DRAFT',
      goal,
      reason,
      merchantId,
    });

    return NextResponse.json({
      success: true,
      campaign: saved,
    });
  } catch (error) {
    console.error('API /api/merchant/campaigns POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save campaign.' },
      { status: 500 }
    );
  }
}
