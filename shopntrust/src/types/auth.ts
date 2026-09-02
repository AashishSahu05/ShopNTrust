// ============================================================
// ShopNTrust — Demo Authentication & Customer Context Types
// ============================================================
// Frontend-only demo identity and session context definitions.
// Note: This is a frontend demo layer; no real backend auth or
// password handling exists.
// ============================================================

import type { ProductCategory } from './product';

/** Centralized User Roles */
export type UserRole = 'customer' | 'merchant' | 'guest';

/** Customer Demo Profile */
export interface CustomerProfile {
  name: string;
  email: string;
  preferredCategories: ProductCategory[];
}

/** Current Session Context (Transients for current browsing session) */
export interface CustomerSessionContext {
  /** Canonical Product IDs viewed during the current session (ordered, deduplicated) */
  viewedProductIds: string[];
}

/** Merchant Demo Profile */
export interface MerchantProfile {
  name: string;
  email: string;
  storeName: string;
}

/** Stored Demo Account Record (localStorage simulation) */
export interface DemoAccountRecord {
  id: string;
  role: 'customer' | 'merchant';
  name: string;
  email: string;
  password?: string; // Demo simulation only
  preferredCategories?: ProductCategory[];
  storeName?: string;
}

/** Discriminated Demo User State */
export type DemoUser =
  | {
      role: 'customer';
      profile: CustomerProfile;
      session: CustomerSessionContext;
    }
  | {
      role: 'merchant';
      profile: MerchantProfile;
    }
  | {
      role: 'guest';
    };

/** Auth & Context Provider State */
export interface AuthContextType {
  /** Current active demo user */
  user: DemoUser;

  /** Active role */
  role: UserRole;

  /** Convenience getters */
  isCustomer: boolean;
  isMerchant: boolean;
  isGuest: boolean;

  /** Customer profile if active */
  customerProfile: CustomerProfile | null;

  /** Merchant profile if active */
  merchantProfile: MerchantProfile | null;

  /** Current session viewed product IDs */
  viewedProductIds: string[];

  /** Auth Actions */
  signIn: (
    role: 'customer' | 'merchant',
    email: string,
    password?: string
  ) => { success: boolean; error?: string };

  signUp: (
    role: 'customer' | 'merchant',
    data: {
      name: string;
      email: string;
      password?: string;
      preferredCategories?: ProductCategory[];
      storeName?: string;
    }
  ) => { success: boolean; error?: string };

  loginAsCustomer: (profile?: Partial<CustomerProfile>) => void;
  loginAsMerchant: (merchant?: Partial<MerchantProfile>) => void;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;

  /** Customer Context Updaters */
  updatePreferredCategories: (categories: ProductCategory[]) => void;
  recordViewedProduct: (productId: string) => void;
  clearViewedProducts: () => void;

  /** UI Control */
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}
