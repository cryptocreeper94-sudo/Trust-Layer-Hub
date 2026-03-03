import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface WalletToken {
  symbol: string;
  balance: string;
  usd: string;
}

interface WalletBalances {
  native: string;
  usd: string;
  tokens: WalletToken[];
}

export interface ExternalWallet {
  id: number;
  address: string;
  chain: string;
  walletType: string;
  label: string;
  lastSynced: string;
  balances?: WalletBalances;
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

export function getExternalWalletsTotalUsd(wallets: ExternalWallet[]): number {
  return wallets.reduce((sum, w) => {
    if (!w.balances) return sum;
    const nativeUsd = parseFloat(w.balances.usd.replace(/,/g, "")) || 0;
    const tokenUsd = (w.balances.tokens || []).reduce(
      (t, tok) => t + (parseFloat(tok.usd.replace(/,/g, "")) || 0),
      0
    );
    return sum + nativeUsd + tokenUsd;
  }, 0);
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
      if (!walletId) return null;
      try {
        const data = await apiGet<{ balances: WalletBalances }>(`/api/wallets/${walletId}/balances`);
        return data.balances || null;
      } catch {
        return null;
      }
    },
    enabled: !!walletId,
    staleTime: 60000,
  });
}
