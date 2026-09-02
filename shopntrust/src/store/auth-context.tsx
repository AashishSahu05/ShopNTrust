// ============================================================
// ShopNTrust — Demo Auth & Customer Context Provider
// ============================================================
// Frontend-only demo authentication and session context.
// Realistic sign in / sign up validation against local storage accounts.
// ============================================================

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  UserRole,
  CustomerProfile,
  MerchantProfile,
  DemoAccountRecord,
  DemoUser,
  AuthContextType,
  ProductCategory,
} from '@/types';
import { productExists } from '@/lib/catalog';

// ============================================================
// PRESET DEMO ACCOUNTS SEED
// ============================================================

export const INITIAL_DEMO_ACCOUNTS: DemoAccountRecord[] = [
  {
    id: 'demo-cust-1',
    role: 'customer',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    password: 'password123',
    preferredCategories: ['phones', 'wearables', 'headphones'],
  },
  {
    id: 'demo-cust-2',
    role: 'customer',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    password: 'password123',
    preferredCategories: ['skincare', 'footwear', 'nutrition'],
  },
  {
    id: 'demo-merch-1',
    role: 'merchant',
    name: 'Vikram Mehta',
    email: 'vikram@apexretail.in',
    password: 'password123',
    storeName: 'Apex Flagship Store',
  },
];

const STORAGE_KEY_AUTH = 'snt_demo_auth_state_v1';
const STORAGE_KEY_ACCOUNTS = 'snt_demo_accounts_v1';
const STORAGE_KEY_VIEWED = 'snt_demo_viewed_products_v1';

const defaultUser: DemoUser = {
  role: 'customer',
  profile: {
    name: INITIAL_DEMO_ACCOUNTS[0].name,
    email: INITIAL_DEMO_ACCOUNTS[0].email,
    preferredCategories: INITIAL_DEMO_ACCOUNTS[0].preferredCategories || ['phones', 'wearables'],
  },
  session: { viewedProductIds: [] },
};

interface AuthState {
  user: DemoUser;
  accounts: DemoAccountRecord[];
  viewedProductIds: string[];
  isAuthModalOpen: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'HYDRATE'; user: DemoUser; accounts: DemoAccountRecord[]; viewedProductIds: string[] }
  | { type: 'SET_USER'; user: DemoUser }
  | { type: 'ADD_ACCOUNT'; account: DemoAccountRecord }
  | { type: 'UPDATE_CATEGORIES'; categories: ProductCategory[] }
  | { type: 'RECORD_VIEWED'; productId: string }
  | { type: 'CLEAR_VIEWED' }
  | { type: 'SET_MODAL_OPEN'; isOpen: boolean };

