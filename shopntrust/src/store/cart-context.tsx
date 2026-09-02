// ============================================================
// ShopNTrust — Cart State (React Context + useReducer)
// ============================================================
// Phase 3 Hardened: Variant-aware cart discrimination, canonical catalog
// validation, bounded quantities [1..10], subtotal precision, and safe persistence.
// ============================================================

'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Product, ProductVariant, CartItem, CartState, CartSummary } from '@/types';
import { appConfig } from '@/lib/config';
import { getProductById } from '@/lib/catalog';

// ============================================================
// HELPERS
// ============================================================

/** Helper to generate a unique composite item key for product + variant */
export function getCartItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

// ============================================================
// ACTIONS
// ============================================================

type CartAction =
  | {
      type: 'ADD_ITEM';
      product: Product;
      variant?: ProductVariant;
      quantity?: number;
      addedVia: CartItem['addedVia'];
    }
  | { type: 'REMOVE_ITEM'; itemKey: string }
  | { type: 'UPDATE_QUANTITY'; itemKey: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; items: CartItem[] };

// ============================================================
// REDUCER
// ============================================================

const initialState: CartState = {
  items: [],
  isLoading: true,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Validate product against canonical catalog
      const canonical = getProductById(action.product.product_id) || action.product;
      const qtyToAdd = Math.max(1, Math.min(action.quantity || 1, appConfig.maxCartQuantity));
      const targetKey = getCartItemKey(
        canonical.product_id,
        action.variant?.variant_id
      );

      const existingIndex = state.items.findIndex(
        (item) =>
          getCartItemKey(
            item.product.product_id,
            item.selectedVariant?.variant_id
          ) === targetKey
      );

      if (existingIndex > -1) {
        return {
          ...state,
          items: state.items.map((item, idx) =>
            idx === existingIndex
              ? {
                  ...item,
                  product: canonical, // update with canonical product reference
                  quantity: Math.min(
                    item.quantity + qtyToAdd,
                    appConfig.maxCartQuantity
                  ),
                }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            product: canonical,
            selectedVariant: action.variant,
            quantity: Math.min(qtyToAdd, appConfig.maxCartQuantity),
            addedVia: action.addedVia,
            addedAt: Date.now(),
          },
        ],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            getCartItemKey(
              item.product.product_id,
              item.selectedVariant?.variant_id
            ) !== action.itemKey &&
            item.product.product_id !== action.itemKey
        ),
      };

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) =>
              getCartItemKey(
                item.product.product_id,
                item.selectedVariant?.variant_id
              ) !== action.itemKey &&
              item.product.product_id !== action.itemKey
          ),
        };
      }

      const clampedQty = Math.max(1, Math.min(action.quantity, appConfig.maxCartQuantity));

      return {
        ...state,
        items: state.items.map((item) =>
          getCartItemKey(
            item.product.product_id,
            item.selectedVariant?.variant_id
          ) === action.itemKey ||
          item.product.product_id === action.itemKey
            ? {
                ...item,
                quantity: clampedQty,
              }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'HYDRATE':
      return { items: action.items, isLoading: false };

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

interface CartContextValue {
  state: CartState;
  summary: CartSummary;
  addItem: (
    product: Product,
    variant?: ProductVariant,
    quantity?: number,
    addedVia?: CartItem['addedVia']
  ) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId?: string) => boolean;
  getQuantity: (productId: string, variantId?: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // 1. Hydrate and validate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(appConfig.storageKeys.cart);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          // Re-validate against canonical catalog
          const validatedItems: CartItem[] = [];
          for (const item of parsed) {
            if (!item || !item.product || typeof item.product.product_id !== 'string') continue;
            const canonical = getProductById(item.product.product_id);
            if (!canonical) continue; // Safely omit invalid/stale product IDs

            // Validate variant if specified
            let validVariant: ProductVariant | undefined = undefined;
            if (item.selectedVariant && canonical.variants) {
              validVariant = canonical.variants.find(
                (v) => v.variant_id === item.selectedVariant?.variant_id
              );
            }

            validatedItems.push({
              product: canonical,
              selectedVariant: validVariant || item.selectedVariant,
              quantity: Math.max(1, Math.min(item.quantity || 1, appConfig.maxCartQuantity)),
              addedVia: item.addedVia || 'manual',
              addedAt: item.addedAt || Date.now(),
            });
          }
          dispatch({ type: 'HYDRATE', items: validatedItems });
        } else {
          dispatch({ type: 'HYDRATE', items: [] });
        }
      } else {
        dispatch({ type: 'HYDRATE', items: [] });
      }
    } catch {
      dispatch({ type: 'HYDRATE', items: [] });
    }
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (!state.isLoading) {
      try {
        localStorage.setItem(
          appConfig.storageKeys.cart,
          JSON.stringify(state.items)
        );
      } catch {
        // fail silently if storage quota exceeded
      }
    }
  }, [state.items, state.isLoading]);

  // Compute subtotal with canonical price resolution
  const subtotal = state.items.reduce((sum, item) => {
    const canonical = getProductById(item.product.product_id) || item.product;
    const unitPrice = item.selectedVariant?.price ?? canonical.price ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  const summary: CartSummary = {
    itemCount: state.items.length,
    totalQuantity: state.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    currency: appConfig.currency,
    aiAssistedCount: state.items.filter(
      (item) => item.addedVia !== 'manual'
    ).length,
  };

  const addItem = useCallback(
    (
      product: Product,
      variant?: ProductVariant,
      quantity = 1,
      addedVia: CartItem['addedVia'] = 'manual'
    ) => {
      dispatch({ type: 'ADD_ITEM', product, variant, quantity, addedVia });
    },
    []
  );

  const removeItem = useCallback((itemKey: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemKey });
  }, []);

  const updateQuantity = useCallback(
    (itemKey: string, quantity: number) => {
      dispatch({ type: 'UPDATE_QUANTITY', itemKey, quantity });
    },
    []
  );

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const isInCart = useCallback(
    (productId: string, variantId?: string) => {
      const targetKey = getCartItemKey(productId, variantId);
      return state.items.some(
        (item) =>
          getCartItemKey(
            item.product.product_id,
            item.selectedVariant?.variant_id
          ) === targetKey ||
          (!variantId && item.product.product_id === productId)
      );
    },
    [state.items]
  );

  const getQuantity = useCallback(
    (productId: string, variantId?: string) => {
      const targetKey = getCartItemKey(productId, variantId);
      const item = state.items.find(
        (item) =>
          getCartItemKey(
            item.product.product_id,
            item.selectedVariant?.variant_id
          ) === targetKey ||
          (!variantId && item.product.product_id === productId)
      );
      return item?.quantity ?? 0;
    },
    [state.items]
  );

  return (
    <CartContext.Provider
      value={{
        state,
        summary,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
