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
  const p137 = getProductById('P137'); // boAt Earbuds

  const img101 = getProductImageUrl('P101');
  const img133 = getProductImageUrl('P133');
  const img137 = getProductImageUrl('P137');

  // Sample match product for AI demonstration
  const matchProduct = getProductById('P106'); // Samsung S24 Ultra
  const matchImg = getProductImageUrl('P106');

  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-white via-indigo-50/20 to-background py-14 md:py-20">
      <Container>
        {/* Top Identity & Headline */}
        <div className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-indigo-50/90 px-3.5 py-1 text-xs font-bold text-snt-accent mb-4 shadow-2xs"
          >
            <Sparkles className="size-3.5" />
            <span>Autonomous Agentic Shopping & E-Commerce</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12]"
          >
            How do you want to{' '}
            <span className="bg-gradient-to-r from-snt-accent via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              shop?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Browse our 54-product canonical catalog yourself, or tell our AI shopping agent what you need in plain natural language.
          </motion.p>
        </div>

        {/* Two Large First-Class Shopping Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-12">
          {/* Card 1: 🛍️ SHOP MANUALLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="group relative flex flex-col justify-between rounded-3xl border border-border/90 bg-card p-6 sm:p-7 shadow-sm hover:border-slate-400 hover:shadow-xl transition-all"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-foreground border border-border">
                  <Store className="size-6 text-slate-800" />
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider border border-border">
                  54 Real Products
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-foreground mb-1.5 flex items-center gap-2">
                <span>Shop Manually</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                Browse products, categories and brands yourself with multi-faceted search and sorting.
              </p>

              {/* Mini Authentic Catalog Collage */}
              <div className="rounded-2xl bg-secondary/40 border border-border p-3.5 space-y-2 mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5">
                  <span>Canonical Sample Items</span>
                  <span>Direct Retail</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Sample 1: P101 */}
                  {p101 && (
                    <div className="flex flex-col items-center rounded-xl bg-card border border-border/80 p-2 text-center">
                      <div className="relative size-12 mb-1">
                        {img101 ? (
                          <Image src={img101} alt={p101.name} fill className="object-contain" unoptimized />
                        ) : (
                          <ShoppingBag className="size-5 text-slate-400 m-auto" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-foreground truncate w-full">{p101.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold">{formatPrice(p101.price)}</span>
                    </div>
                  )}

                  {/* Sample 2: P133 */}
                  {p133 && (
                    <div className="flex flex-col items-center rounded-xl bg-card border border-border/80 p-2 text-center">
                      <div className="relative size-12 mb-1">
                        {img133 ? (
                          <Image src={img133} alt={p133.name} fill className="object-contain" unoptimized />
                        ) : (
                          <ShoppingBag className="size-5 text-slate-400 m-auto" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-foreground truncate w-full">{p133.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold">{formatPrice(p133.price)}</span>
                    </div>
                  )}

                  {/* Sample 3: P137 */}
                  {p137 && (
                    <div className="flex flex-col items-center rounded-xl bg-card border border-border/80 p-2 text-center">
                      <div className="relative size-12 mb-1">
                        {img137 ? (
                          <Image src={img137} alt={p137.name} fill className="object-contain" unoptimized />
                        ) : (
                          <ShoppingBag className="size-5 text-slate-400 m-auto" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-foreground truncate w-full">boAt Earbuds</span>
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold">{formatPrice(p137.price)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 border-slate-300 hover:border-foreground bg-card hover:bg-secondary font-bold text-xs gap-2 shadow-xs cursor-pointer"
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
            className="group relative flex flex-col justify-between rounded-3xl border-2 border-indigo-400/90 bg-gradient-to-b from-indigo-50/40 via-card to-card p-6 sm:p-7 shadow-lg shadow-indigo-500/10 hover:border-snt-accent hover:shadow-2xl transition-all"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-snt-accent text-white shadow-md shadow-snt-accent/25">
                  <Sparkles className="size-6" />
                </div>
                <span className="rounded-full bg-indigo-100 text-snt-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider border border-indigo-200">
                  Natural-Language Shopping
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-foreground mb-1.5 flex items-center gap-2">
                <span>Shop with AI Agent</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                Describe what you need and let the shopping agent find and explain the right match.
              </p>

              {/* Compact AI Agent Interaction Preview */}
              <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-3.5 space-y-2 mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-snt-accent border-b border-indigo-100/80 pb-1.5">
                  <span className="flex items-center gap-1">
                    <Cpu className="size-3" />
                    Agent Preview
                  </span>
                  <span className="font-mono text-[9px] bg-white px-1.5 py-0.2 rounded border border-indigo-100">Live Match</span>
                </div>

                {/* Prompt */}
                <p className="text-[11px] text-slate-800 italic leading-snug bg-white/80 p-2 rounded-lg border border-indigo-100/60">
                  &ldquo;Flagship phone with extreme zoom camera and all-day battery under ₹1,20,000.&rdquo;
                </p>

                {/* Match Result */}
                {matchProduct && (
                  <div className="flex items-center justify-between gap-2.5 bg-white p-2 rounded-lg border border-indigo-200/80 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative size-8 shrink-0">
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
              className="w-full h-12 bg-snt-accent hover:bg-snt-accent-hover text-white font-bold text-xs gap-2 shadow-md shadow-snt-accent/25 cursor-pointer"
              render={<Link href="/ai-shop" />}
            >
              <Sparkles className="size-4" />
              <span>Start AI Shopping</span>
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>

        {/* Trust & Transparency Strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2 text-xs text-muted-foreground border-t border-border/60">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            54 Verified Canonical Products
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            Zero Hallucinated Specs
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            Direct Retail Pricing
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            100% Customer Controlled
          </span>
        </div>
      </Container>
    </section>
  );
}
