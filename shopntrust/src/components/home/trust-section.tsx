// ============================================================
// ShopNTrust — Trust & Commerce Principles (Homepage)
// ============================================================

import { Brain, Target, MessageCircle, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { AI_VALUE_PROPS } from '@/lib/homepage-data';

const iconMap: Record<string, React.ElementType> = {
  brain: Brain,
  target: Target,
  'message-circle': MessageCircle,
  'shield-check': ShieldCheck,
};

export function TrustSection() {
  return (
    <section className="py-10 md:py-14 bg-white border-t border-slate-200/80">
      <Container size="default">
        <div className="mb-8 text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1026]">
            Commerce Built on <span className="text-[#5B35F5]">Trust</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#667085] leading-relaxed">
            AI recommends with complete transparency. You decide and purchase with total control.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AI_VALUE_PROPS.map((prop) => {
            const Icon = iconMap[prop.iconName] || Brain;

            return (
              <div
                key={prop.title}
                className="group rounded-2xl border border-slate-200/80 bg-[#F8F8FC]/50 p-5 transition-all duration-300 hover:border-[#5B35F5]/40 hover:shadow-md hover:bg-white"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-[#5B35F5] border border-indigo-100 transition-colors group-hover:bg-[#5B35F5] group-hover:text-white">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0B1026]">
                  {prop.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#667085]">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
