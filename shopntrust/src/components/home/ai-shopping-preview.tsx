// ============================================================
// ShopNTrust — AI Commerce Experience Intro (Homepage)
// ============================================================

import Link from 'next/link';
import { Sparkles, ArrowRight, MessageSquareCode, Cpu, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export function AIShoppingPreview() {
  const steps = [
    {
      step: '01',
      title: 'State Your Needs',
      desc: 'Describe budget, use cases, or specific constraints in simple natural language.',
      icon: MessageSquareCode,
    },
    {
      step: '02',
      title: 'AI Matches Canonical IDs',
      desc: 'Our engine identifies real catalog items with zero hallucinated specs or prices.',
      icon: Cpu,
    },
    {
      step: '03',
      title: 'Transparent Reasoning',
      desc: 'Read exact match factors and compatibility explanations before adding to cart.',
      icon: Sparkles,
    },
    {
      step: '04',
      title: 'You Decide & Control',
      desc: 'Nothing is added automatically. Seamlessly approve and checkout with Razorpay.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="bg-slate-950 py-20 text-white md:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-3.5">
            <Sparkles className="size-3.5" />
            <span>Next-Generation Shopping Model</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
            How AI Shopping Works
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A trustworthy, transparent shopping assistant designed to eliminate endless filter navigation.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {steps.map((item, idx) => {
            const Icon = item.icon;

            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                      <Icon className="size-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <p className="text-sm font-bold text-white">
              Ready to test natural language product discovery?
            </p>
            <p className="text-xs text-slate-400">
              Experience the intelligent shopping interface directly.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-snt-accent hover:bg-snt-accent-hover text-white font-bold px-5 h-11 shrink-0 gap-2"
            render={<Link href="/ai-shop" />}
          >
            <Sparkles className="size-4" />
            <span>Launch AI Shopping Assistant</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
