import { useMutation } from "@tanstack/react-query";
import { gradeEngineService } from "@/services/grade-engine";
import { toast } from "sonner";

export function useCalculateClass() {
  return useMutation({
    mutationFn: (data: {
      classId: number;
      subjectId: number;
      academicYearId: number;
    }) => gradeEngineService.calculateClass(data),
    onSuccess: () => {
      toast.success("Perhitungan nilai akhir kelas berhasil disinkronkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghitung nilai akhir kelas");
    },
  });
}
