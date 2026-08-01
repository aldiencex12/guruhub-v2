"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from "@/queries/teachers.query";
import type { Teacher, Gender } from "@/types";
import { getGenderLabel } from "@/lib/utils";
import { api } from "@/services/api";
import { Download, Upload } from "lucide-react";

const teacherSchema = z.object({
  nip: z.string().max(18, "NIP maksimal 18 karakter").optional().or(z.literal("")),
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().optional().or(z.literal("")),
  gender: z.enum(["L", "P"] as const),
});
type TeacherForm = z.infer<typeof teacherSchema>;

export default function TeachersPage() {
  const { data: teachers = [], isLoading: isFetching } = useTeachers();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Teacher | null>(null);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const isMutating = createTeacher.isPending || updateTeacher.isPending || deleteTeacher.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { gender: "L" },
  });

  const openAdd = () => {
    setEditing(null);
    reset({ gender: "L", name: "", nip: "", phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    reset({ name: teacher.name, nip: teacher.nip ?? "", phone: teacher.phone ?? "", gender: teacher.gender });
    setDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    const payload = {
      name: data.name,
      nip: data.nip || undefined,
      phone: data.phone || undefined,
      gender: data.gender,
    };

    try {
      if (editing) {
        await updateTeacher.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createTeacher.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteTeacher.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const columns: ColumnDef<Teacher>[] = [
    { accessorKey: "name", header: "Nama Guru", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {row.original.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</p>
          <p className="text-xs text-gray-400">{row.original.email ?? "—"}</p>
        </div>
      </div>
    )},
    { accessorKey: "nip", header: "NIP", cell: ({ getValue }) => <span className="font-mono text-xs">{(getValue() as string) || "—"}</span> },
    { accessorKey: "gender", header: "Jenis Kelamin", cell: ({ getValue }) => getGenderLabel(getValue() as string) },
    { accessorKey: "phone", header: "Telepon", cell: ({ getValue }) => (getValue() as string) || "—" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => (
      <Badge variant={getValue() === "Aktif" ? "success" : "secondary"}>{getValue() as string || "Aktif"}</Badge>
    )},
    { id: "actions", header: "Aksi", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(row.original)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-600" /> Guru
          </h1>
          <p className="text-sm text-gray-500 mt-1">{teachers.length} guru terdaftar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => api.download("/import/templates/teachers", "template-guru.xlsx")}>
            <Download className="h-4 w-4 mr-2" /> Template Guru
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsImporting(true);
                const formData = new FormData();
                formData.append("file", file);
                try {
                  await api.post("/import/teachers", formData);
                  toast.success("Guru berhasil diimpor");
                  window.location.reload();
                } catch (error: any) {
                  toast.error(error.message || "Gagal mengimpor guru");
                } finally {
                  setIsImporting(false);
                  e.target.value = "";
                }
              }}
            />
            <Button variant="outline" disabled={isImporting}>
              <Upload className="h-4 w-4 mr-2" /> {isImporting ? "Mengimpor..." : "Import"}
            </Button>
          </div>
          <Button onClick={openAdd} id="add-teacher-btn">
            <Plus className="h-4 w-4 mr-2" /> Tambah Guru
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data guru...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={teachers}
            searchKey="name"
            searchPlaceholder="Cari nama atau NIP guru..."
            emptyMessage="Tidak ada data guru ditemukan."
          />
        )}
      </div>

      {/* Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Data Guru" : "Tambah Guru Baru"}
        description="Lengkapi form berikut untuk menyimpan data guru"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input id="name" placeholder="Masukkan nama lengkap" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nip">NIP</Label>
            <Input id="nip" placeholder="Opsional, maks 18 karakter" maxLength={18} {...register("nip")} />
            {errors.nip && <p className="text-xs text-red-600">{errors.nip.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input id="phone" placeholder="Opsional" {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Jenis Kelamin *</Label>
            <Select id="gender" {...register("gender")}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
            {errors.gender && <p className="text-xs text-red-600">{errors.gender.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating}>{editing ? "Simpan Perubahan" : "Tambah Guru"}</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Hapus Guru"
        description={`Apakah Anda yakin ingin menghapus guru "${deleteDialog?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={isMutating}
      />
    </div>
  );
}
