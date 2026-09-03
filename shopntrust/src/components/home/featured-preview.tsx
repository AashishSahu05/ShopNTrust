// ============================================================
// ShopNTrust — Featured Catalog Showcase (Homepage)
// ============================================================
// Displays real canonical products from the verified catalog
// immediately below the hero to establish a real e-commerce presence.
// ============================================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PackageCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { ProductCard } from '@/components/product-card';
import { getFeaturedProducts } from '@/lib/catalog';

export function FeaturedPreview() {
  const featuredProducts = getFeaturedProducts();

  return (
    <section className="py-16 md:py-24 bg-background">
      <Container>
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 mb-2">
              <PackageCheck className="size-3.5" />
              <span>Verified E-Commerce Catalog</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Discover Verified Products
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Authentic flagship phones, personal audio, smartwatches, and athletic gear. Direct retail prices with zero fabricated discounts.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:border-snt-accent/60 transition-all shadow-2xs shrink-0"
          >
            <span>View Full Collection</span>
            <ArrowRight className="size-3.5 text-snt-accent" />
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
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-xs font-bold text-foreground"
          >
            <span>Explore the complete collection</span>
            <ArrowRight className="size-3.5 text-snt-accent" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
