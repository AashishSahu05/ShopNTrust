// ============================================================
// ShopNTrust — Futuristic AI-Commerce Storefront (/shop)
// ============================================================
// Curated high-performance catalog browsing experience.
// Combines editorial typography, verified real product photography,
// command-style instant search, intelligent category navigation,
// and seamless bridge to natural language AI shopping.
// ============================================================

'use client';

import { useState, useMemo, useDeferredValue, Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  X,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  Compass,
  Flame,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { useAuth } from '@/store/auth-context';
import { useCampaigns } from '@/store/campaign-context';
import {
  getAllProducts,
  getAvailableCategories,
  getAvailableBrands,
  filterAndSortProducts,
  type FilterOptions,
} from '@/lib/catalog';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isMerchant } = useAuth();
  const collectionRef = useRef<HTMLDivElement>(null);

  // Role Guard: Merchants are isolated to merchant dashboard
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  const urlCategory = searchParams.get('category') || 'all';
  const urlQuery = searchParams.get('q') || '';
  const urlBrand = searchParams.get('brand') || 'all';
  const urlCampaign = searchParams.get('campaign') || '';

  const { activeCampaigns } = useCampaigns();
  const activeCampaign = useMemo(() => {
    if (!urlCampaign) return null;
    return (
      activeCampaigns.find((c) => c.id === urlCampaign || urlCampaign === 'active') ||
      activeCampaigns[0] ||
      null
    );
  }, [urlCampaign, activeCampaigns]);

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>(urlBrand);
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('featured');

  const [prevUrlCategory, setPrevUrlCategory] = useState(urlCategory);
  if (urlCategory !== prevUrlCategory) {
    setPrevUrlCategory(urlCategory);
    setSelectedCategory(urlCategory);
  }

  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const [prevUrlBrand, setPrevUrlBrand] = useState(urlBrand);
  if (urlBrand !== prevUrlBrand) {
    setPrevUrlBrand(urlBrand);
    setSelectedBrand(urlBrand);
  }

  const deferredQuery = useDeferredValue(searchQuery);

  const categories = useMemo(() => getAvailableCategories(), []);
  const brands = useMemo(() => getAvailableBrands(), []);

  const filteredProducts = useMemo(() => {
    let list = filterAndSortProducts({
      query: deferredQuery,
      category: selectedCategory,
      brand: selectedBrand,
      sortBy,
    });

    if (activeCampaign && Array.isArray(activeCampaign.productIds) && activeCampaign.productIds.length > 0) {
      const allowedIds = new Set(activeCampaign.productIds.map((id) => id.toUpperCase()));
      list = list.filter((p) => allowedIds.has(p.product_id.toUpperCase()));
    }

    return list;
  }, [deferredQuery, selectedCategory, selectedBrand, sortBy, activeCampaign]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    Boolean(activeCampaign) ||
    sortBy !== 'featured';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSortBy('featured');
    router.push('/shop');
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      router.push('/shop');
    } else {
      router.push(`/shop?category=${catId}`);
    }
  };

  const scrollToCollection = () => {
    collectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isMerchant) {
    return null;
  }

  return (
    <div className="py-6 md:py-10 bg-background min-h-screen">
      <Container>
        {/* ============================================================ */}
        {/* STEP 3 — STRONG STOREFRONT HERO EXPERIENCE */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-[#0B0F17] to-indigo-950/70 text-white p-8 sm:p-11 mb-8 shadow-xl shadow-slate-950/15">
          {/* Subtle ambient lighting orb */}
          <div className="absolute top-0 right-1/4 -mt-16 size-80 rounded-full bg-indigo-500/12 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 -mb-12 size-64 rounded-full bg-purple-500/8 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            {/* Small premium eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-300 backdrop-blur-xs mb-3.5 shadow-2xs">
              <Sparkles className="size-3.5 text-indigo-400" />
              <span>The ShopNTrust Edit</span>
            </div>

            {/* Large headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1] mb-3">
              Discover what fits your world.
            </h1>

            {/* Supporting copy */}
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed mb-7 font-normal">
              Explore authentic high-performance tech, personal audio, smart gear, athletic apparel, and wellness essentials—curated manually or discovered with real-time AI guidance.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={scrollToCollection}
                className="h-11 px-6 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-100 hover:shadow-lg transition-all cursor-pointer shadow-sm text-xs sm:text-sm"
              >
                <span>Explore Collection</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Button>

              <Link
                href="/ai-shop"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-indigo-400/40 bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/60 hover:border-indigo-400/70 font-semibold transition-all backdrop-blur-xs text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                <Sparkles className="size-4 text-indigo-400" />
                <span>Shop with AI</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STEP 4 — AI DISCOVERY BANNER (Subtle & Elegant Near Search) */}
        {/* ============================================================ */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-indigo-100/90 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-white p-4 px-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xs shrink-0">
              <Compass className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Not sure what to choose?
              </p>
              <p className="text-[11px] text-slate-500">
                Tell our AI shopping assistant what you need in plain natural language.
              </p>
            </div>
          </div>

          <Link
            href="/ai-shop"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold px-4 py-2 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Ask AI</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* ============================================================ */}
        {/* STEP 5 & 6 — PREMIUM SEARCH, CATEGORY & FILTER DISCOVERY */}
        {/* ============================================================ */}
        <div ref={collectionRef} id="collection-grid" className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_4px_16px_-4px_rgba(15,23,42,0.03)] space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            {/* Command-Style Search Bar */}
            <div className="relative sm:col-span-6 lg:col-span-7">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, or what you're looking for..."
                className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs"
                aria-label="Search products, brands, or what you're looking for"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 cursor-pointer p-1 rounded-md"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Brand Dropdown */}
            <div className="sm:col-span-3 lg:col-span-2.5">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs"
                aria-label="Filter by brand"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-3 lg:col-span-2.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as FilterOptions['sortBy'])}
                className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs"
                aria-label="Sort products"
              >
                <option value="featured">Sort: Curated Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Category Carousel Pills (Clean & Obvious Active States) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1.5 scrollbar-none border-t border-slate-100">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-xs shadow-indigo-600/20'
                    : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Status & Active Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-2 font-medium">
            <SlidersHorizontal className="size-3.5 text-slate-400" />
            <span className="text-foreground font-semibold">
              Curated Selection
            </span>
            {selectedCategory !== 'all' && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold text-snt-accent">
                {categories.find((c) => c.id === selectedCategory)?.label || selectedCategory}
              </span>
            )}
            {selectedBrand !== 'all' && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {selectedBrand}
              </span>
            )}
            {activeCampaign && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                <Flame className="size-3 text-rose-500 fill-rose-500" />
                <span>Campaign: {activeCampaign.name} ({activeCampaign.discountValue}% OFF)</span>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-snt-accent hover:text-snt-accent/80 hover:bg-snt-accent/10 gap-1.5 cursor-pointer rounded-lg font-semibold"
            >
              <RotateCcw className="size-3" />
              <span>Reset filters</span>
            </Button>
          )}
        </div>

        {/* ============================================================ */}
        {/* STEP 10 — PRODUCT GRID */}
        {/* ============================================================ */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.product_id} product={product} index={index} />
            ))}
          </div>
        ) : (
          /* ============================================================ */
          /* STEP 11 — POLISHED EMPTY DISCOVERY STATE */
          /* ============================================================ */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/90 bg-card p-12 sm:p-16 text-center shadow-xs">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary mb-4 text-muted-foreground shadow-2xs">
              <Search className="size-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              We couldn&apos;t find that yet.
            </h3>
            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
              No catalog items matched your current search filters. You can reset filters, explore other categories, or let our AI shopping assistant guide you.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-4 rounded-xl gap-2 cursor-pointer font-semibold"
              >
                <RotateCcw className="size-3.5" />
                <span>Clear search & filters</span>
              </Button>

              <Link
                href="/ai-shop"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-snt-accent hover:bg-snt-accent-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Ask AI</span>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground font-medium">Loading collection...</div>}>
      <ShopContent />
    </Suspense>
  );
}
