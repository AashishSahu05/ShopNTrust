// ============================================================
// ShopNTrust — Storefront Active Campaign Banner Component
// ============================================================
// Dynamic luxury banner displayed on the storefront when an active
// campaign exists in the database.
// Automatically hides when no campaign is active or if expired/paused.
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import type { Campaign } from '@/types';

export function CampaignBanner() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadActiveCampaign() {
      try {
        const res = await fetch('/api/campaigns/active', { cache: 'no-store' });
        const data = await res.json();

        if (mounted && data.success && Array.isArray(data.campaigns) && data.campaigns.length > 0) {
          // Take the most recently activated campaign
          setCampaign(data.campaigns[0]);
        }
      } catch (err) {
        console.error('Failed to load storefront campaign banner:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadActiveCampaign();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || !campaign) {
    return null;
  }

  const discountText = `${campaign.discountValue}% OFF`;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 border-y border-indigo-500/20 py-4.5 text-white shadow-md"
      >
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-12 left-1/4 size-48 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 right-1/4 size-48 rounded-full bg-purple-500/20 blur-2xl" />

        <Container>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {/* Flame badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-xs font-black tracking-wide text-rose-300 uppercase shadow-xs">
                <Flame className="size-3.5 text-rose-400 fill-rose-400" />
                <span>Featured Campaign</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                  {campaign.name}
                </h3>
                <span className="text-xs text-indigo-300 font-medium">
                  • Get <span className="font-bold text-rose-300">{discountText}</span> on selected canonical products
                </span>
              </div>
            </div>

            {/* CTA button */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                size="sm"
                className="h-9 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 gap-1.5 cursor-pointer"
                render={<Link href="/shop" />}
              >
                <span>Shop Campaign</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </Container>
      </motion.section>
    </AnimatePresence>
  );
}
