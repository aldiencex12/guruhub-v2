import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classMembersService } from "@/services/class-members";
import { toast } from "sonner";

export function useClassMembers(params: { classId: number }) {
  return useQuery({
    queryKey: ["class-members", params],
    queryFn: () => classMembersService.getAll(params),
    enabled: !!params.classId,
  });
}

export function useAddClassMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { classId: number; studentId: number }) => classMembersService.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-members"] });
      toast.success("Siswa berhasil ditambahkan ke kelas");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menambahkan siswa ke kelas");
    },
  });
}

export function useRemoveClassMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classMembersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-members"] });
      toast.success("Siswa berhasil dikeluarkan dari kelas");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal mengeluarkan siswa dari kelas");
    },
  });
}

export function usePromoteStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sourceClassId: number; targetClassId: number; studentIds: number[] }) => classMembersService.promote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-members"] });
      toast.success("Berhasil memindahkan siswa ke kelas baru");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memindahkan siswa");
    },
  });
}