const initialAuthState: AuthState = {
  user: defaultUser,
  accounts: INITIAL_DEMO_ACCOUNTS,
  viewedProductIds: [],
  isAuthModalOpen: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        user: action.user,
        accounts: action.accounts,
        viewedProductIds: action.viewedProductIds,
        isLoading: false,
      };

    case 'SET_USER':
      return {
        ...state,
        user: action.user,
        isAuthModalOpen: false,
      };

    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts.filter((a) => a.email.toLowerCase() !== action.account.email.toLowerCase()), action.account],
      };

    case 'UPDATE_CATEGORIES':
      if (state.user.role !== 'customer') return state;
      return {
        ...state,
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            preferredCategories: action.categories,
          },
        },
      };

    case 'RECORD_VIEWED': {
      const cleanId = action.productId.trim().toUpperCase();
      if (!productExists(cleanId)) return state;

      const filtered = state.viewedProductIds.filter((id) => id !== cleanId);
      const updatedList = [cleanId, ...filtered].slice(0, 20);

      return {
        ...state,
        viewedProductIds: updatedList,
        user:
          state.user.role === 'customer'
            ? {
                ...state.user,
                session: {
                  viewedProductIds: updatedList,
                },
              }
            : state.user,
      };
    }

    case 'CLEAR_VIEWED':
      return {
        ...state,
        viewedProductIds: [],
        user:
          state.user.role === 'customer'
            ? {
                ...state.user,
                session: { viewedProductIds: [] },
              }
            : state.user,
      };

    case 'SET_MODAL_OPEN':
      return {
        ...state,
        isAuthModalOpen: action.isOpen,
      };

    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // 1. Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      let hydratedUser = defaultUser;
      let hydratedAccounts = INITIAL_DEMO_ACCOUNTS;
      let hydratedViewed: string[] = [];

      const storedAccounts = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (storedAccounts) {
        const parsedAccounts = JSON.parse(storedAccounts);
        if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
          hydratedAccounts = parsedAccounts;
        }
      }

      const storedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        if (parsed && (parsed.role === 'customer' || parsed.role === 'merchant' || parsed.role === 'guest')) {
          hydratedUser = parsed;
        }
      }

      const storedViewed = localStorage.getItem(STORAGE_KEY_VIEWED);
      if (storedViewed) {
        const parsedViewed = JSON.parse(storedViewed);
        if (Array.isArray(parsedViewed)) {
          hydratedViewed = parsedViewed.filter((id) => typeof id === 'string' && productExists(id));
        }
      }

      dispatch({
        type: 'HYDRATE',
        user: hydratedUser,
        accounts: hydratedAccounts,
        viewedProductIds: hydratedViewed,
      });
    } catch {
      dispatch({
        type: 'HYDRATE',
        user: defaultUser,
        accounts: INITIAL_DEMO_ACCOUNTS,
        viewedProductIds: [],
      });
    }
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (!state.isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(state.user));
        localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(state.accounts));
        localStorage.setItem(STORAGE_KEY_VIEWED, JSON.stringify(state.viewedProductIds));
      } catch {
        // Storage write error ignored for demo
      }
    }
  }, [state.user, state.accounts, state.viewedProductIds, state.isLoading]);

  // Sign In with realistic validation
  const signIn = useCallback(
    (role: 'customer' | 'merchant', email: string, password?: string) => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        return { success: false, error: 'Please enter your email address.' };
      }

      const match = state.accounts.find(
        (a) => a.email.toLowerCase() === trimmedEmail && a.role === role
      );

      if (!match) {
        return {
          success: false,
          error: `No demo ${role} account found with email "${email}". Please create an account first.`,
        };
      }

      if (password && match.password && match.password !== password) {
        return {
          success: false,
          error: 'Incorrect password for this demo account.',
        };
      }

      // Log in
      if (role === 'customer') {
        dispatch({
          type: 'SET_USER',
          user: {
            role: 'customer',
            profile: {
              name: match.name,
              email: match.email,
              preferredCategories: match.preferredCategories || ['phones', 'headphones'],
            },
            session: {
              viewedProductIds: state.viewedProductIds,
            },
          },
        });
      } else {
        dispatch({
          type: 'SET_USER',
          user: {
            role: 'merchant',
            profile: {
              name: match.name,
              email: match.email,
              storeName: match.storeName || 'Apex Flagship Store',
            },
          },
        });
      }

      return { success: true };
    },
    [state.accounts, state.viewedProductIds]
  );

  // Sign Up with realistic validation
  const signUp = useCallback(
    (
      role: 'customer' | 'merchant',
      data: {
        name: string;
        email: string;
        password?: string;
        preferredCategories?: ProductCategory[];
        storeName?: string;
      }
    ) => {
      const trimmedName = data.name.trim();
      const trimmedEmail = data.email.trim().toLowerCase();

      if (!trimmedName) {
        return { success: false, error: 'Please enter your full name.' };
      }
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      // Check if already exists for this role
      const existing = state.accounts.find(
        (a) => a.email.toLowerCase() === trimmedEmail && a.role === role
      );
      if (existing) {
        return {
          success: false,
          error: `A demo ${role} account with "${data.email}" already exists. Please sign in instead.`,
        };
      }

      const newAccount: DemoAccountRecord = {
        id: `demo-${role}-${Date.now()}`,
        role,
        name: trimmedName,
        email: data.email.trim(),
        password: data.password || 'password123',
        preferredCategories: data.preferredCategories || ['phones', 'wearables', 'headphones'],
        storeName: data.storeName?.trim() || 'Flagship Store',
      };

      dispatch({ type: 'ADD_ACCOUNT', account: newAccount });

      // Automatically sign in newly created account
      if (role === 'customer') {
        dispatch({
          type: 'SET_USER',
          user: {
            role: 'customer',
            profile: {
              name: newAccount.name,
              email: newAccount.email,
              preferredCategories: newAccount.preferredCategories || ['phones'],
            },
            session: {
              viewedProductIds: state.viewedProductIds,
            },
          },
        });
      } else {
        dispatch({
          type: 'SET_USER',
          user: {
            role: 'merchant',
            profile: {
              name: newAccount.name,
              email: newAccount.email,
              storeName: newAccount.storeName || 'Flagship Store',
            },
          },
        });
      }

      return { success: true };
    },
    [state.accounts, state.viewedProductIds]
  );

  // Fast convenience helpers
  const loginAsCustomer = useCallback((profileData?: Partial<CustomerProfile>) => {
    const defaultCust = INITIAL_DEMO_ACCOUNTS[0];
    const profile: CustomerProfile = {
      name: profileData?.name?.trim() || defaultCust.name,
      email: profileData?.email?.trim() || defaultCust.email,
      preferredCategories: profileData?.preferredCategories || defaultCust.preferredCategories || ['phones'],
    };

    dispatch({
      type: 'SET_USER',
      user: {
        role: 'customer',
        profile,
        session: {
          viewedProductIds: state.viewedProductIds,
        },
      },
    });
  }, [state.viewedProductIds]);

  const loginAsMerchant = useCallback((merchantData?: Partial<MerchantProfile>) => {
    const defaultMerch = INITIAL_DEMO_ACCOUNTS[2];
    const profile: MerchantProfile = {
      name: merchantData?.name?.trim() || defaultMerch.name,
      email: merchantData?.email?.trim() || defaultMerch.email,
      storeName: merchantData?.storeName?.trim() || defaultMerch.storeName || 'Apex Flagship Store',
    };

    dispatch({
      type: 'SET_USER',
      user: {
        role: 'merchant',
        profile,
      },
    });
  }, []);

  const logout = useCallback(() => {
    dispatch({
      type: 'SET_USER',
      user: { role: 'guest' },
    });
  }, []);

  const switchRole = useCallback(
    (newRole: UserRole) => {
      if (newRole === 'merchant') {
        loginAsMerchant();
      } else if (newRole === 'customer') {
        loginAsCustomer();
      } else {
        logout();
      }
    },
    [loginAsMerchant, loginAsCustomer, logout]
  );

  const updatePreferredCategories = useCallback((categories: ProductCategory[]) => {
    dispatch({ type: 'UPDATE_CATEGORIES', categories });
  }, []);

  const recordViewedProduct = useCallback((productId: string) => {
    dispatch({ type: 'RECORD_VIEWED', productId });
  }, []);

  const clearViewedProducts = useCallback(() => {
    dispatch({ type: 'CLEAR_VIEWED' });
  }, []);

  const openAuthModal = useCallback(() => {
    dispatch({ type: 'SET_MODAL_OPEN', isOpen: true });
  }, []);

  const closeAuthModal = useCallback(() => {
    dispatch({ type: 'SET_MODAL_OPEN', isOpen: false });
  }, []);

  const value: AuthContextType = useMemo(() => {
    const isCustomer = state.user.role === 'customer';
    const isMerchant = state.user.role === 'merchant';
    const isGuest = state.user.role === 'guest';

    return {
      user: state.user,
      role: state.user.role,
      isCustomer,
      isMerchant,
      isGuest,
      customerProfile: state.user.role === 'customer' ? state.user.profile : null,
      merchantProfile: state.user.role === 'merchant' ? state.user.profile : null,
      viewedProductIds: state.viewedProductIds,
      signIn,
      signUp,
      loginAsCustomer,
      loginAsMerchant,
      logout,
      switchRole,
      updatePreferredCategories,
      recordViewedProduct,
      clearViewedProducts,
      isAuthModalOpen: state.isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
    };
  }, [
    state.user,
    state.viewedProductIds,
    state.isAuthModalOpen,
    signIn,
    signUp,
    loginAsCustomer,
    loginAsMerchant,
    logout,
    switchRole,
    updatePreferredCategories,
    recordViewedProduct,
    clearViewedProducts,
    openAuthModal,
    closeAuthModal,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
