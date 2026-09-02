// ============================================================
// ShopNTrust — Homepage (Futuristic Agentic Commerce)
// ============================================================
// Structured hierarchy:
// 1. HeroSection (Split layout with animated AI shopping agent demonstration)
// 2. FeaturedPreview (Real canonical products immediately after hero)
// 3. BrowseSection (Real catalog category discovery)
// 4. AICommerceBridge ("Shop Your Way" - Traditional vs Agentic)
// 5. TrustSection (Transparency & Verified Catalog principles)
// 6. Final CTA ("Ready to shop with an agent?")
// ============================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedPreview } from '@/components/home/featured-preview';
import { BrowseSection } from '@/components/home/browse-section';
import { AICommerceBridge } from '@/components/home/ai-commerce-bridge';
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
      {/* 1. Hero with Live AI Agent Interaction Panel */}
      <HeroSection />

      {/* 2. Real E-Commerce Showcase (Explore Canonical Products) */}
      <FeaturedPreview />

      <div className="snt-divider" />

      {/* 3. Category Discovery with Real Catalog Categories */}
      <BrowseSection />

      {/* 4. AI + Commerce Bridge ("Shop Your Way") */}
      <AICommerceBridge />

      {/* 5. Trust & Transparency Principles */}
      <TrustSection />

      {/* 6. Final Homepage CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white to-indigo-50/40 border-t border-border/80 text-center">
        <Container size="narrow">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 text-xs font-bold text-snt-accent mb-4 shadow-2xs">
            <Sparkles className="size-3.5" />
            <span>Ready for the Next Era of Commerce</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
            Ready to shop with an intelligent agent?
          </h2>

          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Skip tedious filter adjustments. State your exact requirements in plain English and let our agent match genuine products from our canonical catalog.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-12 bg-snt-accent hover:bg-snt-accent-hover text-white font-bold px-8 shadow-md shadow-snt-accent/20 gap-2.5 cursor-pointer"
              render={<Link href="/ai-shop" />}
            >
              <Sparkles className="size-4" />
              <span>Start AI Shopping</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 border-border/90 bg-card hover:bg-secondary font-semibold px-6 cursor-pointer"
              render={<Link href="/shop" />}
            >
              Explore Full Catalog
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-emerald-600" />
              54 Authentic Items
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Direct Retail Pricing
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-4 text-emerald-600" />
              No Forced Purchase
            </span>
          </div>
        </Container>
      </section>
    </>
  );
}
