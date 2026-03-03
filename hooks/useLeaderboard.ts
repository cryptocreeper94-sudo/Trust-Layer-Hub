import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface LeaderboardEntry {
  rank: number;
  username: string;
  memberSince: string;
}

interface AffiliateEntry extends LeaderboardEntry {
  convertedReferrals: number;
  tier: string;
}

interface StakerEntry extends LeaderboardEntry {
  stakeActions: number;
}

interface ActiveEntry extends LeaderboardEntry {
  stampCount: number;
}

interface LeaderboardData {
  topAffiliates: AffiliateEntry[];
  topStakers: StakerEntry[];
  mostActive: ActiveEntry[];
}

const FALLBACK: LeaderboardData = {
  topAffiliates: [],
  topStakers: [],
  mostActive: [],
};

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      try {
        return await apiGet<LeaderboardData>("/api/leaderboard", false);
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 60000,
  });
}
