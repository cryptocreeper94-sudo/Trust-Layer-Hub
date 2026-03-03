import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

export function useStripeStatus() {
  return useQuery({
    queryKey: ["/api/stripe/status"],
  });
}

export function useStripeDashboard() {
  return useQuery({
    queryKey: ["/api/stripe/dashboard"],
  });
}

export function useConnectStripe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { businessName?: string; stripeSecretKey?: string }) =>
      apiRequest("POST", "/api/stripe/connect", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/dashboard"] });
    },
  });
}

export function useDisconnectStripe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/stripe/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/dashboard"] });
    },
  });
}
