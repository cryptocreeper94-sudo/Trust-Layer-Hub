import type { Express, Request, Response } from "express";
import { XMLParser } from "fast-xml-parser";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  imageUrl: string;
  publishedAt: string;
  url: string;
}

interface RSSFeedConfig {
  url: string;
  source: string;
  category: string;
}

const NATIONAL_FEEDS: RSSFeedConfig[] = [
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", source: "NYT Business", category: "Finance" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", source: "NYT Tech", category: "Technology" },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC Tech", category: "Technology" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business", category: "Finance" },
  { url: "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular", source: "CryptoCompare", category: "Crypto" },
];

const WORLD_FEEDS: RSSFeedConfig[] = [
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", source: "New York Times", category: "World" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml", source: "BBC News", category: "World" },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science", category: "Science" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", source: "NYT World", category: "World" },
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

interface NewsCache {
  items: NewsItem[];
  fetchedAt: number;
}

const cache: Record<string, NewsCache> = {
  national: { items: [], fetchedAt: 0 },
  world: { items: [], fetchedAt: 0 },
};
const localCache: Record<string, NewsCache> = {};
const CACHE_TTL = 10 * 60 * 1000;
const LOCAL_CACHE_TTL = 15 * 60 * 1000;
let refreshPromises: Record<string, Promise<void>> = {};

function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function extractMediaUrl(item: any): string {
  if (item["media:thumbnail"]?.["@_url"]) return item["media:thumbnail"]["@_url"];
  if (item["media:content"]?.["@_url"]) return item["media:content"]["@_url"];
  if (Array.isArray(item["media:content"])) {
    const img = item["media:content"].find((m: any) => m["@_medium"] === "image" || m["@_url"]?.match(/\.(jpg|png|webp)/i));
    if (img) return img["@_url"] || "";
  }
  if (item["media:group"]?.["media:content"]?.["@_url"]) return item["media:group"]["media:content"]["@_url"];
  return "";
}

function extractImageFromContent(content: string): string {
  if (!content) return "";
  const match = content.match(/src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i);
  return match ? match[1] : "";
}

function mapCategory(itemCategory: string | undefined, defaultCat: string): string {
  if (!itemCategory) return defaultCat;
  const lower = itemCategory.toLowerCase();
  if (lower.includes("tech")) return "Technology";
  if (lower.includes("business") || lower.includes("econom") || lower.includes("financ")) return "Finance";
  if (lower.includes("science") || lower.includes("health")) return "Science";
  if (lower.includes("sport")) return "Sports";
  if (lower.includes("politic")) return "Politics";
  if (lower.includes("climate") || lower.includes("environ")) return "Environment";
  if (lower.includes("entertainment") || lower.includes("arts")) return "Entertainment";
  return defaultCat;
}

