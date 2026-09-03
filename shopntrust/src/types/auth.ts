// ============================================================
// ShopNTrust — Real Supabase Authentication & Customer Context Types
// ============================================================
// Types for real Supabase authentication, customer profiles, and session state.
// ============================================================

import type { ProductCategory } from './product';

/** Centralized User Roles */
export type UserRole = 'customer' | 'merchant' | 'guest';

/** Customer Profile */
export interface CustomerProfile {
  id?: string;
  name: string;
  email: string;
  preferredCategories: ProductCategory[];
}

/** Current Session Context */
export interface CustomerSessionContext {
  /** Canonical Product IDs viewed during the current session (ordered, deduplicated) */
  viewedProductIds: string[];
}

/** Merchant Profile */
export interface MerchantProfile {
  id?: string;
  name: string;
  email: string;
  storeName: string;
}

/** Stored Account Record */
export interface DemoAccountRecord {
  id: string;
  role: 'customer' | 'merchant';
  name: string;
  email: string;
  password?: string;
  preferredCategories?: ProductCategory[];
  storeName?: string;
}

/** Discriminated User State */
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
  /** Current active user */
  user: DemoUser;

  /** Active role */
  role: UserRole;

  /** Convenience getters */
  isCustomer: boolean;
  isMerchant: boolean;
  isGuest: boolean;

  /** Loading state during session restoration */
  isLoading: boolean;

  /** Customer profile if active */
  customerProfile: CustomerProfile | null;

  /** Merchant profile if active */
  merchantProfile: MerchantProfile | null;

  /** Current session viewed product IDs */
  viewedProductIds: string[];

  /** Real Supabase Auth Actions */
  signIn: (
    role: 'customer' | 'merchant',
    email: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;

  signUp: (
    role: 'customer' | 'merchant',
    data: {
      name: string;
      email: string;
      password?: string;
      preferredCategories?: ProductCategory[];
      storeName?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;

  loginAsCustomer: (profile?: Partial<CustomerProfile>) => void;
  loginAsMerchant: (merchant?: Partial<MerchantProfile>) => void;
  logout: () => Promise<void>;
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
