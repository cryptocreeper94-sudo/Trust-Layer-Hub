import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface SendResult {
  success: boolean;
  message: string;
  txHash: string;
}

interface ReceiveInfo {
  tlidAddress: string;
  hexAddress: string;
  chain: string;
  supportedAssets: string[];
}

interface SwapResult {
  success: boolean;
  message: string;
  fromAsset: string;
  toAsset: string;
  inputAmount: number;
  outputAmount: number;
  rate: number;
  txHash: string;
}

export function useSendTokens() {
  return useMutation({
    mutationFn: async (params: { to: string; amount: number; asset: string }) => {
      return apiPost<SendResult>("/api/wallet/send", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["shell-balance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useReceiveInfo() {
  return useQuery({
    queryKey: ["wallet-receive"],
    queryFn: async () => {
      try {
        return await apiGet<ReceiveInfo>("/api/wallet/receive");
      } catch {
        return null;
      }
    },
    staleTime: 300000,
  });
}

export function useSwapTokens() {
  return useMutation({
    mutationFn: async (params: { fromAsset: string; toAsset: string; amount: number }) => {
      return apiPost<SwapResult>("/api/wallet/swap", params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["shell-balance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