async function fetchRSSFeed(config: RSSFeedConfig, prefix: string, maxItems = 8): Promise<NewsItem[]> {
  try {
    if (config.source === "CryptoCompare") return await fetchCryptoNews(config, prefix);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(config.url, {
      signal: controller.signal,
      headers: { "User-Agent": "TrustLayerHub/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

    return items.slice(0, maxItems).map((item: any, idx: number) => {
      const title = stripHtml(typeof item.title === "string" ? item.title : item.title?.["#text"] || "");
      const desc = stripHtml(typeof item.description === "string" ? item.description : item.description?.["#text"] || "");
      const imageUrl = extractMediaUrl(item) || extractImageFromContent(item["content:encoded"] || item.description || "");

      let pubDate = item.pubDate || item["dc:date"] || "";
      let publishedAt: string;
      try { publishedAt = new Date(pubDate).toISOString(); }
      catch { publishedAt = new Date().toISOString(); }

      const rawCat = Array.isArray(item.category) ? item.category[0] : item.category;
      const catStr = typeof rawCat === "string" ? rawCat : rawCat?.["#text"] || "";
      const itemCategory = mapCategory(catStr, config.category);

      return {
        id: `${prefix}-${config.source.replace(/\s/g, "").toLowerCase()}-${idx}`,
        title,
        summary: desc.length > 200 ? desc.substring(0, 200).replace(/\s+\S*$/, "") + "..." : desc,
        category: itemCategory,
        source: config.source,
        imageUrl,
        publishedAt,
        url: item.link || item.guid || "#",
      };
    }).filter((item: NewsItem) => item.title.length > 0);
  } catch (err) {
    console.error(`RSS fetch error (${config.source}):`, err instanceof Error ? err.message : err);
    return [];
  }
}

async function fetchCryptoNews(config: RSSFeedConfig, prefix: string): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(config.url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = await res.json();
    const articles = data.Data || [];

    return articles.slice(0, 8).map((article: any) => {
      const cats = (article.categories || "").toLowerCase();
      let category = "Crypto";
      if (cats.includes("blockchain")) category = "Blockchain";
      else if (cats.includes("defi")) category = "DeFi";
      else if (cats.includes("bitcoin")) category = "Bitcoin";
      else if (cats.includes("ethereum")) category = "Ethereum";
      else if (cats.includes("regulation")) category = "Regulation";
      else if (cats.includes("exchange")) category = "Exchange";
      else if (cats.includes("market")) category = "Markets";

      return {
        id: `${prefix}-cc-${article.id}`,
        title: article.title || "",
        summary: (article.body || "").length > 200
          ? article.body.substring(0, 200).replace(/\s+\S*$/, "") + "..."
          : article.body || "",
        category,
        source: article.source || "CryptoCompare",
        imageUrl: article.imageurl || "",
        publishedAt: new Date((article.published_on || 0) * 1000).toISOString(),
        url: article.url || "#",
      };
    }).filter((item: NewsItem) => item.title.length > 0);
  } catch (err) {
    console.error("CryptoCompare fetch error:", err instanceof Error ? err.message : err);
    return [];
  }
}

function interleaveByCategory(items: NewsItem[], limit: number): NewsItem[] {
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    const key = item.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const cryptoCats = new Set(["Crypto", "Bitcoin", "Ethereum", "DeFi", "Blockchain", "Exchange", "Markets", "Regulation"]);
  const crypto = deduped.filter(i => cryptoCats.has(i.category));
  const general = deduped.filter(i => !cryptoCats.has(i.category));

  const result: NewsItem[] = [];
  let ci = 0, gi = 0;
  while (result.length < limit && (ci < crypto.length || gi < general.length)) {
    if (gi < general.length) result.push(general[gi++]);
    if (ci < crypto.length && result.length < limit) result.push(crypto[ci++]);
    if (gi < general.length && result.length < limit) result.push(general[gi++]);
  }
  return result;
}

async function refreshCategory(category: "national" | "world"): Promise<void> {
  const now = Date.now();
  const c = cache[category];
  if (now - c.fetchedAt < CACHE_TTL && c.items.length > 0) return;
  if (refreshPromises[category]) return refreshPromises[category];

  const feeds = category === "national" ? NATIONAL_FEEDS : WORLD_FEEDS;
  const prefix = category === "national" ? "nat" : "wld";

  refreshPromises[category] = (async () => {
    console.log(`[News] Fetching ${category} from ${feeds.length} sources...`);
    const results = await Promise.allSettled(feeds.map(f => fetchRSSFeed(f, prefix)));

    const allItems: NewsItem[] = [];
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        console.log(`[News] ${feeds[idx].source}: ${result.value.length} items`);
        allItems.push(...result.value);
      } else {
        console.log(`[News] ${feeds[idx].source}: FAILED`);
      }
    });

    allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const limit = category === "national" ? 15 : 20;
    cache[category] = {
      items: category === "national" ? interleaveByCategory(allItems, limit) : dedupe(allItems, limit),
      fetchedAt: Date.now(),
    };
    console.log(`[News] ${category}: ${cache[category].items.length} articles cached`);
  })();

  try { await refreshPromises[category]; }
  finally { delete refreshPromises[category]; }
}

function dedupe(items: NewsItem[], limit: number): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

