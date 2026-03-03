import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface TimelineEntry {
  type: "hallmark" | "stamp";
  identifier: string;
  category: string;
  detail: string | null;
  dataHash: string;
  createdAt: string;
}

interface TimelineData {
  timeline: TimelineEntry[];
}

const FALLBACK: TimelineData = { timeline: [] };

export function useHallmarkTimeline() {
  return useQuery({
    queryKey: ["hallmark-timeline"],
    queryFn: async () => {
      try {
        return await apiGet<TimelineData>("/api/hallmarks/timeline");
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 30000,
  });
}
