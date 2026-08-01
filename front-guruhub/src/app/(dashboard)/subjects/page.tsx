"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
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
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, useDeleteBulkSubjects } from "@/queries/subjects.query";
import type { Subject, GradeLevel } from "@/types";
import { api } from "@/services/api";
import { Download, Upload } from "lucide-react";

const GRADE_LEVELS: GradeLevel[] = ["7", "8", "9", "10", "11", "12"];
const RELIGION_GROUPS = [
  { value: "UMUM", label: "Mapel Umum (Non-Agama)" },
  { value: "Islam", label: "Agama Islam" },
  { value: "Kristen", label: "Agama Kristen" },
  { value: "Katolik", label: "Agama Katolik" },
  { value: "Hindu", label: "Agama Hindu" },
  { value: "Buddha", label: "Agama Buddha" },
  { value: "Khonghucu", label: "Agama Khonghucu" },
];

const schema = z.object({
  code: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  gradeLevel: z.enum(["7", "8", "9", "10", "11", "12"] as const),
  religionGroup: z.enum(["UMUM", "Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"] as const),
  description: z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function SubjectsPage() {
  const { data: subjects = [], isLoading: isFetching } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const deleteBulkSubjects = useDeleteBulkSubjects();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Subject | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState({});

  const isMutating = createSubject.isPending || updateSubject.isPending || deleteSubject.isPending || deleteBulkSubjects.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { gradeLevel: "7", religionGroup: "UMUM" },
  });

  const openAdd = () => {
    setEditing(null);
    reset({ gradeLevel: "7", religionGroup: "UMUM", code: "", name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    reset({ code: s.code, name: s.name, gradeLevel: s.gradeLevel as any, religionGroup: s.religionGroup || "UMUM", description: s.description ?? "" });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      code: data.code,
      name: data.name,
      gradeLevel: data.gradeLevel,
      religionGroup: data.religionGroup,
      description: data.description || undefined,
    };

    try {
      if (editing) {
        await updateSubject.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createSubject.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteSubject.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRowIds).map(Number);
    if (ids.length === 0) return;
    try {
      await deleteBulkSubjects.mutateAsync(ids);
      setBulkDeleteConfirm(false);
      setSelectedRowIds({}); // clear selection
    } catch {}
  };

  const columns: ColumnDef<Subject>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input 
          type="checkbox" 
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-gray-300 w-4 h-4 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input 
          type="checkbox" 
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300 w-4 h-4 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
        />
      ),
    },
    { accessorKey: "code", header: "Kode", cell: ({ getValue }) => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{getValue() as string}</span> },
    { accessorKey: "name", header: "Nama Mata Pelajaran" },
    { accessorKey: "gradeLevel", header: "Tingkat", cell: ({ getValue }) => <Badge variant="secondary">Kelas {getValue() as string}</Badge> },
    {
      accessorKey: "religionGroup",
      header: "Kategori / Agama",
      cell: ({ getValue }) => {
        const val = (getValue() as string) || "UMUM";
        if (val === "UMUM") {
          return <Badge variant="secondary" className="text-gray-500 border-gray-300">Mapel Umum</Badge>;
        }
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300">Agama {val}</Badge>;
      },
    },
    { accessorKey: "description", header: "Deskripsi", cell: ({ getValue }) => (getValue() as string) || "—" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge variant={getValue() === "Aktif" ? "success" : "secondary"}>{getValue() as string || "Aktif"}</Badge> },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><BookOpen className="h-6 w-6 text-emerald-600" /> Mata Pelajaran</h1>
          <p className="text-sm text-gray-500 mt-1">{subjects.length} mata pelajaran terdaftar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => api.download("/import/templates/subjects", "template-subjects.xlsx")}>
            <Download className="h-4 w-4 mr-2" /> Template Mapel
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
                  await api.post("/import/subjects", formData);
                  toast.success("Mata pelajaran berhasil diimpor");
                  window.location.reload();
                } catch (error: any) {
                  toast.error(error.message || "Gagal mengimpor mata pelajaran");
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
          {Object.keys(selectedRowIds).length > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Hapus Terpilih ({Object.keys(selectedRowIds).length})
            </Button>
          )}
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Tambah Mapel</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data mata pelajaran...</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={subjects} 
            searchKey="name" 
            searchPlaceholder="Cari nama atau kode mapel..." 
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={setSelectedRowIds}
          />
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Kode Mapel *</Label>
            <Input placeholder="Contoh: MTK-SMP7" {...register("code")} />
            {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nama Mapel *</Label>
            <Input placeholder="Nama mata pelajaran" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tingkat Kelas *</Label>
            <Select {...register("gradeLevel")}>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>Kelas {g}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Kategori Mata Pelajaran (Mapel Agama atau Bukan) *</Label>
            <Select {...register("religionGroup")}>
              {RELIGION_GROUPS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            <p className="text-[11px] text-gray-500">Jika memilih mapel agama, mapel ini hanya akan otomatis muncul di rapor siswa yang agamanya sesuai.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Deskripsi</Label>
            <Input placeholder="Opsional" {...register("description")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Hapus Mata Pelajaran" description={`Hapus mata pelajaran "${deleteDialog?.name}"?`} loading={isMutating} />
      <ConfirmDialog open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} onConfirm={handleBulkDelete} title="Hapus Massal Mata Pelajaran" description={`Apakah Anda yakin ingin menghapus ${Object.keys(selectedRowIds).length} mata pelajaran terpilih?`} loading={isMutating} />
    </div>
  );
}
