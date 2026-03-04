import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface StakingInfo {
  apy: number;
  cooldownDays: number;
  totalStaked: number;
  rewardsEarned: number;
  monthlyRewardEstimate: number;
  yearlyRewardEstimate: number;
  stakedRatio: number;
  cooldownActive: boolean;
  cooldownRemaining: number;
  cooldownAmount: number;
}

export function useStakingInfo() {
  return useQuery({
    queryKey: ["staking-info"],
    queryFn: async () => {
      try {
        return await apiGet<StakingInfo>("/api/staking/info");
      } catch {
        return {
          apy: 0,
          cooldownDays: 7,
          totalStaked: 0,
          rewardsEarned: 0,
          monthlyRewardEstimate: 0,
          yearlyRewardEstimate: 0,
          stakedRatio: 0,
          cooldownActive: false,
          cooldownRemaining: 0,
          cooldownAmount: 0,
        };
      }
    },
    staleTime: 30000,
  });
}

export function useStake() {
  return useMutation({
    mutationFn: async (amount: number) => {
      return apiPost<{ success: boolean; message: string; txHash: string }>("/api/staking/stake", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["staking-info"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUnstake() {
  return useMutation({
    mutationFn: async (amount: number) => {
      return apiPost<{ success: boolean; message: string; cooldownDays: number; availableDate: string }>("/api/staking/unstake", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["staking-info"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
