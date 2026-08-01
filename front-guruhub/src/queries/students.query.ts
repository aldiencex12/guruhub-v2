import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsService } from "@/services/students";
import { toast } from "sonner";
import type { Student } from "@/types";

export function useStudents(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: () => studentsService.getAll(params),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Student, "id" | "status" | "createdAt">) => studentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Siswa baru berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan siswa");
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Student> }) => studentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Data siswa berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui data siswa");
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Siswa berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus siswa");
    },
  });
}

export function useDeleteBulkStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => studentsService.deleteBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Siswa-siswa terpilih berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus siswa");
    },
  });
}
