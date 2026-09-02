// ============================================================
// ShopNTrust — Browse Section (Homepage)
// ============================================================
// Real category pathway connecting to /shop with category filters.
// ============================================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Laptop,
  Headphones,
  Smartphone,
  Watch,
  Zap,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { getAvailableCategories } from '@/lib/catalog';
import type { ProductCategory } from '@/types';
import { cn } from '@/lib/utils';

/** Map category IDs to icons */
const categoryIconMap: Partial<Record<ProductCategory, React.ElementType>> = {
  phones: Smartphone,
  headphones: Headphones,
  wearables: Watch,
  laptops: Laptop,
  accessories: Zap,
  skincare: Sparkles,
  nutrition: HeartPulse,
};

/** Map category IDs to gradient classes */
const categoryGradientMap: Partial<Record<ProductCategory, string>> = {
  phones: 'from-sky-500/10 to-cyan-500/5',
  headphones: 'from-violet-500/10 to-purple-500/5',
  wearables: 'from-rose-500/10 to-pink-500/5',
  laptops: 'from-blue-500/10 to-indigo-500/5',
  accessories: 'from-emerald-500/10 to-teal-500/5',
  skincare: 'from-teal-500/10 to-emerald-500/5',
  nutrition: 'from-amber-500/10 to-yellow-500/5',
};

export function BrowseSection() {
  const categories = getAvailableCategories().slice(0, 6);

  return (
    <section className="py-20 md:py-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Browse by category
            </h2>
            <p className="mt-2 text-muted-foreground">
              Explore authentic product collections curated across technology and lifestyle.
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            View all categories
            <ArrowRight className="size-3.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, i) => {
            const Icon = categoryIconMap[category.id] || Smartphone;
            const gradient = categoryGradientMap[category.id] || 'from-gray-500/10 to-slate-500/5';

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link
                  href={`/shop?category=${category.id}`}
                  className={cn(
                    'group relative flex flex-col items-center rounded-xl border border-border p-5 text-center',
                    'transition-all duration-300',
                    'hover:border-snt-accent/30 hover:shadow-lg hover:shadow-snt-accent/5',
                    'bg-gradient-to-br',
                    gradient
                  )}
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-background/60 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-4 text-muted-foreground group-hover:text-snt-accent transition-colors" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground line-clamp-1">
                    {category.label}
                  </h3>
                  <span className="mt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    {category.count} items
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile "View all" link */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href="/shop"
            className="flex items-center gap-1 text-sm font-medium text-snt-accent hover:text-snt-accent/80"
          >
            View all categories
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
