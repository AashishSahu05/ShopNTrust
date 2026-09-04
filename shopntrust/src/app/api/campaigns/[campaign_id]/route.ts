// ============================================================
// ShopNTrust — Campaign Status Management API (/api/campaigns/[campaign_id])
// ============================================================
// Allows authenticated merchants to pause their campaigns.
// Strict data isolation: Merchant A CANNOT modify Merchant B's campaign.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateMerchantRequest } from '@/lib/auth/merchant-auth';
import { pauseCampaign } from '@/lib/campaigns/campaign-service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ campaign_id: string }> | { campaign_id: string } }
) {
  try {
    // 1. Authenticate merchant
    const auth = await authenticateMerchantRequest(request);
    if (!auth.authenticated || !auth.merchantId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Merchant authentication required.' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.campaign_id;

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID parameter is required.' },
        { status: 400 }
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

    const { status } = (body || {}) as { status?: string };

    if (!status || status.toUpperCase() !== 'PAUSED') {
      return NextResponse.json(
        { success: false, error: 'Invalid or unsupported status transition. Only PAUSED is supported.' },
        { status: 400 }
      );
    }

    // 2. Pause campaign with ownership verification
    const result = await pauseCampaign(campaignId, auth.merchantId);

    return NextResponse.json({
      success: true,
      campaign_id: result.campaignId,
      status: result.status,
    });
  } catch (err: unknown) {
    console.error('Error in PATCH /api/campaigns/[campaign_id]:', err);
    const message = err instanceof Error ? err.message : 'Campaign could not be paused.';
    const isForbidden = message.toLowerCase().includes('forbidden') || message.toLowerCase().includes('permission');
    const isNotFound = message.toLowerCase().includes('not found');

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: isForbidden ? 403 : isNotFound ? 404 : 400 }
    );
  }
}
