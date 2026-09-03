// ============================================================
// ShopNTrust — Real Supabase Auth & Customer Context Provider
// ============================================================
// Real authentication powered by Supabase Auth and database persistence.
// Handles customer signup, signin, logout, profile persistence, and viewed products.
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
import { supabase } from '@/lib/supabase/client';
import {
  getDbProfile,
  upsertDbProfile,
  recordDbViewedProduct,
  getDbViewedProducts,
} from '@/lib/supabase/db';
import type {
  UserRole,
  CustomerProfile,
  MerchantProfile,
  DemoUser,
  AuthContextType,
  ProductCategory,
} from '@/types';
import { productExists } from '@/lib/catalog';

const defaultGuestUser: DemoUser = {
  role: 'guest',
};

interface AuthState {
  user: DemoUser;
  viewedProductIds: string[];
  isAuthModalOpen: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; user: DemoUser; viewedProductIds?: string[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'UPDATE_CATEGORIES'; categories: ProductCategory[] }
  | { type: 'RECORD_VIEWED'; productId: string }
  | { type: 'CLEAR_VIEWED' }
  | { type: 'SET_MODAL_OPEN'; isOpen: boolean };

const initialAuthState: AuthState = {
  user: defaultGuestUser,
  viewedProductIds: [],
  isAuthModalOpen: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_USER':
      return {
        ...state,
        user: action.user,
        viewedProductIds: action.viewedProductIds !== undefined ? action.viewedProductIds : state.viewedProductIds,
        isAuthModalOpen: false,
        isLoading: false,
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
                  ...state.user.session,
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
      return { ...state, isAuthModalOpen: action.isOpen };

    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Sync session from Supabase on mount and listen to auth changes
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          const user = session.user;
          const userMetadata = user.user_metadata || {};
          const isMerchantRole = userMetadata.role === 'merchant';

          if (isMerchantRole) {
            const merchProfile: MerchantProfile = {
              id: user.id,
              name: userMetadata.name || user.email?.split('@')[0] || 'Merchant Partner',
              email: user.email || '',
              storeName: userMetadata.storeName || 'Official Merchant Store',
            };
            dispatch({ type: 'SET_USER', user: { role: 'merchant', profile: merchProfile }, viewedProductIds: [] });
          } else {
            // Load DB profile or fallback to user metadata
            const dbProfile = await getDbProfile(user.id);
            const custProfile: CustomerProfile = {
              id: user.id,
              name: dbProfile?.name || userMetadata.name || user.email?.split('@')[0] || 'Customer',
              email: user.email || '',
              preferredCategories: dbProfile?.preferredCategories || userMetadata.preferredCategories || ['phones', 'wearables', 'headphones'],
            };

            const dbViewed = await getDbViewedProducts(user.id);
            dispatch({
              type: 'SET_USER',
              user: {
                role: 'customer',
                profile: custProfile,
                session: { viewedProductIds: dbViewed },
              },
              viewedProductIds: dbViewed,
            });
          }
        } else {
          dispatch({ type: 'SET_USER', user: defaultGuestUser, viewedProductIds: [] });
        }
      } catch (err) {
        console.error('Supabase getSession error:', err);
        if (mounted) {
          dispatch({ type: 'SET_USER', user: defaultGuestUser, viewedProductIds: [] });
        }
      }
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const userMetadata = user.user_metadata || {};
        const isMerchantRole = userMetadata.role === 'merchant';

