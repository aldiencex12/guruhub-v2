"use client";

import { useState } from "react";
import { Award, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/queries/assessment-categories.query";
import { useAuthStore } from "@/store/auth.store";
import type { AssessmentCategory } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  weight: z.coerce.number().min(1).max(100, "Bobot 1–100"),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function AssessmentCategoriesPage() {
  const { currentUser } = useAuthStore();
  const isTeacher = ["Teacher", "HomeroomTeacher"].includes(currentUser?.role || "");

  const { data: categories = [], isLoading: isFetching } = useCategories();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<AssessmentCategory | null>(null);
  const [editing, setEditing] = useState<AssessmentCategory | null>(null);

  const isMutating = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;

  const totalWeight = categories.filter(c => c.isActive).reduce((sum, c) => sum + c.weight, 0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const openAdd = () => {
    setEditing(null);
    reset({ name: "", weight: 0, description: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (c: AssessmentCategory) => {
    setEditing(c);
    reset({ name: c.name, weight: c.weight, description: c.description ?? "", isActive: c.isActive });
    setDialogOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      weight: data.weight,
      description: data.description || undefined,
      isActive: data.isActive,
    };

    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteCategory.mutateAsync(deleteDialog.id);
      setDeleteDialog(null);
    } catch {}
  };

  const columns: ColumnDef<AssessmentCategory>[] = [
    { accessorKey: "name", header: "Nama Kategori" },
    { accessorKey: "weight", header: "Bobot", cell: ({ getValue }) => (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${getValue() as number}%` }} />
        </div>
        <span className="text-sm font-mono font-semibold">{getValue() as number}%</span>
      </div>
    )},
    { accessorKey: "description", header: "Deskripsi", cell: ({ getValue }) => (getValue() as string) || "—" },
    { accessorKey: "isActive", header: "Status", cell: ({ getValue }) => (
      <Badge variant={getValue() ? "success" : "secondary"}>{getValue() ? "Aktif" : "Nonaktif"}</Badge>
    )},
    { id: "pembuat", header: "Pembuat", cell: ({ row }: any) => (
      <Badge variant={row.original.teacherId ? "info" : "secondary"}>
        {row.original.teacherId ? (isTeacher ? "Milik Saya" : "Guru") : "Standar Sekolah"}
      </Badge>
    )},
    { id: "actions", header: "Aksi", cell: ({ row }: any) => {
      const canEdit = !isTeacher || row.original.teacherId !== null;
      return canEdit ? (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
          {!row.original.isDefault && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDialog(row.original)}><Trash2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-400 italic">Hanya Baca</span>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Award className="h-6 w-6 text-amber-600" /> Kategori Penilaian</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} kategori terdaftar</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Kategori</Button>
      </div>

      {/* Weight summary */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${totalWeight === 100 ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}>
        {totalWeight !== 100 && <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />}
        <div>
          <p className={`font-semibold ${totalWeight === 100 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
            Total Bobot Aktif: {totalWeight}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalWeight === 100 ? "✅ Total bobot sudah tepat 100%" : `⚠️ Total bobot harus = 100%. Sisa: ${100 - totalWeight}%`}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Memuat kategori penilaian...</p>
          </div>
        ) : (
          <DataTable columns={columns} data={categories} searchKey="name" searchPlaceholder="Cari kategori..." />
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Edit Kategori" : "Tambah Kategori"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Kategori *</Label>
            <Input placeholder="Contoh: Ulangan Harian" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Bobot (%) *</Label>
            <Input type="number" min={1} max={100} placeholder="0–100" {...register("weight")} />
            {errors.weight && <p className="text-xs text-red-600">{errors.weight.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Deskripsi</Label>
            <Input placeholder="Opsional" {...register("description")} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register("isActive")} className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button type="submit" loading={isMutating}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} onConfirm={handleDelete} title="Hapus Kategori" description={`Hapus kategori "${deleteDialog?.name}"?`} loading={isMutating} />
    </div>
  );
}
