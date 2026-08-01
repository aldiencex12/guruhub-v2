"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
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
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useDeleteBulkStudents } from "@/queries/students.query";
import type { Student } from "@/types";
import { getGenderLabel } from "@/lib/utils";
import { api } from "@/services/api";
import { Download, Upload } from "lucide-react";

const RELIGIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"] as const;
type Religion = typeof RELIGIONS[number];

const RELIGION_LABELS: Record<Religion, string> = {
  Islam: "Islam",
  Kristen: "Kristen",
  Katolik: "Katolik",
  Hindu: "Hindu",
  Buddha: "Buddha",
  Khonghucu: "Khonghucu",
};

const schema = z.object({
  nisn: z.string()
    .min(1, "NISN wajib diisi")
    .max(20, "NISN maksimal 20 digit")
    .regex(/^[0-9]+$/, "NISN hanya boleh berisi angka"),
  name: z.string().min(1, "Nama wajib diisi"),
  gender: z.enum(["L", "P"] as const),
  religion: z.enum(RELIGIONS),
  status: z.enum(["Aktif", "Nonaktif"] as const),
});
type FormData = z.infer<typeof schema>;

export default function StudentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: students = [], isLoading: isFetching } = useStudents({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 1000,
  });

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const deleteBulkStudent = useDeleteBulkStudents();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Student | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const isMutating = createStudent.isPending || updateStudent.isPending || deleteStudent.isPending || deleteBulkStudent.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { gender: "L" as const, status: "Aktif" as const, religion: "Islam" as Religion },
  });

  const openAdd = () => {
    setEditing(null);
    reset({ gender: "L", status: "Aktif", religion: "Islam", nisn: "", name: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    reset({
      nisn: s.nisn,
      name: s.name,
      gender: s.gender,
      religion: s.religion,
      status: s.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      nisn: data.nisn,
      name: data.name,
      gender: data.gender,
      religion: data.religion,
      status: data.status,
    };

    try {
      if (editing) {
        await updateStudent.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createStudent.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteStudent.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const selectedIds = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .map((idStr) => parseInt(idStr, 10))
    .filter((id) => !isNaN(id));

  const handleBulkDelete = async () => {
    try {
      await deleteBulkStudent.mutateAsync(selectedIds);
      setRowSelection({});
      setBulkDeleteDialogOpen(false);
    } catch {}
  };

  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Select all"
          className="rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500 h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          aria-label="Select row"
          className="rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-500 h-4 w-4"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    { accessorKey: "name", header: "Nama Siswa", cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {row.original.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</p>
          <p className="text-xs text-gray-400 font-mono">{row.original.nisn}</p>
        </div>
      </div>
    )},
    { accessorKey: "gender", header: "L/P", cell: ({ getValue }) => getGenderLabel(getValue() as string) },
    { accessorKey: "religion", header: "Agama", cell: ({ getValue }) => (
      <span className="text-sm">{getValue() as string}</span>
    )},
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => (
      <Badge variant={getValue() === "Aktif" ? "success" : "secondary"}>{getValue() as string}</Badge>
    )},
    { id: "actions", header: "Aksi", cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(row.original)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Users className="h-6 w-6 text-purple-600" /> Siswa</h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} siswa terdaftar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => api.download("/import/templates/students", "template-students.xlsx")}>
            <Download className="h-4 w-4 mr-2" /> Template
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
                  await api.post("/import/students", formData);
                  toast.success("Siswa berhasil diimpor");
                  window.location.reload();
                } catch (error: any) {
                  toast.error(error.message || "Gagal mengimpor siswa");
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
          <Button onClick={openAdd} id="add-student-btn"><Plus className="h-4 w-4 mr-2" /> Tambah Siswa</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data siswa...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={students}
            searchKey="name"
            searchPlaceholder="Cari nama atau NISN..."
            emptyMessage="Tidak ada data siswa."
            selectedRowIds={rowSelection}
            onSelectedRowIdsChange={setRowSelection}
            toolbar={
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="h-9 px-3 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Hapus Terpilih ({selectedIds.length})
                  </Button>
                )}
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
                  <option value="all">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </Select>
              </div>
            }
          />
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Edit Data Siswa" : "Tambah Siswa Baru"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Nama Lengkap *</Label>
            <Input placeholder="Nama lengkap siswa" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>NISN * <span className="text-gray-400 font-normal">(1-20 digit angka)</span></Label>
            <Input placeholder="0012345678" maxLength={20} {...register("nisn")} />
            {errors.nisn && <p className="text-xs text-red-600">{errors.nisn.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Jenis Kelamin *</Label>
            <Select {...register("gender")}>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
            {errors.gender && <p className="text-xs text-red-600">{errors.gender.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Agama *</Label>
            <Select {...register("religion")}>
              {RELIGIONS.map((r) => (
                <option key={r} value={r}>{RELIGION_LABELS[r]}</option>
              ))}
            </Select>
            {errors.religion && <p className="text-xs text-red-600">{errors.religion.message}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </Select>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Hapus Siswa"
        description={`Apakah Anda yakin ingin menghapus siswa "${deleteDialog?.name}"?`}
        loading={isMutating}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Masal Siswa"
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} siswa yang terpilih?`}
        loading={isMutating}
      />
    </div>
  );
}
