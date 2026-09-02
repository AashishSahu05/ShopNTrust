// ============================================================
// ShopNTrust — Editorial Product Detail Page (/product/[productId])
// ============================================================

'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  Info,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { getProductById, resolveProductIds } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/store/cart-context';
import { useAuth } from '@/store/auth-context';
import { getProductImageUrl, getProductGallery } from '@/lib/product-images';
import type { ProductVariant } from '@/types';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ productId: string }>;
}

function ProductDetailView({
  product,
  productId,
}: {
  product: NonNullable<ReturnType<typeof getProductById>>;
  productId: string;
}) {
  const router = useRouter();
  const { isMerchant, recordViewedProduct } = useAuth();

  // Role Guard: Merchants are isolated from customer product view
  useEffect(() => {
    if (isMerchant) {
      router.replace('/merchant');
    }
  }, [isMerchant, router]);

  useEffect(() => {
    if (!isMerchant) {
      recordViewedProduct(productId);
    }
  }, [productId, recordViewedProduct, isMerchant]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(() => {
    return product.variants && product.variants.length > 0 ? product.variants[0] : undefined;
  });
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs'>('overview');

  const galleryImages = useMemo(() => getProductGallery(productId), [productId]);
  const [activeImage, setActiveImage] = useState<string | null>(() => getProductImageUrl(productId));
  const [imageError, setImageError] = useState(false);

  const { addItem, isInCart } = useCart();

  const crossSellProducts = useMemo(
    () => resolveProductIds(product.crossSellIds || []),
    [product.crossSellIds]
  );
  const upsellProducts = useMemo(
    () => resolveProductIds(product.upsellIds || []),
    [product.upsellIds]
  );

  if (isMerchant) {
    return null;
  }

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentMrp = selectedVariant?.mrp ?? product.mrp;
  const savings = currentMrp && currentMrp > currentPrice ? currentMrp - currentPrice : 0;
  const inCart = isInCart(product.product_id, selectedVariant?.variant_id);

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity, 'manual');
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  return (
    <div className="py-8 md:py-12 bg-background min-h-screen">
      <Container>
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/60" />
          <Link href="/shop" className="hover:text-foreground transition-colors">
            Storefront
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/60" />
          <Link
            href={`/shop?category=${product.category}`}
            className="capitalize text-muted-foreground hover:text-foreground transition-colors"
          >
            {product.categoryDisplay || product.category}
          </Link>
          <ChevronRight className="size-3 text-muted-foreground/60" />
          <span className="font-semibold text-foreground truncate max-w-[240px]">
            {product.name}
          </span>
        </nav>

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Product Showcase */}
          <div className="lg:col-span-6">
            <div className="sticky top-24 space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border/80 bg-slate-50/70 p-8 flex items-center justify-center shadow-sm">
                {activeImage && !imageError ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain p-6 transition-all duration-300"
                    onError={() => setImageError(true)}
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                      <ShoppingBag className="size-8 text-slate-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-500">Image Reference Pending</span>
                    <span className="text-xs text-slate-400 font-mono mt-1">Product ID: {product.product_id}</span>
                  </div>
                )}

                {/* Brand & Stock Badges */}
                <div className="absolute top-5 left-5 flex flex-wrap gap-2 z-10">
                  <span className="inline-flex items-center rounded-lg bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-800 shadow-xs border border-slate-200">
                    {product.brand || product.categoryDisplay}
                  </span>
                  {product.stockStatus === 'in_stock' ? (
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      In Stock {product.stockQuantity ? `(${product.stockQuantity})` : ''}
                    </span>
                  ) : product.stockStatus === 'low_stock' ? (
                    <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                      Low Stock {product.stockQuantity ? `(${product.stockQuantity})` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* SKU Code Stamp */}
                <div className="absolute bottom-5 left-5 z-10">
                  <span className="font-mono text-xs font-semibold text-slate-500 bg-white/90 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
                    ID: {product.product_id}
                  </span>
                </div>
              </div>

              {/* Gallery Thumbnails (if multiple images) */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveImage(img);
                        setImageError(false);
                      }}
                      className={cn(
                        'relative size-16 shrink-0 rounded-xl overflow-hidden border-2 bg-slate-50 p-1 cursor-pointer transition-all',
                        activeImage === img
                          ? 'border-snt-accent shadow-xs ring-1 ring-snt-accent'
                          : 'border-border opacity-70 hover:opacity-100'
                      )}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Assurance Bar */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground shadow-2xs">
                <div className="flex flex-col items-center gap-1.5">
                  <Truck className="size-4 text-snt-accent" />
                  <span className="font-medium text-foreground">
                    {product.shippingCharge === '₹0' || product.shippingCharge === 'Free' ? 'Free Delivery' : product.shippingCharge}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{product.deliveryEstimate}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 border-x border-border">
                  <RotateCcw className="size-4 text-snt-accent" />
                  <span className="font-medium text-foreground">
                    {product.returnable ? `${product.returnWindowDays} Days Return` : 'Non-returnable'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Standard Policy</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <ShieldCheck className="size-4 text-snt-accent" />
                  <span className="font-medium text-foreground">100% Genuine</span>
                  <span className="text-[10px] text-muted-foreground">Direct Source</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details, Variants, Price, Purchase */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Category & Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-snt-accent border border-indigo-100">
                    {product.categoryDisplay || product.category}
                  </span>
                  {product.subCategory && (
                    <span className="text-xs text-muted-foreground">
                      • {product.subCategory}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
                  {product.name}
                </h1>

                {/* Rating Breakdown */}
                {product.rating !== undefined && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-amber-800 font-bold text-xs">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      <span>{product.rating.toFixed(1)}</span>
                    </div>
                    {product.reviewCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        based on <strong className="text-foreground">{product.reviewCount}</strong> verified reviews
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price Display Box */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                    {formatPrice(currentPrice, product.currency)}
                  </span>
                  {currentMrp && currentMrp > currentPrice && (
                    <>
                      <span className="text-sm text-muted-foreground line-through font-medium">
                        {formatPrice(currentMrp, product.currency)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Save {formatPrice(savings, product.currency)}
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Tax-inclusive pricing. All payment modes supported via Razorpay.
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-700 leading-relaxed">
                {product.description}
              </p>

              {/* Variant Selectors */}
              {product.variants && product.variants.length > 0 && (
                <div className="border-t border-border pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Configuration / Variant
                    </label>
                    {selectedVariant && (
                      <span className="text-xs font-bold text-snt-accent">
                        {selectedVariant.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.variant_id === v.variant_id;

                      return (
                        <button
                          key={v.variant_id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={cn(
                            'flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer',
                            isSelected
                              ? 'border-snt-accent bg-indigo-50/70 shadow-sm ring-1 ring-snt-accent'
                              : 'border-border bg-card hover:bg-secondary/60 hover:border-slate-300'
                          )}
                        >
                          <span className="text-xs font-bold text-foreground">
                            {v.name}
                          </span>
                          <span className="mt-1 text-[11px] font-mono font-semibold text-muted-foreground">
                            {formatPrice(v.price, product.currency)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Add to Cart */}
              <div className="border-t border-border pt-6">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Stepper */}
                  <div className="flex items-center rounded-xl border border-border bg-card p-1 shrink-0 justify-between sm:justify-start">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold font-mono text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      disabled={quantity >= 10}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={product.stockStatus === 'out_of_stock'}
                    className={cn(
                      'flex-1 h-12 text-sm font-bold gap-2 shadow-sm transition-all cursor-pointer',
                      addedSuccess
                        ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                        : 'bg-snt-accent hover:bg-snt-accent-hover text-white shadow-indigo-500/20'
                    )}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="size-4" />
                        <span>Added to Shopping Bag!</span>
                      </>
                    ) : inCart ? (
                      <>
                        <Check className="size-4 text-white" />
                        <span>Add More to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4" />
                        <span>Add to Bag • {formatPrice(currentPrice * quantity, product.currency)}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Tabs & Specs Section */}
        <div className="mt-16 border-t border-border pt-10">
          <div className="flex border-b border-border mb-8 gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'pb-3.5 text-sm font-bold transition-all border-b-2 cursor-pointer',
                activeTab === 'overview'
                  ? 'border-snt-accent text-snt-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Overview & Features
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={cn(
                'pb-3.5 text-sm font-bold transition-all border-b-2 cursor-pointer',
                activeTab === 'specs'
                  ? 'border-snt-accent text-snt-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Technical Specifications
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {product.featuresList && product.featuresList.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-foreground mb-3.5">
                    Highlighted Features
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {product.featuresList.map((f, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 text-xs text-slate-800">
                        <Check className="size-4 text-snt-accent shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.benefits && product.benefits.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-foreground mb-3">
                    Verified Benefits
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                    {product.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(product.useCases || product.targetCustomer) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.useCases && product.useCases.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2.5">
                        Ideal Scenarios
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {product.useCases.map((u, i) => (
                          <span key={i} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-slate-700">
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.targetCustomer && product.targetCustomer.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2.5">
                        Recommended Audience
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {product.targetCustomer.map((tc, i) => (
                          <span key={i} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-slate-700">
                            {tc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-border/80">
                      <th className="w-1/3 bg-secondary/60 p-3.5 font-bold text-foreground">Canonical ID</th>
                      <td className="p-3.5 font-mono font-semibold text-slate-700">{product.product_id}</td>
                    </tr>
                    <tr className="border-b border-border/80">
                      <th className="bg-secondary/60 p-3.5 font-bold text-foreground">Brand</th>
                      <td className="p-3.5 text-slate-700">{product.brand || 'Official'}</td>
                    </tr>
                    <tr className="border-b border-border/80">
                      <th className="bg-secondary/60 p-3.5 font-bold text-foreground">Category</th>
                      <td className="p-3.5 text-slate-700">{product.categoryDisplay || product.category}</td>
                    </tr>
                    {product.subCategory && (
                      <tr className="border-b border-border/80">
                        <th className="bg-secondary/60 p-3.5 font-bold text-foreground">Sub-Category</th>
                        <td className="p-3.5 text-slate-700">{product.subCategory}</td>
                      </tr>
                    )}
                    {product.specifications &&
                      Object.entries(product.specifications).map(([key, val]) => (
                        <tr key={key} className="border-b border-border/80">
                          <th className="bg-secondary/60 p-3.5 font-bold text-foreground">{key}</th>
                          <td className="p-3.5 text-slate-700">{val}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {product.rawSpecs && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Detailed Hardware & Manufacturing Data
                  </h4>
                  <p className="text-xs whitespace-pre-line text-muted-foreground leading-relaxed">
                    {product.rawSpecs}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cross-Sell Recommendations */}
        {crossSellProducts.length > 0 && (
          <div className="mt-16 border-t border-border pt-10">
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Compatible Accessories & Pairings
              </h3>
              <p className="text-xs text-muted-foreground">
                Officially tested ecosystem companions for {product.name}.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {crossSellProducts.map((p, i) => (
                <ProductCard key={p.product_id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Upsell Options */}
        {upsellProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Higher Performance Tiers
              </h3>
              <p className="text-xs text-muted-foreground">
                Explore upgraded alternatives within the catalog.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {upsellProducts.map((p, i) => (
                <ProductCard key={p.product_id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.productId;
  const product = useMemo(() => getProductById(productId), [productId]);

  if (!product) {
    return (
      <div className="py-24 bg-background">
        <Container size="narrow" className="text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-secondary mb-4">
            <Info className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested product ID <code className="font-mono font-bold text-snt-accent">{productId}</code> is not in the canonical catalog.
          </p>
          <Button className="mt-6" render={<Link href="/shop" />}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Storefront
          </Button>
        </Container>
      </div>
    );
  }

  return <ProductDetailView key={productId} product={product} productId={productId} />;
}
