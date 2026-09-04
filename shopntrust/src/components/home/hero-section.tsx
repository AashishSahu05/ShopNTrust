// ============================================================
// ShopNTrust — Storefront Hero Section (AI-Commerce Showcase)
// ============================================================
// Visual Match to Authoritative Reference:
// - Left: Editorial serif headline with AI/Explore color accents,
//   subheading, pill action buttons, and 4 circular trust benefits.
// - Right: 3D-style Featured Active Campaign Card with glowing neon
//   pedestal, OnePlus Nord CE6 flagship visual, 10% OFF floating badge,
//   campaign thumbnails, live countdown timer, and "Upgrade your everyday" script.
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  CheckCircle2,
  Flame,
  Clock,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { useCampaigns } from '@/store/campaign-context';
import { getProductById, resolveProductIds } from '@/lib/catalog';
import { getProductImageUrl } from '@/lib/product-images';

export function HeroSection() {
  const { activeCampaigns, isLoading } = useCampaigns();

  // Active campaign from DB
  const campaign = activeCampaigns.length > 0 ? activeCampaigns[0] : null;

  // Resolved canonical products for the campaign
  const campaignProductIds = campaign?.productIds && campaign.productIds.length > 0
    ? campaign.productIds
    : ['P101', 'P105', 'P106', 'P107', 'P114', 'P115'];

  const resolvedProducts = resolveProductIds(campaignProductIds);
  const previewProducts = resolvedProducts.slice(0, 3);

  // Phone visual: OnePlus Nord CE6 (P101) from canonical catalog
  const heroProduct = getProductById('P101') || resolvedProducts[0] || getProductById('P114')!;
  const heroImageUrl = getProductImageUrl(heroProduct.product_id) || '/images/products/P101.jpg';

  // Live countdown timer calculation
  const [timeLeft, setTimeLeft] = useState({
    days: '04',
    hours: '12',
    minutes: '36',
    seconds: '21',
  });

  useEffect(() => {
    // Determine target end date from campaign or default to +4 days
    const targetDate = campaign?.endDate
      ? new Date(campaign.endDate).getTime()
      : Date.now() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 36 * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [campaign?.endDate]);

  const discountValue = campaign?.discountValue || 10;
  const campaignName = campaign?.name || 'Mobile Phones Sales Booster';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FAF9FF] to-white pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-slate-200/70">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 right-1/4 size-[600px] rounded-full bg-gradient-to-br from-[#5B35F5]/10 via-[#7C3AED]/8 to-[#6366F1]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 size-[400px] rounded-full bg-gradient-to-tr from-purple-500/5 to-indigo-500/5 blur-3xl pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* ============================================================ */}
          {/* LEFT COLUMN: Editorial Typography, Actions & Trust Strip     */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left">
            {/* Small Top Pill */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-[#F3F1FF] px-4 py-1 text-xs font-semibold text-[#5B35F5] mb-5 w-fit shadow-2xs"
            >
              <Sparkles className="size-3.5 text-[#5B35F5]" />
              <span>Autonomous Agentic Shopping & E-Commerce</span>
            </motion.div>

            {/* Editorial Serif Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#0B1026] leading-[1.12]"
            >
              Shop Smarter <br />
              with <span className="text-[#2563EB]">AI,</span> or{' '}
              <span className="text-[#7C3AED]">Explore</span> <br />
              Your Way.
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-4 text-sm sm:text-base text-[#667085] max-w-lg leading-relaxed font-normal"
            >
              Verified products, Direct retail prices, AI-powered shopping. <br className="hidden sm:inline" />
              Your trust, our priority.
            </motion.p>

            {/* Hero Quick Action Buttons (Pill buttons from reference) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-7 flex flex-wrap items-center gap-3.5"
            >
              <Button
                size="lg"
                className="h-12 px-7 bg-gradient-to-r from-[#5B35F5] via-[#6366F1] to-[#7C3AED] hover:from-[#4927d6] hover:to-[#6d28d9] text-white font-bold text-sm rounded-full shadow-md shadow-[#5B35F5]/30 gap-2.5 cursor-pointer transition-all duration-200 hover:shadow-lg"
                render={<Link href="/ai-shop" />}
              >
                <Sparkles className="size-4" />
                <span>Start AI Shopping</span>
                <ArrowRight className="size-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 border-slate-200 bg-white hover:bg-slate-50 text-[#0B1026] font-bold text-sm rounded-full shadow-2xs cursor-pointer transition-all"
                render={<Link href="/shop" />}
              >
                <span>Explore Storefront</span>
              </Button>
            </motion.div>

            {/* Compact Trust Benefits Strip with colored circle icons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
            >
              {/* 1. Verified Products */}
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-emerald-100/90 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-[#10162F] leading-tight text-[11px]">Verified Products</p>
                  <p className="text-[10px] text-[#667085]">100% Authentic</p>
                </div>
              </div>

              {/* 2. Free Delivery */}
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-indigo-100/90 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60">
                  <Truck className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-[#10162F] leading-tight text-[11px]">Free Delivery</p>
                  <p className="text-[10px] text-[#667085]">On All Orders</p>
                </div>
              </div>

              {/* 3. Direct Prices */}
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-purple-100/90 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200/60">
                  <Tag className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-[#10162F] leading-tight text-[11px]">Direct Prices</p>
                  <p className="text-[10px] text-[#667085]">No Fake Discounts</p>
                </div>
              </div>

              {/* 4. Curated Catalog */}
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-blue-100/90 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-[#10162F] leading-tight text-[11px]">Curated Catalog</p>
                  <p className="text-[10px] text-[#667085]">Top Global Brands</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: 3D-STYLE FEATURED CAMPAIGN SHOWPIECE           */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 relative flex items-center justify-center">
            <div className="relative w-full max-w-[620px]">
              {/* Handwritten script text top-right */}
              <div className="absolute -top-7 sm:-top-8 right-4 sm:right-6 z-20 select-none">
                <span className="font-serif italic font-semibold text-indigo-950 text-xl sm:text-2xl -rotate-6 inline-block drop-shadow-xs">
                  Upgrade your everyday
                </span>
              </div>

              {/* Top-left burst accent lines */}
              <div className="absolute -top-3.5 left-2 z-20 text-indigo-500/80">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="8" y1="6" x2="4" y2="3" />
                  <line x1="14" y1="4" x2="13" y2="0" />
                </svg>
              </div>

              {/* 3D CAMPAIGN CARD */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="relative rounded-[28px] bg-gradient-to-br from-[#12082A] via-[#1E0D45] to-[#2D1264] border-2 border-[#8B5CF6]/40 p-5 sm:p-7 text-white shadow-[0_20px_60px_-15px_rgba(139,92,246,0.45)] overflow-hidden"
              >
                {/* Background ambient lighting inside card */}
                <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-violet-600/30 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-1/4 size-48 rounded-full bg-indigo-500/20 blur-2xl" />

                {/* Top Section: Merchandising Details + 3D Pedestal with Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left Side: Badge, Title, Subtitle, Checkmarks */}
                  <div className="sm:col-span-7 flex flex-col justify-between z-10">
                    {/* Flame Badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#3D1228] border border-rose-500/40 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-300 mb-2.5 w-fit shadow-xs">
                      <Flame className="size-3 text-rose-400 fill-rose-400" />
                      <span>Featured Campaign</span>
                    </div>

                    {/* Campaign Headline */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-serif mb-2">
                      {campaignName.split(' ').slice(0, 2).join(' ')} <br />
                      {campaignName.split(' ').slice(2).join(' ') || 'Sales Booster'}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xs text-indigo-200/90 leading-relaxed mb-4 max-w-[240px]">
                      Get <span className="font-bold text-white">{discountValue}% OFF</span> on selected flagship phones
                    </p>

                    {/* Bullet Points with circular checkmarks */}
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/95">
                        <div className="size-4 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                        <span>Latest models</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-white/95">
                        <div className="size-4 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                        <span>Verified products</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-white/95">
                        <div className="size-4 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                        <span>Limited time offer</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: 3D Stage with Standing Phone and Glowing Badge */}
                  <div className="sm:col-span-5 relative flex items-center justify-center min-h-[220px] sm:min-h-[260px]">
                    {/* Top right pill badge */}
                    <div className="absolute top-0 right-1 z-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2.5 py-0.5">
                      {discountValue}% OFF
                    </div>

                    {/* Glowing circular discount badge floating next to phone */}
                    <div className="absolute right-0 sm:-right-2 top-1/2 -translate-y-1/2 z-30 size-16 sm:size-18 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#4F46E5] border-2 border-white/50 shadow-[0_0_25px_rgba(124,58,237,0.85)] flex flex-col items-center justify-center text-white text-center">
                      <span className="text-base sm:text-lg font-black leading-none">{discountValue}%</span>
                      <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider leading-none mt-0.5">OFF</span>
                    </div>

                    {/* 3D Glowing Neon Pedestal Stage */}
                    <div className="absolute bottom-2 w-48 sm:w-52 h-16 sm:h-20 rounded-[100%] bg-gradient-to-b from-[#8B5CF6] to-[#3B0764] p-[2.5px] shadow-[0_0_35px_rgba(139,92,246,0.8),inset_0_0_20px_rgba(168,85,247,0.5)]">
                      <div className="w-full h-full rounded-[100%] bg-gradient-to-b from-[#2E1065] via-[#1E0845] to-[#0F0426] border border-violet-400/60 flex items-center justify-center">
                        <div className="w-36 sm:w-40 h-12 sm:h-14 rounded-[100%] border border-violet-300/40 shadow-[inset_0_0_15px_rgba(167,139,250,0.6)]" />
                      </div>
                    </div>

                    {/* Standing Phone Visual (P101: OnePlus Nord CE6) */}
                    <div className="relative z-10 w-40 sm:w-44 h-52 sm:h-60 transition-transform duration-500 hover:scale-105">
                      <Image
                        src={heroImageUrl}
                        alt={heroProduct.name}
                        fill
                        className="object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.7)]"
                        priority
                        unoptimized
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Product Thumbnails on Left + Countdown Timer on Right */}
                <div className="mt-4 pt-3.5 border-t border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
                  {/* Left: Product preview thumbnails */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {previewProducts.map((p) => {
                        const thumb = getProductImageUrl(p.product_id);
                        return (
                          <div
                            key={p.product_id}
                            className="size-8 sm:size-9 rounded-xl bg-white border border-white/40 p-1 flex items-center justify-center shadow-xs overflow-hidden"
                          >
                            {thumb && (
                              <Image
                                src={thumb}
                                alt={p.name}
                                width={26}
                                height={26}
                                className="object-contain"
                                unoptimized
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-medium text-indigo-200/90 whitespace-nowrap">
                      {campaign?.productCount || resolvedProducts.length || 6} verified items
                    </span>
                  </div>

                  {/* Right: Countdown timer */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-200/90 mb-1">
                      <Clock className="size-3 text-indigo-300" />
                      <span>Offer ends in</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col items-center rounded-lg bg-[#0F0724] border border-indigo-900/60 px-1.5 sm:px-2 py-0.5 min-w-[28px] sm:min-w-[32px]">
                        <span className="font-mono text-xs font-black text-white">{timeLeft.days}</span>
                        <span className="text-[7px] sm:text-[8px] text-indigo-300 font-medium uppercase">Days</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg bg-[#0F0724] border border-indigo-900/60 px-1.5 sm:px-2 py-0.5 min-w-[28px] sm:min-w-[32px]">
                        <span className="font-mono text-xs font-black text-white">{timeLeft.hours}</span>
                        <span className="text-[7px] sm:text-[8px] text-indigo-300 font-medium uppercase">Hours</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg bg-[#0F0724] border border-indigo-900/60 px-1.5 sm:px-2 py-0.5 min-w-[28px] sm:min-w-[32px]">
                        <span className="font-mono text-xs font-black text-white">{timeLeft.minutes}</span>
                        <span className="text-[7px] sm:text-[8px] text-indigo-300 font-medium uppercase">Minutes</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg bg-[#0F0724] border border-indigo-900/60 px-1.5 sm:px-2 py-0.5 min-w-[28px] sm:min-w-[32px]">
                        <span className="font-mono text-xs font-black text-white">{timeLeft.seconds}</span>
                        <span className="text-[7px] sm:text-[8px] text-indigo-300 font-medium uppercase">Seconds</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <Link
                  href={campaign?.id ? `/shop?campaign=${campaign.id}` : '/shop'}
                  className="mt-4 w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#5B35F5] via-[#6366F1] to-[#7C3AED] hover:from-[#4b2ad6] hover:to-[#6d28d9] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#5B35F5]/40 transition-all cursor-pointer group"
                >
                  <span>Shop the Campaign</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
