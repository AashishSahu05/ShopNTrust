// ============================================================
// ShopNTrust — Campaign Proposal Preview Component
// ============================================================
// Luxury AI proposal preview card.
// Strictly business-facing:
// - Renders resolved canonical products with verified images & prices.
// - Zero raw JSON, technical traces, or internal URLs.
// - Enforces the Merchant Approval Gate with double-click protection.
// ============================================================

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Flame,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShoppingBag,
  ArrowUpRight,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import type { ResolvedCampaignProposal } from '@/types';

interface CampaignPreviewProps {
  proposal: ResolvedCampaignProposal;
  isActivating: boolean;
  onApprove: () => void;
  onReject: () => void;
  activationError?: string | null;
}

export function CampaignPreview({
  proposal,
  isActivating,
  onApprove,
  onReject,
  activationError,
}: CampaignPreviewProps) {
  const isBlocked = proposal.hasInvalidProduct || isActivating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-2xl shadow-indigo-950/40"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Header Badge & Title */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              AI Campaign Recommendation
            </span>
            <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
              {proposal.name}
            </h3>
          </div>
        </div>

        {/* Goal Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 px-3.5 py-1 text-xs font-semibold text-indigo-300">
          <Target className="size-3.5" />
          <span className="capitalize">{proposal.goal.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Core Campaign Highlights Grid */}
      <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Offer Box */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-4 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Flame className="size-4 text-rose-400" />
            <span>Promotional Offer</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              {proposal.discountValue}% OFF
            </span>
            <span className="text-xs text-slate-400 capitalize">
              ({proposal.discountType})
            </span>
          </div>
        </div>

        {/* Duration Box */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-4 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Clock className="size-4 text-indigo-400" />
            <span>Planned Duration</span>
          </div>
          <div className="mt-1.5">
            <span className="text-2xl font-black text-white">
              {proposal.durationDays} Days
            </span>
            <span className="ml-2 text-xs text-slate-400">from activation</span>
          </div>
        </div>

        {/* Target Audience Box */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-4 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Target className="size-4 text-emerald-400" />
            <span>Audience Target</span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-slate-200 line-clamp-2">
            {proposal.target}
          </p>
        </div>
      </div>

      {/* Recommended Canonical Products */}
      <div className="relative z-10 mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Included Products ({proposal.products.length})
          </span>
          <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Canonical Catalog Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {proposal.products.map((product) => (
            <div
              key={product.productId}
              className="group flex items-center gap-3.5 rounded-xl border border-slate-800/90 bg-slate-800/30 p-3 transition-colors hover:border-indigo-500/40 hover:bg-slate-800/60"
            >
              {/* Product Thumbnail */}
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-slate-700/60 bg-white p-1">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-slate-100 text-slate-400">
                    <ShoppingBag className="size-5" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    {product.productId}
                  </span>
                  <Link
                    href={`/product/${product.productId}`}
                    target="_blank"
                    className="text-slate-400 hover:text-white transition-colors"
                    title="View Product Page"
                  >
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <h4 className="truncate text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {product.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-black text-slate-200">
                    {formatPrice(product.price)}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="text-[10px] text-slate-500 line-through">
                      {formatPrice(product.mrp)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation Reason */}
      <div className="relative z-10 mt-6 rounded-xl border border-slate-800/90 bg-slate-950/70 p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1.5">
          <Info className="size-4" />
          <span>Why AI recommends this campaign</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-300">
          {proposal.reason}
        </p>
      </div>

      {/* Validation Warning if invalid product returned */}
      {proposal.hasInvalidProduct && (
        <div className="relative z-10 mt-4 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          <AlertTriangle className="size-5 shrink-0 text-rose-400" />
          <div>
            <span className="font-bold">Catalog Validation Error:</span>{' '}
            {proposal.validationError || 'Unverified products detected. This campaign cannot be activated.'}
          </div>
        </div>
      )}

      {/* Activation Error Alert */}
      {activationError && (
        <div className="relative z-10 mt-4 flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-300">
          <XCircle className="size-5 shrink-0 text-rose-400" />
          <div>{activationError}</div>
        </div>
      )}

      {/* Merchant Approval Gate Action Buttons */}
      <div className="relative z-10 mt-7 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-5">
        <p className="text-xs text-slate-400 text-center sm:text-left">
          <span className="font-semibold text-slate-300">Approval Required:</span> AI only generates recommendations. Campaigns are never activated without explicit merchant authorization.
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Reject Button */}
          <Button
            type="button"
            variant="outline"
            disabled={isActivating}
            onClick={onReject}
            className="flex-1 sm:flex-initial h-11 border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold cursor-pointer"
          >
            <XCircle className="mr-1.5 size-4 text-slate-400" />
            Reject
          </Button>

          {/* Approve & Activate Button (Double-click protected) */}
          <Button
            type="button"
            disabled={isBlocked}
            onClick={onApprove}
            className="flex-1 sm:flex-initial h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-6 shadow-lg shadow-indigo-500/25 cursor-pointer gap-2"
          >
            {isActivating ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                <span>Activating Campaign...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4 text-emerald-300" />
                <span>✓ Approve & Activate</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
