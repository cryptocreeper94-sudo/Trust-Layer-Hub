import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

export interface LatestNewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  imageUrl: string;
  publishedAt: string;
  url: string;
}

export function useNationalNews() {
  return useQuery<LatestNewsItem[]>({
    queryKey: ["/api/news/national"],
    queryFn: async () => {
      const url = new URL("/api/news/national", getApiUrl());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`National news fetch failed: ${res.status}`);
      const data = await res.json();
      return data.news || [];
    },
    staleTime: 300000,
    retry: 2,
  });
}

export function useLocalNews(zipCode: string | null) {
  return useQuery<{ news: LatestNewsItem[]; location: { city: string; state: string; stateAbbr: string } | null }>({
    queryKey: ["/api/news/local", zipCode],
    queryFn: async () => {
      if (!zipCode) return { news: [], location: null };
      const url = new URL("/api/news/local", getApiUrl());
      url.searchParams.set("zip", zipCode);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Local news fetch failed: ${res.status}`);
      return await res.json();
    },
    enabled: !!zipCode && /^\d{5}$/.test(zipCode),
    staleTime: 600000,
    retry: 1,
  });
}
