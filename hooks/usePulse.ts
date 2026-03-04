import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface PulseSignal {
  asset: string;
  direction: string;
  confidence: number;
  timeframe: string;
  price: number;
  change24h: number;
}

interface PulseSummary {
  available: boolean;
  topSignals: PulseSignal[];
  marketSentiment: string;
  sentimentScore: number;
  activeSignals: number;
  totalPredictions: number;
  predictionAccuracy: number;
  lastUpdated: string | null;
}

interface PulseStats {
  available: boolean;
  totalPredictions: number;
  accuracy: number;
  last30dAccuracy: number;
  profitableTrades?: number;
  avgReturnPerTrade?: number;
}

const EMPTY_SUMMARY: PulseSummary = {
  available: false,
  topSignals: [],
  marketSentiment: "neutral",
  sentimentScore: 50,
  activeSignals: 0,
  totalPredictions: 0,
  predictionAccuracy: 0,
  lastUpdated: null,
};

export function usePulseSummary() {
  return useQuery({
    queryKey: ["pulse-summary"],
    queryFn: async () => {
      try {
        return await apiGet<PulseSummary>("/api/pulse/summary");
      } catch {
        return EMPTY_SUMMARY;
      }
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });
}

export function usePulseStats() {
  return useQuery({
    queryKey: ["pulse-stats"],
    queryFn: async () => {
      try {
        return await apiGet<PulseStats>("/api/pulse/stats");
      } catch {
        return { available: false, totalPredictions: 0, accuracy: 0, last30dAccuracy: 0 };
      }
    },
    staleTime: 60000,
  });
}
