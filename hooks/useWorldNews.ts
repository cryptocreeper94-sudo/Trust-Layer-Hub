import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

export interface WorldNewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  imageUrl: string;
  publishedAt: string;
  url: string;
}

export function useWorldNews() {
  return useQuery<WorldNewsItem[]>({
    queryKey: ["/api/news/world"],
    queryFn: async () => {
      const url = new URL("/api/news/world", getApiUrl());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`World news fetch failed: ${res.status}`);
      const data = await res.json();
      return data.news || [];
    },
    staleTime: 300000,
    retry: 2,
  });
}
