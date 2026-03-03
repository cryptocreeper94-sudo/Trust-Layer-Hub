import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface Membership {
  trustLayerId: string;
  membershipStatus: string;
  membershipType: string;
}

interface SubscriptionStatus {
  tier: string;
  active: boolean;
  features: string[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

interface VoidStats {
  totalVoidIds: number;
  totalStamps: number;
  totalBridgeLinks: number;
}

interface PresaleStats {
  totalSold: number;
  totalRaised: number;
}

export function useMembership() {
  return useQuery({
    queryKey: ["membership"],
    queryFn: async () => {
      try {
        return await apiGet<Membership>("/api/user/membership");
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });
}

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      try {
        return await apiGet<SubscriptionStatus>("/api/subscription/status");
      } catch {
        return { tier: "free", active: false, features: [] };
      }
    },
    staleTime: 60000,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      try {
        return await apiGet<SubscriptionPlan[]>("/api/subscription/plans", false);
      } catch {
        return [];
      }
    },
    staleTime: 300000,
  });
}

export function useVoidStats() {
  return useQuery({
    queryKey: ["void-stats"],
    queryFn: async () => {
      try {
        return await apiGet<VoidStats>("/api/void/stats", false);
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });
}

export function usePresaleStats() {
  return useQuery({
    queryKey: ["presale-stats"],
    queryFn: async () => {
      try {
        return await apiGet<PresaleStats>("/api/presale/stats", false);
      } catch {
        return { totalSold: 0, totalRaised: 0 };
      }
    },
    staleTime: 60000,
  });
}
