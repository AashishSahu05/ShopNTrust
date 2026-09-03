// ============================================================
// ShopNTrust — AI Commerce Events API Endpoint (/api/analytics/events)
// ============================================================

import { NextResponse } from 'next/server';
import { recordCommerceEvent, getCommerceEvents, type RecordEventInput } from '@/lib/analytics/events-service';

export async function POST(request: Request) {
  try {
    const body: RecordEventInput = await request.json();

    if (!body.sessionId || !body.eventType) {
      return NextResponse.json(
        { error: 'sessionId and eventType are required' },
        { status: 400 }
      );
    }

    const event = await recordCommerceEvent(body);
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error logging commerce event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const events = await getCommerceEvents({ sessionId });
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching commerce events:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve events' },
      { status: 500 }
    );
  }
}
