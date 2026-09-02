// ============================================================
// ShopNTrust — Modern Storefront (/shop)
// ============================================================
// Futuristic, product-first catalog browsing experience.
// Supports URL search parameter synchronization, instant search,
// dynamic category pills, brand filtering, and complete sorting.
// ============================================================

'use client';

import { useState, useMemo, useDeferredValue, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  X,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { useAuth } from '@/store/auth-context';
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

  // Role Guard: Merchants are isolated from customer shop
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  const urlCategory = searchParams.get('category') || 'all';
  const urlQuery = searchParams.get('q') || '';
  const urlBrand = searchParams.get('brand') || 'all';

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
  const allProducts = useMemo(() => getAllProducts(), []);

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts({
      query: deferredQuery,
      category: selectedCategory,
      brand: selectedBrand,
      sortBy,
    });
  }, [deferredQuery, selectedCategory, selectedBrand, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
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

  if (isMerchant) {
    return null;
  }

  return (
    <div className="py-8 md:py-12 bg-background min-h-screen">
      <Container>
        {/* Page Header Banner */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-snt-accent border border-indigo-200/60">
                Official Catalog
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {allProducts.length} Verified Products
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Curated Storefront
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Explore authentic smartphones, personal audio, smart gear, athletic apparel, and wellness essentials.
            </p>
          </div>

          {/* AI Banner */}
          <Link
            href="/ai-shop"
            className="flex items-center gap-3 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50/50 p-3 px-4 shadow-xs transition-all hover:border-snt-accent hover:shadow-md hover:shadow-snt-accent/5"
          >
            <div className="flex size-8 items-center justify-center rounded-xl bg-snt-accent text-white shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Looking for something specific?
              </p>
              <p className="text-[11px] text-snt-accent font-medium">
                Try Natural AI Shopping →
              </p>
            </div>
          </Link>
        </div>

        {/* Toolbar: Search, Brand & Sort */}
        <div className="mb-6 rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            {/* Search Input */}
            <div className="relative sm:col-span-6 lg:col-span-7">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, brand, specifications, or category..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-snt-accent focus:outline-none focus:ring-1 focus:ring-snt-accent transition-all"
                aria-label="Search catalog"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus:border-snt-accent focus:outline-none cursor-pointer"
                aria-label="Filter by brand"
              >
                <option value="all">All Brands ({brands.length})</option>
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
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus:border-snt-accent focus:outline-none cursor-pointer"
                aria-label="Sort products"
              >
                <option value="featured">Sort: Curated Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Category Carousel Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-border/40">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              All Items ({allProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-snt-accent text-white font-semibold shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter & Active Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">
              {filteredProducts.length}
            </span>
            <span>
              {filteredProducts.length === 1 ? 'product' : 'products'} found
            </span>
            {hasActiveFilters && (
              <span className="text-muted-foreground/60">
                (filtered from {allProducts.length} total)
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-snt-accent hover:text-snt-accent/80 gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3" />
              Reset filters
            </Button>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.product_id} product={product} index={index} />
            ))}
          </div>
        ) : (
          /* Empty Search Results */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary mb-4">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              No matching products found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              We couldn&apos;t find any items matching your current filters. Try resetting search or checking another category.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-5 gap-2 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Clear all filters
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading storefront...</div>}>
      <ShopContent />
    </Suspense>
  );
}
