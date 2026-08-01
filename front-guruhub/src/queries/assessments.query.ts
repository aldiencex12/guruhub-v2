import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentsService } from "@/services/assessments";
import { toast } from "sonner";
import type { Assessment } from "@/types";

export function useAssessments(params?: {
  classId?: number;
  subjectId?: number;
  teacherId?: number;
  academicYearId?: number;
  assessmentType?: string;
}) {
  return useQuery({
    queryKey: ["assessments", params],
    queryFn: () => assessmentsService.getAll(params),
  });
}

export function useAssessment(id: number) {
  return useQuery({
    queryKey: ["assessments", id],
    queryFn: () => assessmentsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      classId: number;
      subjectId: number;
      teacherId?: number;
      academicYearId?: number;
      categoryId: number;
      title: string;
      description?: string;
      assessmentType: string;
      assessmentDate: string;
      maxScore: number;
      scores?: Array<{ studentId: number; score: number; notes?: string }>;
    }) => assessmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Penilaian berhasil disimpan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan penilaian");
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Assessment> }) => assessmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Penilaian berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui penilaian");
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assessmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Penilaian berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus penilaian");
    },
  });
}

export function useSaveScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      scores,
    }: {
      id: number;
      scores: Array<{ studentId: number; score: number; notes?: string }>;
    }) => assessmentsService.saveScores(id, scores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Nilai siswa berhasil disimpan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan nilai siswa");
    },
  });
}
