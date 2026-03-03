import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface FeedEvent {
  category: string;
  user: string;
  description: string;
  timeAgo: string;
  timestamp: string;
}

interface ActivityFeedData {
  events: FeedEvent[];
}

const FALLBACK: ActivityFeedData = { events: [] };

export function useActivityFeed() {
  return useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      try {
        return await apiGet<ActivityFeedData>("/api/activity/feed", false);
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 30000,
  });
}
