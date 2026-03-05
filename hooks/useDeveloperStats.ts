import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface SystemInfo {
  uptime: string;
  uptimeMs: number;
  bootTime: string;
  nodeVersion: string;
  env: string;
  memoryMB: number;
}

interface DatabaseStats {
  users: number;
  activeSessions: number;
  hallmarks: number;
  trustStamps: number;
  chatChannels: number;
  chatMessages: number;
  linkedAccounts: number;
  stripeConnections: number;
}

interface BlockchainInfo {
  status: string;
  blockTime?: string;
  tps?: number;
  lastBlock?: string;
  totalAccounts?: number;
  consensus?: string;
  chainId?: string;
  isTestnet?: boolean;
}

interface PulseInfo {
  status: string;
  activeSignals?: number;
  sentiment?: string;
  sentimentScore?: number;
  accuracy?: number;
  totalPredictions?: number;
}

interface EndpointInfo {
  method: string;
  path: string;
  auth: boolean;
  desc: string;
}

interface EndpointsInfo {
  total: number;
  public: number;
  authenticated: number;
  list: EndpointInfo[];
}

interface HealthChecks {
  status: string;
  checks: Record<string, string>;
}

interface DeveloperStats {
  system: SystemInfo;
  database: DatabaseStats;
  blockchain: BlockchainInfo;
  pulse: PulseInfo;
  endpoints: EndpointsInfo;
}

const EMPTY_STATS: DeveloperStats = {
  system: { uptime: "--", uptimeMs: 0, bootTime: "", nodeVersion: "--", env: "--", memoryMB: 0 },
  database: { users: 0, activeSessions: 0, hallmarks: 0, trustStamps: 0, chatChannels: 0, chatMessages: 0, linkedAccounts: 0, stripeConnections: 0 },
  blockchain: { status: "unknown" },
  pulse: { status: "unknown" },
  endpoints: { total: 0, public: 0, authenticated: 0, list: [] },
};

const EMPTY_HEALTH: HealthChecks = {
  status: "unknown",
  checks: { server: "unknown", database: "unknown", blockchain: "unknown", pulse: "unknown" },
};

export function useDeveloperStats() {
  return useQuery<DeveloperStats>({
    queryKey: ["/api/developer/stats"],
    refetchInterval: 60000,
    placeholderData: EMPTY_STATS,
  });
}

export function useDeveloperHealth() {
  return useQuery<HealthChecks>({
    queryKey: ["/api/developer/health"],
    refetchInterval: 30000,
    placeholderData: EMPTY_HEALTH,
  });
}
