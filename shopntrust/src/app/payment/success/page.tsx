// ============================================================
// ShopNTrust — Payment Success Feedback (/payment/success)
// ============================================================

import Link from 'next/link';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  return (
    <div className="py-20 bg-background min-h-screen">
      <Container size="narrow" className="text-center">
        <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-5">
          <CheckCircle2 className="size-8" />
        </div>
        <span className="rounded-md bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
          Payment Verified
        </span>
        <h1 className="text-3xl font-extrabold text-foreground mt-3">
          Order Placed Successfully
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Your order has been confirmed. You will receive an SMS and email notification with tracking details.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button render={<Link href="/shop" />}>
            <ShoppingBag className="size-4 mr-2" />
            Continue Shopping
          </Button>
          <Button variant="outline" render={<Link href="/" />}>
            Home
          </Button>
        </div>
      </Container>
    </div>
  );
}
