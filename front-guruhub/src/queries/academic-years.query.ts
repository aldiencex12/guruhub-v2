import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academicYearsService, AcademicYear } from "../services/academic-years";

export const useAcademicYears = () => {
  return useQuery({
    queryKey: ["academicYears"],
    queryFn: async () => {
      return await academicYearsService.getAll();
    },
  });
};

export const useCreateAcademicYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { year: string; semester: string; isActive?: boolean }) =>
      academicYearsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
};

export const useUpdateAcademicYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; year?: string; semester?: string; isActive?: boolean }) =>
      academicYearsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
};

export const useDeleteAcademicYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => academicYearsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academicYears"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
};
