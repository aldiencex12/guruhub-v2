import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teachersService } from "@/services/teachers";
import { toast } from "sonner";
import type { Teacher } from "@/types";

export function useTeachers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["teachers", params],
    queryFn: () => teachersService.getAll({ limit: 1000, ...params }),
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Teacher, "id" | "status" | "createdAt">) => teachersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Guru baru berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan guru");
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Teacher> }) => teachersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Data guru berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui data guru");
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teachersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Guru berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus guru");
    },
  });
}
