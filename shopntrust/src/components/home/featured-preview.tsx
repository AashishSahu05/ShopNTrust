// ============================================================
// ShopNTrust — Verified Catalog Showcase (Homepage)
// ============================================================
// Displays real canonical products from the verified catalog
// with dynamic active campaign discount badges and one-click quick add.
// ============================================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { ProductCard } from '@/components/product-card';
import { getFeaturedProducts } from '@/lib/catalog';

export function FeaturedPreview() {
  const featuredProducts = getFeaturedProducts();

  return (
    <section className="py-10 sm:py-14 bg-white">
      <Container>
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200/80 mb-2.5 shadow-2xs">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>Verified E-Commerce Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1026]">
              Discover Verified Products
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#667085] max-w-xl leading-relaxed">
              Authentic flagship phones, personal audio, smartwatches, athletic gear, and more. Direct retail prices with zero fabricated discounts.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-[#F8F8FC] px-4 py-2 text-xs font-bold text-[#0B1026] hover:border-[#5B35F5]/60 transition-all shadow-2xs shrink-0"
          >
            <span>View Full Collection</span>
            <ArrowRight className="size-3.5 text-[#5B35F5]" />
          </Link>
        </motion.div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.slice(0, 8).map((product, i) => (
            <ProductCard key={product.product_id} product={product} index={i} />
          ))}
        </div>

        {/* Mobile "View all" link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F8F8FC] border border-slate-200 px-5 py-2.5 text-xs font-bold text-[#0B1026]"
          >
            <span>Explore full 66-item collection</span>
            <ArrowRight className="size-3.5 text-[#5B35F5]" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
