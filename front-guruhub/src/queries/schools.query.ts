import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolsService, SchoolSettings } from "@/services/schools";

export const schoolKeys = {
  all: ["schools"] as const,
  current: () => [...schoolKeys.all, "current"] as const,
};

export function useSchoolSettings() {
  return useQuery({
    queryKey: schoolKeys.current(),
    queryFn: () => schoolsService.getCurrent(),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

export function useUpdateSchoolSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SchoolSettings>) => schoolsService.updateCurrent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schoolKeys.all });
    },
  });
}
