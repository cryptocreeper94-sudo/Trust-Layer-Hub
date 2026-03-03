import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface ExternalWallet {
  id: number;
  address: string;
  chain: string;
  walletType: string;
  label: string;
  lastSynced: string;
  balances?: WalletBalance[];
}

interface WalletBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
}

export function useExternalWallets() {
  return useQuery({
    queryKey: ["external-wallets"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ wallets: ExternalWallet[] }>("/api/wallets");
        return data.wallets || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useConnectWallet() {
  return useMutation({
    mutationFn: async (params: { address: string; chain: string; walletType: string; label?: string }) => {
      return apiPost("/api/wallets/connect", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-wallets"] });
    },
  });
}

export function useDisconnectWallet() {
  return useMutation({
    mutationFn: async (walletId: number) => {
      const { apiRequest } = await import("@/lib/query-client");
      return apiRequest("DELETE", `/api/wallets/${walletId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-wallets"] });
    },
  });
}

export function useWalletBalances(walletId: number | null) {
  return useQuery({
    queryKey: ["wallet-balances", walletId],
    queryFn: async () => {
      if (!walletId) return [];
      try {
        const data = await apiGet<{ balances: WalletBalance[] }>(`/api/wallets/${walletId}/balances`);
        return data.balances || [];
      } catch {
        return [];
      }
    },
    enabled: !!walletId,
    staleTime: 60000,
  });
}
