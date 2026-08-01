import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentCategoriesService } from "@/services/assessment-categories";
import { toast } from "sonner";
import type { AssessmentCategory } from "@/types";

export function useCategories() {
  return useQuery({
    queryKey: ["assessment-categories"],
    queryFn: () => assessmentCategoriesService.getAll(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AssessmentCategory, "id" | "isActive">) => assessmentCategoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-categories"] });
      toast.success("Kategori penilaian berhasil ditambahkan");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan kategori penilaian");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AssessmentCategory> }) => assessmentCategoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-categories"] });
      toast.success("Kategori penilaian berhasil diperbarui");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui kategori penilaian");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => assessmentCategoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-categories"] });
      toast.success("Kategori penilaian berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menghapus kategori penilaian");
    },
  });
}
