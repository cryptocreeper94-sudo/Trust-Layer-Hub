import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface PublicProfile {
  username: string;
  firstName: string | null;
  tlid: string;
  memberSince: string;
  emailVerified: boolean;
  hallmarkCount: number;
  stampCount: number;
  referralCount: number;
  affiliateTier: string;
}

export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      try {
        return await apiGet<PublicProfile>(`/api/users/${username}/public`, false);
      } catch {
        return null;
      }
    },
    enabled: !!username,
    staleTime: 60000,
  });
}
