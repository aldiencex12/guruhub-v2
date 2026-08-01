import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance";
import { toast } from "sonner";

export function useAttendances(params?: { scheduleId?: number; attendanceDate?: string; teacherId?: number; classId?: number }) {
  return useQuery({
    queryKey: ["attendances", params],
    queryFn: () => attendanceService.getAll(params),
  });
}

export function useAttendanceRecap(classId: number, month: string) {
  return useQuery({
    queryKey: ["attendanceRecap", classId, month],
    queryFn: () => attendanceService.getRecap(classId, month),
    enabled: !!classId && !!month,
  });
}

export function useAttendance(id: number) {
  return useQuery({
    queryKey: ["attendance", id],
    queryFn: () => attendanceService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      scheduleId: number;
      attendanceDate: string;
      notes?: string;
      details: Array<{ studentId: number; status: string; notes?: string }>;
    }) => attendanceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-attendance"] });
      toast.success("Sesi absensi berhasil disimpan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan absensi");
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        notes?: string;
        details: Array<{ studentId: number; status: string; notes?: string }>;
      };
    }) => attendanceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-attendance"] });
      toast.success("Sesi absensi berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui absensi");
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-pending-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-attendance"] });
      toast.success("Sesi absensi berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus absensi");
    },
  });
}

