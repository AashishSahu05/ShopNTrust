// ============================================================
// ShopNTrust — Campaign Store & Storefront State Provider
// ============================================================
// Supplies active campaign data and real-time product coverage
// to storefront product cards, banners, and catalogue views.
// Automatically syncs active database campaigns without manual refresh.
// ============================================================

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Campaign } from '@/types';

export interface CampaignProductInfo {
  campaignId: string;
  campaignName: string;
  discountType: string;
  discountPercent: number;
}

export interface CampaignContextType {
  activeCampaigns: Campaign[];
  campaignProductMap: Map<string, CampaignProductInfo>;
  isLoading: boolean;
  refreshCampaigns: () => Promise<void>;
  getCampaignForProduct: (productId: string) => CampaignProductInfo | undefined;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns/active', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setActiveCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to load active campaigns context:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        const res = await fetch('/api/campaigns/active', { cache: 'no-store' });
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.campaigns)) {
          setActiveCampaigns(data.campaigns);
        }
      } catch (err) {
        console.error('Failed to load active campaigns context:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadInitial();

    return () => {
      mounted = false;
    };
  }, []);

  const campaignProductMap = useMemo(() => {
    const map = new Map<string, CampaignProductInfo>();
    for (const camp of activeCampaigns) {
      if (camp.status === 'ACTIVE' && Array.isArray(camp.productIds)) {
        for (const pId of camp.productIds) {
          const cleanId = pId.trim().toUpperCase();
          if (!map.has(cleanId)) {
            map.set(cleanId, {
              campaignId: camp.id,
              campaignName: camp.name,
              discountType: camp.discountType,
              discountPercent: camp.discountValue,
            });
          }
        }
      }
    }
    return map;
  }, [activeCampaigns]);

  const getCampaignForProduct = useCallback(
    (productId: string) => {
      if (!productId) return undefined;
      return campaignProductMap.get(productId.trim().toUpperCase());
    },
    [campaignProductMap]
  );

  const value = useMemo(
    () => ({
      activeCampaigns,
      campaignProductMap,
      isLoading,
      refreshCampaigns,
      getCampaignForProduct,
    }),
    [activeCampaigns, campaignProductMap, isLoading, refreshCampaigns, getCampaignForProduct]
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaigns(): CampaignContextType {
  const context = useContext(CampaignContext);
  if (!context) {
    // Return safe fallback if rendered outside provider
    return {
      activeCampaigns: [],
      campaignProductMap: new Map(),
      isLoading: false,
      refreshCampaigns: async () => {},
      getCampaignForProduct: () => undefined,
    };
  }
  return context;
}
