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
    <section className="py-20 md:py-28 bg-white border-t border-border/80">
      <Container size="default">
        <div className="mb-14 text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Commerce Built on <span className="text-snt-accent">Trust</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            AI recommends with complete transparency. You decide and purchase with total control.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AI_VALUE_PROPS.map((prop) => {
            const Icon = iconMap[prop.iconName] || Brain;

            return (
              <div
                key={prop.title}
                className="group rounded-2xl border border-border/80 bg-background p-6 transition-all duration-300 hover:border-snt-accent/40 hover:shadow-lg hover:shadow-snt-accent/5 hover:-translate-y-0.5"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-snt-accent border border-indigo-100/80 transition-colors group-hover:bg-snt-accent group-hover:text-white">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {prop.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
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
