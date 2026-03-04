import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface BalanceData {
  totalTokens: number;
  presaleTokens: number;
  stakedTokens: number;
  liquidTokens: number;
}

interface ShellBalance {
  balance: number;
}

interface DwcBag {
  totalDwc: number;
  currentValue: number;
  launchProjectedValue: number;
  sources: {
    presale: number;
    shells: number;
    airdrops: number;
    earlyAdopterBonus: number;
  };
}

interface RewardProfile {
  profile: { tier: string; multiplier: number; totalQuestsCompleted: number };
  shellBalance: number;
  tiers: unknown[];
  conversion: { rate: number; tgeDate: string };
}

interface Transaction {
  id: string;
  type: string;
  title?: string;
  amount: number;
  tokenAmount?: number;
  txHash?: string;
  status?: string;
  date?: string;
  asset?: string;
  from?: string;
  createdAt?: string;
}

export function useBalance() {
  return useQuery({
    queryKey: ["balance"],
    queryFn: async () => {
      try {
        const data = await apiGet<BalanceData>("/api/balance");
        return {
          sig: data.totalTokens || 0,
          stSig: data.stakedTokens || 0,
          liquid: data.liquidTokens || 0,
          presale: data.presaleTokens || 0,
        };
      } catch {
        return { sig: 0, stSig: 0, liquid: 0, presale: 0 };
      }
    },
    staleTime: 30000,
  });
}

export function useShellBalance() {
  return useQuery({
    queryKey: ["shell-balance"],
    queryFn: async () => {
      try {
        const data = await apiGet<ShellBalance>("/api/shells/my-balance");
        return data.balance || 0;
      } catch {
        return 0;
      }
    },
    staleTime: 30000,
  });
}

export function useDwcBag() {
  return useQuery({
    queryKey: ["dwc-bag"],
    queryFn: async () => {
      try {
        return await apiGet<DwcBag>("/api/user/dwc-bag");
      } catch {
        return {
          totalDwc: 0,
          currentValue: 0,
          launchProjectedValue: 0,
          sources: { presale: 0, shells: 0, airdrops: 0, earlyAdopterBonus: 0 },
        };
      }
    },
    staleTime: 30000,
  });
}

export function useRewardProfile() {
  return useQuery({
    queryKey: ["reward-profile"],
    queryFn: async () => {
      try {
        return await apiGet<RewardProfile>("/api/user/reward-profile");
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ transactions: Transaction[] }>("/api/user/transactions");
        if (!data?.transactions || !Array.isArray(data.transactions)) {
          return [];
        }
        return data.transactions.map(tx => ({
          id: tx.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: tx.type || "received",
          amount: tx.amount || tx.tokenAmount || 0,
          asset: tx.asset || "SIG",
          from: tx.title || tx.from || "",
          txHash: tx.txHash || "",
          createdAt: tx.date || tx.createdAt || new Date().toISOString(),
        }));
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}