        if (isMerchantRole) {
          const merchProfile: MerchantProfile = {
            id: user.id,
            name: userMetadata.name || user.email?.split('@')[0] || 'Merchant Partner',
            email: user.email || '',
            storeName: userMetadata.storeName || 'Official Merchant Store',
          };
          dispatch({ type: 'SET_USER', user: { role: 'merchant', profile: merchProfile }, viewedProductIds: [] });
        } else {
          const dbProfile = await getDbProfile(user.id);
          const custProfile: CustomerProfile = {
            id: user.id,
            name: dbProfile?.name || userMetadata.name || user.email?.split('@')[0] || 'Customer',
            email: user.email || '',
            preferredCategories: dbProfile?.preferredCategories || userMetadata.preferredCategories || ['phones', 'wearables', 'headphones'],
          };
          const dbViewed = await getDbViewedProducts(user.id);
          dispatch({
            type: 'SET_USER',
            user: {
              role: 'customer',
              profile: custProfile,
              session: { viewedProductIds: dbViewed },
            },
            viewedProductIds: dbViewed,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SET_USER', user: defaultGuestUser, viewedProductIds: [] });
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Real Supabase Sign In (with auto-confirm fallback)
  const signIn = useCallback(
    async (
      role: 'customer' | 'merchant',
      email: string,
      password?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!email.trim() || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        // Handle "Email not confirmed" — auto-confirm and retry
        if (error && (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('email_not_confirmed')
        )) {
          try {
            // Call server-side API to auto-confirm the user's email
            const confirmRes = await fetch('/api/auth/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim() }),
            });

            if (confirmRes.ok) {
              // Retry sign-in after confirming email
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });

              if (retryError) {
                return { success: false, error: retryError.message };
              }

              if (retryData.user) {
                const user = retryData.user;
                const userMetadata = user.user_metadata || {};
                const isMerchantRole = role === 'merchant' || userMetadata.role === 'merchant';

                if (isMerchantRole) {
                  const merchProfile: MerchantProfile = {
                    id: user.id,
                    name: userMetadata.name || user.email?.split('@')[0] || 'Merchant Partner',
                    email: user.email || '',
                    storeName: userMetadata.storeName || 'Official Merchant Store',
                  };
                  dispatch({ type: 'SET_USER', user: { role: 'merchant', profile: merchProfile }, viewedProductIds: [] });
                } else {
                  const dbProfile = await getDbProfile(user.id);
                  const custProfile: CustomerProfile = {
                    id: user.id,
                    name: dbProfile?.name || userMetadata.name || user.email?.split('@')[0] || 'Customer',
                    email: user.email || '',
                    preferredCategories: dbProfile?.preferredCategories || userMetadata.preferredCategories || ['phones', 'wearables', 'headphones'],
                  };
                  const dbViewed = await getDbViewedProducts(user.id);
                  dispatch({
                    type: 'SET_USER',
                    user: {
                      role: 'customer',
                      profile: custProfile,
                      session: { viewedProductIds: dbViewed },
                    },
                    viewedProductIds: dbViewed,
                  });
                }

                return { success: true };
              }
            }
          } catch {
            // Auto-confirm failed, return original error with helpful message
          }

          return { success: false, error: 'Could not verify your account. Please try again or create a new account.' };
        }

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const user = data.user;
          const userMetadata = user.user_metadata || {};
          const isMerchantRole = role === 'merchant' || userMetadata.role === 'merchant';

          if (isMerchantRole) {
            const merchProfile: MerchantProfile = {
              id: user.id,
              name: userMetadata.name || user.email?.split('@')[0] || 'Merchant Partner',
              email: user.email || '',
              storeName: userMetadata.storeName || 'Official Merchant Store',
            };
            dispatch({ type: 'SET_USER', user: { role: 'merchant', profile: merchProfile }, viewedProductIds: [] });
          } else {
            const dbProfile = await getDbProfile(user.id);
            const custProfile: CustomerProfile = {
              id: user.id,
              name: dbProfile?.name || userMetadata.name || user.email?.split('@')[0] || 'Customer',
              email: user.email || '',
              preferredCategories: dbProfile?.preferredCategories || userMetadata.preferredCategories || ['phones', 'wearables', 'headphones'],
            };
            const dbViewed = await getDbViewedProducts(user.id);
            dispatch({
              type: 'SET_USER',
              user: {
                role: 'customer',
                profile: custProfile,
                session: { viewedProductIds: dbViewed },
              },
              viewedProductIds: dbViewed,
            });
          }

          return { success: true };
        }

        return { success: false, error: 'Failed to sign in. Please try again.' };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Authentication network error';
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  // Real Supabase Sign Up (with auto-confirm + auto-sign-in)
  const signUp = useCallback(
    async (
      role: 'customer' | 'merchant',
      formData: {
        name: string;
        email: string;
        password?: string;
        preferredCategories?: ProductCategory[];
        storeName?: string;
      }
    ): Promise<{ success: boolean; error?: string }> => {
      const { name, email, password, preferredCategories, storeName } = formData;

      if (!name.trim() || !email.trim() || !password) {
        return { success: false, error: 'Name, email, and password are required.' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              role,
              preferredCategories: preferredCategories || ['phones', 'wearables'],
              storeName: storeName || '',
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const user = data.user;

          // Auto-confirm the email via server-side API so login works later
          try {
            await fetch('/api/auth/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim() }),
            });
          } catch {
            // Non-fatal: confirmation may fail if service role key is not set
          }

          // Auto-sign-in after signup to establish a proper session
          try {
            await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
          } catch {
            // Non-fatal: the onAuthStateChange listener will handle session
          }

          if (role === 'merchant') {
            const merchProfile: MerchantProfile = {
              id: user.id,
              name: name.trim(),
              email: user.email || email.trim(),
              storeName: storeName || 'Merchant Store',
            };
            dispatch({ type: 'SET_USER', user: { role: 'merchant', profile: merchProfile }, viewedProductIds: [] });
          } else {
            const custProfile: CustomerProfile = {
              id: user.id,
              name: name.trim(),
              email: user.email || email.trim(),
              preferredCategories: preferredCategories || ['phones', 'wearables', 'headphones'],
            };

            // Persist profile to Supabase profiles table
            await upsertDbProfile(user.id, custProfile);

            dispatch({
              type: 'SET_USER',
              user: {
                role: 'customer',
                profile: custProfile,
                session: { viewedProductIds: [] },
              },
              viewedProductIds: [],
            });
          }

          return { success: true };
        }

        return { success: false, error: 'Sign up failed. Please try again.' };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Sign up network error';
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  // Helper Login Shortcuts for Quick UI switching
  const loginAsCustomer = useCallback((profileOverride?: Partial<CustomerProfile>) => {
    const custProfile: CustomerProfile = {
      name: profileOverride?.name || 'Customer User',
      email: profileOverride?.email || 'customer@example.com',
      preferredCategories: profileOverride?.preferredCategories || ['phones', 'wearables'],
    };
    dispatch({
      type: 'SET_USER',
      user: {
        role: 'customer',
        profile: custProfile,
        session: { viewedProductIds: [] },
      },
      viewedProductIds: [],
    });
  }, []);

  const loginAsMerchant = useCallback((merchantOverride?: Partial<MerchantProfile>) => {
    const merchProfile: MerchantProfile = {
      name: merchantOverride?.name || 'Merchant Partner',
      email: merchantOverride?.email || 'merchant@shopntrust.in',
      storeName: merchantOverride?.storeName || 'Verified Merchant Store',
    };
    dispatch({
      type: 'SET_USER',
      user: {
        role: 'merchant',
        profile: merchProfile,
      },
      viewedProductIds: [],
    });
  }, []);

  // Real Supabase Logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Continue client cleanup
    }
    dispatch({ type: 'SET_USER', user: defaultGuestUser, viewedProductIds: [] });
  }, []);

