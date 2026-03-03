import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import { apiGet } from "@/lib/api";

interface CoSigner {
  address: string;
  label: string;
  userId?: number;
  email?: string;
}

export interface MultisigVault {
  id: number;
  vaultName: string;
  threshold: number;
  coSigners: CoSigner[];
  createdAt: string;
}

interface SignatureEntry {
  userId: number;
  action: "approve" | "reject";
  timestamp: string;
}

export interface MultisigTransaction {
  id: number;
  vaultId: number;
  amount: string;
  destination: string;
  description: string;
  status: string;
  signatures: SignatureEntry[];
  createdAt: string;
}

export function useMultisigVault() {
  return useQuery<MultisigVault | null>({
    queryKey: ["/api/multisig/vault"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ vault: MultisigVault | null }>("/api/multisig/vault");
        return data.vault || null;
      } catch {
        return null;
      }
    },
  });
}

export function useMultisigPending() {
  return useQuery<MultisigTransaction[]>({
    queryKey: ["/api/multisig/pending"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ transactions: MultisigTransaction[] }>("/api/multisig/pending");
        return data.transactions || [];
      } catch {
        return [];
      }
    },
  });
}

export function useMultisigHistory() {
  return useQuery<MultisigTransaction[]>({
    queryKey: ["/api/multisig/history"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ transactions: MultisigTransaction[] }>("/api/multisig/history");
        return data.transactions || [];
      } catch {
        return [];
      }
    },
  });
}

export function useApproveTransaction() {
  return useMutation({
    mutationFn: async (txId: number) => {
      const res = await apiRequest("POST", `/api/multisig/approve/${txId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/multisig/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multisig/history"] });
    },
  });
}

export function useRejectTransaction() {
  return useMutation({
    mutationFn: async (txId: number) => {
      const res = await apiRequest("POST", `/api/multisig/reject/${txId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/multisig/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/multisig/history"] });
    },
  });
}
