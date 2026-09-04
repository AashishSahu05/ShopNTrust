// ============================================================
// ShopNTrust — AI Campaign Orchestrator UI Component
// ============================================================
// Additive feature on the existing Merchant Dashboard.
// 1. Merchant inputs business goal
// 2. Proxies to backend /api/campaigns/generate -> n8n webhook
// 3. Renders AI recommendation proposal card (Zero raw JSON)
// 4. Enforces Merchant Approval Gate (Reject OR Approve & Activate)
// 5. Protected against double-click activation
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CampaignPreview } from './campaign-preview';
import { useAuth } from '@/store/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { ResolvedCampaignProposal, Campaign } from '@/types';

interface CampaignOrchestratorProps {
  onCampaignActivated?: (campaign: Campaign) => void;
}

const SUGGESTED_GOALS = [
  'Increase laptop sales this week',
  'Promote flagship smartphones',
  'Boost wireless audio conversions',
  'Clear sports apparel inventory',
];

export function CampaignOrchestrator({ onCampaignActivated }: CampaignOrchestratorProps) {
  const { merchantProfile } = useAuth();

  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [proposal, setProposal] = useState<ResolvedCampaignProposal | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const [activatedSuccess, setActivatedSuccess] = useState<{
    campaignId: string;
    name: string;
  } | null>(null);

  // 1. Handle Proposal Generation
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed) {
      setGenerateError('Please specify what business goal you want to achieve.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setProposal(null);
    setActivatedSuccess(null);

    try {
      const res = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.proposal) {
        throw new Error(data.error || 'Campaign AI is temporarily unavailable. Please try again.');
      }

      setProposal(data.proposal);
    } catch (err: unknown) {
      console.error('Error generating campaign proposal:', err);
      const message = err instanceof Error ? err.message : 'Campaign AI is temporarily unavailable. Please try again.';
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Handle Merchant Rejection (Dismiss proposal without touching DB)
  const handleReject = () => {
    setProposal(null);
    setActivationError(null);
  };

  // 3. Handle Merchant Approval & Activation (Double-click protected)
  const handleApprove = async () => {
    if (!proposal || isActivating) return;

    setIsActivating(true);
    setActivationError(null);

    try {
      // Extract bearer auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token =
        session?.access_token ||
        (merchantProfile?.id ? `merchant-${merchantProfile.id}` : 'test-merchant-a');

      const res = await fetch('/api/campaigns/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaign: {
            name: proposal.name,
            goal: proposal.goal,
            product_ids: proposal.productIds,
            discount_type: proposal.discountType,
            discount_value: proposal.discountValue,
            duration_days: proposal.durationDays,
            reason: proposal.reason,
            target: proposal.target,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.campaign_id) {
        throw new Error(data.error || 'Campaign could not be activated. No changes were made.');
      }

      // Success: Clear proposal, show success feedback, notify parent
      setActivatedSuccess({
        campaignId: data.campaign_id,
        name: proposal.name,
      });
      setProposal(null);
      setGoal('');

      if (onCampaignActivated && data.campaign) {
        onCampaignActivated(data.campaign);
      }
    } catch (err: unknown) {
      console.error('Error activating campaign:', err);
      const message = err instanceof Error ? err.message : 'Campaign could not be activated. No changes were made.';
      setActivationError(message);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Orchestrator Input Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
                <Zap className="size-3" />
                <span>AI Growth Engine</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-foreground">
                AI Campaign Orchestrator
              </h2>
            </div>
          </div>
          <p className="text-xs text-muted-foreground sm:text-right max-w-xs leading-relaxed">
            State your business objective. AI analyzes recent sales & existing coverage to formulate targeted campaigns.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="mt-6">
          <label
            htmlFor="campaign-goal-input"
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2"
          >
            What do you want to achieve?
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="campaign-goal-input"
                type="text"
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  if (generateError) setGenerateError(null);
                }}
                disabled={isGenerating}
                placeholder="e.g. Increase laptop sales this week"
                className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all disabled:opacity-60"
              />
            </div>

            <Button
              type="submit"
              disabled={isGenerating || !goal.trim()}
              className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Analyzing Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Generate Campaign</span>
                </>
              )}
            </Button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Suggested:
            </span>
            {SUGGESTED_GOALS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  setGoal(suggestion);
                  if (generateError) setGenerateError(null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/70 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
              >
                <span>{suggestion}</span>
              </button>
            ))}
          </div>

          {/* Loading status message */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-3"
            >
              <Loader2 className="size-4 animate-spin text-indigo-600" />
              <span>Analyzing sales data and active campaigns with AI agent...</span>
            </motion.div>
          )}

          {/* Generation Error Alert */}
          {generateError && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{generateError}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleGenerate()}
                className="h-7 text-xs text-rose-800 hover:bg-rose-100 font-semibold cursor-pointer"
              >
                <RefreshCw className="mr-1 size-3" />
                Retry
              </Button>
            </motion.div>
          )}
        </form>

        {/* Success Confirmation Card after Activation */}
        {activatedSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-900 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Campaign Activated Successfully
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    &quot;{activatedSuccess.name}&quot; is now live on the storefront.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Campaign ID
                </span>
                <div className="font-mono text-xs font-bold text-emerald-950">
                  {activatedSuccess.campaignId}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Campaign Proposal Card (Review & Approval Gate) */}
      <AnimatePresence>
        {proposal && (
          <CampaignPreview
            proposal={proposal}
            isActivating={isActivating}
            onApprove={handleApprove}
            onReject={handleReject}
            activationError={activationError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
