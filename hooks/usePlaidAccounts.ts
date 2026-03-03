import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface LinkedAccount {
  id: number;
  institutionName: string;
  accountType: string;
  accountSubtype: string;
  accountMask: string;
  balance: string;
  currency: string;
  lastSynced: string;
}

interface PlaidLinkToken {
  linkToken: string;
}

export function usePlaidAccounts() {
  return useQuery({
    queryKey: ["plaid-accounts"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ accounts: LinkedAccount[] }>("/api/plaid/accounts");
        return data.accounts || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });
}

export function useCreateLinkToken() {
  return useMutation({
    mutationFn: async () => {
      return apiPost<PlaidLinkToken>("/api/plaid/create-link-token", {});
    },
  });
}

export function useExchangePlaidToken() {
  return useMutation({
    mutationFn: async (publicToken: string) => {
      return apiPost("/api/plaid/exchange-token", { publicToken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plaid-accounts"] });
    },
  });
}

export function useUnlinkAccount() {
  return useMutation({
    mutationFn: async (accountId: number) => {
      const { apiRequest } = await import("@/lib/query-client");
      return apiRequest("DELETE", `/api/plaid/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plaid-accounts"] });
    },
  });
}

export function usePlaidTransactions(accountId: number | null) {
  return useQuery({
    queryKey: ["plaid-transactions", accountId],
    queryFn: async () => {
      if (!accountId) return [];
      try {
        const data = await apiGet<{ transactions: any[] }>(`/api/plaid/transactions/${accountId}`);
        return data.transactions || [];
      } catch {
        return [];
      }
    },
    enabled: !!accountId,
    staleTime: 60000,
  });
}
