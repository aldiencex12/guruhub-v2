import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectsService } from "@/services/subjects";
import { toast } from "sonner";
import type { Subject } from "@/types";

export function useSubjects(params?: { gradeLevel?: string; status?: string; limit?: number }) {
  return useQuery({
    queryKey: ["subjects", params],
    queryFn: () => subjectsService.getAll({ limit: 1000, ...params }),
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Subject, "id" | "status">) => subjectsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Mata pelajaran berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan mata pelajaran");
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subject> }) => subjectsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Mata pelajaran berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui mata pelajaran");
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subjectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Mata pelajaran berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus mata pelajaran");
    },
  });
}

export function useDeleteBulkSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => subjectsService.deleteBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Mata pelajaran berhasil dihapus massal");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus mata pelajaran secara massal");
    },
  });
}
