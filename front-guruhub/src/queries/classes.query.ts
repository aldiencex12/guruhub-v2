import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesService } from "@/services/classes";
import { toast } from "sonner";
import type { Class } from "@/types";

export function useClasses(params?: { academicYearId?: number; gradeLevel?: string; status?: string; limit?: number }) {
  return useQuery({
    queryKey: ["classes", params],
    queryFn: () => classesService.getAll({ limit: 1000, ...params }),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; gradeLevel: string; academicYearId: number; homeroomTeacherId?: number }) => classesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Kelas berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan kelas");
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Class> }) => classesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Data kelas berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui data kelas");
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Kelas berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus kelas");
    },
  });
}

export function useDeleteBulkClasses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => classesService.deleteBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Kelas berhasil dihapus massal");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus kelas secara massal");
    },
  });
}
