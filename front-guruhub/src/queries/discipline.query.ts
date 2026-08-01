import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disciplineService } from "@/services/discipline";

export const disciplineKeys = {
  all: ["discipline"] as const,
  incidents: () => [...disciplineKeys.all, "incidents"] as const,
  incidentList: (filters: Record<string, any>) => [...disciplineKeys.incidents(), "list", filters] as const,
  incidentDetail: (id: number) => [...disciplineKeys.incidents(), "detail", id] as const,
  categories: () => [...disciplineKeys.all, "categories"] as const,
  types: (category?: string) => [...disciplineKeys.all, "types", category] as const,
  policy: () => [...disciplineKeys.all, "policy"] as const,
  thresholds: () => [...disciplineKeys.all, "thresholds"] as const,
  sanctions: () => [...disciplineKeys.all, "sanctions"] as const,
  sanctionList: (filters: Record<string, any>) => [...disciplineKeys.sanctions(), "list", filters] as const,
  studentRecap: (studentId: number) => [...disciplineKeys.all, "student-recap", studentId] as const,
  auditLogs: (filters: Record<string, any>) => [...disciplineKeys.all, "audit-logs", filters] as const,
  analytics: (filters: Record<string, any>) => [...disciplineKeys.all, "analytics", filters] as const,
};

// React Query Hooks
export function useDisciplineViolations(params?: any) {
  return useQuery({
    queryKey: disciplineKeys.incidentList(params || {}),
    queryFn: async () => {
      const res = await disciplineService.getIncidents({ limit: 1000, ...params });
      return res.data || res;
    },
  });
}

export function useVerifyDisciplineViolation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { status: string; notes?: string } }) => {
      return disciplineService.updateIncidentStatus(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.incidents() });
    },
  });
}

export function useResolveDisciplineViolation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { actionTaken: string } }) => {
      return disciplineService.updateIncidentStatus(id, { status: "RESOLVED", notes: data.actionTaken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.incidents() });
    },
  });
}

export function useUpdateSanctionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { status: string; notes?: string } }) => {
      return disciplineService.updateSanctionStatus(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.sanctions() });
    },
  });
}

export function useCreateThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return disciplineService.createThreshold(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.thresholds() });
    },
  });
}

export function useUpdateThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return disciplineService.updateThreshold(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.thresholds() });
    },
  });
}

export function useDeleteThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return disciplineService.deleteThreshold(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.thresholds() });
    },
  });
}
