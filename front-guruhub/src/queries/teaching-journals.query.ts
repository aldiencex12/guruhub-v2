import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teachingJournalsService } from "@/services/teaching-journals";
import { toast } from "sonner";
import type { TeachingJournal } from "@/types";

export function useJournals(params?: { teacherId?: number; scheduleId?: number; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["teaching-journals", params],
    queryFn: () => teachingJournalsService.getAll(params),
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TeachingJournal, "id" | "schedule" | "createdAt">) => teachingJournalsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-journals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activities"] });
      toast.success("Jurnal mengajar berhasil dibuat");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal membuat jurnal mengajar");
    },
  });
}

export function useUpdateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeachingJournal> }) => teachingJournalsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-journals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activities"] });
      toast.success("Jurnal mengajar berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui jurnal");
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teachingJournalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-journals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activities"] });
      toast.success("Jurnal mengajar berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus jurnal");
    },
  });
}
