// ============================================================
// ShopNTrust — Customer Profile & Session Signals Modal
// ============================================================
// Displays customer profile context (name, email, preferred categories)
// and current-session signals (viewed product IDs, cart summary).
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  X,
  Sparkles,
  Layers,
  Eye,
  ShoppingBag,
  LogOut,
  Store,
  Check,
  Plus,
  Package,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/store/auth-context';
import { useCart } from '@/store/cart-context';
import { getAvailableCategories, getProductById } from '@/lib/catalog';
import type { ProductCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerProfileDrawer({ isOpen, onClose }: CustomerProfileDrawerProps) {
  const {
    user,
    isCustomer,
    isMerchant,
    customerProfile,
    merchantProfile,
    viewedProductIds,
    updatePreferredCategories,
    clearViewedProducts,
    logout,
  } = useAuth();

  const { summary } = useCart();
  const allCategories = getAvailableCategories();
  const [isEditingCats, setIsEditingCats] = useState(false);

  if (!isOpen) return null;

  const currentCats = customerProfile?.preferredCategories || [];

  const handleToggleCat = (catId: ProductCategory) => {
    if (currentCats.includes(catId)) {
      updatePreferredCategories(currentCats.filter((c) => c !== catId));
    } else {
      updatePreferredCategories([...currentCats, catId]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="mb-6 flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-snt-accent border border-indigo-200/80 shadow-xs">
              {isMerchant ? <Store className="size-6 text-emerald-700" /> : <User className="size-6 text-snt-accent" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-foreground">
                  {isCustomer ? customerProfile?.name : isMerchant ? merchantProfile?.name : 'Guest User'}
                </h2>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  isMerchant ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-snt-accent'
                )}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCustomer ? customerProfile?.email : isMerchant ? `${merchantProfile?.storeName} • ${merchantProfile?.email}` : 'Browsing without a saved demo profile'}
              </p>
            </div>
          </div>

          <div className="overflow-y-auto space-y-5 pr-1 flex-1">
            {isCustomer && (
              <>
                {/* My Orders Quick Access */}
                <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-[#5B35F5] border border-indigo-100">
                      <Package className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">My Orders</p>
                      <p className="text-[11px] text-muted-foreground">View purchase history and receipts</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#5B35F5] hover:bg-[#4a26df] text-white text-xs font-bold gap-1 cursor-pointer"
                    render={<Link href="/orders" onClick={onClose} />}
                  >
                    <span>View</span>
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
                {/* Preferred Categories Section */}
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="size-3.5 text-snt-accent" />
                      <span className="text-xs font-bold text-foreground">Preferred Categories</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingCats(!isEditingCats)}
                      className="text-[11px] font-semibold text-snt-accent hover:underline cursor-pointer"
                    >
                      {isEditingCats ? 'Done Editing' : 'Modify'}
                    </button>
                  </div>

                  {isEditingCats ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {allCategories.map((cat) => {
                        const isSelected = currentCats.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleToggleCat(cat.id)}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                              isSelected
                                ? 'bg-snt-accent text-white shadow-2xs font-semibold'
                                : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {isSelected ? <Check className="size-3" /> : <Plus className="size-3" />}
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {currentCats.length > 0 ? (
                        currentCats.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-lg bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 text-xs font-semibold text-snt-accent capitalize"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No category preferences selected</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Current Session Signals */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-snt-accent" />
                      <span className="text-xs font-bold text-foreground">Current Session Signals</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Auto-tracked in memory</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span>Viewed Products</span>
                        <Eye className="size-3.5 text-slate-500" />
                      </div>
                      <p className="text-lg font-bold text-foreground font-mono">{viewedProductIds.length}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <div className="flex items-center justify-between text-muted-foreground mb-1">
                        <span>Current Bag</span>
                        <ShoppingBag className="size-3.5 text-slate-500" />
                      </div>
                      <p className="text-lg font-bold text-foreground font-mono">{summary.totalQuantity} items</p>
                    </div>
                  </div>

                  {/* Viewed Product IDs Badges */}
                  {viewedProductIds.length > 0 && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground">Recent Canonical IDs:</span>
                        <button
                          onClick={clearViewedProducts}
                          className="text-[10px] text-muted-foreground hover:text-rose-600 cursor-pointer"
                        >
                          Clear list
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {viewedProductIds.map((pid) => {
                          const prod = getProductById(pid);
                          return (
                            <Link
                              key={pid}
                              href={`/product/${pid}`}
                              onClick={onClose}
                              className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-[11px] font-mono text-slate-700 hover:border-snt-accent hover:text-snt-accent transition-colors"
                            >
                              <span className="font-bold">{pid}</span>
                              {prod && <span className="text-[10px] font-sans truncate max-w-[100px]">({prod.name})</span>}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {isMerchant && (
              <div className="rounded-2xl border border-border bg-emerald-50/50 p-4 space-y-3">
                <p className="text-xs font-bold text-emerald-900">Active Merchant Mode</p>
                <p className="text-xs text-muted-foreground">
                  You are logged into the merchant operations interface for <strong>{merchantProfile?.storeName}</strong>.
                </p>
                <Button
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs"
                  render={<Link href="/merchant" onClick={onClose} />}
                >
                  <Store className="size-3.5 mr-1.5" />
                  <span>Go to Merchant Portal</span>
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 border-t border-border pt-4 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 cursor-pointer font-semibold"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
