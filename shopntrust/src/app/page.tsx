// ============================================================
// ShopNTrust — Storefront Homepage (Autonomous Agentic Commerce)
// ============================================================
// Target visual structure:
// 1. GLOBAL NAVBAR (Header)
// 2. COMPACT HERO with Floating Active Campaign Card (HeroSection)
// 3. SHOP MANUALLY + SHOP WITH AI AGENT (ShoppingChoiceCards)
// 4. TRUSTED GLOBAL BRANDS STRIP (BrandStrip)
// 5. VERIFIED E-COMMERCE PRODUCTS (FeaturedPreview)
// 6. COMMERCE TRUST PRINCIPLES (TrustSection)
// 7. COMPACT FINAL CTA
// ============================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { ShoppingChoiceCards } from '@/components/home/shopping-choice-cards';
import { BrandStrip } from '@/components/home/brand-strip';
import { FeaturedPreview } from '@/components/home/featured-preview';
import { TrustSection } from '@/components/home/trust-section';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { isMerchant } = useAuth();

  // Role Guard: Merchants are isolated to /merchant
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  if (isMerchant) {
    return null;
  }

  return (
    <>
      {/* 1. Compact Hero with Canonical Product Visual & Dynamic Campaign Card */}
      <HeroSection />

      {/* 2. Side-by-Side Shopping Paths: Shop Manually vs Shop with AI Agent */}
      <ShoppingChoiceCards />

      {/* 3. Trusted Global Brands Strip */}
      <BrandStrip />

      {/* 4. Verified Products Collection with Dynamic Campaign Badges */}
      <FeaturedPreview />

      {/* 5. Trust & Transparency Principles */}
      <TrustSection />

      {/* 6. Compact Final Storefront Call-to-Action */}
      <section className="py-10 md:py-14 bg-gradient-to-b from-white via-[#F8F8FC] to-[#F3F1FF]/30 border-t border-slate-200/80 text-center">
        <Container size="narrow">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1FF] border border-[#5B35F5]/30 px-3 py-0.5 text-xs font-bold text-[#5B35F5] mb-3 shadow-2xs">
            <Sparkles className="size-3.5" />
            <span>Ready for the Next Era of Commerce</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1026] leading-tight">
            Ready to shop with an intelligent agent?
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-[#667085] max-w-lg mx-auto leading-relaxed">
            Skip tedious filter adjustments. State your exact requirements in plain English and let our agent match genuine products from our canonical catalog.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-11 bg-gradient-to-r from-[#5B35F5] via-[#6366F1] to-[#7C3AED] hover:from-[#4927d6] hover:to-[#6d28d9] text-white font-bold px-7 shadow-md shadow-[#5B35F5]/25 gap-2 cursor-pointer text-xs sm:text-sm rounded-xl"
              render={<Link href="/ai-shop" />}
            >
              <Sparkles className="size-4" />
              <span>Start AI Shopping</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-11 border-slate-200 bg-white hover:bg-[#F8F8FC] text-[#0B1026] font-bold px-6 text-xs sm:text-sm rounded-xl cursor-pointer"
              render={<Link href="/shop" />}
            >
              Explore Full Catalog
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#667085]">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              66 Authentic Items
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Direct Retail Pricing
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Customer Controlled
            </span>
          </div>
        </Container>
      </section>
    </>
  );
}
