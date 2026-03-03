import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

interface WorldNewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  imageUrl: string;
  publishedAt: string;
  url: string;
}

const FALLBACK_NEWS: WorldNewsItem[] = [
  {
    id: "wn-1",
    title: "Global Markets Rally as Central Banks Signal Rate Stabilization",
    summary: "Major stock indices surged across Asia, Europe, and North America as central bank leaders indicated a pause in interest rate adjustments.",
    category: "Finance",
    source: "Reuters",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    url: "#",
  },
  {
    id: "wn-2",
    title: "AI Regulation Framework Advances in EU Parliament",
    summary: "European lawmakers moved closer to finalizing comprehensive artificial intelligence regulations for responsible AI deployment.",
    category: "Technology",
    source: "AP News",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    url: "#",
  },
  {
    id: "wn-3",
    title: "Renewable Energy Investments Surpass $500B Globally",
    summary: "Clean energy investments reached a historic milestone in 2026, driven by solar and wind projects in developing nations.",
    category: "Energy",
    source: "Bloomberg",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    url: "#",
  },
  {
    id: "wn-4",
    title: "Blockchain Adoption Grows Among Fortune 500 Companies",
    summary: "Over 60% of Fortune 500 companies now use blockchain technology for supply chain management or financial operations.",
    category: "Blockchain",
    source: "CoinDesk",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    url: "#",
  },
  {
    id: "wn-5",
    title: "Space Tourism Sector Sees Record Bookings for 2027",
    summary: "Multiple commercial space companies reported unprecedented demand for orbital and suborbital flights.",
    category: "Science",
    source: "Space.com",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    url: "#",
  },
  {
    id: "wn-6",
    title: "Digital Currency Pilot Programs Expand Across 15 Nations",
    summary: "Central bank digital currency initiatives are accelerating, with fifteen countries now running active pilot programs.",
    category: "Finance",
    source: "Financial Times",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    url: "#",
  },
];

export function useWorldNews() {
  return useQuery<WorldNewsItem[]>({
    queryKey: ["world-news"],
    queryFn: async () => {
      try {
        const baseUrl = getApiUrl();
        const res = await fetch(`${baseUrl}/api/news/world`);
        if (!res.ok) return FALLBACK_NEWS;
        const data = await res.json();
        const news = data.news || FALLBACK_NEWS;
        return news.map((item: WorldNewsItem) => ({
          ...item,
          imageUrl: item.imageUrl && !item.imageUrl.startsWith("http")
            ? new URL(item.imageUrl, baseUrl).toString()
            : item.imageUrl,
        }));
      } catch {
        return FALLBACK_NEWS;
      }
    },
    staleTime: 300000,
  });
}
