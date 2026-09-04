// ============================================================
// ShopNTrust — Shopping Choice Cards (Manual vs AI Agent)
// ============================================================
// Side-by-side premium decision cards:
// - Left: "SHOP MANUALLY" with real category previews and catalog link
// - Right: "SHOP WITH AI AGENT" with sample prompt bubbles, feature checks & CTA
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
  CheckCircle2,
  MessageSquare,
  GitCompare,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getProductImageUrl } from '@/lib/product-images';

export function ShoppingChoiceCards() {
  // Canonical category preview items
  const categoryPreviews = [
    { label: 'Mobiles', id: 'phones', productId: 'P101' },
    { label: 'Audio', id: 'headphones', productId: 'P121' },
    { label: 'Wearables', id: 'wearables', productId: 'P123' },
    { label: 'Athletics', id: 'footwear', productId: 'P133' },
    { label: 'Lifestyle', id: 'skincare', productId: 'P135' },
  ];

  return (
    <section className="py-8 sm:py-10 bg-[#F8F8FC]/60 border-b border-slate-200/70">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* ============================================================ */}
          {/* CARD 1: SHOP MANUALLY                                        */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
            className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-[0_2px_16px_-4px_rgba(11,16,38,0.04)] hover:border-slate-300 hover:shadow-lg transition-all duration-300"
          >
            <div>
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#F0EDFF] text-[#5B35F5] border border-indigo-100 shadow-2xs">
                  <Store className="size-5" />
                </div>
                <span className="rounded-full bg-[#F3F1FF] border border-indigo-200/60 px-3.5 py-1 text-[10px] font-bold text-[#5B35F5] uppercase tracking-wider">
                  Verified Authentic
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0B1026] mb-1.5">
                Shop Manually
              </h2>
              <p className="text-xs text-[#667085] leading-relaxed mb-5">
                Browse our complete collection of verified products across electronics, personal audio, wearables, athletic gear, and wellness.
              </p>

              {/* Compact Category Previews */}
              <div className="rounded-2xl bg-[#F8F8FC] border border-slate-200/80 p-3.5 mb-6">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/70 pb-2 mb-3">
                  <span>Explore Categories</span>
                  <span>Direct Retail</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {categoryPreviews.map((cat) => {
                    const imgUrl = getProductImageUrl(cat.productId);
                    return (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.id}`}
                        className="group/cat flex flex-col items-center rounded-xl bg-white border border-slate-200/80 p-1.5 text-center transition-all hover:border-[#5B35F5]/50 hover:shadow-xs"
                      >
                        <div className="relative size-10 mb-1 flex items-center justify-center">
                          {imgUrl ? (
                            <Image
                              src={imgUrl}
                              alt={cat.label}
                              fill
                              className="object-contain p-0.5 transition-transform group-hover/cat:scale-110"
                              unoptimized
                            />
                          ) : (
                            <ShoppingBag className="size-4 text-slate-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-[#10162F] truncate w-full group-hover/cat:text-[#5B35F5]">
                          {cat.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              variant="outline"
              className="w-full h-11 border-slate-200/90 bg-white hover:bg-[#F8F8FC] text-[#0B1026] font-bold text-xs gap-2 rounded-xl shadow-2xs cursor-pointer transition-all"
              render={<Link href="/shop" />}
            >
              <ShoppingBag className="size-4 text-slate-600" />
              <span>Explore Storefront</span>
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>

          {/* ============================================================ */}
          {/* CARD 2: SHOP WITH AI AGENT                                   */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col justify-between rounded-3xl border-2 border-[#5B35F5]/70 bg-gradient-to-b from-[#F3F1FF]/40 via-white to-white p-6 sm:p-7 shadow-[0_8px_30px_-6px_rgba(91,53,245,0.14)] hover:border-[#5B35F5] hover:shadow-xl hover:shadow-[#5B35F5]/15 transition-all duration-300"
          >
            <div>
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5B35F5] to-[#7C3AED] text-white shadow-md shadow-[#5B35F5]/25 ring-1 ring-[#5B35F5]/30">
                  <Sparkles className="size-5" />
                </div>
                <span className="rounded-full bg-[#F3F1FF] border border-indigo-200/60 px-3.5 py-1 text-[10px] font-bold text-[#5B35F5] uppercase tracking-wider">
                  Natural-Language Shopping
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0B1026] mb-1.5">
                Shop with <span className="text-[#5B35F5]">AI Agent</span>
              </h2>
              <p className="text-xs text-[#667085] leading-relaxed mb-4">
                Describe what you need and let the shopping agent find and explain the right match.
              </p>

              {/* Example AI Interaction Bubbles */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 rounded-xl bg-white border border-indigo-100 p-2 text-xs shadow-2xs">
                  <MessageSquare className="size-3.5 text-[#5B35F5] shrink-0" />
                  <span className="text-[11px] text-slate-700 italic truncate">
                    &ldquo;Find a flagship phone under ₹1,20,000 with best camera&rdquo;
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-white border border-indigo-100 p-2 text-xs shadow-2xs">
                  <GitCompare className="size-3.5 text-[#7C3AED] shrink-0" />
                  <span className="text-[11px] text-slate-700 italic truncate">
                    &ldquo;Compare P106 and P114&rdquo;
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-white border border-indigo-100 p-2 text-xs shadow-2xs">
                  <ShoppingBag className="size-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] text-slate-700 italic truncate">
                    &ldquo;Add option 1 to my bag&rdquo;
                  </span>
                </div>
              </div>

              {/* Feature Checkmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 border-t border-indigo-100 text-[11px] font-semibold text-[#10162F] mb-4">
                <span className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-600" />
                  Personalized picks
                </span>
                <span className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-600" />
                  Instant comparisons
                </span>
                <span className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-600" />
                  One-command bag
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full h-11 bg-gradient-to-r from-[#5B35F5] via-[#6366F1] to-[#7C3AED] hover:from-[#4927d6] hover:to-[#6d28d9] text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-[#5B35F5]/25 cursor-pointer transition-all"
              render={<Link href="/ai-shop" />}
            >
              <Sparkles className="size-4" />
              <span>Start AI Shopping</span>
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