interface ZipLocation {
  city: string;
  state: string;
  stateAbbr: string;
  lat: string;
  lng: string;
}

async function lookupZip(zipCode: string): Promise<ZipLocation | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return null;
    return {
      city: place["place name"],
      state: place.state,
      stateAbbr: place["state abbreviation"],
      lat: place.latitude,
      lng: place.longitude,
    };
  } catch {
    return null;
  }
}

async function fetchLocalNews(location: ZipLocation): Promise<NewsItem[]> {
  const cacheKey = `${location.city}-${location.stateAbbr}`.toLowerCase();
  const cached = localCache[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < LOCAL_CACHE_TTL && cached.items.length > 0) {
    return cached.items;
  }

  const searchQuery = encodeURIComponent(`${location.city} ${location.stateAbbr}`);
  const googleNewsUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;

  try {
    console.log(`[News] Fetching local news for ${location.city}, ${location.stateAbbr}...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(googleNewsUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "TrustLayerHub/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

    const news = items.slice(0, 12).map((item: any, idx: number) => {
      const rawTitle = typeof item.title === "string" ? item.title : item.title?.["#text"] || "";
      const parts = rawTitle.split(" - ");
      const source = parts.length > 1 ? parts[parts.length - 1].trim() : "Local News";
      const title = parts.length > 1 ? parts.slice(0, -1).join(" - ").trim() : rawTitle;

      let pubDate = item.pubDate || "";
      let publishedAt: string;
      try { publishedAt = new Date(pubDate).toISOString(); }
      catch { publishedAt = new Date().toISOString(); }

      return {
        id: `local-${idx}`,
        title: stripHtml(title),
        summary: stripHtml(typeof item.description === "string" ? item.description : item.description?.["#text"] || title),
        category: "Local",
        source,
        imageUrl: "",
        publishedAt,
        url: item.link || "#",
      };
    }).filter((item: NewsItem) => item.title.length > 0);

    localCache[cacheKey] = { items: news, fetchedAt: Date.now() };
    console.log(`[News] Local (${location.city}): ${news.length} articles`);
    return news;
  } catch (err) {
    console.error(`Local news fetch error:`, err instanceof Error ? err.message : err);
    return localCache[cacheKey]?.items || [];
  }
}

export function registerNewsRoutes(app: Express): void {
  refreshCategory("national").catch(console.error);
  refreshCategory("world").catch(console.error);

  app.get("/api/news/national", async (_req: Request, res: Response) => {
    try {
      await refreshCategory("national");
      res.json({ news: cache.national.items });
    } catch {
      res.json({ news: [] });
    }
  });

  app.get("/api/news/world", async (_req: Request, res: Response) => {
    try {
      await refreshCategory("world");
      res.json({ news: cache.world.items });
    } catch {
      res.json({ news: [] });
    }
  });

  app.get("/api/news/local", async (req: Request, res: Response) => {
    const zip = (req.query.zip as string || "").trim();
    if (!zip || !/^\d{5}$/.test(zip)) {
      res.status(400).json({ error: "Valid 5-digit US zip code required", news: [] });
      return;
    }

    try {
      const location = await lookupZip(zip);
      if (!location) {
        res.status(404).json({ error: "Zip code not found", news: [] });
        return;
      }

      const news = await fetchLocalNews(location);
      res.json({
        news,
        location: { city: location.city, state: location.state, stateAbbr: location.stateAbbr },
      });
    } catch {
      res.json({ news: [], location: null });
    }
  });

  app.get("/api/news/zip-lookup", async (req: Request, res: Response) => {
    const zip = (req.query.zip as string || "").trim();
    if (!zip || !/^\d{5}$/.test(zip)) {
      res.status(400).json({ error: "Valid 5-digit US zip code required" });
      return;
    }

    try {
      const location = await lookupZip(zip);
      if (!location) {
        res.status(404).json({ error: "Zip code not found" });
        return;
      }
      res.json({ location });
    } catch {
      res.status(500).json({ error: "Lookup failed" });
    }
  });
}
