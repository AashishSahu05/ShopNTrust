// ============================================================
// ShopNTrust — AI + Commerce Bridge Section
// ============================================================
// Demonstrates that ShopNTrust supports both:
// 1. Traditional Manual Browsing (Browse, Filter, Compare, Cart)
// 2. Agentic AI Commerce (Describe, Match, Explain, Purchase)
// ============================================================

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Store,
  ArrowRight,
  Filter,
  Cpu,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export function AICommerceBridge() {
  return (
    <section className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden">
      <Container>
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 border border-slate-700 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-3.5">
            <Sparkles className="size-3.5" />
            <span>Dual-Mode Shopping Paradigm</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
            Shop Your Way
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Choose standard e-commerce navigation or let an autonomous shopping agent handle product matching for you.
          </p>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left: Traditional Commerce Mode */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-slate-800 bg-slate-950/70 p-7 sm:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-200 border border-slate-700">
                  <Store className="size-6" />
                </div>
                <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Traditional Mode
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white mb-2">
                Browse & Filter Yourself
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Directly explore our curated selection across phones, wearables, personal audio, laptops, gaming, and lifestyle gear with precision multi-filter controls.
              </p>

              {/* Journey Steps */}
              <div className="space-y-3 border-t border-slate-800/80 pt-5">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-slate-800 font-mono text-[10px] font-bold text-slate-400">1</span>
                  <span>Explore catalog across 7 verified categories</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-slate-800 font-mono text-[10px] font-bold text-slate-400">2</span>
                  <span>Filter by brand, price range, and sort orders</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-slate-800 font-mono text-[10px] font-bold text-slate-400">3</span>
                  <span>Inspect specifications and add directly to your bag</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="mt-8 w-full border-slate-700 bg-slate-900 text-white hover:bg-slate-800 h-11 text-xs font-bold gap-2 cursor-pointer"
              render={<Link href="/shop" />}
            >
              <Filter className="size-3.5" />
              <span>Explore Storefront Catalog</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </motion.div>

          {/* Right: Agentic AI Commerce Mode */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/50 to-slate-950 p-7 sm:p-8 flex flex-col justify-between relative shadow-lg shadow-indigo-500/10"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-snt-accent text-white shadow-md shadow-snt-accent/30">
                  <Sparkles className="size-6" />
                </div>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3 py-1 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                  Agentic AI Mode
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white mb-2">
                Describe What You Need
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Tell the agent your exact requirements in plain natural language. The AI parses constraints, queries the verified catalog, and provides transparent recommendations.
              </p>

              {/* Journey Steps */}
              <div className="space-y-3 border-t border-indigo-500/20 pt-5">
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-600/30 font-mono text-[10px] font-bold text-indigo-300">1</span>
                  <span>Describe budget, use-cases, and feature priorities</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-600/30 font-mono text-[10px] font-bold text-indigo-300">2</span>
                  <span>AI matches authentic canonical products with zero hallucination</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-600/30 font-mono text-[10px] font-bold text-indigo-300">3</span>
                  <span>Review transparent reasoning and approve 1-click purchase</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-8 w-full bg-snt-accent hover:bg-snt-accent-hover text-white h-11 text-xs font-bold gap-2 shadow-md shadow-snt-accent/20 cursor-pointer"
              render={<Link href="/ai-shop" />}
            >
              <Cpu className="size-3.5" />
              <span>Launch AI Shopping Agent</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
