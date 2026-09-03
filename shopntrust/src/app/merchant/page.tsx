// ============================================================
// ShopNTrust — Merchant AI Revenue Analytics Console (/merchant)
// ============================================================
// Phase 8 Complete: Real merchant-side AI revenue attribution,
// live transaction aggregation, interactive SVG visual charts,
// AI conversion funnel, and upsell/cross-sell commerce impact.
// Zero mock data. Real persisted data only.
// ============================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Store,
  Lock,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Info,
  Filter,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-context';
import { formatPrice } from '@/lib/format';
import type {
  MerchantAnalytics,
  AnalyticsDateRange,
  RecentOrderRow,
  TimelineMetric,
} from '@/types';

export default function MerchantDashboardPage() {
  const router = useRouter();
  const { isMerchant, isCustomer, isGuest, merchantProfile, openAuthModal } = useAuth();

  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('all');
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<TimelineMetric | null>(null);

  // Role Guard: Customers redirected to storefront
  useEffect(() => {
    if (isCustomer) {
      router.replace('/');
    }
  }, [isCustomer, router]);

  // Fetch Authoritative Analytics Data
  const fetchAnalytics = useCallback(async (range: AnalyticsDateRange) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/merchant/analytics?range=${range}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch merchant analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isCustomer && !isGuest) {
      fetchAnalytics(dateRange);
    }
  }, [dateRange, isCustomer, isGuest, fetchAnalytics]);

  if (isCustomer) {
    return null;
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
            Please sign in with your Merchant credentials to access real-time revenue analytics and AI commerce performance.
          </p>
          <Button
            size="lg"
            onClick={openAuthModal}
            className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 cursor-pointer"
          >
            <Lock className="size-4" />
            <span>Sign In to Merchant Portal</span>
          </Button>
        </Container>
      </div>
    );
  }

  const revenue = analytics?.revenue || {
    total: 0,
    aiAssisted: 0,
    manual: 0,
    aiContributionPercent: 0,
    currency: 'INR',
  };

  const orders = analytics?.orders || {
    total: 0,
    aiAssisted: 0,
    manual: 0,
    aiAverageOrderValue: 0,
    manualAverageOrderValue: 0,
  };

  const funnel = analytics?.funnel || {
    sessions: 0,
    recommendationsShown: 0,
    recommendationsInteracted: 0,
    productsAdded: 0,
    checkoutsOpened: 0,
    ordersCompleted: 0,
    conversionRate: 0,
  };

  const upsellCrossSell = analytics?.upsellCrossSell || {
    upsell: { shown: 0, accepted: 0, acceptanceRate: 0, revenue: 0 },
    crossSell: { shown: 0, accepted: 0, acceptanceRate: 0, revenue: 0 },
  };

  const timeline = analytics?.timeline || [];
  const recentOrders = analytics?.recentOrders || [];

  const storeName = isMerchant && merchantProfile?.storeName
    ? merchantProfile.storeName
    : 'ShopNTrust Official Merchant';

  // SVG Chart Calculations
  const maxRevenue = Math.max(
    ...timeline.map((t) => t.totalRevenue),
    1000
  );

  return (
    <div className="py-8 md:py-12 bg-[#F9FAFC] min-h-screen text-slate-900">
      <Container>
        {/* Top Control Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Merchant Portal
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real Persisted Data
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              AI Revenue Analytics
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-xl">
              Store: <span className="font-bold text-slate-800">{storeName}</span> • Real-time AI attribution and transaction metrics.
            </p>
          </div>

          {/* Date Filter & Refresh Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              {(['7d', '30d', '90d', 'all'] as AnalyticsDateRange[]).map((rangeKey) => {
                const labelMap = {
                  '7d': '7 Days',
                  '30d': '30 Days',
                  '90d': '90 Days',
                  all: 'All Time',
                };
                const active = dateRange === rangeKey;
                return (
                  <button
                    key={rangeKey}
                    type="button"
                    onClick={() => setDateRange(rangeKey)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {labelMap[rangeKey]}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(dateRange)}
              disabled={isRefreshing}
              className="h-9 px-3 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 1. TOP KPI CARDS SECTION */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* KPI 1: Total Gross Revenue */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_4px_16px_-4px_rgba(15,23,42,0.03)] transition-all hover:border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-2xs">
                <DollarSign className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatPrice(revenue.total, revenue.currency)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{orders.total} successfully paid orders</span>
            </p>
          </div>

          {/* KPI 2: AI-Assisted Revenue */}
          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/10 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_4px_16px_-4px_rgba(15,23,42,0.03)] transition-all hover:border-indigo-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">AI-Assisted Revenue</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xs">
                <Sparkles className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-900 font-mono tracking-tight">
              {formatPrice(revenue.aiAssisted, revenue.currency)}
            </p>
            <p className="text-[11px] text-indigo-700 font-medium mt-1">
              Directly influenced by AI Shopping
            </p>
          </div>

          {/* KPI 3: AI Contribution % */}
          <div className="rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/40 via-white to-purple-50/10 p-5 shadow-xs transition-all hover:border-purple-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">AI Contribution</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-purple-900 font-mono tracking-tight">
                {revenue.aiContributionPercent}%
              </p>
              <span className="text-xs font-bold text-purple-700">of total revenue</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(revenue.aiContributionPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* KPI 4: AI-Assisted Orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI-Assisted Orders</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ShoppingBag className="size-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {orders.aiAssisted} <span className="text-xs font-bold text-slate-400 font-sans">/ {orders.total}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              AI AOV: <span className="font-bold text-slate-800 font-mono">{formatPrice(orders.aiAverageOrderValue)}</span>
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. AI IMPACT HERO SPOTLIGHT */}
        {/* ============================================================ */}
        <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-[#5B4DFB] via-[#6F57F5] to-[#7952F5] text-white p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 size-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide">
                <Sparkles className="size-3.5" />
                <span>AI COMMERCE PROOF OF IMPACT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {revenue.total > 0
                  ? `AI generated ${revenue.aiContributionPercent}% of merchant revenue`
                  : 'AI Shopping Commerce Engine Ready'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                ShopNTrust AI connects natural language customer intent directly to canonical catalog recommendations, upsells, and cross-sells—generating attributable completed orders.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-indigo-200">
                <Info className="size-3.5 shrink-0" />
                <span>Attribution Rule: Orders are attributed only when customer purchases AI-recommended, upsold, or cross-sold items.</span>
              </div>
            </div>

            {/* Quick Metrics Cluster */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 min-w-[280px]">
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">AI Revenue</p>
                <p className="text-xl font-black font-mono mt-0.5">{formatPrice(revenue.aiAssisted)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Conversion Rate</p>
                <p className="text-xl font-black font-mono mt-0.5">{funnel.conversionRate}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Upsell Lift</p>
                <p className="text-xl font-black font-mono mt-0.5">{formatPrice(upsellCrossSell.upsell.revenue)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Cross-Sell Lift</p>
                <p className="text-xl font-black font-mono mt-0.5">{formatPrice(upsellCrossSell.crossSell.revenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. CHARTS GRID: Revenue Over Time & Manual vs AI Comparison */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Chart A: Revenue Over Time (8 cols) */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Revenue Trend Over Time</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Real Paid Transactions
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily breakdown comparing Total Revenue vs AI-Assisted Revenue.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="size-2.5 rounded-full bg-slate-900 inline-block" />
                  <span>Total</span>
                </span>
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span className="size-2.5 rounded-full bg-[#5B4DFB] inline-block" />
                  <span>AI-Assisted</span>
                </span>
              </div>
            </div>

            {/* Interactive SVG Line/Bar Chart or Honest Empty State */}
            {timeline.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Calendar className="size-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">No revenue data recorded for this period</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Once customers complete purchases through the storefront or AI Shopping Assistant, transaction trendlines will populate here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative h-56 w-full pt-4">
                  {/* Background Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-mono">
                    <div className="border-b border-slate-100 w-full flex justify-between">
                      <span>{formatPrice(maxRevenue)}</span>
                    </div>
                    <div className="border-b border-slate-100 w-full flex justify-between">
                      <span>{formatPrice(maxRevenue / 2)}</span>
                    </div>
                    <div className="border-b border-slate-100 w-full flex justify-between">
                      <span>₹0</span>
                    </div>
                  </div>

                  {/* SVG Chart Bars */}
                  <div className="relative h-full flex items-end justify-between gap-2 px-2 pb-2">
                    {timeline.map((item, idx) => {
                      const totalHeight = Math.max(8, (item.totalRevenue / maxRevenue) * 100);
                      const aiHeight = Math.max(0, (item.aiRevenue / maxRevenue) * 100);

                      return (
                        <div
                          key={item.date}
                          onMouseEnter={() => setActiveTooltip(item)}
                          onMouseLeave={() => setActiveTooltip(null)}
                          className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                        >
                          {/* Tooltip Hover Overlay */}
                          {activeTooltip?.date === item.date && (
                            <div className="absolute -top-16 z-30 bg-slate-900 text-white text-[11px] rounded-xl p-2 shadow-lg min-w-[140px] text-left pointer-events-none animate-in fade-in">
                              <p className="font-bold border-b border-slate-700 pb-1 text-[10px] text-slate-300">
                                {item.label} • {item.orderCount} orders
                              </p>
                              <div className="pt-1 space-y-0.5 text-[10.5px]">
                                <p className="flex justify-between">
                                  <span>Total:</span>
                                  <span className="font-mono font-bold">{formatPrice(item.totalRevenue)}</span>
                                </p>
                                <p className="flex justify-between text-indigo-300">
                                  <span>AI Assisted:</span>
                                  <span className="font-mono font-bold">{formatPrice(item.aiRevenue)}</span>
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Bars Container */}
                          <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                            {/* Total Bar */}
                            <div
                              style={{ height: `${totalHeight}%` }}
                              className="w-1/2 bg-slate-800 rounded-t-md group-hover:bg-slate-950 transition-all"
                            />
                            {/* AI Bar */}
                            <div
                              style={{ height: `${aiHeight}%` }}
                              className="w-1/2 bg-gradient-to-t from-[#5B4DFB] to-[#7952F5] rounded-t-md group-hover:brightness-110 transition-all"
                            />
                          </div>

                          {/* Date Label */}
                          <span className="text-[10px] font-bold text-slate-400 mt-2 truncate w-full text-center">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart B: Manual vs AI Revenue Comparison (4 cols) */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                Channel Attribution
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Manual storefront shopping vs AI-assisted shopping.
              </p>

              <div className="space-y-6">
                {/* AI Shopping Channel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" />
                      <span>AI-Assisted Shopping</span>
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      {formatPrice(revenue.aiAssisted)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-[#5B4DFB] to-[#7952F5] h-full rounded-full transition-all duration-500"
                      style={{ width: `${revenue.total > 0 ? (revenue.aiAssisted / revenue.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{orders.aiAssisted} orders</span>
                    <span>{revenue.aiContributionPercent}% of revenue</span>
                  </div>
                </div>

                {/* Manual Shopping Channel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Store className="size-3.5" />
                      <span>Manual Storefront Catalog</span>
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      {formatPrice(revenue.manual)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="bg-slate-700 h-full rounded-full transition-all duration-500"
                      style={{ width: `${revenue.total > 0 ? (revenue.manual / revenue.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{orders.manual} orders</span>
                    <span>{revenue.total > 0 ? Math.round((revenue.manual / revenue.total) * 100) : 0}% of revenue</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric Comparison Insight Box */}
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Average Order Value Lift</span>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="rounded-xl bg-white p-2 border border-slate-200/60 shadow-2xs">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Manual AOV</p>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {formatPrice(orders.manualAverageOrderValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50/70 p-2 border border-indigo-200/60 shadow-2xs">
                  <p className="text-[10px] text-indigo-700 font-semibold uppercase">AI AOV</p>
                  <p className="font-mono font-black text-indigo-900 text-sm mt-0.5">
                    {formatPrice(orders.aiAverageOrderValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. AI SHOPPING CONVERSION FUNNEL & UPSELL / CROSS-SELL IMPACT */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* AI Shopping Funnel (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Layers className="size-4 text-indigo-600" />
                  <span>AI Shopping Conversion Funnel</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real progression from initial AI intent query to successful payment.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {funnel.conversionRate}% Conversion
              </span>
            </div>

            {/* Funnel Steps */}
            <div className="space-y-3 pt-2">
              {[
                {
                  label: 'AI Shopping Sessions',
                  count: funnel.sessions,
                  desc: 'Customers engaged with AI assistant',
                  color: 'bg-indigo-600',
                  pct: 100,
                },
                {
                  label: 'Recommendations Rendered',
                  count: funnel.recommendationsShown,
                  desc: 'Products matched to natural language criteria',
                  color: 'bg-indigo-500',
                  pct: funnel.sessions > 0 ? Math.min(100, Math.round((funnel.recommendationsShown / funnel.sessions) * 100)) : 0,
                },
                {
                  label: 'Added to Bag from AI',
                  count: funnel.productsAdded,
                  desc: 'Recommendation, upsell, or cross-sell added',
                  color: 'bg-purple-600',
                  pct: funnel.recommendationsShown > 0 ? Math.min(100, Math.round((funnel.productsAdded / funnel.recommendationsShown) * 100)) : 0,
                },
                {
                  label: 'Checkouts Opened',
                  count: funnel.checkoutsOpened,
                  desc: 'Customer proceeded to express checkout',
                  color: 'bg-purple-700',
                  pct: funnel.productsAdded > 0 ? Math.min(100, Math.round((funnel.checkoutsOpened / funnel.productsAdded) * 100)) : 0,
                },
                {
                  label: 'Successfully Paid Orders',
                  count: funnel.ordersCompleted,
                  desc: 'Razorpay payment completed & order confirmed',
                  color: 'bg-emerald-600',
                  pct: funnel.checkoutsOpened > 0 ? Math.min(100, Math.round((funnel.ordersCompleted / funnel.checkoutsOpened) * 100)) : 0,
                },
              ].map((step, idx) => (
                <div key={step.label} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-6 items-center justify-center rounded-full bg-white text-slate-700 font-bold text-xs border border-slate-200 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{step.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{step.desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black font-mono text-slate-900 block">{step.count}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{step.pct}% rate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upsell & Cross-Sell Impact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Upsell Card */}
            <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
                    <ArrowUpRight className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950">AI Upsell Impact</h4>
                    <p className="text-[10px] text-amber-800">&quot;Worth the Upgrade&quot; recommendations</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Active AI Engine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Acceptance Rate</p>
                  <p className="text-xl font-black font-mono text-amber-950 mt-0.5">
                    {upsellCrossSell.upsell.acceptanceRate}%
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    {upsellCrossSell.upsell.accepted} of {upsellCrossSell.upsell.shown} accepted
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Attributed Revenue</p>
                  <p className="text-xl font-black font-mono text-amber-950 mt-0.5">
                    {formatPrice(upsellCrossSell.upsell.revenue)}
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    From accepted upgrades
                  </p>
                </div>
              </div>
            </div>

            {/* Cross-Sell Card */}
            <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                    <Layers className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-950">AI Cross-Sell Impact</h4>
                    <p className="text-[10px] text-emerald-800">&quot;Pairs Well With&quot; ecosystem add-ons</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Active AI Engine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Acceptance Rate</p>
                  <p className="text-xl font-black font-mono text-emerald-950 mt-0.5">
                    {upsellCrossSell.crossSell.acceptanceRate}%
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    {upsellCrossSell.crossSell.accepted} of {upsellCrossSell.crossSell.shown} accepted
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Attributed Revenue</p>
                  <p className="text-xl font-black font-mono text-emerald-950 mt-0.5">
                    {formatPrice(upsellCrossSell.crossSell.revenue)}
                  </p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    From accepted pairings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. RECENT AI-ASSISTED ORDERS TABLE */}
        {/* ============================================================ */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Recent Orders & AI Attribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative transaction ledger with verified AI attribution sources.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-500">
              Showing {recentOrders.length} {recentOrders.length === 1 ? 'order' : 'orders'}
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No orders completed yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed transactions will be itemized here with full AI attribution details.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                    <th className="pb-3 pl-2">Order ID</th>
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Attribution</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {recentOrders.map((ord) => {
                    const dateFormatted = new Date(ord.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // Mask customer email for privacy
                    const [userPart, domainPart] = ord.customerEmail.split('@');
                    const maskedEmail = userPart && domainPart
                      ? `${userPart.slice(0, 2)}***@${domainPart}`
                      : ord.customerEmail;

                    return (
                      <tr key={ord.orderId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pl-2 font-mono font-bold text-slate-900">
                          {ord.orderId}
                        </td>
                        <td className="py-3.5 text-slate-500 font-sans text-[11px]">
                          {dateFormatted}
                        </td>
                        <td className="py-3.5">
                          <p className="font-bold text-slate-900">{ord.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{maskedEmail}</p>
                        </td>
                        <td className="py-3.5">
                          {ord.attributionType === 'ai_recommendation' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              <Sparkles className="size-3" />
                              <span>AI Recommendation</span>
                            </span>
                          )}
                          {ord.attributionType === 'ai_upsell' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <ArrowUpRight className="size-3" />
                              <span>AI Upsell</span>
                            </span>
                          )}
                          {ord.attributionType === 'ai_cross_sell' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <Layers className="size-3" />
                              <span>AI Cross-Sell</span>
                            </span>
                          )}
                          {ord.attributionType === 'ai_mixed' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                              <Sparkles className="size-3" />
                              <span>AI Mixed</span>
                            </span>
                          )}
                          {ord.attributionType === 'manual' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              <Store className="size-3" />
                              <span>Manual Storefront</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {ord.itemCount} {ord.itemCount === 1 ? 'unit' : 'units'}
                          {ord.aiItemCount > 0 && (
                            <span className="text-indigo-600 font-bold ml-1 text-[10.5px]">
                              ({ord.aiItemCount} AI)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          {ord.paymentStatus === 'successful' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="size-3.5 text-emerald-500" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                              <XCircle className="size-3.5 text-rose-500" />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2 text-right font-mono font-black text-slate-900 text-sm">
                          {formatPrice(ord.totalAmount, ord.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
