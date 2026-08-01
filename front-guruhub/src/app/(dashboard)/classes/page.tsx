"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, School } from "lucide-react";
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
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass, useDeleteBulkClasses } from "@/queries/classes.query";
import { useTeachers } from "@/queries/teachers.query";
import { useAcademicYears } from "@/queries/dashboard.query";
import { useAuthStore } from "@/store/auth.store";
import type { Class, GradeLevel } from "@/types";

const GRADE_LEVELS: GradeLevel[] = ["7", "8", "9", "10", "11", "12"];

const schema = z.object({
  name: z.string().min(1, "Nama kelas wajib diisi"),
  gradeLevel: z.enum(["7","8","9","10","11","12"] as const),
  academicYearId: z.coerce.number().min(1, "Tahun ajaran wajib dipilih"),
  homeroomTeacherId: z.coerce.number().optional().or(z.literal(0)),
});
type FormData = z.infer<typeof schema>;

export default function ClassesPage() {
  const { currentUser } = useAuthStore();
  const canEdit = ["SuperAdmin", "SchoolAdmin", "Principal"].includes(currentUser?.role || "");

  const [yearFilter, setYearFilter] = useState<string>("all");

  const { data: classes = [], isLoading: isFetching } = useClasses({
    academicYearId: yearFilter === "all" ? undefined : Number(yearFilter),
    limit: 1000,
  });
  const { data: teachers = [] } = useTeachers({ limit: 1000 });
  const { data: academicYears = [] } = useAcademicYears();

  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const deleteBulkClasses = useDeleteBulkClasses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Class | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState({});

  const isMutating = createClass.isPending || updateClass.isPending || deleteClass.isPending || deleteBulkClasses.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { gradeLevel: "7", academicYearId: academicYears.find(ay => ay.isActive)?.id || academicYears[0]?.id || 0 },
  });

  const openAdd = () => {
    setEditing(null);
    const activeAy = academicYears.find(ay => ay.isActive) || academicYears[0];
    reset({ gradeLevel: "7", academicYearId: activeAy?.id || 0, name: "", homeroomTeacherId: 0 });
    setDialogOpen(true);
  };

  const openEdit = (c: Class) => {
    setEditing(c);
    reset({
      name: c.name,
      gradeLevel: c.gradeLevel as any,
      academicYearId: c.academicYearId,
      homeroomTeacherId: c.homeroomTeacherId || 0,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      gradeLevel: data.gradeLevel,
      academicYearId: data.academicYearId,
      homeroomTeacherId: data.homeroomTeacherId || undefined,
    };

    try {
      if (editing) {
        await updateClass.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createClass.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteClass.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRowIds).map(Number);
    if (ids.length === 0) return;
    try {
      await deleteBulkClasses.mutateAsync(ids);
      setBulkDeleteConfirm(false);
      setSelectedRowIds({}); // clear selection
    } catch {}
  };

  const columns: ColumnDef<Class>[] = [
    ...(canEdit ? [{
      id: "select",
      header: ({ table }: any) => (
        <input 
          type="checkbox" 
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded border-gray-300 w-4 h-4 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
        />
      ),
      cell: ({ row }: any) => (
        <input 
          type="checkbox" 
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300 w-4 h-4 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
        />
      ),
    }] : []),
    { accessorKey: "name", header: "Nama Kelas", cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{row.original.name}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{row.original.name}</p>
          <p className="text-xs text-gray-400">Tingkat {row.original.gradeLevel}</p>
        </div>
      </div>
    )},
    { accessorKey: "gradeLevel", header: "Tingkat", cell: ({ getValue }) => <Badge variant="secondary">Kelas {getValue() as string}</Badge> },
    { id: "waliKelas", header: "Wali Kelas", cell: ({ row }) => row.original.homeroomTeacher?.name ?? teachers.find(t => t.id === row.original.homeroomTeacherId)?.name ?? "—" },
    { id: "tahunAjaran", header: "Tahun Ajaran", cell: ({ row }) => row.original.academicYear?.name ?? academicYears.find(ay => ay.id === row.original.academicYearId)?.name ?? "—" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <Badge variant={getValue() === "Aktif" ? "success" : "secondary"}>{getValue() as string || "Aktif"}</Badge> },
    ...(canEdit ? [{ id: "actions", header: "Aksi", cell: ({ row }: any) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(row.original)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    )}] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><School className="h-6 w-6 text-indigo-600" /> Kelas</h1>
          <p className="text-sm text-gray-500 mt-1">{classes.length} kelas terdaftar</p>
        </div>
        <div className="flex gap-2">
          {canEdit && Object.keys(selectedRowIds).length > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Hapus Terpilih ({Object.keys(selectedRowIds).length})
            </Button>
          )}
          {canEdit && <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Tambah Kelas</Button>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat data kelas...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={classes}
            searchKey="name"
            searchPlaceholder="Cari nama kelas..."
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={setSelectedRowIds}
            toolbar={
              <Select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="w-40">
                <option value="all">Semua TA</option>
                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
              </Select>
            }
          />
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Edit Kelas" : "Tambah Kelas"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tahun Ajaran *</Label>
            <Select {...register("academicYearId")}>
              {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name} — {ay.semester}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nama Kelas *</Label>
            <Input placeholder="Contoh: 7A, X-MIPA-1" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tingkat Kelas *</Label>
            <Select {...register("gradeLevel")}>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>Kelas {g}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Wali Kelas</Label>
            <Select {...register("homeroomTeacherId")}>
              <option value="0">— Pilih Wali Kelas —</option>
              {teachers
                .filter(t => !t.status || t.status === "Aktif")
                .filter(t => {
                  const isAssigned = classes.some(c => c.homeroomTeacherId === t.id && c.id !== editing?.id);
                  return !isAssigned;
                })
                .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Hapus Kelas" description={`Hapus kelas "${deleteDialog?.name}"?`} loading={isMutating} />
      <ConfirmDialog open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} onConfirm={handleBulkDelete} title="Hapus Massal Kelas" description={`Apakah Anda yakin ingin menghapus ${Object.keys(selectedRowIds).length} kelas terpilih?`} loading={isMutating} />
    </div>
  );
}
