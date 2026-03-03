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

const FALLBACK_STAKING: StakingInfo = {
  apy: 12.5,
  cooldownDays: 7,
  totalStaked: 50000,
  rewardsEarned: 1562.5,
  monthlyRewardEstimate: 520.83,
  yearlyRewardEstimate: 6250,
  stakedRatio: 0.397,
  cooldownActive: false,
  cooldownRemaining: 0,
  cooldownAmount: 0,
};

export function useStakingInfo() {
  return useQuery({
    queryKey: ["staking-info"],
    queryFn: async () => {
      try {
        return await apiGet<StakingInfo>("/api/staking/info");
      } catch {
        return FALLBACK_STAKING;
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
