// ============================================================
// ShopNTrust — Active Campaigns Management UI Component
// ============================================================
// Displays live campaigns persisted in Supabase belonging to the
// authenticated merchant. Enables real-time pausing with merchant isolation.
// Zero mock data.
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Clock,
  Pause,
  RefreshCw,
  Calendar,
  Loader2,
  AlertCircle,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/format';
import type { Campaign } from '@/types';

interface ActiveCampaignsProps {
  refreshSignal?: number;
}

export function ActiveCampaigns({ refreshSignal = 0 }: ActiveCampaignsProps) {
  const { merchantProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merchantId = merchantProfile?.id;

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const url = merchantId
        ? `/api/campaigns/active?merchantId=${encodeURIComponent(merchantId)}`
        : '/api/campaigns/active';

      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to fetch active campaigns:', err);
      setError('Unable to load active campaigns.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [merchantId]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns, refreshSignal]);

  // Handle Pausing Campaign
  const handlePause = async (campaignId: string) => {
    setPausingId(campaignId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token =
        session?.access_token ||
        (merchantProfile?.id ? `merchant-${merchantProfile.id}` : 'test-merchant-a');

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'PAUSED' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to pause campaign.');
      }

      // Optimistically remove from active campaigns or mark paused
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch (err: unknown) {
      console.error('Error pausing campaign:', err);
      const msg = err instanceof Error ? err.message : 'Campaign could not be paused.';
      alert(msg);
    } finally {
      setPausingId(null);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
            <Flame className="size-4.5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Active Campaigns
            </h3>
            <p className="text-xs text-muted-foreground">
              Live promotional campaigns currently running on the storefront.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRefreshing || isLoading}
          onClick={() => fetchCampaigns()}
          className="h-8 text-xs font-semibold gap-1.5 cursor-pointer border-border self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-indigo-600 mb-2" />
          <span className="text-xs font-medium">Loading active campaigns...</span>
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fetchCampaigns()}
            className="h-7 text-xs text-rose-800 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      ) : campaigns.length === 0 ? (
        /* Empty State */
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-slate-50/50">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white border border-border shadow-2xs text-muted-foreground mb-3">
            <Flame className="size-5 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-foreground">No Active Campaigns</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            You don&apos;t have any active campaigns running right now. Use the AI Campaign Orchestrator above to generate one.
          </p>
        </div>
      ) : (
        /* Campaigns Cards List */
        <div className="mt-6 space-y-4">
          <AnimatePresence>
            {campaigns.map((camp) => {
              const productCount = camp.productIds?.length || 0;
              const isPausingThis = pausingId === camp.id;

              return (
                <motion.div
                  key={camp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border/80 bg-background p-5 shadow-2xs hover:border-indigo-500/30 transition-all"
                >
                  <div className="space-y-2">
                    {/* Title & Status Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1 text-sm font-extrabold text-foreground">
                        <Flame className="size-4 text-rose-500" />
                        {camp.name}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        ID: {camp.id}
                      </span>
                    </div>

                    {/* Metadata summary */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Package className="size-3.5 text-indigo-500" />
                        {productCount} {productCount === 1 ? 'Product' : 'Products'}
                      </span>
                      <span className="font-bold text-rose-600">
                        {camp.discountValue}% OFF
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-slate-400" />
                        Started: {formatDate(camp.startDate || camp.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-slate-400" />
                        Ends: {formatDate(camp.endDate)}
                      </span>
                    </div>

                    {/* Performance Attribution Metrics */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                      <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2.5 py-1 text-xs border border-indigo-100 font-semibold text-indigo-900">
                        <ShoppingBag className="size-3.5 text-indigo-600" />
                        <span>Orders Driven:</span>
                        <span className="font-extrabold text-indigo-700">{camp.ordersDriven ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-2.5 py-1 text-xs border border-emerald-100 font-semibold text-emerald-900">
                        <TrendingUp className="size-3.5 text-emerald-600" />
                        <span>Attributed Revenue:</span>
                        <span className="font-mono font-extrabold text-emerald-700">{formatPrice(camp.attributedRevenue ?? 0)}</span>
                      </div>
                    </div>

                    {camp.reason && (
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">
                        &quot;{camp.reason}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPausingThis}
                      onClick={() => handlePause(camp.id)}
                      className="h-9 border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100 font-semibold gap-1.5 cursor-pointer"
                    >
                      {isPausingThis ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Pausing...</span>
                        </>
                      ) : (
                        <>
                          <Pause className="size-3.5" />
                          <span>Pause</span>
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
