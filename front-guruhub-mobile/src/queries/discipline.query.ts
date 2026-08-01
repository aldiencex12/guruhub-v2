import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disciplineService, mobileAuxService } from "@/services/discipline";

export function useMobileDisciplineCategories() {
  return useQuery({
    queryKey: ["mobile-discipline-categories"],
    queryFn: async () => {
      const res: any = await disciplineService.getCategories();
      return res.data;
    },
  });
}

export function useMobileDisciplineViolations() {
  return useQuery({
    queryKey: ["mobile-discipline-violations"],
    queryFn: async () => {
      const res: any = await disciplineService.getViolations();
      return res.data;
    },
  });
}

export function useMobileClasses() {
  return useQuery({
    queryKey: ["mobile-classes"],
    queryFn: async () => {
      const res: any = await mobileAuxService.getClasses();
      return res.data;
    },
  });
}

export function useMobileStudents(classId?: number) {
  return useQuery({
    queryKey: ["mobile-students", classId],
    queryFn: async () => {
      const res: any = await mobileAuxService.getStudents(classId);
      return res.data;
    },
    enabled: !!classId,
  });
}

export function useMobileAcademicYears() {
  return useQuery({
    queryKey: ["mobile-academic-years"],
    queryFn: async () => {
      const res: any = await mobileAuxService.getAcademicYears();
      return res.data;
    },
  });
}

export function useCreateMobileViolation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => disciplineService.createViolation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-discipline-violations"] });
    },
  });
}