  const switchRole = useCallback((newRole: UserRole) => {
    if (newRole === 'merchant') {
      loginAsMerchant();
    } else if (newRole === 'customer') {
      loginAsCustomer();
    } else {
      logout();
    }
  }, [loginAsMerchant, loginAsCustomer, logout]);

  // Update Preferred Categories
  const updatePreferredCategories = useCallback(
    async (categories: ProductCategory[]) => {
      dispatch({ type: 'UPDATE_CATEGORIES', categories });
      if (state.user.role === 'customer' && state.user.profile.id) {
        await upsertDbProfile(state.user.profile.id, {
          name: state.user.profile.name,
          email: state.user.profile.email,
          preferredCategories: categories,
        });
      }
    },
    [state.user]
  );

  // Record Viewed Product
  const recordViewedProduct = useCallback(
    (productId: string) => {
      dispatch({ type: 'RECORD_VIEWED', productId });
      if (state.user.role === 'customer' && state.user.profile.id) {
        recordDbViewedProduct(state.user.profile.id, productId);
      }
    },
    [state.user]
  );

  const clearViewedProducts = useCallback(() => {
    dispatch({ type: 'CLEAR_VIEWED' });
  }, []);

  const openAuthModal = useCallback(() => {
    dispatch({ type: 'SET_MODAL_OPEN', isOpen: true });
  }, []);

  const closeAuthModal = useCallback(() => {
    dispatch({ type: 'SET_MODAL_OPEN', isOpen: false });
  }, []);

  // Getters
  const role: UserRole = state.user.role;
  const isCustomer = role === 'customer';
  const isMerchant = role === 'merchant';
  const isGuest = role === 'guest';

  const customerProfile: CustomerProfile | null =
    state.user.role === 'customer' ? state.user.profile : null;
  const merchantProfile: MerchantProfile | null =
    state.user.role === 'merchant' ? state.user.profile : null;

  const value = useMemo<AuthContextType>(
    () => ({
      user: state.user,
      role,
      isCustomer,
      isMerchant,
      isGuest,
      isLoading: state.isLoading,
      customerProfile,
      merchantProfile,
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
    }),
    [
      state.user,
      role,
      isCustomer,
      isMerchant,
      isGuest,
      state.isLoading,
      customerProfile,
      merchantProfile,
      state.viewedProductIds,
      signIn,
      signUp,
      loginAsCustomer,
      loginAsMerchant,
      logout,
      switchRole,
      updatePreferredCategories,
      recordViewedProduct,
      clearViewedProducts,
      state.isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
