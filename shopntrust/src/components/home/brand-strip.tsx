// ============================================================
// ShopNTrust — Trusted Global Brands Strip
// ============================================================
// Compact brand strip rendering brands verified against the canonical catalog:
// Apple, Samsung, OnePlus, Sony, Nike, ASUS, Logitech, Noise, Ultrahuman, Minimalist, boAt.
// Clicking any brand filters the storefront catalog directly.
// ============================================================

'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';

export function BrandStrip() {
  // Canonical catalog verified brands
  const canonicalBrands = [
    'Apple',
    'Samsung',
    'OnePlus',
    'Sony',
    'Nike',
    'ASUS',
    'Logitech',
    'Noise',
    'Ultrahuman',
    'Minimalist',
    'boAt',
  ];

  return (
    <section className="py-4.5 sm:py-5 bg-white border-b border-slate-200/70">
      <Container>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          {/* Header Title */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Trusted Global Brands
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
          </div>

          {/* Brands List */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap overflow-x-auto py-1 text-xs">
            {canonicalBrands.map((brand) => (
              <Link
                key={brand}
                href={`/shop?brand=${encodeURIComponent(brand)}`}
                className="inline-flex items-center rounded-xl bg-[#F8F8FC] hover:bg-[#F3F1FF] border border-slate-200/80 hover:border-[#5B35F5]/40 px-3 py-1 font-bold text-[#10162F] hover:text-[#5B35F5] transition-all duration-150 shadow-2xs text-[11px]"
              >
                {brand}
              </Link>
            ))}
          </div>

          {/* View All Brands CTA */}
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5B35F5] hover:text-[#4327d6] shrink-0 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
