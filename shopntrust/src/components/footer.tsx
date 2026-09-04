// ============================================================
// ShopNTrust — Footer (High-Contrast Obsidian Module)
// ============================================================

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand & Purpose */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xs shadow-indigo-600/30 ring-1 ring-indigo-500/30">
                <Sparkles className="size-3.5" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-white">
                Shop<span className="text-indigo-400 font-black">N</span>Trust
              </span>
            </div>
            <p className="max-w-sm text-xs text-slate-400 leading-relaxed">
              Futuristic AI-native commerce platform. Authentic electronics, smart accessories, and wellness essentials engineered for intelligent shopping.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] text-slate-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Track 01 • Razorpay Buildathon 2026
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6 text-xs">
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-slate-200 mb-3">
                Storefront
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                    Storefront
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-slate-400 hover:text-white transition-colors">
                    Explore Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/ai-shop" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1">
                    AI Shopping <Sparkles className="size-2.5" />
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-slate-400 hover:text-white transition-colors">
                    Shopping Bag
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-slate-400 hover:text-white transition-colors font-medium text-indigo-300/90">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold uppercase tracking-wider text-slate-200 mb-3">
                Merchant & Support
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/help#contact" className="text-slate-400 hover:text-white transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/merchant" className="text-slate-400 hover:text-white transition-colors">
                    Merchant Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/checkout" className="text-slate-400 hover:text-white transition-colors">
                    Checkout Preview
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Trust Statement */}
          <div className="md:col-span-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-200 mb-1">
              Customer Sovereignty
            </p>
            <p className="text-[11px] leading-relaxed">
              AI interprets and recommends. You decide and purchase. No automatic additions or hidden charges.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-[11px] text-slate-500 sm:flex-row">
          <p>© 2026 ShopNTrust. All rights reserved.</p>
          <p className="flex items-center gap-1 text-slate-400 font-medium">
            Built by Aashish Sahu
          </p>
        </div>
      </Container>
    </footer>
  );
}
