import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

export function useAffiliateDashboard() {
  return useQuery({
    queryKey: ["/api/affiliate/dashboard"],
  });
}

export function useAffiliateLink() {
  return useQuery({
    queryKey: ["/api/affiliate/link"],
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest("POST", "/api/affiliate/request-payout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
    },
  });
}
