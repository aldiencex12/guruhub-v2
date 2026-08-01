import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportCardsService } from "@/services/report-cards";
import { toast } from "sonner";
import type { ReportCard } from "@/types";

export function useReportCards(params?: {
  classId?: number;
  academicYearId?: number;
  semester?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["report-cards", params],
    queryFn: () => reportCardsService.getAll(params),
  });
}

export function useReportCardDetail(id: number) {
  return useQuery({
    queryKey: ["report-card", id],
    queryFn: () => reportCardsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateReportCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      studentId: number;
      academicYearId: number;
      semester: string;
    }) => reportCardsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      toast.success("Rapor baru berhasil dibuat");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membuat rapor");
    },
  });
}

export function useUpdateReportCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ReportCard> }) => reportCardsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      queryClient.invalidateQueries({ queryKey: ["report-card", variables.id] });
      toast.success("Data rapor berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui rapor");
    },
  });
}

export function usePublishReportCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reportCardsService.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      queryClient.invalidateQueries({ queryKey: ["report-card", id] });
      toast.success("Rapor berhasil dipublikasikan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mempublikasikan rapor");
    },
  });
}

export function useDeleteReportCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reportCardsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      toast.success("Rapor berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus rapor");
    },
  });
}
