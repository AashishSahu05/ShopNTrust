'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  Store,
  Lock,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { getProductCount, getAvailableCategories } from '@/lib/catalog';
import { useAuth } from '@/store/auth-context';

export default function MerchantDashboardPage() {
  const router = useRouter();
  const totalProducts = getProductCount();
  const categories = getAvailableCategories();
  const { isMerchant, isCustomer, isGuest, merchantProfile, openAuthModal } = useAuth();

  // Role Guard: Customers are strictly forbidden from merchant portal
  useEffect(() => {
    if (isCustomer) {
      router.replace('/');
    }
  }, [isCustomer, router]);

  if (isCustomer) {
    return null; // Redirecting to storefront
  }

  if (isGuest) {
    return (
      <div className="py-20 bg-background min-h-[70vh] flex items-center">
        <Container size="narrow" className="text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-slate-900 text-white mb-4 shadow-sm">
            <Store className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Merchant Console Authentication</h1>
          <p className="mt-2 text-xs text-muted-foreground max-w-sm mx-auto">
            Please sign in with your Merchant credentials to manage catalog inventory and operations.
          </p>
          <Button
            size="lg"
            onClick={openAuthModal}
            className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2"
          >
            <Lock className="size-4" />
            <span>Sign In to Merchant Portal</span>
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 bg-background min-h-screen">
      <Container>
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-md bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Merchant Portal
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {isMerchant ? `Store: ${merchantProfile?.storeName}` : 'Operational Overview'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Merchant Console
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Monitor catalog synchronization, inventory metrics, and prepare for AI recommendation analytics.
            </p>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Catalog Products</span>
              <Package className="size-4 text-snt-accent" />
            </div>
            <p className="text-2xl font-black text-foreground font-mono">{totalProducts}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">100% Canonical Verified</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Active Categories</span>
              <Layers className="size-4 text-snt-accent" />
            </div>
            <p className="text-2xl font-black text-foreground font-mono">{categories.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Multi-Category Storefront</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">AI Match Engine</span>
              <Sparkles className="size-4 text-snt-accent" />
            </div>
            <p className="text-2xl font-black text-foreground font-mono">Ready</p>
            <p className="text-[11px] text-indigo-700 font-medium mt-1">n8n Workflow Prepared</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Payment Gateway</span>
              <ShieldCheck className="size-4 text-snt-accent" />
            </div>
            <p className="text-2xl font-black text-foreground font-mono">Razorpay</p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Activation in Phase 5</p>
          </div>
        </div>

        {/* Operational Notice Box */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-foreground">
            Phase Architecture Summary
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real merchant analytics, conversion lift stories, and AI recommendation revenue tracking are scheduled for implementation in Phase 12. Current canonical catalog inventory and pricing data is active and synchronized.
          </p>
        </div>
      </Container>
    </div>
  );
}
