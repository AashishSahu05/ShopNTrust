// ============================================================
// ShopNTrust — Customer Help Center Page (/help)
// ============================================================
// Luxury, high-end consumer Help Center integrated seamlessly
// into the ShopNTrust storefront visual language:
// - Hero with instant client-side keyword search
// - Popular Questions quick-access chips
// - 9 Customer-focused Category Cards
// - Interactive Framer Motion FAQ Accordions
// - Live Search Result & Empty State Handling
// - Safe Informational Contact Support Section
// ============================================================

'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Sparkles,
  Bot,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Package,
  User,
  Flame,
  Headphones,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  MessageSquare,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import {
  HELP_CATEGORIES,
  HELP_ARTICLES,
  type HelpCategory,
  type HelpArticle,
} from '@/lib/help-data';

// Category Icon Resolver
function CategoryIcon({ name, className = 'size-5' }: { name: HelpCategory['iconName']; className?: string }) {
  switch (name) {
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'bot':
      return <Bot className={className} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    case 'shopping-cart':
      return <ShoppingCart className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'user':
      return <User className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const faqSectionRef = useRef<HTMLDivElement>(null);

  // Toggle open/close of FAQ accordion
  const toggleArticle = (articleId: string) => {
    setExpandedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });
  };

  // Click on a popular question chip
  const handleSelectPopularQuestion = (articleId: string) => {
    setSearchQuery('');
    setSelectedCategory('all');
    setExpandedArticles((prev) => new Set(prev).add(articleId));

    // Smooth scroll to the article
    setTimeout(() => {
      const el = document.getElementById(`faq-${articleId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Instant client-side search filtering
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      return HELP_ARTICLES.filter((article) => {
        const inQuestion = article.question.toLowerCase().includes(q);
        const inAnswer = article.answer.toLowerCase().includes(q);
        const inKeywords = article.keywords.some((k) => k.toLowerCase().includes(q));
        const inBullets = article.bullets?.some((b) => b.toLowerCase().includes(q)) || false;
        return inQuestion || inAnswer || inKeywords || inBullets;
      });
    }

    if (selectedCategory !== 'all') {
      return HELP_ARTICLES.filter((article) => article.categoryId === selectedCategory);
    }

    return HELP_ARTICLES;
  }, [searchQuery, selectedCategory]);

  // Popular questions for quick access chips
  const popularArticles = useMemo(() => {
    return HELP_ARTICLES.filter((a) => a.popular).slice(0, 8);
  }, []);

  const handleCategoryCardClick = (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery('');
    faqSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE]">
      {/* ============================================================ */}
      {/* 1. HERO SECTION & SEARCH                                     */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F8F7FD] to-[#F3F0FC]/40 pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-slate-200/70">
        {/* Ambient violet/indigo background glow */}
        <div className="absolute top-0 right-1/3 size-[480px] rounded-full bg-gradient-to-br from-[#5B35F5]/10 via-[#7C3AED]/8 to-[#6366F1]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 size-[380px] rounded-full bg-gradient-to-tr from-purple-500/8 to-indigo-500/5 blur-3xl pointer-events-none" />

        <Container size="default" className="relative z-10 text-center">
          {/* Small Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#5B35F5]/30 bg-[#F3F1FF] px-4 py-1 text-xs font-bold text-[#5B35F5] mb-4 shadow-2xs"
          >
            <Sparkles className="size-3.5" />
            <span>ShopNTrust Help Center</span>
          </motion.div>

          {/* Main Editorial Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B1026] leading-tight mb-3"
          >
            How can we help you today?
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-sm sm:text-base text-[#667085] max-w-xl mx-auto leading-relaxed mb-8"
          >
            Find answers about shopping, AI Shopping, your Bag, checkout, payments, and order tracking.
          </motion.p>

          {/* Prominent Instant Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative flex items-center rounded-2xl bg-white shadow-[0_4px_24px_-4px_rgba(91,53,245,0.12)] border-2 border-slate-200/90 focus-within:border-[#5B35F5] focus-within:shadow-[0_4px_28px_-2px_rgba(91,53,245,0.22)] transition-all">
              <Search className="absolute left-4 size-5 text-[#5B35F5] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help by keyword (e.g. payment, AI shopping, bag, order ID)..."
                className="w-full h-13 pl-12 pr-12 text-sm sm:text-base text-[#0B1026] placeholder:text-slate-400 bg-transparent rounded-2xl focus:outline-none"
                aria-label="Search Help Center articles"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3.5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/* 2. POPULAR QUESTIONS QUICK CHIPS                             */}
      {/* ============================================================ */}
      <section className="py-6 sm:py-7 bg-white border-b border-slate-200/70">
        <Container>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#667085] shrink-0 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Popular Questions
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {popularArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => handleSelectPopularQuestion(article.id)}
                  className="inline-flex items-center rounded-xl bg-[#F8F8FC] hover:bg-[#F3F1FF] border border-slate-200/80 hover:border-[#5B35F5]/40 px-3 py-1.5 font-medium text-[#10162F] hover:text-[#5B35F5] transition-all duration-150 shadow-2xs text-left cursor-pointer"
                >
                  <span>{article.question}</span>
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/* 3. 9 CATEGORY CARDS GRID                                     */}
      {/* ============================================================ */}
      <section className="py-10 sm:py-14 bg-[#FDFCFE]">
        <Container>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B35F5]">
                Knowledge Base
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0B1026] mt-0.5">
                Browse by Category
              </h2>
            </div>
            {selectedCategory !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-[#5B35F5] hover:bg-[#F3F1FF] gap-1.5 cursor-pointer font-bold"
              >
                <RotateCcw className="size-3" />
                <span>Show All Categories</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HELP_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id && !searchQuery;
              return (
                <motion.div
                  key={cat.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleCategoryCardClick(cat.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-[#5B35F5] bg-gradient-to-b from-[#F3F1FF] via-white to-white shadow-md shadow-[#5B35F5]/10 ring-1 ring-[#5B35F5]/30'
                      : 'border-slate-200/90 bg-white hover:border-[#5B35F5]/50 hover:shadow-lg hover:shadow-slate-950/4'
                  }`}
                >
                  <div>
                    {/* Category Icon & Count */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-[#5B35F5] text-white shadow-xs'
                            : 'bg-[#F0EDFF] text-[#5B35F5] group-hover:bg-[#5B35F5] group-hover:text-white'
                        }`}
                      >
                        <CategoryIcon name={cat.iconName} className="size-5" />
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {cat.articlesCount} articles
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#0B1026] group-hover:text-[#5B35F5] transition-colors mb-1.5">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#667085] leading-relaxed mb-4">
                      {cat.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#5B35F5] group-hover:translate-x-0.5 transition-transform">
                    <span>View answers</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/* 4. FAQ ACCORDION & SEARCH RESULTS SECTION                    */}
      {/* ============================================================ */}
      <section ref={faqSectionRef} className="py-10 sm:py-14 bg-white border-t border-slate-200/80">
        <Container size="default">
          {/* Section Header */}
          <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              {searchQuery ? (
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-[#0B1026]">
                    Search Results for &ldquo;{searchQuery}&rdquo;
                  </h2>
                  <span className="rounded-full bg-[#F3F1FF] border border-[#5B35F5]/30 text-[#5B35F5] px-2.5 py-0.5 text-xs font-bold">
                    {filteredArticles.length} found
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-[#0B1026]">
                    {selectedCategory === 'all'
                      ? 'Frequently Asked Questions'
                      : HELP_CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'FAQs'}
                  </h2>
                  <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-bold">
                    {filteredArticles.length} answers
                  </span>
                </div>
              )}
            </div>

            {/* Clear Filters / Category Switcher */}
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B35F5] hover:text-[#4927d6] cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Reset View</span>
              </button>
            )}
          </div>

          {/* Accordion FAQ Articles List */}
          {filteredArticles.length > 0 ? (
            <div className="space-y-3.5">
              {filteredArticles.map((article) => {
                const isOpen = expandedArticles.has(article.id);
                const category = HELP_CATEGORIES.find((c) => c.id === article.categoryId);

                return (
                  <div
                    key={article.id}
                    id={`faq-${article.id}`}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'border-[#5B35F5]/50 bg-gradient-to-b from-[#FAF9FF] via-white to-white shadow-md shadow-[#5B35F5]/5'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Accordion Header Button */}
                    <button
                      onClick={() => toggleArticle(article.id)}
                      className="flex items-center justify-between w-full p-4 sm:p-5 text-left transition-colors cursor-pointer gap-4"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 flex size-6 items-center justify-center rounded-lg shrink-0 ${
                            isOpen ? 'bg-[#5B35F5] text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <CategoryIcon name={category?.iconName || 'sparkles'} className="size-3.5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-[#0B1026] leading-snug">
                            {article.question}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">
                            {category?.title}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`size-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 bg-[#5B35F5] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ChevronDown className="size-4" />
                      </div>
                    </button>

                    {/* Accordion Expandable Content */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-indigo-50/80 text-xs sm:text-sm text-[#475467] leading-relaxed space-y-3">
                            <p>{article.answer}</p>

                            {/* Bullet points if present */}
                            {article.bullets && article.bullets.length > 0 && (
                              <ul className="space-y-1.5 pl-1 pt-1">
                                {article.bullets.map((bullet, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="size-4 rounded-full bg-indigo-50 text-[#5B35F5] flex items-center justify-center shrink-0 mt-0.5">
                                      <Check className="size-2.5" />
                                    </div>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Helpful Context Link */}
                            {article.categoryId === 'ai-shopping' && (
                              <div className="pt-2">
                                <Link
                                  href="/ai-shop"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B35F5] hover:underline"
                                >
                                  <Sparkles className="size-3.5" />
                                  <span>Try AI Shopping Now →</span>
                                </Link>
                              </div>
                            )}

                            {article.categoryId === 'shopping-products' && (
                              <div className="pt-2">
                                <Link
                                  href="/shop"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B35F5] hover:underline"
                                >
                                  <ShoppingBag className="size-3.5" />
                                  <span>Explore Storefront Catalog →</span>
                                </Link>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================ */
            /* EMPTY SEARCH RESULTS STATE                                   */
            /* ============================================================ */
            <div className="text-center py-12 px-4 rounded-2xl border border-slate-200 bg-[#FAF9FF]">
              <div className="size-12 rounded-2xl bg-[#F0EDFF] text-[#5B35F5] flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                <Search className="size-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#0B1026] mb-1">
                No help articles found for &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-[#667085] max-w-md mx-auto mb-5 leading-relaxed">
                We couldn&apos;t find matching answers. Try checking your spelling or explore popular topics below.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                <span className="text-[11px] font-bold text-slate-400">Try:</span>
                {['Payment', 'AI Shopping', 'Bag', 'Orders', 'Campaigns'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="rounded-lg bg-white border border-slate-200 hover:border-[#5B35F5] px-2.5 py-1 text-xs font-semibold text-[#5B35F5] cursor-pointer shadow-2xs"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* ============================================================ */}
      {/* 5. CONTACT SUPPORT SECTION                                   */}
      {/* ============================================================ */}
      <section id="contact" className="py-12 sm:py-16 bg-[#F8F8FC]/80 border-t border-slate-200/80">
        <Container size="default">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-[0_4px_24px_-4px_rgba(11,16,38,0.06)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1FF] border border-[#5B35F5]/30 px-3.5 py-1 text-xs font-bold text-[#5B35F5] mb-3">
                  <Headphones className="size-3.5" />
                  <span>Customer Care</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0B1026] mb-2 leading-tight">
                  Need more help? Our support team is here to help.
                </h2>

                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-6">
                  Have an inquiry about an order status, payment verification, or product compatibility? We provide direct resolution assistance for all customer shopping needs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8F8FC] border border-slate-200/70">
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#10162F]">Order & Delivery</p>
                      <p className="text-[11px] text-[#667085]">Tracking, dispatch, and receipt inquiries</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8F8FC] border border-slate-200/70">
                    <CreditCard className="size-4 text-[#5B35F5] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#10162F]">Payment Verification</p>
                      <p className="text-[11px] text-[#667085]">Instant checks with banking gateway</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Hours & Safe Contact Information Card */}
              <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#12082A] via-[#1E0D45] to-[#2D1264] p-6 text-white shadow-xl shadow-indigo-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="size-4 text-violet-300" />
                  <span className="text-xs font-bold text-violet-200 uppercase tracking-wider">
                    Operating Hours
                  </span>
                </div>

                <p className="font-serif text-lg font-bold text-white mb-1">
                  Monday – Saturday
                </p>
                <p className="text-xs text-indigo-200/90 leading-relaxed mb-4">
                  9:00 AM to 8:00 PM IST
                </p>

                <div className="border-t border-white/10 pt-4 mb-5 text-xs space-y-2 text-indigo-200/80">
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400 shrink-0" />
                    <span>Inquiries addressed within standard operating hours</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400 shrink-0" />
                    <span>Keep your Order ID handy for faster assistance</span>
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-[11px] text-indigo-100/90 text-center mb-4">
                  <span>Support contact details will be available here.</span>
                </div>

                <Button
                  size="sm"
                  className="w-full h-10 bg-gradient-to-r from-[#5B35F5] to-[#7C3AED] hover:from-[#4b2ad6] hover:to-[#6d28d9] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  render={<Link href="/ai-shop" />}
                >
                  <MessageSquare className="size-3.5 mr-1.5" />
                  <span>Ask AI Shopping Assistant</span>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
