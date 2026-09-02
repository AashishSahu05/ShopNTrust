// ============================================================
// ShopNTrust — Payment Failed Feedback (/payment/failed)
// ============================================================

import Link from 'next/link';
import { XCircle, RefreshCw } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export default function PaymentFailedPage() {
  return (
    <div className="py-20 bg-background min-h-screen">
      <Container size="narrow" className="text-center">
        <div className="flex size-16 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-5">
          <XCircle className="size-8" />
        </div>
        <span className="rounded-md bg-rose-50 text-rose-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
          Transaction Incomplete
        </span>
        <h1 className="text-3xl font-extrabold text-foreground mt-3">
          Payment Was Not Completed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          The transaction could not be processed. No funds were debited. You can safely retry checkout.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button render={<Link href="/checkout" />}>
            <RefreshCw className="size-4 mr-2" />
            Retry Checkout
          </Button>
          <Button variant="outline" render={<Link href="/cart" />}>
            Back to Bag
          </Button>
        </div>
      </Container>
    </div>
  );
}
