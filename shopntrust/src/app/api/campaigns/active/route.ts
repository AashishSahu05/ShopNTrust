// ============================================================
// ShopNTrust — Authoritative Active Campaigns API (/api/campaigns/active)
// ============================================================
// Returns campaigns that are:
// - status = 'ACTIVE'
// - start_date <= NOW() AND end_date >= NOW() (safe read-time expiration)
// - optionally scoped to merchantId if requested by merchant console
// - Enriched with canonical product details
// ============================================================

import { NextResponse } from 'next/server';
import { getAuthoritativeActiveCampaigns } from '@/lib/campaigns/campaign-service';
import { getOrders } from '@/lib/orders/order-service';
import { getProductById } from '@/lib/catalog';
import { getProductImageUrl } from '@/lib/product-images';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || undefined;

    const [campaigns, orders] = await Promise.all([
      getAuthoritativeActiveCampaigns(merchantId),
      getOrders({ dateRange: 'all' }),
    ]);

    // Filter authoritative successful orders only
    const successfulOrders = orders.filter(
      (o) => o.paymentStatus === 'successful' && o.status !== 'payment_failed'
    );

    // Build map of campaignId -> { ordersDriven: number, attributedRevenue: number }
    const campaignStatsMap = new Map<string, { ordersDriven: number; attributedRevenue: number }>();

    for (const order of successfulOrders) {
      const touchedCampaigns = new Set<string>();
      if (order.campaignId) {
        touchedCampaigns.add(order.campaignId);
      }
      for (const item of order.items) {
        if (item.campaignId) {
          touchedCampaigns.add(item.campaignId);
        }
      }

      for (const cId of touchedCampaigns) {
        const cur = campaignStatsMap.get(cId) || { ordersDriven: 0, attributedRevenue: 0 };
        cur.ordersDriven += 1;

        let itemRev = 0;
        for (const item of order.items) {
          if (item.campaignId === cId || (!item.campaignId && order.campaignId === cId)) {
            const unitPrice = item.selectedVariant?.price ?? item.product.price;
            itemRev += unitPrice * item.quantity;
          }
        }
        cur.attributedRevenue += itemRev > 0 ? itemRev : order.total;
        campaignStatsMap.set(cId, cur);
      }
    }

    // Enrich with canonical product metadata & real campaign attribution metrics
    const enrichedCampaigns = campaigns.map((camp) => {
      const stats = campaignStatsMap.get(camp.id) || { ordersDriven: 0, attributedRevenue: 0 };
      const products = (camp.productIds || []).map((id) => {
        const canonical = getProductById(id);
        return {
          productId: id,
          name: canonical?.name || `Product ${id}`,
          price: canonical?.price || 0,
          mrp: canonical?.mrp,
          category: canonical?.category || 'general',
          categoryDisplay: canonical?.categoryDisplay,
          imageUrl: getProductImageUrl(id) || '',
        };
      });

      return {
        ...camp,
        products,
        ordersDriven: stats.ordersDriven,
        attributedRevenue: stats.attributedRevenue,
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedCampaigns.length,
      campaigns: enrichedCampaigns,
    });
  } catch (err: unknown) {
    console.error('Error in /api/campaigns/active:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve active campaigns.',
        campaigns: [],
      },
      { status: 500 }
    );
  }
}
