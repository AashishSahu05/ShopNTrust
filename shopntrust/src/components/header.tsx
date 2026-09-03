// ============================================================
// ShopNTrust — Global Header (Strict Role Separation)
// ============================================================
// - Customer / Guest: Storefront, AI Shopping, Catalog, Bag, Profile
//   (Merchant Portal is completely hidden).
// - Merchant: Merchant Console, Store Profile, Logout
//   (Customer shopping navigation and Bag are completely hidden).
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  Store,
  BarChart3,
  Menu,
  X,
  ArrowUpRight,
  User,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useCart } from '@/store/cart-context';
import { useAuth } from '@/store/auth-context';
import { Container } from '@/components/ui/container';
import { DemoAuthModal } from '@/components/auth/demo-auth-modal';
import { CustomerProfileDrawer } from '@/components/auth/customer-profile-drawer';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { summary } = useCart();
  const {
    isCustomer,
    isMerchant,
    isGuest,
    customerProfile,
    merchantProfile,
    openAuthModal,
    logout,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  // Customer navigation items
  const customerNavItems = [
    {
      label: 'Storefront',
      href: '/',
      icon: Store,
      isAI: false,
    },
    {
      label: 'AI Shopping',
      href: '/ai-shop',
      icon: Sparkles,
      isAI: true,
    },
    {
      label: 'Catalog',
      href: '/shop',
      icon: ShoppingBag,
      isAI: false,
    },
  ];

  // Merchant navigation items
  const merchantNavItems = [
    {
      label: 'Merchant Console',
      href: '/merchant',
      icon: BarChart3,
      isAI: false,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_1px_8px_-2px_rgba(15,23,42,0.03)] transition-all">
        <Container className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <Link
            href={isMerchant ? '/merchant' : '/'}
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className={cn(
              'flex size-8 items-center justify-center rounded-xl text-white shadow-sm transition-shadow',
              isMerchant
                ? 'bg-slate-900 shadow-slate-900/20'
                : 'bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-indigo-600/25 ring-1 ring-indigo-500/30'
            )}>
              {isMerchant ? <Store className="size-4" /> : <Sparkles className="size-4" />}
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">
              Shop<span className="text-snt-accent font-black">N</span>Trust
              {isMerchant && (
                <span className="ml-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Merchant
                </span>
              )}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden items-center gap-1.5 md:flex"
            aria-label="Main navigation"
          >
            {/* Customer / Guest Nav */}
            {!isMerchant &&
              customerNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                if (item.isAI) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-600/20 ring-1 ring-indigo-500/30'
                          : 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/60'
                      )}
                    >
                      <Sparkles className={cn("size-3.5", isActive ? "text-white" : "text-indigo-600")} />
                      <span>AI Shopping</span>
                      <span className={cn(
                        "ml-1 rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider",
                        isActive ? "bg-white/20 text-white" : "bg-indigo-200/70 text-indigo-800"
                      )}>
                        Beta
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'text-slate-900 font-bold bg-slate-100/90 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                    )}
                  >
                    <Icon className="size-3.5 opacity-70" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

            {/* Merchant Only Nav */}
            {isMerchant &&
              merchantNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                      isActive
                        ? 'text-foreground bg-slate-100 shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-slate-100/50'
                    )}
                  >
                    <Icon className="size-4 opacity-70 text-emerald-700" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Right side — Identity Pill, Cart & Mobile menu */}
          <div className="flex items-center gap-2.5">
            {/* Customer Identity Badge */}
            {isCustomer && customerProfile && (
              <button
                onClick={() => setProfileDrawerOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-2xs"
                aria-label="Open customer profile"
              >
                <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-[10px] shadow-xs">
                  <User className="size-3" />
                </div>
                <span className="font-bold truncate max-w-[110px]">{customerProfile.name.split(' ')[0]}</span>
                <span className="rounded-md bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                  {customerProfile.preferredCategories.length} prefs
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            )}

            {/* Merchant Identity Badge & Logout */}
            {isMerchant && merchantProfile && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-300/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-2xs">
                  <Store className="size-3.5 text-emerald-700" />
                  <span className="font-bold truncate max-w-[130px]">{merchantProfile.storeName}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white hover:bg-rose-50 hover:text-rose-600 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all cursor-pointer shadow-2xs"
                  aria-label="Log out from merchant account"
                >
                  <LogOut className="size-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            )}

            {/* Guest / Unauthenticated Button */}
            {isGuest && (
              <button
                onClick={openAuthModal}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs"
              >
                <User className="size-3.5 text-muted-foreground" />
                <span>Sign In / Account</span>
              </button>
            )}

            {/* Bag Button (CUSTOMER / GUEST ONLY - Hidden for Merchants) */}
            {!isMerchant && (
              <Link
                href="/cart"
                className={cn(
                  'relative flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-foreground transition-all hover:border-indigo-400/60 shadow-2xs hover:shadow-xs',
                  pathname === '/cart' && 'border-snt-accent ring-1 ring-snt-accent/60 bg-indigo-50/40'
                )}
                aria-label={`Shopping bag with ${summary.totalQuantity} items`}
              >
                <ShoppingBag className="size-3.5 text-foreground" />
                <span className="hidden sm:inline font-semibold">Bag</span>
                <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-[10px] font-extrabold text-white shadow-xs">
                  {summary.totalQuantity}
                </span>
              </Link>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex size-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-muted-foreground hover:text-foreground md:hidden shadow-2xs"
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </Container>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border bg-card md:hidden"
            >
              <Container className="py-4 space-y-2">
                {/* Mobile Identity Button */}
                <div className="border-b border-border pb-3 mb-2">
                  {isCustomer && customerProfile && (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        setProfileDrawerOpen(true);
                      }}
                      className="flex items-center justify-between w-full rounded-xl bg-indigo-50/80 border border-indigo-200/80 p-3 text-xs font-bold text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-snt-accent" />
                        <span>{customerProfile.name}</span>
                        <span className="text-[10px] text-snt-accent">({customerProfile.preferredCategories.length} prefs)</span>
                      </div>
                      <span className="text-[10px] text-snt-accent uppercase font-bold">Profile →</span>
                    </button>
                  )}

                  {isMerchant && merchantProfile && (
                    <div className="flex items-center justify-between w-full rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-950">
                      <div className="flex items-center gap-2">
                        <Store className="size-4 text-emerald-700" />
                        <span>{merchantProfile.storeName}</span>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setMobileOpen(false);
                        }}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Log Out
                      </button>
                    </div>
                  )}

                  {isGuest && (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        openAuthModal();
                      }}
                      className="flex items-center justify-center w-full rounded-xl bg-snt-accent text-white p-2.5 text-xs font-bold gap-2 shadow-xs"
                    >
                      <User className="size-3.5" />
                      <span>Sign In / Create Account</span>
                    </button>
                  )}
                </div>

                {/* Nav links */}
                {(!isMerchant ? customerNavItems : merchantNavItems).map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-xl p-3 text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                        item.isAI && 'text-snt-accent'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowUpRight className="size-4 opacity-50" />
                    </Link>
                  );
                })}
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Modals */}
      <DemoAuthModal />
      <CustomerProfileDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />
    </>
  );
}
