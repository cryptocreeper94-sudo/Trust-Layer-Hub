import type { Express, Request, Response } from "express";

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

const CURATED_NEWS: WorldNewsItem[] = [
  {
    id: "wn-1",
    title: "Global Markets Rally as Central Banks Signal Rate Stabilization",
    summary: "Major stock indices surged across Asia, Europe, and North America as central bank leaders indicated a pause in interest rate adjustments, boosting investor confidence in economic stability.",
    category: "Finance",
    source: "Reuters",
    imageUrl: "/assets/images/stock/world-news-1.jpg",
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    url: "#",
  },
  {
    id: "wn-2",
    title: "AI Regulation Framework Advances in EU Parliament",
    summary: "European lawmakers moved closer to finalizing comprehensive artificial intelligence regulations, establishing guidelines for responsible AI deployment across member states.",
    category: "Technology",
    source: "AP News",
    imageUrl: "/assets/images/stock/world-news-2.jpg",
    publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    url: "#",
  },
  {
    id: "wn-3",
    title: "Renewable Energy Investments Surpass $500B Globally",
    summary: "Clean energy investments reached a historic milestone in 2026, driven by solar and wind projects in developing nations, according to the International Energy Agency's latest report.",
    category: "Energy",
    source: "Bloomberg",
    imageUrl: "/assets/images/stock/world-news-3.jpg",
    publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    url: "#",
  },
  {
    id: "wn-4",
    title: "Blockchain Adoption Grows Among Fortune 500 Companies",
    summary: "A new survey reveals that over 60% of Fortune 500 companies now use blockchain technology for supply chain management, digital identity, or financial operations.",
    category: "Blockchain",
    source: "CoinDesk",
    imageUrl: "/assets/images/stock/world-news-4.jpg",
    publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    url: "#",
  },
  {
    id: "wn-5",
    title: "Space Tourism Sector Sees Record Bookings for 2027",
    summary: "Multiple commercial space companies reported unprecedented demand for orbital and suborbital flights, with waitlists extending into late 2027 for premium experiences.",
    category: "Science",
    source: "Space.com",
    imageUrl: "/assets/images/stock/world-news-5.jpg",
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    url: "#",
  },
  {
    id: "wn-6",
    title: "Digital Currency Pilot Programs Expand Across 15 Nations",
    summary: "Central bank digital currency initiatives are accelerating, with fifteen countries now running active pilot programs involving millions of citizens in real-world transactions.",
    category: "Finance",
    source: "Financial Times",
    imageUrl: "/assets/images/stock/world-news-6.jpg",
    publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    url: "#",
  },
];

export function registerNewsRoutes(app: Express): void {
  app.get("/api/news/world", (_req: Request, res: Response) => {
    const news = CURATED_NEWS.map((item) => ({
      ...item,
      publishedAt: new Date(Date.now() - Math.random() * 24 * 3600000).toISOString(),
    }));
    res.json({ news });
  });
}
