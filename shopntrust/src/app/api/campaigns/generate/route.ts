// ============================================================
// ShopNTrust — AI Campaign Proposal Generation API (/api/campaigns/generate)
// ============================================================
// Receives merchant goal, queries n8n AI Campaign Orchestrator webhook,
// parses and validates untrusted external response, and resolves product
// IDs against the authoritative canonical catalog.
//
// CRITICAL:
// - AI ONLY generates a proposal.
// - AI NEVER activates a campaign.
// - Zero raw JSON or internal n8n traces exposed to client.
// ============================================================

import { NextResponse } from 'next/server';
import { generateCampaignProposal } from '@/lib/campaigns/campaign-service';

export async function POST(request: Request) {
  try {
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

    const { goal } = body as { goal?: string };

    if (!goal || typeof goal !== 'string' || !goal.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please provide a business goal for the campaign.' },
        { status: 400 }
      );
    }

    // Generate proposal from n8n webhook and resolve against canonical catalog
    const proposal = await generateCampaignProposal(goal);

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Campaign AI is temporarily unavailable. Please try again.';
    console.error('Error in /api/campaigns/generate:', err);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
