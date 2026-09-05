// ============================================================
// ShopNTrust — AI Commerce Events Service
// ============================================================
// Records, throttles, deduplicates, and retrieves AI commerce events
// for conversion funnel analysis and upsell/cross-sell attribution.
// ============================================================

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/config';
import type { AICommerceEvent, CommerceEventType, AnalyticsDateRange } from '@/types';

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseConfig.anonKey;

const supabaseAdmin = createClient(supabaseConfig.url, serviceRoleKey, {
  auth: { persistSession: false },
});

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'persisted-events.json');

// In-memory cache for serverless environments (e.g. Vercel) where filesystem is read-only
let inMemoryEventsCache: AICommerceEvent[] | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem on serverless (e.g. Vercel)
  }
}

function readLocalEvents(): AICommerceEvent[] {
  if (inMemoryEventsCache !== null) {
    return inMemoryEventsCache;
  }
  try {
    ensureDataDir();
    if (!fs.existsSync(EVENTS_FILE)) {
      inMemoryEventsCache = [];
      return [];
    }
    const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
    inMemoryEventsCache = JSON.parse(raw);
    return inMemoryEventsCache || [];
  } catch {
    inMemoryEventsCache = [];
    return [];
  }
}

function writeLocalEvents(events: AICommerceEvent[]): void {
  inMemoryEventsCache = events;
  try {
    ensureDataDir();
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch {
    // Silently ignore EROFS in serverless runtime since Supabase handles persistent database storage
  }
}

// In-memory debounce cache to prevent duplicate events on React re-renders
const recentEventsCache = new Map<string, number>();

export interface RecordEventInput {
  sessionId: string;
  eventType: CommerceEventType;
  userId?: string | null;
  productId?: string | null;
  sourceProductId?: string | null;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Record a commerce event with automatic deduplication.
 */
export async function recordCommerceEvent(
  input: RecordEventInput
): Promise<AICommerceEvent | null> {
  const cacheKey = `${input.sessionId}_${input.eventType}_${input.productId || ''}_${input.orderId || ''}`;
  const now = Date.now();
  const lastTime = recentEventsCache.get(cacheKey);

  // Debounce duplicate events within 3 seconds
  if (lastTime && now - lastTime < 3000) {
    return null;
  }
  recentEventsCache.set(cacheKey, now);

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const event: AICommerceEvent = {
    id: eventId,
    sessionId: input.sessionId,
    eventType: input.eventType,
    userId: input.userId || null,
    productId: input.productId || null,
    sourceProductId: input.sourceProductId || null,
    orderId: input.orderId || null,
    metadata: input.metadata || {},
    createdAt: new Date(now).toISOString(),
  };

  // Attempt Supabase insert
  try {
    await supabaseAdmin.from('ai_commerce_events').insert({
      id: event.id,
      user_id: event.userId,
      session_id: event.sessionId,
      event_type: event.eventType,
      product_id: event.productId,
      source_product_id: event.sourceProductId,
      order_id: event.orderId,
      metadata: event.metadata,
      created_at: event.createdAt,
    });
  } catch {
    // Graceful fallback to local persistence
  }

  // Always write to local storage
  const localEvents = readLocalEvents();
  localEvents.push(event);
  writeLocalEvents(localEvents);

  return event;
}

/**
 * Retrieve all commerce events, optionally filtered by date range.
 */
export async function getCommerceEvents(filter?: {
  dateRange?: AnalyticsDateRange;
  sessionId?: string;
}): Promise<AICommerceEvent[]> {
  const localEvents = readLocalEvents();
  const mergedMap = new Map<string, AICommerceEvent>();

  for (const e of localEvents) {
    mergedMap.set(e.id, e);
  }

  try {
    const { data: dbEvents, error } = await supabaseAdmin
      .from('ai_commerce_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(dbEvents)) {
      for (const dbe of dbEvents) {
        if (!mergedMap.has(dbe.id)) {
          mergedMap.set(dbe.id, {
            id: dbe.id,
            sessionId: dbe.session_id,
            eventType: dbe.event_type,
            userId: dbe.user_id,
            productId: dbe.product_id,
            sourceProductId: dbe.source_product_id,
            orderId: dbe.order_id,
            metadata: dbe.metadata || {},
            createdAt: dbe.created_at,
          });
        }
      }
    }
  } catch {
    // Local fallback
  }

  let allEvents = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (filter?.sessionId) {
    allEvents = allEvents.filter((e) => e.sessionId === filter.sessionId);
  }

  if (filter?.dateRange && filter.dateRange !== 'all') {
    const now = Date.now();
    let cutoffMs = 0;
    if (filter.dateRange === '7d') cutoffMs = 7 * 24 * 60 * 60 * 1000;
    else if (filter.dateRange === '30d') cutoffMs = 30 * 24 * 60 * 60 * 1000;
    else if (filter.dateRange === '90d') cutoffMs = 90 * 24 * 60 * 60 * 1000;

    const threshold = now - cutoffMs;
    allEvents = allEvents.filter(
      (e) => new Date(e.createdAt).getTime() >= threshold
    );
  }

  return allEvents;
}
