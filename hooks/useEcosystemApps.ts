import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ECOSYSTEM_APPS } from "@/constants/ecosystem-apps";

interface ApiApp {
  id: number | string;
  name: string;
  category: string;
  description: string;
  hook: string;
  tags: string[];
  gradient?: string;
  verified?: boolean;
  featured?: boolean;
  users?: number;
  url: string;
}

export function useEcosystemApps() {
  return useQuery({
    queryKey: ["ecosystem-apps"],
    queryFn: async () => {
      try {
        const data = await apiGet<ApiApp[]>("/api/ecosystem/apps", false);
        if (data && data.length > 0) {
          return data;
        }
        return ECOSYSTEM_APPS;
      } catch {
        return ECOSYSTEM_APPS;
      }
    },
    staleTime: 300000,
  });
}
