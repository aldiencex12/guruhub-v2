import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schedulesService } from "@/services/schedules";
import { toast } from "sonner";
import type { Schedule } from "@/types";

export function useSchedules(params?: { classId?: number; teacherId?: number; academicYearId?: number; dayOfWeek?: string }) {
  return useQuery({
    queryKey: ["schedules", params],
    queryFn: () => schedulesService.getAll(params),
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Schedule, "id" | "class" | "subject" | "teacher" | "academicYear">) => schedulesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal pelajaran berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan jadwal");
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Schedule> }) => schedulesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal pelajaran berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui jadwal");
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => schedulesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal pelajaran berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus jadwal");
    },
  });
}

export function useBulkDeleteSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => schedulesService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal pelajaran yang dipilih berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus jadwal pelajaran");
    },
  });
}

export function useDeleteAllSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => schedulesService.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Seluruh jadwal pelajaran berhasil dikosongkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengosongkan jadwal pelajaran");
    },
  });
}
