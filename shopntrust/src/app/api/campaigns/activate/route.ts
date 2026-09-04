// ============================================================
// ShopNTrust — Campaign Activation API (/api/campaigns/activate)
// ============================================================
// Authoritative merchant approval gate.
// Persists the campaign with status = 'ACTIVE' only after explicit
// merchant approval. Validates all inputs and enforces merchant isolation.
//
// CRITICAL:
// - Merchant session authentication required.
// - merchant_id is authoritatively resolved from session, NEVER from client body.
// - Canonical catalog validation for every product ID.
// - Server-side discount safety and date calculation.
// - Double-click / duplicate activation protection.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateMerchantRequest } from '@/lib/auth/merchant-auth';
import { activateCampaign } from '@/lib/campaigns/campaign-service';
import type { CampaignProposal } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Authoritative merchant authentication
    const auth = await authenticateMerchantRequest(request);
    if (!auth.authenticated || !auth.merchantId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Merchant authentication required.' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Request body must be a JSON object.' },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    const rawCampaign = (payload.campaign || payload) as Record<string, unknown>;

    // 2. Extract and validate fields
    const name = String(rawCampaign.name || '').trim();
    if (!name || name.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Campaign name must be at least 3 characters.' },
        { status: 400 }
      );
    }

    const rawProductIds = Array.isArray(rawCampaign.product_ids)
      ? rawCampaign.product_ids
      : Array.isArray(rawCampaign.productIds)
      ? rawCampaign.productIds
      : [];

    const productIds = rawProductIds.map((id) => String(id).trim().toUpperCase()).filter(Boolean);
    if (productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campaign must include at least one valid canonical product.' },
        { status: 400 }
      );
    }

    const discountType = (rawCampaign.discount_type || rawCampaign.discountType || 'percentage') as CampaignProposal['discountType'];
    const discountValue = Number(rawCampaign.discount_value ?? rawCampaign.discountValue ?? 0);
    if (isNaN(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Discount value must be greater than zero.' },
        { status: 400 }
      );
    }
    if (discountType === 'percentage' && discountValue > 90) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount cannot exceed 90%.' },
        { status: 400 }
      );
    }

    const durationDays = parseInt(String(rawCampaign.duration_days ?? rawCampaign.durationDays ?? 7), 10);
    if (isNaN(durationDays) || durationDays < 1 || durationDays > 90) {
      return NextResponse.json(
        { success: false, error: 'Campaign duration must be between 1 and 90 days.' },
        { status: 400 }
      );
    }

    const proposal: CampaignProposal = {
      name,
      goal: String(rawCampaign.goal || 'increase_sales'),
      productIds,
      discountType,
      discountValue,
      durationDays,
      reason: String(rawCampaign.reason || 'Merchant-approved AI campaign.'),
      target: String(rawCampaign.target || 'Targeted shoppers'),
    };

    // 3. Authoritative server-side activation (Double-click protected)
    const result = await activateCampaign(proposal, auth.merchantId);

    return NextResponse.json({
      success: true,
      campaign_id: result.campaignId,
      status: result.status,
      campaign: result.campaign,
    });
  } catch (err: unknown) {
    console.error('Error in /api/campaigns/activate:', err);
    const message = err instanceof Error ? err.message : 'Campaign could not be activated. No changes were made.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
