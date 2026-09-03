// ============================================================
// ShopNTrust — Application Providers
// ============================================================
// Wraps the app with all necessary context providers.
// Add new providers here as they are created in future phases.
// ============================================================

'use client';

import { type ReactNode } from 'react';
import { CartProvider } from '@/store/cart-context';
import { AuthProvider } from '@/store/auth-context';
import { AISessionProvider } from '@/store/ai-context';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root provider wrapper for the application.
 *
 * All context providers go here so that layout.tsx stays clean.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <AISessionProvider>
          {children}
        </AISessionProvider>
      </CartProvider>
    </AuthProvider>
  );
}
