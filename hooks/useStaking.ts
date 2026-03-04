import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/query-client";

interface StakingPool {
  id: string;
  name: string;
  lockDays: number;
  baseApy: number;
  boostApy: number;
  totalApy: number;
  minStake: number;
}

interface ActiveStake {
  poolId: string;
  poolName: string;
  amount: number;
  apy: number;
  lockDays: number;
  stakedAt: string;
  rewards: number;
  unlockDate: string | null;
  isLocked: boolean;
}

interface StakingInfo {
  apy: number;
  pools: StakingPool[];
  activeStakes: ActiveStake[];
  totalStaked: number;
  rewardsEarned: number;
  monthlyRewardEstimate: number;
  yearlyRewardEstimate: number;
  stakedRatio: number;
  cooldownActive: boolean;
  cooldownRemaining: number;
  cooldownAmount: number;
  cooldownDays: number;
}

interface StakingStats {
  tvl: number;
  averageApy: number;
  totalStakers: number;
  pools: number;
}

const EMPTY_STAKING: StakingInfo = {
  apy: 10,
  pools: [
    { id: "liquid-flex", name: "Liquid Flex", lockDays: 0, baseApy: 10, boostApy: 2, totalApy: 12, minStake: 100 },
    { id: "core-guard-45", name: "Core Guard 45", lockDays: 45, baseApy: 14, boostApy: 3, totalApy: 17, minStake: 500 },
    { id: "core-guard-90", name: "Core Guard 90", lockDays: 90, baseApy: 18, boostApy: 4, totalApy: 22, minStake: 1000 },
    { id: "core-guard-180", name: "Core Guard 180", lockDays: 180, baseApy: 24, boostApy: 5, totalApy: 29, minStake: 2500 },
    { id: "founders-forge", name: "Founders Forge", lockDays: 365, baseApy: 30, boostApy: 8, totalApy: 38, minStake: 5000 },
  ],
  activeStakes: [],
  totalStaked: 0,
  rewardsEarned: 0,
  monthlyRewardEstimate: 0,
  yearlyRewardEstimate: 0,
  stakedRatio: 0,
  cooldownActive: false,
  cooldownRemaining: 0,
  cooldownAmount: 0,
  cooldownDays: 0,
};

export function useStakingInfo() {
  return useQuery({
    queryKey: ["staking-info"],
    queryFn: async () => {
      try {
        return await apiGet<StakingInfo>("/api/staking/info");
      } catch {
        return EMPTY_STAKING;
      }
    },
    staleTime: 30000,
  });
}

export function useStakingPools() {
  return useQuery({
    queryKey: ["staking-pools"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ pools: StakingPool[] }>("/api/staking/pools");
        return data.pools || EMPTY_STAKING.pools;
      } catch {
        return EMPTY_STAKING.pools;
      }
    },
    staleTime: 60000,
  });
}

export function useStakingStats() {
  return useQuery({
    queryKey: ["staking-stats"],
    queryFn: async () => {
      try {
        return await apiGet<StakingStats>("/api/staking/stats");
      } catch {
        return { tvl: 0, averageApy: 0, totalStakers: 0, pools: 5 };
      }
    },
    staleTime: 30000,
  });
}

export function useStake() {
  return useMutation({
    mutationFn: async ({ amount, poolId }: { amount: number; poolId?: string }) => {
      return apiPost<{ success: boolean; message: string; txHash: string; pool: { id: string; name: string; apy: number; lockDays: number } }>("/api/staking/stake", { amount, poolId: poolId || "liquid-flex" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["staking-info"] });
      queryClient.invalidateQueries({ queryKey: ["staking-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUnstake() {
  return useMutation({
    mutationFn: async ({ amount, poolId }: { amount: number; poolId?: string }) => {
      return apiPost<{ success: boolean; message: string; cooldownDays: number; availableDate: string }>("/api/staking/unstake", { amount, poolId: poolId || "liquid-flex" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["staking-info"] });
      queryClient.invalidateQueries({ queryKey: ["staking-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useLiquidStake() {
  return useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      return apiPost<{ success: boolean; message: string; stSigReceived: number; rate: number; txHash: string }>("/api/liquid-staking/stake", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["staking-info"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useLiquidUnstake() {
  return useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      return apiPost<{ success: boolean; message: string; sigRedeemed: number; rate: number; txHash: string }>("/api/liquid-staking/unstake", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["staking-info"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useClaimRewards() {
  return useMutation({
    mutationFn: async () => {
      return apiPost<{ success: boolean; message: string; amount: number; txHash: string }>("/api/staking/claim", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["staking-info"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
