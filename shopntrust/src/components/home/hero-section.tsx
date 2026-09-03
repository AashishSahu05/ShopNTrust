// ============================================================
// ShopNTrust — Rebuilt Homepage Hero ("How do you want to shop?")
// ============================================================
// Primary decision screen presenting two first-class shopping paths:
// 1. SHOP MANUALLY (Browse 54 real products) -> /shop
// 2. SHOP WITH AI (Natural-language agentic discovery) -> /ai-shop
// ============================================================

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Store,
  ShieldCheck,
  CheckCircle2,
  Check,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getProductById } from '@/lib/catalog';
import { getProductImageUrl } from '@/lib/product-images';
import { formatPrice } from '@/lib/format';

export function HeroSection() {
  // Sample products for manual collage
  const p101 = getProductById('P101'); // OnePlus Nord CE6
  const p133 = getProductById('P133'); // Nike Pegasus
  const p121 = getProductById('P121'); // boAt Nirvana Zenith Pro

  const img101 = getProductImageUrl('P101');
  const img133 = getProductImageUrl('P133');
  const img121 = getProductImageUrl('P121');

  // Sample match product for AI demonstration
  const matchProduct = getProductById('P106'); // Samsung S24 Ultra
  const matchImg = getProductImageUrl('P106');

  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white via-indigo-50/15 to-background py-16 md:py-24">
      {/* Subtle ambient lighting orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 size-[500px] rounded-full bg-gradient-to-b from-indigo-500/8 to-purple-500/4 blur-3xl pointer-events-none" />

      <Container className="relative z-10">
        {/* Top Identity & Headline */}
        <div className="mx-auto max-w-3xl text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-4 py-1 text-xs font-bold text-indigo-700 mb-5 shadow-2xs"
          >
            <Sparkles className="size-3.5 text-indigo-600" />
            <span>Autonomous Agentic Shopping & E-Commerce</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.12]"
          >
            How do you want to{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              shop?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Browse our curated collection of verified products yourself, or tell our AI shopping agent what you need in plain natural language.
          </motion.p>
        </div>

        {/* Two Large First-Class Shopping Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-14">
          {/* Card 1: 🛍️ SHOP MANUALLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-xl transition-all duration-300"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 border border-slate-200/80 shadow-2xs">
                  <Store className="size-6 text-slate-800" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider border border-slate-200/70">
                  Verified Authentic
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5 flex items-center gap-2">
                <span>Shop Manually</span>
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Browse our complete collection of verified products across electronics, personal audio, wearables, athletic gear, and wellness.
              </p>

              {/* Mini Authentic Catalog Collage */}
              <div className="rounded-2xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-2 mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60 pb-2">
                  <span>Featured Selections</span>
                  <span>Direct Retail</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {p101 && (
                    <div className="flex flex-col items-center rounded-xl bg-white border border-slate-200/80 p-2 text-center shadow-2xs">
                      <div className="relative size-12 mb-1">
                        {img101 ? (
                          <Image src={img101} alt={p101.name} fill className="object-contain" unoptimized />
                        ) : (
                          <ShoppingBag className="size-5 text-slate-400 m-auto" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-900 truncate w-full">{p101.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{formatPrice(p101.price)}</span>
                    </div>
                  )}

                  {/* Sample 2: P133 */}
                  {p133 && (
                    <div className="flex flex-col items-center rounded-xl bg-white border border-slate-200/80 p-2 text-center shadow-2xs">
                      <div className="relative size-12 mb-1">
                        {img133 ? (
                          <Image src={img133} alt={p133.name} fill className="object-contain" unoptimized />
                        ) : (
                          <ShoppingBag className="size-5 text-slate-400 m-auto" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-900 truncate w-full">{p133.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{formatPrice(p133.price)}</span>
                    </div>
                  )}

                  {/* Sample 3: P121 */}
                  {p121 && (
                    <div className="flex flex-col items-center rounded-xl bg-white border border-slate-200/80 p-2 text-center shadow-2xs">
                      <div className="relative size-12 mb-1">
                        {img121 ? (
                          <Image src={img121} alt={p121.name} fill className="object-contain" unoptimized />
                        ) : (
                          <ShoppingBag className="size-5 text-slate-400 m-auto" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-900 truncate w-full">{p121.name.split(' ')[0]} Earbuds</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{formatPrice(p121.price)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs gap-2 shadow-2xs cursor-pointer rounded-xl"
              render={<Link href="/shop" />}
            >
              <ShoppingBag className="size-4" />
              <span>Browse Full Catalog</span>
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>

          {/* Card 2: ✨ SHOP WITH AI (Primary Differentiator) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="group relative flex flex-col justify-between rounded-3xl border-2 border-indigo-500/80 bg-gradient-to-b from-indigo-50/30 via-white to-white p-7 sm:p-8 shadow-[0_8px_32px_-6px_rgba(79,70,229,0.12)] hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-500/30">
                  <Sparkles className="size-6" />
                </div>
                <span className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider border border-indigo-200/80">
                  Natural-Language Shopping
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5 flex items-center gap-2">
                <span>Shop with AI Agent</span>
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Describe what you need and let the shopping agent find and explain the right match.
              </p>

              {/* Compact AI Agent Interaction Preview */}
              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 space-y-2 mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100/80 pb-2">
                  <span className="flex items-center gap-1">
                    <Cpu className="size-3 text-indigo-600" />
                    Agent Preview
                  </span>
                  <span className="font-mono text-[9px] bg-white px-2 py-0.5 rounded-full border border-indigo-100 text-indigo-700 font-bold">Live Match</span>
                </div>

                {/* Prompt */}
                <p className="text-[11px] text-slate-800 italic leading-snug bg-white/90 p-2.5 rounded-xl border border-indigo-100/70 shadow-2xs">
                  &ldquo;Flagship phone with extreme zoom camera and all-day battery under ₹1,20,000.&rdquo;
                </p>

                {/* Match Result */}
                {matchProduct && (
                  <div className="flex items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-200/80 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative size-9 shrink-0">
                        {matchImg && <Image src={matchImg} alt={matchProduct.name} fill className="object-contain" unoptimized />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 truncate block text-[11px]">{matchProduct.name}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                          <Check className="size-2.5" /> 200MP Zoom • 5000mAh
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-slate-900 text-xs shrink-0">
                      {formatPrice(matchProduct.price)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs gap-2 shadow-md shadow-indigo-600/20 cursor-pointer rounded-xl"
              render={<Link href="/ai-shop" />}
            >
              <Sparkles className="size-4" />
              <span>Start AI Shopping</span>
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>

        {/* Trust & Transparency Strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-4 text-xs text-slate-500 border-t border-slate-200/70">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            Verified Authentic Catalog
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            Zero Hallucinated Specs
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            Direct Retail Pricing
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            100% Customer Controlled
          </span>
        </div>
      </Container>
    </section>
  );
}
