// hooks/useCases.ts
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";

export function useCases() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const token = auth.user?.id_token; // or access_token depending on your config

  // 1. Fetch all cases
  const { data: cases, isLoading, error } = useQuery({
    queryKey: ["/api/cases"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/cases", undefined, token);
      return res.json();
    },
  });

  // 2. Create a case
  const createCase = useMutation({
    mutationFn: async (newCase: any) => {
      const res = await apiRequest("POST", "/api/cases", newCase, token);
      return res.json();
    },
    onSuccess: (createdCase: any) => {
      queryClient.setQueryData(["/api/cases"], (old: any) => {
        if (!old) return [createdCase];
        return [...old, createdCase];
      });

      // still invalidate others for consistency
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/hearings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries"] });
    },
  });

  // 3. Update a case
  const updateCase = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const res = await apiRequest("PUT", `/api/cases/${id}`, updates, token);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/hearings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries"] });
    },
  });

  // 4. Delete a case
  const deleteCase = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cases/${id}`, undefined, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/hearings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diary-entries"] });
    },
  });

  return {
    cases,
    isLoading,
    error,
    createCase,
    updateCase,
    deleteCase,
  };
}
